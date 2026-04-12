import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { checkRateLimit, callAnthropicWithRetry, extractText } from "@/lib/api/ai-helpers";
import {
  CATS,
  GRADES,
  GRADE_SPECS,
  calcCatTotal,
  areaCoeff,
  rooms,
  baths,
  CAT_DURATION,
  getDuration,
  fmtShort,
} from "@/lib/estimate-engine";

// --- 즉석 견적 계산 (GET) - 공개 API (계산만 수행, DB 접근 없음) ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = parseFloat(searchParams.get("area") || "27");
  const gradeKey = searchParams.get("grade") || "standard";

  const grade = GRADES.find((g) => g.key === gradeKey) || GRADES[2];

  const breakdown = CATS.map((cat) => {
    const total = calcCatTotal(cat, area, gradeKey);
    const duration = getDuration(cat.id, area);
    const spec = GRADE_SPECS[cat.id]?.[gradeKey] || "";
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      essential: cat.essential,
      total,
      duration,
      spec,
      matOptions: cat.matOptions?.map((m) => ({
        grade: m.grade,
        name: m.name,
        price: m.price,
      })),
    };
  });

  const directTotal = breakdown.reduce((s, c) => s + c.total, 0);

  // 등급별 비교
  const gradeComparison = GRADES.map((g) => {
    const total = CATS.reduce((s, cat) => s + calcCatTotal(cat, area, g.key), 0);
    return {
      key: g.key,
      label: g.label,
      tag: g.tag,
      color: g.color,
      mult: g.mult,
      total,
    };
  });

  // 공사기간 추정
  const maxSeq = Math.max(...Object.values(CAT_DURATION).map((d) => d.seq));
  let totalMinDays = 0;
  let totalMaxDays = 0;
  for (let seq = 1; seq <= maxSeq; seq++) {
    const catsInSeq = Object.entries(CAT_DURATION).filter(([, d]) => d.seq === seq);
    const maxMin = Math.max(...catsInSeq.map(([id]) => getDuration(id, area).min));
    const maxMax = Math.max(...catsInSeq.map(([id]) => getDuration(id, area).max));
    totalMinDays += maxMin;
    totalMaxDays += maxMax;
  }

  return ok({
    area,
    grade: {
      key: grade.key,
      label: grade.label,
      tag: grade.tag,
      color: grade.color,
      desc: grade.desc,
      mult: grade.mult,
    },
    areaCoeff: areaCoeff(area),
    rooms: rooms(area),
    baths: baths(area),
    directTotal,
    breakdown,
    gradeComparison,
    duration: { min: totalMinDays, max: totalMaxDays },
  });
}

// --- AI 견적 코칭 (POST) - 인증 필요 (API 비용 발생) ---
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
    const { question, area, grade, breakdown } = body as {
      question: string;
      area?: number;
      grade?: string;
      breakdown?: { name: string; total: number }[];
    };

    if (!question) {
      return err("question 필수");
    }

    const contextParts: string[] = [];
    if (area) contextParts.push(`현재 시뮬레이션: ${area}평`);
    if (grade) {
      const g = GRADES.find((gr) => gr.key === grade);
      if (g) contextParts.push(`등급: ${g.label} (${g.tag})`);
    }
    if (breakdown?.length) {
      const total = breakdown.reduce((s, b) => s + b.total, 0);
      contextParts.push(`총 공사비: ${fmtShort(total)}`);
      contextParts.push(
        `공종별: ${breakdown
          .filter((b) => b.total > 0)
          .map((b) => `${b.name} ${fmtShort(b.total)}`)
          .join(", ")}`
      );
    }

    const answer = await callAnthropicWithRetry(async (client) => {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: `당신은 대한민국 인테리어 견적 전문 코치입니다. 10년 이상 경력의 인테리어 견적 전문가로서, 건축주에게 실질적이고 구체적인 조언을 제공합니다.

전문 분야:
- 인테리어 공사 견적 분석 및 참고 가격 범위 제시
- 공종별(철거, 설비, 전기, 목공, 타일, 도배, 주방 등) 세부 비용 분석
- 자재 등급별 가격 차이와 가성비 추천
- 시공 품질 대비 비용 최적화 전략
- 업체 견적서 비교 분석 요령
- 2026년 기준 인건비 및 자재가 시세

${contextParts.length > 0 ? `\n현재 고객 상황:\n${contextParts.join("\n")}` : ""}

답변 규칙:
- 한국어, 존댓말 (사장님/고객님 호칭)
- 구체적인 금액, 자재명, 브랜드 포함
- 실무에서 쓰이는 팁과 주의사항 강조
- 800자 이내로 핵심 위주
- 비용 절감 포인트가 있으면 반드시 언급
- 과도한 절약이 품질 하락으로 이어지는 경우 경고

질문: ${question}`,
          },
        ],
      });
      return extractText(response);
    });

    return ok({ question, answer, createdAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message.includes("ANTHROPIC_API_KEY")) {
      return err(error.message, 500);
    }
    return serverError(error);
  }
}
