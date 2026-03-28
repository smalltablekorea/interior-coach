import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { CATS } from "@/lib/estimate-engine";

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

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("estimates", "write");
  if (!auth.ok) return auth.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return err("ANTHROPIC_API_KEY가 설정되지 않았습니다.", 500);

  try {
    const body = await request.json();
    const { images } = body as {
      images: { data: string; mimeType: string }[];
    };

    if (!images || images.length === 0) return err("이미지가 필요합니다.");
    if (images.length > 10) return err("최대 10장까지 첨부 가능합니다.");

    const client = new Anthropic({ apiKey });

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return err("파싱 결과가 올바르지 않습니다.", 422);
    }

    // 공종별로 그룹화
    const grouped: Record<string, { name: string; qty: number; unit: string; unitPrice: number }[]> = {};

    for (const item of parsed.items) {
      const catId = item.catId || matchCategory(item.name) || "carpentry";
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push({
        name: item.name,
        qty: item.qty || 1,
        unit: item.unit || "식",
        unitPrice: item.unitPrice || (item.totalAmount ? Math.round(item.totalAmount / (item.qty || 1) / 100) * 100 : 0),
      });
    }

    return ok({ grouped, rawItems: parsed.items });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err("영수증 분석 결과 파싱 실패. 다시 시도해주세요.", 422);
    }
    return serverError(error);
  }
}
