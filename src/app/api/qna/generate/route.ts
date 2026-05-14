import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { getCurrentMonthConfig, weightedPick } from "@/lib/qna/monthly-config";
import { createCronRoute } from "@/lib/cron/monitor";

const CATEGORY_LABELS: Record<string, string> = {
  estimate: "견적/비용",
  contractor: "업체선택",
  process: "시공과정",
  quality: "품질/하자",
  materials: "자재/마감재",
  design: "디자인/스타일",
  other: "기타",
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAuthorId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "user_";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/** KST 날짜 문자열에서 08:00~22:00 사이 랜덤 시간 생성 */
function randomKSTTime(dateStr: string): Date {
  const hour = randomInt(8, 21);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  return new Date(
    `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+09:00`,
  );
}

/** created_at 이후 30분~4시간 랜덤 */
function randomAnsweredAt(createdAt: Date): Date {
  const offsetMs = randomInt(30 * 60_000, 4 * 3600_000);
  return new Date(createdAt.getTime() + offsetMs);
}

function getTodayKST(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().split("T")[0];
}

async function generateQnaBatch(
  count: number,
): Promise<Array<{ title: string; content: string; answer: string; category: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const config = getCurrentMonthConfig();

  // 가중치 기반 카테고리 사전 배정
  const categories = Array.from({ length: count }, () => weightedPick(config.categoryWeights));

  const assignmentList = categories
    .map((cat, i) => `[${i + 1}] 카테고리: ${CATEGORY_LABELS[cat]} (${cat})`)
    .join("\n");

  // CTA 대상 인덱스 (10-15%)
  const ctaCount = Math.max(1, Math.round(count * randomInt(10, 15) / 100));
  const ctaIndices = new Set<number>();
  while (ctaIndices.size < ctaCount) {
    ctaIndices.add(randomInt(0, count - 1));
  }
  const ctaNote = `CTA 삽입 대상 번호: ${[...ctaIndices].map((i) => i + 1).join(", ")} (해당 답변의 마지막 단락에 인테리어코치 기능을 자연스럽게 언급)`;

  const prompt = `당신은 대한민국 인테리어 업계에서 15년 이상 경력의 전문 컨설턴트입니다.
인테리어를 준비 중인 일반 소비자(집주인)들이 올리는 질문과, 전문가가 답변하는 Q&A를 생성합니다.

## 시즌 컨텍스트
현재: ${config.month}월 (${config.season})
${config.context}
분위기: ${config.mood}

## 생성 요청
아래 ${count}개의 질문-답변 쌍을 생성해주세요.
질문자는 전부 **인테리어를 준비 중이거나 시공 중인 일반 소비자(집주인)**입니다.

${assignmentList}

${ctaNote}

## 질문자 페르소나 (전부 소비자)
- 신혼부부 (첫 인테리어, 예산 걱정)
- 아파트 입주 예정자 (신축/구축 리모델링)
- 자가 소유자 (노후 주택 리모델링)
- 전세/월세 세입자 (부분 인테리어)
- 부모님 집 인테리어 대신 알아보는 자녀
다양한 페르소나를 섞어주세요.

## 제목 규칙
- 소비자 입장의 자연스러운 질문 톤
- 구체적 상황 포함 (평수, 예산, 지역, 공간 등)
- 5-10%는 오타/줄임말 포함: "이게 맞나요;;", "어떻게 해야하나요ㅠ", "도와주세요ㅠㅠ"
- 15%는 지역명 포함: 서울/경기/인천 위주
- 시작 패턴 다양하게: "견적을~", "업체 선택~", "시공 중에~", "25평 아파트~", "처음 인테리어~", "신혼집~", "30대 부부인데~", "이번에 이사~", "솔직히~", "급해요)~", "혹시~"
- 동일 패턴 반복 금지
- 20~50자

## 질문(content) 규칙 (200~500자)
- 소비자 입장에서의 구체적 고민과 상황 설명
  - 견적/비용(estimate): 견적서 항목 이해, 적정 가격, 추가 비용, 예산 배분
  - 업체선택(contractor): 좋은 업체 고르는 법, 후기 확인법, 계약 시 주의사항, 업체 비교
  - 시공과정(process): 시공 기간, 공정 순서, 시공 중 확인할 것, 입주 일정
  - 품질/하자(quality): 하자 발견, AS 요청, 마감 품질 체크, 하자 보수
  - 자재/마감재(materials): 자재 선택, 브랜드 비교, 가성비 자재, 친환경 자재
  - 디자인/스타일(design): 인테리어 스타일, 색상 조합, 공간 활용, 트렌드

## 답변(answer) 규칙 (300~800자)
### 3단 구성 필수:
1. **공감** (1문장) — "처음 인테리어 준비하시면 충분히 걱정되실 수 있습니다", "많은 분들이 같은 고민을 하십니다"
2. **핵심 조언** (2-3개 포인트) — 소비자가 실제로 활용할 수 있는 구체적 팁, 수치, 체크리스트
3. **마무리** — CTA 대상이면 인테리어코치 기능 자연 연결, 아니면 격려

### 답변 품질:
- 구체적 수치 또는 체크리스트 최소 1개 필수 (예: "25평 기준 전체 인테리어 2,500~4,000만원", "시공 기간 보통 3~4주")
- 소비자가 바로 활용할 수 있는 실용적 조언
- 친절하고 쉬운 설명 (전문 용어 사용 시 괄호로 설명 추가)
- 존댓말 사용 ("~하시는 게", "~드립니다")
- 2026년 현재 인테리어 시세/트렌드 반영

### CTA 패턴 (해당 번호만):
- 견적/비용: "인테리어코치에서 견적 비교 기능으로 적정 가격을 확인해보실 수 있습니다"
- 업체선택: "인테리어코치에서 검증된 업체 정보와 실제 시공 사례를 확인하실 수 있습니다"
- 시공과정: "인테리어코치 공정표 공유 기능으로 시공 진행 상황을 실시간으로 확인하실 수 있습니다"
- 품질/하자: "인테리어코치에서 하자 체크리스트와 AS 요청 관리를 편리하게 하실 수 있습니다"
- 자재/마감재: "인테리어코치에서 자재별 가격 비교와 실제 시공 사례를 확인하실 수 있습니다"
- 디자인: "인테리어코치에서 다양한 스타일 레퍼런스와 시공 사례를 모아보실 수 있습니다"

### SEO 키워드 자연 포함:
인테리어 견적, 인테리어 비용, 인테리어 업체 추천, 아파트 인테리어, 인테리어 시공, 인테리어 하자, 인테리어 자재, 인테리어 디자인, 리모델링 비용, 신혼집 인테리어, 인테리어 AS, 인테리어 계약, 인테리어 공정, 인테리어 마감재

## 금지어 (절대 사용 불가)
- 경쟁사: 집닥→"타 플랫폼", 오늘의집→"인테리어 커뮤니티", 호갱노노→"시세 조회 서비스", 아키스케치→"3D 설계 툴", 숨고→"견적 중개 서비스", 집첵→"현장 검수 서비스"
- 비방: 사기→"신뢰 문제", 먹튀→"계약 불이행", 야반도주→"연락 두절", 날림공사→"시공 품질 이슈", 양아치→"비전문적 행위"
- 불법/비윤리: 불법 하도급 조장, 무자격 시공 권유, 탈세 방법, 허위 견적 작성 방법 등 금지
- 법률/세무/노무 구체 질문 시: "전문가 상담을 권장드립니다" 로 전환

## 출력 형식
반드시 아래 JSON 배열만 출력 (설명 텍스트 없이):
[
  {
    "title": "질문 제목",
    "content": "질문 본문",
    "answer": "답변 본문",
    "category": "지정된 카테고리 코드"
  }
]`;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(jsonStr);
}

export const GET = createCronRoute({
  name: "qna/generate",
  handler: async () => {
    const todayKST = getTodayKST();
    const totalCount = randomInt(7, 15);

    const generated = await generateQnaBatch(totalCount);

    const rows = generated.map((item) => {
      const isPending = Math.random() < 0.1;
      const createdAt = randomKSTTime(todayKST);
      const answeredAt = isPending ? null : randomAnsweredAt(createdAt);

      return {
        service: "interior" as const,
        title: item.title,
        content: item.content,
        answer: isPending ? null : item.answer,
        authorId: generateAuthorId(),
        authorRole: "consumer",
        category: item.category,
        status: isPending ? "pending" : "answered",
        createdAt,
        answeredAt,
        viewCount: randomInt(50, 500),
      };
    });

    const inserted = await db.insert(qnaPosts).values(rows).returning();
    const config = getCurrentMonthConfig();
    const pending = rows.filter((r) => r.status === "pending").length;
    const answered = rows.filter((r) => r.status === "answered").length;

    return {
      processed: inserted.length,
      metadata: {
        date: todayKST,
        month: config.month,
        season: config.season,
        pending,
        answered,
      },
    };
  },
});
