// 랜딩 Live Demo 섹션용 샘플 메시지
export interface DemoMessage {
  id: number;
  sender: "사장님" | "목수팀장" | "고객" | "system";
  text: string;
  time: string;
  type: "text" | "image" | "system";
  imageUrl?: string;
}

export const DEMO_MESSAGES: DemoMessage[] = [
  { id: 1, sender: "system", text: "잠실 르엘 32평 리모델링 톡방이 생성되었습니다", time: "4/16 09:00", type: "system" },
  { id: 2, sender: "사장님", text: "오늘 철거 시작합니다. 인력 3명 투입 예정이에요.", time: "4/16 09:12", type: "text" },
  { id: 3, sender: "목수팀장", text: "네 사장님, 오전에 보양 먼저 끝내고 시작하겠습니다", time: "4/16 09:15", type: "text" },
  { id: 4, sender: "사장님", text: "철거 전 현장 사진입니다", time: "4/16 09:30", type: "image", imageUrl: "" },
  { id: 5, sender: "system", text: "📸 시공 사진 3장이 자동 정리되었습니다", time: "4/16 09:31", type: "system" },
  { id: 6, sender: "고객", text: "사장님, 거실 벽체는 어디까지 철거되나요?", time: "4/16 10:05", type: "text" },
  { id: 7, sender: "사장님", text: "거실 좌측 비내력벽만 철거합니다. 도면 다시 공유드릴게요", time: "4/16 10:08", type: "text" },
  { id: 8, sender: "system", text: "✅ 철거 공정 시작 → 진행률 8%", time: "4/16 12:00", type: "system" },
  { id: 9, sender: "목수팀장", text: "폐기물 1톤 반출 완료했습니다. 내일 추가 반출 예정", time: "4/16 17:30", type: "text" },
  { id: 10, sender: "사장님", text: "수고하셨습니다. 내일 전기 팀장님 오시면 분전반 먼저 확인해주세요", time: "4/16 18:00", type: "text" },
  { id: 11, sender: "system", text: "🔔 내일 공정: 전기 (팀장+기공 2인)", time: "4/16 18:01", type: "system" },
  { id: 12, sender: "고객", text: "진행 상황 잘 보고 있습니다. 감사해요!", time: "4/16 20:15", type: "text" },
];

export const DEMO_PROGRESS_STEPS = [
  { label: "철거", pct: 100, done: true },
  { label: "전기", pct: 100, done: true },
  { label: "목공", pct: 60, done: false },
  { label: "타일", pct: 0, done: false },
  { label: "도배", pct: 0, done: false },
  { label: "가구", pct: 0, done: false },
];

export const DEMO_SIDEBAR = {
  progress: 38,
  nextMilestone: "타일 시공 (4/20~25)",
  payment: "2차 중도금 1,500만원 (4/25)",
  defects: 0,
  photos: 12,
};
