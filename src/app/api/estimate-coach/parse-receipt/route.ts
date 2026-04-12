import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { checkRateLimit, callAnthropicWithRetry, extractJson } from "@/lib/api/ai-helpers";
import { CATS } from "@/lib/estimate-engine";
import { z } from "zod";

const CAT_KEYWORDS: Record<string, string[]> = {
  demolition: ["철거", "해체", "폐기물", "잔재물", "덤프"],
  plumbing: ["설비", "배관", "방수", "급수", "배수", "수전", "조적", "몰탈"],
  window: ["샷시", "창호", "유리", "도어", "발코니", "시스템창"],
  electrical: ["전기", "배선", "스위치", "콘센트", "조명", "LED", "다운라이트", "등기구", "분전반"],
  carpentry: ["목공", "목수", "합판", "MDF", "몰딩", "걸레받이", "우물천장", "간접", "루버"],
  tile: ["타일", "줄눈", "시멘트", "본드", "접착"],
  wallpaper: ["도배", "벽지", "풀", "실크", "합지"],
  film: ["필름", "시트지", "인테리어필름", "랩핑"],
  paint: ["페인트", "도장", "페인팅", "젯소", "수성", "에폭시"],
  kitchen: ["주방", "싱크대", "상판", "후드", "빌트인"],
  bathroom: ["욕실", "세면", "양변기", "욕조", "샤워", "수전", "거울", "악세사리", "파티션"],
  door: ["문", "도어", "ABS", "온도어", "중문", "현관", "경첩", "실린더"],
  furniture: ["가구", "붙박이장", "신발장", "수납", "드레스룸"],
  flooring: ["마루", "바닥", "강마루", "원목", "SPC", "헤링본"],
  etc: ["청소", "입주청소", "미화", "실리콘", "배관청소", "하드웨어", "손잡이", "레일"],
};

function matchCategory(itemName: string, itemCategory?: string): string | null {
  const text = `${itemName} ${itemCategory || ""}`.toLowerCase();
  for (const [catId, keywords] of Object.entries(CAT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return catId;
  }
  return null;
}

// ─── 이미지 검증 스키마 ───
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image

const imageSchema = z.object({
  data: z.string().min(1, "이미지 데이터가 비어있습니다"),
  mimeType: z.enum(VALID_MIME_TYPES, { message: "지원하지 않는 이미지 형식입니다 (JPEG, PNG, WebP, GIF만 가능)" }),
});

const requestSchema = z.object({
  images: z.array(imageSchema).min(1, "이미지가 필요합니다").max(10, "최대 10장까지 첨부 가능합니다"),
});

// ─── 파싱 결과 검증 스키마 ───
const parsedItemSchema = z.object({
  name: z.string().default("항목명 없음"),
  catId: z.string().optional(),
  qty: z.number().default(1),
  unit: z.string().default("식"),
  unitPrice: z.number().default(0),
  totalAmount: z.number().default(0),
});

const parsedResultSchema = z.object({
  items: z.array(parsedItemSchema),
});

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("estimates", "write");
  if (!auth.ok) return auth.response;

  // Rate limiting
  const rateCheck = checkRateLimit(auth.userId);
  if (!rateCheck.allowed) {
    return err(`요청이 너무 많습니다. ${Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000)}초 후 다시 시도해주세요.`, 429);
  }

  try {
    const body = await request.json();

    // 서버 측 입력 검증
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      const messages = validation.error.issues.map((i) => i.message).join(", ");
      return err(messages);
    }

    const { images } = validation.data;

    // 개별 이미지 크기 검증 (base64 → 실제 크기 근사)
    for (let i = 0; i < images.length; i++) {
      const approxBytes = Math.ceil(images[i].data.length * 0.75);
      if (approxBytes > MAX_IMAGE_SIZE_BYTES) {
        return err(`${i + 1}번째 이미지가 너무 큽니다 (최대 5MB).`);
      }
    }

    const catNames = CATS.map((c) => `${c.id}(${c.name})`).join(", ");

    // 모든 이미지를 한 번에 전송
    const content: Anthropic.Messages.ContentBlockParam[] = [];
    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: img.data,
        },
      });
    }
    content.push({
      type: "text",
      text: `이 영수증/견적서/거래명세서 이미지를 분석하여 인테리어 공사 세부항목으로 변환해주세요.

공종 목록: ${catNames}

반드시 아래 JSON 형식으로만 응답하세요 (설명 텍스트 없이 JSON만):
{
  "items": [
    {
      "name": "항목명 (영수증에 적힌 그대로)",
      "catId": "해당하는 공종 ID (위 목록에서 선택)",
      "qty": 수량(숫자),
      "unit": "단위 (개/m²/롤/식/세트/EA 등)",
      "unitPrice": 단가(숫자, 원 단위),
      "totalAmount": 합계금액(숫자)
    }
  ]
}

규칙:
- 금액은 숫자만 (쉼표, 원 기호 제거)
- 여러 영수증이면 모든 항목을 하나의 items 배열에 합산
- catId는 항목 내용에 맞는 공종 선택. 매칭 어려우면 가장 가까운 공종
- 배송비/부가세 행은 제외
- 수량 불명확하면 1
- 단가 불명확하면 totalAmount을 qty로 나눈 값`,
    });

    // 재시도 로직 적용
    const parsed = await callAnthropicWithRetry(async (client) => {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content }],
      });
      return extractJson<{ items: unknown[] }>(response);
    });

    // 구조 검증
    const result = parsedResultSchema.safeParse(parsed);
    if (!result.success) {
      return err("영수증 분석 결과 형식이 올바르지 않습니다. 다시 시도해주세요.", 422);
    }

    if (result.data.items.length === 0) {
      return err("영수증에서 인식된 항목이 없습니다. 이미지를 확인해주세요.", 422);
    }

    // 공종별로 그룹화
    const grouped: Record<string, { name: string; qty: number; unit: string; unitPrice: number }[]> = {};

    for (const item of result.data.items) {
      const catId = item.catId || matchCategory(item.name) || "carpentry";
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push({
        name: item.name,
        qty: item.qty || 1,
        unit: item.unit || "식",
        unitPrice: item.unitPrice || (item.totalAmount ? Math.round(item.totalAmount / (item.qty || 1) / 100) * 100 : 0),
      });
    }

    return ok({ grouped, rawItems: result.data.items });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err("영수증 분석 결과를 해석할 수 없습니다. 이미지를 다시 촬영해주세요.", 422);
    }
    if (error instanceof Error && error.message.includes("ANTHROPIC_API_KEY")) {
      return err(error.message, 500);
    }
    return serverError(error);
  }
}
