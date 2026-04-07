/**
 * 월별 Q&A 생성 설정 — 소비자(인테리어 준비중인 고객) 관점
 */

export interface MonthlyConfig {
  month: number;
  season: string;
  context: string;
  categoryWeights: {
    estimate: number;
    contractor: number;
    process: number;
    quality: number;
    materials: number;
    design: number;
    other: number;
  };
  mood: string;
}

const MONTHLY_CONFIGS: MonthlyConfig[] = [
  {
    month: 1,
    season: "연초 비수기",
    context: "새해 이사/인테리어 계획 시작. 비수기라 견적이 저렴할지 궁금, 봄 입주 목표로 업체 알아보기 시작, 연말에 계약했는데 연초에 시공 시작 예정",
    categoryWeights: { estimate: 30, contractor: 25, process: 10, quality: 10, materials: 10, design: 10, other: 5 },
    mood: "기대감, 정보 수집, 비수기 할인 기대",
  },
  {
    month: 2,
    season: "비수기 + 설 연휴",
    context: "설 연휴 전후 시공 일정 걱정, 봄 입주 맞추려면 언제 계약해야 하나, 비수기에 시작하면 할인 받을 수 있는지, 자재 선택 고민 시작",
    categoryWeights: { estimate: 25, contractor: 20, process: 15, quality: 10, materials: 15, design: 10, other: 5 },
    mood: "조급함, 설 연휴 일정 걱정, 할인 기대",
  },
  {
    month: 3,
    season: "비수기→성수기 전환",
    context: "봄 이사 시즌 시작, 견적 받기 시작하는 사람 급증. 여러 업체 비교 중, 견적 차이가 왜 이렇게 큰지 의문, 3월에 계약하면 5월 입주 가능한지",
    categoryWeights: { estimate: 30, contractor: 25, process: 15, quality: 5, materials: 10, design: 10, other: 5 },
    mood: "비교 분석 모드, 불안감, 서두름",
  },
  {
    month: 4,
    season: "봄 성수기 본격",
    context: "성수기라 업체 잡기 어려움, 견적이 비수기보다 높아짐. 시공 중인 현장 관리 궁금, 공정별 체크 포인트, 업체가 바빠서 소통이 안 됨",
    categoryWeights: { estimate: 20, contractor: 20, process: 25, quality: 15, materials: 10, design: 5, other: 5 },
    mood: "성수기 가격 충격, 시공 중 불안, 소통 스트레스",
  },
  {
    month: 5,
    season: "성수기 피크",
    context: "시공 중 문제 발생 다수(일정 지연, 추가 비용, 하자). 업체가 너무 바빠서 AS 느림, 이웃 민원, 시공 품질 걱정",
    categoryWeights: { estimate: 15, contractor: 15, process: 20, quality: 30, materials: 10, design: 5, other: 5 },
    mood: "스트레스, 하자 걱정, 추가비용 분쟁",
  },
  {
    month: 6,
    season: "성수기 마무리 + 장마",
    context: "장마철 시공 가능한지, 습기/곰팡이 걱정, 도배·페인트 시기 고민. 봄에 한 인테리어 하자 보수 요청, 장마 전에 마무리해야 하는 공사",
    categoryWeights: { estimate: 10, contractor: 15, process: 15, quality: 30, materials: 20, design: 5, other: 5 },
    mood: "장마 걱정, 하자 보수 요구, 마감재 선택 신중",
  },
  {
    month: 7,
    season: "여름 비수기",
    context: "비수기라 견적 저렴해지는지, 가을 입주 목표로 준비 시작. 여름에 시공하면 장단점, 에어컨 설치와 인테리어 동시 진행 가능한지",
    categoryWeights: { estimate: 25, contractor: 20, process: 10, quality: 10, materials: 15, design: 15, other: 5 },
    mood: "여유, 정보 수집, 가을 입주 계획",
  },
  {
    month: 8,
    season: "비수기 + 여름 휴가",
    context: "9월 가을 성수기 전 계약 서두르기. 여름 휴가 시즌이라 업체 연락 안됨, 가을 입주 맞추려면 지금 계약해야 하는지",
    categoryWeights: { estimate: 25, contractor: 25, process: 10, quality: 5, materials: 15, design: 15, other: 5 },
    mood: "서두름, 업체 선택 고민, 가을 준비",
  },
  {
    month: 9,
    season: "가을 성수기 시작",
    context: "추석 전후 일정 조율, 연말 입주 목표. 성수기 진입으로 견적 상승, 업체 스케줄 확보 경쟁, 자재 품절 이슈",
    categoryWeights: { estimate: 25, contractor: 25, process: 15, quality: 10, materials: 15, design: 5, other: 5 },
    mood: "조급함, 연말 입주 압박, 가격 비교",
  },
  {
    month: 10,
    season: "가을 성수기 본격",
    context: "연말 입주 마감 임박, 시공 중 현장 관리 이슈. 공사 지연 걱정, 추가 비용 발생, 입주 청소·준비 궁금",
    categoryWeights: { estimate: 15, contractor: 15, process: 25, quality: 25, materials: 10, design: 5, other: 5 },
    mood: "마감 압박, 품질 걱정, 입주 준비",
  },
  {
    month: 11,
    season: "성수기 마무리",
    context: "입주 전 최종 점검, 하자 체크리스트. 잔금 지급 전 확인사항, 입주 청소, 가구 배치, AS 보증 기간 확인",
    categoryWeights: { estimate: 10, contractor: 15, process: 15, quality: 35, materials: 10, design: 10, other: 5 },
    mood: "꼼꼼함, 하자 점검, 입주 기대",
  },
  {
    month: 12,
    season: "연말 정산",
    context: "내년 인테리어 계획, 연말 할인 프로모션 있는지. 올해 한 인테리어 하자 AS 요청, 겨울 시공 주의사항, 새해 이사 준비",
    categoryWeights: { estimate: 25, contractor: 20, process: 10, quality: 15, materials: 10, design: 10, other: 10 },
    mood: "내년 계획, 연말 할인 기대, 하자 AS",
  },
];

/** KST 기준 현재 월의 설정 반환 */
export function getCurrentMonthConfig(): MonthlyConfig {
  const now = new Date();
  const kstMonth = new Date(now.getTime() + 9 * 60 * 60 * 1000).getMonth() + 1; // 1-12
  return MONTHLY_CONFIGS[kstMonth - 1];
}

/** 가중치 배열에서 가중 랜덤 선택 */
export function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + (w as number), 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight as number;
    if (rand <= 0) return key;
  }
  return entries[0][0];
}
