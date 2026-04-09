/**
 * 샘플 톡방 대본
 * 신규 유저 가입 시 자동 주입되는 현장 톡방 대화 시나리오
 * "잠실 32평 리모델링" 가상 프로젝트
 */

export interface SampleMessage {
  senderType: "owner" | "team" | "partner" | "client" | "system";
  senderDisplayName: string;
  content: string;
  contentType: "text" | "image" | "system_event";
  /** 첫 메시지 대비 분 단위 오프셋 */
  minuteOffset: number;
  metadata?: Record<string, unknown>;
}

export const SAMPLE_PROJECT = {
  name: "샘플: 잠실 32평 리모델링",
  address: "서울 송파구 잠실동 레이크팰리스 A동 1203호",
  buildingType: "아파트" as const,
  areaPyeong: 32,
  status: "시공중" as const,
  progress: 45,
  budget: 85_000_000,
  spent: 38_000_000,
};

export const SAMPLE_PINNED_SUMMARY = {
  currentProgressPercent: 45,
  nextMilestoneTitle: "타일 시공",
  nextMilestoneDate: "2026-04-18",
  pendingPaymentAmount: 15_000_000,
  pendingPaymentDueDate: "2026-04-25",
  openDefectsCount: 0,
};

export const SAMPLE_MESSAGES: SampleMessage[] = [
  // Day 1 — 철거 시작
  {
    senderType: "system",
    senderDisplayName: "시스템",
    content: "현장 톡방이 개설되었습니다.",
    contentType: "system_event",
    minuteOffset: 0,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "잠실 32평 리모델링 시작합니다. 오늘 철거팀 투입됩니다.",
    contentType: "text",
    minuteOffset: 5,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "네 감사합니다! 혹시 소음이 많이 심할까요? 옆집에 미리 말씀드려야 할지...",
    contentType: "text",
    minuteOffset: 12,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "관리사무소에 공사 신고는 저희가 이미 했고, 양옆 세대에도 인사 돌렸습니다. 철거는 이틀 정도 소요됩니다.",
    contentType: "text",
    minuteOffset: 15,
  },
  {
    senderType: "partner",
    senderDisplayName: "철거팀 이반장",
    content: "철거 시작합니다. 화장실 타일 상태가 예상보다 좋아서 부분 철거로 진행해도 될 것 같습니다.",
    contentType: "text",
    minuteOffset: 60,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "좋습니다. 부분 철거로 가면 비용도 절감되고 공기도 단축되니 그렇게 하시죠.",
    contentType: "text",
    minuteOffset: 65,
  },

  // Day 1 — 오후
  {
    senderType: "partner",
    senderDisplayName: "철거팀 이반장",
    content: "거실 벽체 철거 완료했습니다. 사진 보내드립니다.",
    contentType: "text",
    minuteOffset: 300,
  },
  {
    senderType: "partner",
    senderDisplayName: "철거팀 이반장",
    content: "[거실 벽체 철거 완료 사진]",
    contentType: "image",
    minuteOffset: 301,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "와 깔끔하게 잘 빠졌네요! 실시간으로 볼 수 있어서 좋습니다 👍",
    contentType: "text",
    minuteOffset: 320,
  },

  // Day 2 — 철거 마무리
  {
    senderType: "system",
    senderDisplayName: "시스템",
    content: "진행률이 10%에서 23%로 업데이트되었습니다.",
    contentType: "system_event",
    minuteOffset: 1440,
    metadata: { type: "progress_update", from: 10, to: 23 },
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "철거 완료됐습니다. 내일부터 배관 작업 들어갑니다. 배관팀 이 기사님 투입 예정입니다.",
    contentType: "text",
    minuteOffset: 1500,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "어머 빠르네요, 감사합니다! 배관은 얼마나 걸릴까요?",
    contentType: "text",
    minuteOffset: 1520,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "배관은 3일 정도 잡고 있습니다. 화장실 2개 + 주방 배관 교체입니다.",
    contentType: "text",
    minuteOffset: 1525,
  },

  // Day 4 — 배관
  {
    senderType: "partner",
    senderDisplayName: "배관 이기사",
    content: "안방 화장실 배관 완료. 거실 화장실은 내일 마무리합니다.",
    contentType: "text",
    minuteOffset: 4320,
  },
  {
    senderType: "partner",
    senderDisplayName: "배관 이기사",
    content: "[안방 화장실 배관 작업 사진]",
    contentType: "image",
    minuteOffset: 4321,
  },

  // Day 5 — 전기
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "배관 완료. 오늘부터 전기 작업 병행합니다. 콘센트 위치 변경 건 반영했습니다.",
    contentType: "text",
    minuteOffset: 5760,
  },
  {
    senderType: "team",
    senderDisplayName: "최현장",
    content: "거실 벽체 치수 다시 확인 부탁드려요. 붙박이장 들어갈 자리 900mm 맞는지 체크해야 합니다.",
    contentType: "text",
    minuteOffset: 5800,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "방금 확인했습니다. 920mm 나옵니다. 붙박이장 사이즈 문제없습니다.",
    contentType: "text",
    minuteOffset: 5830,
  },

  // Day 7 — 수금 관련
  {
    senderType: "system",
    senderDisplayName: "시스템",
    content: "중도금 1차 1,500만원 결제일이 4/25로 예정되어 있습니다.",
    contentType: "system_event",
    minuteOffset: 8640,
    metadata: { type: "payment_reminder", amount: 15_000_000, dueDate: "2026-04-25" },
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "박고객님, 중도금 1차 안내드립니다. 4/25까지 1,500만원입니다. 계좌는 이전에 안내드린 것과 동일합니다.",
    contentType: "text",
    minuteOffset: 8700,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "네 알겠습니다. 25일 전에 입금하겠습니다!",
    contentType: "text",
    minuteOffset: 8730,
  },

  // Day 9 — 목공
  {
    senderType: "system",
    senderDisplayName: "시스템",
    content: "진행률이 23%에서 45%로 업데이트되었습니다.",
    contentType: "system_event",
    minuteOffset: 11520,
    metadata: { type: "progress_update", from: 23, to: 45 },
  },
  {
    senderType: "partner",
    senderDisplayName: "목공 박기사",
    content: "거실 천장 몰딩 작업 중입니다. 우물천장 시공 진행하고 있어요.",
    contentType: "text",
    minuteOffset: 11600,
  },
  {
    senderType: "partner",
    senderDisplayName: "목공 박기사",
    content: "[거실 우물천장 시공 사진]",
    contentType: "image",
    minuteOffset: 11601,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "우물천장 너무 예쁘네요! 조명 들어가면 더 멋질 것 같아요.",
    contentType: "text",
    minuteOffset: 11650,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "네, 간접조명 들어가면 분위기 확 달라집니다. 다음 주 타일 시공 후에 조명 설치합니다.",
    contentType: "text",
    minuteOffset: 11660,
  },

  // Day 10 — 다음 일정 안내
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "이번 주까지 목공 마무리하고, 다음 주 월요일(4/18)부터 타일 시공 들어갑니다. 타일은 선택하신 포세린 300x600으로 진행합니다.",
    contentType: "text",
    minuteOffset: 12960,
  },
  {
    senderType: "client",
    senderDisplayName: "박고객",
    content: "감사합니다! 진행 상황 계속 공유해주셔서 안심이 됩니다 😊",
    contentType: "text",
    minuteOffset: 13000,
  },
  {
    senderType: "owner",
    senderDisplayName: "김사장",
    content: "당연하죠! 궁금한 점 있으시면 언제든 톡 남겨주세요.",
    contentType: "text",
    minuteOffset: 13010,
  },
];

/** 샘플 첨부파일 목록 (Storage에 미리 업로드된 무저작권 사진) */
export const SAMPLE_ATTACHMENTS = [
  {
    messageIndex: 7, // "사진 보내드립니다" 다음 메시지
    storagePath: "/sample/demolition-livingroom.jpg",
    fileType: "image/jpeg",
    fileSize: 245_000,
    autoCategorizedTag: "demolition",
  },
  {
    messageIndex: 14, // 배관 사진
    storagePath: "/sample/plumbing-bathroom.jpg",
    fileType: "image/jpeg",
    fileSize: 312_000,
    autoCategorizedTag: "bathroom",
  },
  {
    messageIndex: 24, // 우물천장 사진
    storagePath: "/sample/ceiling-living.jpg",
    fileType: "image/jpeg",
    fileSize: 280_000,
    autoCategorizedTag: "living",
  },
];
