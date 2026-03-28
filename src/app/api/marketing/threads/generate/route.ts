import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { sites, constructionPhases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { type, siteId, context } = body as {
    type: string;
    siteId?: string;
    context?: string;
  };

  if (!type) {
    return NextResponse.json({ error: "type 필수" }, { status: 400 });
  }

  // Build context from site data if siteId provided
  let siteContext = "";
  if (siteId) {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    if (site) {
      const phases = await db
        .select()
        .from(constructionPhases)
        .where(eq(constructionPhases.siteId, siteId));

      const completedPhases = phases.filter((p) => p.status === "완료").map((p) => p.category);
      const inProgressPhases = phases.filter((p) => p.status === "진행중").map((p) => p.category);

      siteContext = `
현장 정보:
- 현장명: ${site.name}
- 위치: ${site.address || "미정"}
- 건물유형: ${site.buildingType || "미정"}
- 면적: ${site.areaPyeong || "미정"}평
- 상태: ${site.status}
- 완료 공정: ${completedPhases.join(", ") || "없음"}
- 진행중 공정: ${inProgressPhases.join(", ") || "없음"}
`;
    }
  }

  const typeDescriptions: Record<string, string> = {
    시공완료: "시공이 완료된 인테리어 프로젝트를 소개하는 글. Before/After 비포/애프터 느낌으로, 공간의 변화를 강조.",
    시공팁: "인테리어 시공 과정에서 유용한 팁이나 노하우를 공유하는 교육형 콘텐츠. 전문성을 보여주면서도 쉽게 설명.",
    고객후기: "실제 고객의 만족 후기를 바탕으로 한 콘텐츠. 신뢰감과 친근함을 강조.",
    프로모션: "할인, 이벤트, 특가 등 프로모션 정보를 알리는 콘텐츠. 긴급성과 혜택을 강조.",
    일상: "인테리어 업체의 일상, 현장 분위기, 팀 소개 등 친근한 브랜딩 콘텐츠.",
  };

  const prompt = `당신은 한국 인테리어 업체의 SNS 마케팅 전문가입니다.
Meta Threads 플랫폼에 올릴 포스트를 작성해주세요.

콘텐츠 유형: ${type}
설명: ${typeDescriptions[type] || type}
${siteContext}
${context ? `추가 컨텍스트: ${context}` : ""}

다음 JSON 형식으로 정확히 응답해주세요 (JSON만 반환):
{
  "content": "포스트 본문 (500자 이내, 이모지 적절히 활용, 줄바꿈으로 가독성 확보)",
  "hashtags": "#인테리어 #리모델링 ... (5-10개, 공백으로 구분)"
}

규칙:
- 한국어로 작성
- Threads 최적화 (500자 이내)
- 자연스럽고 전문적인 톤
- 이모지는 적절히 (과하지 않게)
- 해시태그는 한국 인테리어 관련 트렌디한 태그 포함
- CTA(Call to Action) 포함 (DM 문의, 프로필 링크 등)`;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "콘텐츠 생성에 실패했습니다. 다시 시도해주세요.", raw: text },
      { status: 422 }
    );
  }
}
