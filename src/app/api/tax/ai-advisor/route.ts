import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taxAiConsultations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { requireFeature } from "@/lib/api/plan-guard";
import { incrementUsage } from "@/lib/subscription";
import { z } from "zod";
import { validateBody } from "@/lib/api/validate";

const questionSchema = z.object({
  question: z.string().min(1, "질문을 입력해주세요").max(2000),
});

export async function GET() {
  const auth = await requireWorkspaceAuth("tax", "read");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const rows = await db
      .select()
      .from(taxAiConsultations)
      .where(workspaceFilter(taxAiConsultations.workspaceId, taxAiConsultations.userId, wid, uid))
      .orderBy(desc(taxAiConsultations.createdAt))
      .limit(20);

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "write");
  if (!auth.ok) return auth.response;

  const wid = auth.workspaceId;
  const uid = auth.userId;

  // 플랜 체크: aiTaxAdvisor는 starter 이상
  const planCheck = await requireFeature(uid, "aiTaxAdvisor");
  if (!planCheck.ok) return planCheck.response;

  const validation = await validateBody(request, questionSchema);
  if (!validation.ok) return validation.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err("ANTHROPIC_API_KEY가 설정되지 않았습니다.", 500);
  }

  try {
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

질문: ${validation.data.question}`,
        },
      ],
    });

    const answer = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    const [saved] = await db
      .insert(taxAiConsultations)
      .values({
        userId: uid,
        workspaceId: wid,
        question: validation.data.question,
        answer,
        category: "세무상담",
      })
      .returning();

    // 사용량 카운트 증가
    await incrementUsage(uid, "aiTaxAdvisor");

    return ok(saved);
  } catch (error) {
    return serverError(error);
  }
}
