import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxAiConsultations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const USER_ID = "demo";

export async function GET() {
  const rows = await db
    .select()
    .from(taxAiConsultations)
    .where(eq(taxAiConsultations.userId, USER_ID))
    .orderBy(desc(taxAiConsultations.createdAt))
    .limit(20);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  const body = await request.json();
  const { question } = body as { question: string };

  if (!question) {
    return NextResponse.json({ error: "question 필수" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `당신은 한국 인테리어 사업자를 위한 세무/회계 전문 상담사입니다.

전문 분야:
- 부가가치세 (매출세액, 매입세액, 신고/납부)
- 원천징수 (일용직, 프리랜서, 정규직)
- 4대보험 (국민연금, 건강보험, 고용보험, 산재보험)
- 종합소득세 / 법인세
- 인테리어 업종 특화 절세 방법
- 세금계산서 발행/수취
- 경비 처리 및 증빙

답변 규칙:
- 한국어, 존댓말
- 전문적이면서 이해하기 쉽게
- 구체적인 세율, 기한, 절차 포함
- 관련 법규 참고 시 간단히 언급
- 500자 이내로 핵심만
- ⚠️ 마지막에 "본 상담은 일반적인 세무 정보이며, 구체적인 세무 처리는 세무사와 상담하시기 바랍니다." 고지 포함

질문: ${question}`,
      },
    ],
  });

  const answer = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  const [saved] = await db
    .insert(taxAiConsultations)
    .values({
      userId: USER_ID,
      question,
      answer,
      category: "세무상담",
    })
    .returning();

  return NextResponse.json(saved);
}
