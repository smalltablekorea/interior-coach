import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { CATS, calcSub } from "@/lib/estimate-engine";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return err("ANTHROPIC_API_KEY가 설정되지 않았습니다.", 500);

  try {
    const body = await request.json();
    const { catId, catName, area, grade, gradeLabel, buildingType } = body as {
      catId: string;
      catName: string;
      area: number;
      grade: string;
      gradeLabel: string;
      buildingType: string;
    };

    if (!catId || !catName) return err("catId, catName 필수");

    const cat = CATS.find((c) => c.id === catId);
    if (!cat) return err("존재하지 않는 공종입니다.");

    // 현재 엔진 세부항목 정보
    const engineSubs = cat.subs.map((sub, i) => ({
      index: i,
      name: sub.name,
      type: sub.type,
      computed: Math.round(calcSub(sub, area || 27)),
    }));

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `당신은 대한민국 인테리어 현장 견적 전문가입니다. 아래 현장 조건에 맞는 "${catName}" 공종의 세부내역을 현실적으로 작성해주세요.

현장 조건:
- 면적: ${area || 27}평
- 등급: ${gradeLabel} (${grade})
- 건물유형: ${buildingType}

현재 엔진 세부항목:
${engineSubs.map((s) => `[${s.index}] ${s.name} (${s.type}) = ${s.computed.toLocaleString()}원`).join("\n")}

요청사항:
1. 기존 엔진 항목의 이름을 현장에 맞게 구체적으로 수정 (예: "철거 인건비" → "철거 인건비 (2인×2일)")
2. 필요시 금액도 현장 조건에 맞게 조정
3. 엔진에 없는 추가 항목이 필요하면 customSubs로 추가 (현실적인 수량/단위/단가)
4. 현장에서 실제로 필요한 자재가 있으면 matOverrides로 추가

반드시 아래 JSON 형식으로만 응답하세요. 설명 텍스트 없이 JSON만:
{
  "subs": [
    { "index": 0, "name": "수정된 항목명", "amount": 수정금액또는null }
  ],
  "customSubs": [
    { "name": "추가항목명", "qty": 1, "unit": "식", "unitPrice": 100000 }
  ],
  "matOverrides": [
    { "name": "자재명", "qty": 1, "unit": "개", "unitPrice": 50000 }
  ]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // JSON 파싱 (코드블록 제거)
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return ok({
      subs: parsed.subs || [],
      customSubs: parsed.customSubs || [],
      matOverrides: parsed.matOverrides || [],
    });
  } catch (error) {
    return serverError(error);
  }
}
