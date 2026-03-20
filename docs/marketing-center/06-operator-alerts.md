# 견적코치 마케팅 센터 — 운영자 알림 규칙

> 최종 수정: 2026-03-21

---

## 1. 알림 등급 체계

| 등급 | 색상 | 조건 | 운영자 대응 |
|------|------|------|-------------|
| **Critical** | 🔴 빨강 | 서비스 장애 수준, 매출 직접 영향 | 즉시 확인 (15분 이내) |
| **Warning** | 🟠 주황 | 전환율 하락, 이상 패턴 감지 | 당일 확인 |
| **Info** | 🔵 파랑 | 일반 운영 정보, 마일스톤 도달 | 확인 불필요 (대시보드 표시) |
| **Success** | 🟢 초록 | 목표 달성, 캠페인 성과 호조 | 참고 |

---

## 2. Critical 알림

### CRIT-01: 결제 성공률 급락

| 항목 | 값 |
|------|-----|
| **조건** | 최근 1시간 결제 성공률 < 80% (최소 5건 이상 시도 기준) |
| **계산** | `결제 성공 / (결제 성공 + 결제 실패) × 100` |
| **알림 채널** | 슬랙 #ops + 이메일 |
| **메시지** | "⚠️ 결제 성공률 급락: 최근 1시간 {rate}% (정상 기준 90%+). PG사 상태 확인 필요." |
| **재발송 방지** | 동일 조건 4시간 이내 재발송 금지 |
| **운영자 액션** | PG사 대시보드 확인 → 결제 수단별 실패 분석 → 필요시 PG사 연락 |

### CRIT-02: 업로드/분석 파이프라인 장애

| 항목 | 값 |
|------|-----|
| **조건** | 최근 30분 업로드 실패율 > 10% 또는 분석 완료율 < 80% |
| **알림 채널** | 슬랙 #ops + 이메일 |
| **메시지** | "⚠️ 분석 파이프라인 이상: 최근 30분 실패율 {rate}%. 서버/AI 상태 확인 필요." |
| **재발송 방지** | 2시간 |
| **운영자 액션** | 서버 로그 확인 → AI API 상태 확인 → 파일 포맷 이슈 확인 |

### CRIT-03: 일 매출 급감

| 항목 | 값 |
|------|-----|
| **조건** | 오늘 15시 기준 매출이 최근 7일 동시간 평균 대비 50% 미만 |
| **알림 채널** | 슬랙 #ops |
| **메시지** | "⚠️ 일 매출 급감: 오늘 {today_revenue} / 7일 평균 {avg_revenue} ({rate}%). 원인 분석 필요." |
| **재발송 방지** | 24시간 (하루 1회) |
| **운영자 액션** | 퍼널 단계별 이상 확인 → 트래픽 소스 확인 → 외부 요인 확인 |

---

## 3. Warning 알림

### WARN-01: 주요 전환율 하락

| 항목 | 값 |
|------|-----|
| **조건** | 주간 전환율(CVR-01~06 중 하나)이 전주 대비 20%p 이상 하락 |
| **알림 주기** | 매일 10:00 KST (전일 기준 집계) |
| **알림 채널** | 슬랙 #marketing |
| **메시지** | "📉 전환율 하락 감지: {step_name} 전환율 {this_week}% (전주 {last_week}%, 변화 {diff}%p)" |
| **운영자 액션** | 퍼널 페이지에서 해당 단계 분석 → 최근 변경사항 확인 |

### WARN-02: 미결제 대기자 급증

| 항목 | 값 |
|------|-----|
| **조건** | 분석 완료 후 24시간 미결제 유저 > 20명 (일 기준) |
| **알림 주기** | 매일 10:00 KST |
| **알림 채널** | 슬랙 #marketing |
| **메시지** | "📊 미결제 대기자 {count}명 (전일 {yesterday}명). 결제 유도 자동화 상태 확인 권장." |
| **운영자 액션** | 자동화 실행 상태 확인 → 결제 페이지 UX 점검 → 할인 캠페인 검토 |

### WARN-03: 자동화 발송 실패율 상승

| 항목 | 값 |
|------|-----|
| **조건** | 최근 24시간 자동화 메시지 발송 실패율 > 5% |
| **알림 채널** | 슬랙 #ops |
| **메시지** | "📨 자동화 발송 실패율 {rate}% (최근 24시간). 채널별: 카카오 {kakao}%, 이메일 {email}%." |
| **운영자 액션** | 카카오/이메일 API 상태 확인 → 수신자 데이터 품질 확인 |

### WARN-04: 업로드 중단율 급증

| 항목 | 값 |
|------|-----|
| **조건** | 일간 업로드 시작 대비 제출율이 50% 미만 (최소 10건 시작 기준) |
| **알림 주기** | 매일 18:00 KST |
| **알림 채널** | 슬랙 #product |
| **메시지** | "📤 업로드 중단율 높음: 시작 {started}건 / 제출 {submitted}건 (제출율 {rate}%). UX 이슈 확인 필요." |
| **운영자 액션** | 업로드 페이지 접근 → 에러 로그 확인 → 파일 포맷별 실패 분석 |

---

## 4. Info 알림

### INFO-01: 일간 요약 리포트

| 항목 | 값 |
|------|-----|
| **시간** | 매일 09:00 KST |
| **알림 채널** | 슬랙 #marketing |
| **내용** | 전일 KPI 요약 (8개 지표 + 전일 대비) |

**메시지 템플릿:**

```
📊 견적코치 일간 리포트 ({date})

신규가입: {signups}명 ({signup_diff})
업로드 시작: {uploads_started}건 ({upload_diff})
업로드 제출: {uploads_submitted}건 ({submit_diff})
분석 완료: {analysis_done}건
결제 성공: {payments}건 ({payment_diff})
매출: {revenue} ({revenue_diff})
업체문의: {inquiries}건
리포트 확인: {reports_viewed}건

주요 전환율:
• 가입→업로드: {cvr_signup_upload}%
• 분석→결제: {cvr_analysis_payment}%
• 리포트→문의: {cvr_report_inquiry}%

{alerts_summary}
```

### INFO-02: 주간 요약 리포트

| 항목 | 값 |
|------|-----|
| **시간** | 매주 월요일 09:00 KST |
| **알림 채널** | 슬랙 #marketing + 이메일 (팀 전체) |
| **내용** | 주간 KPI + 전주 대비 + 세그먼트별 변화 + 자동화 성과 |

### INFO-03: 마일스톤 알림

| 마일스톤 | 메시지 |
|----------|--------|
| 가입자 100명 | "🎉 가입자 100명 돌파!" |
| 가입자 500명 | "🎉 가입자 500명 돌파!" |
| 가입자 1,000명 | "🎉 가입자 1,000명 돌파!" |
| 일 결제 10건 | "💰 오늘 결제 10건 달성!" |
| 일 매출 100만원 | "💰 오늘 매출 100만원 돌파!" |
| 월 매출 1,000만원 | "🏆 이번 달 매출 1,000만원 돌파!" |

### INFO-04: 캠페인 상태 변경

| 항목 | 값 |
|------|-----|
| **트리거** | 캠페인 상태 변경 (시작/중지/종료) |
| **알림 채널** | 슬랙 #marketing |
| **메시지** | "📢 캠페인 '{name}' 상태 변경: {old_status} → {new_status}" |

---

## 5. Success 알림

### SUCCESS-01: 자동화 전환 성공

| 항목 | 값 |
|------|-----|
| **트리거** | 자동화 메시지 발송 후 24시간 이내 목표 전환 발생 |
| **알림 채널** | 대시보드 표시 (슬랙 발송 안 함) |
| **예시** | "AUTO-03 '미결제 유도'로 진입한 김○○님이 결제 완료" |

### SUCCESS-02: 주간 목표 달성

| 항목 | 값 |
|------|-----|
| **트리거** | 주간 KPI 목표 달성 |
| **알림 채널** | 슬랙 #marketing |
| **메시지** | "✅ 이번 주 목표 달성: {metric} {actual}/{target} ({achievement}%)" |

---

## 6. 알림 설정 관리 (admin 설정 페이지용)

### 채널 설정

| 채널 | 기본값 | 설명 |
|------|--------|------|
| 슬랙 웹훅 URL | 미설정 | Critical/Warning은 슬랙 필수 |
| 이메일 수신자 | admin 이메일 | 쉼표 구분 다중 수신 |
| 대시보드 | 항상 활성 | 모든 알림 표시 |

### 알림별 on/off

```typescript
interface AlertSettings {
  // Critical — 항상 on (끌 수 없음)
  crit_payment_rate: true;        // 상수
  crit_pipeline_failure: true;    // 상수
  crit_revenue_drop: true;        // 상수

  // Warning — 기본 on, 끌 수 있음
  warn_conversion_drop: boolean;  // 기본 true
  warn_unpaid_surge: boolean;     // 기본 true
  warn_automation_failure: boolean; // 기본 true
  warn_upload_abandon: boolean;   // 기본 true

  // Info — 기본 on, 끌 수 있음
  info_daily_report: boolean;     // 기본 true
  info_weekly_report: boolean;    // 기본 true
  info_milestones: boolean;       // 기본 true
  info_campaign_status: boolean;  // 기본 true

  // Success — 기본 off
  success_automation_convert: boolean; // 기본 false
  success_weekly_goal: boolean;   // 기본 true

  // 시간 설정
  daily_report_time: string;      // "09:00" KST
  weekly_report_day: string;      // "monday"
  quiet_hours_start: string;      // "22:00" (Warning/Info 발송 보류)
  quiet_hours_end: string;        // "08:00"
}
```

### 발송 제한 정책 설정

```typescript
interface SendingPolicy {
  // 야간 발송 금지
  night_quiet_start: string;      // "21:00" KST
  night_quiet_end: string;        // "08:00" KST
  night_queue_behavior: "hold_until_morning" | "drop";  // 기본: hold

  // 유저당 일일 한도
  max_messages_per_user_per_day: number;  // 기본: 2

  // 중복 발송 방지
  min_interval_same_automation_hours: number;  // 기본: 24
  min_interval_any_message_hours: number;      // 기본: 4

  // 재진입 방지
  default_reentry_cooldown_hours: number;  // 기본: 168 (7일)

  // 수신 거부
  respect_marketing_opt_out: true;  // 상수

  // 최근 결제자 보호
  exclude_recent_payers_hours: number;  // 기본: 24
}
```

---

## 7. 알림 메시지 레이블 (admin UI 표시용)

### 한국어 레이블

```typescript
export const ALERT_LABELS = {
  // 등급
  critical: "긴급",
  warning: "주의",
  info: "정보",
  success: "성공",

  // 개별 알림
  crit_payment_rate: "결제 성공률 급락",
  crit_pipeline_failure: "분석 파이프라인 장애",
  crit_revenue_drop: "일 매출 급감",
  warn_conversion_drop: "전환율 하락",
  warn_unpaid_surge: "미결제 대기자 급증",
  warn_automation_failure: "자동화 발송 실패",
  warn_upload_abandon: "업로드 중단율 급증",
  info_daily_report: "일간 요약 리포트",
  info_weekly_report: "주간 요약 리포트",
  info_milestones: "마일스톤 달성",
  info_campaign_status: "캠페인 상태 변경",
  success_automation_convert: "자동화 전환 성공",
  success_weekly_goal: "주간 목표 달성",
} as const;

export const ALERT_DESCRIPTIONS = {
  crit_payment_rate: "결제 성공률이 80% 미만으로 하락했을 때 알림",
  crit_pipeline_failure: "업로드 실패율 10%+ 또는 분석 완료율 80% 미만일 때 알림",
  crit_revenue_drop: "일 매출이 7일 평균 대비 50% 미만일 때 알림",
  warn_conversion_drop: "주요 전환율이 전주 대비 20%p 이상 하락했을 때 알림",
  warn_unpaid_surge: "미결제 대기자가 20명 이상일 때 알림",
  warn_automation_failure: "자동화 메시지 발송 실패율이 5%를 초과했을 때 알림",
  warn_upload_abandon: "업로드 제출율이 50% 미만일 때 알림",
  info_daily_report: "매일 아침 전일 KPI 요약을 발송",
  info_weekly_report: "매주 월요일 주간 성과를 발송",
  info_milestones: "가입자, 매출 등 마일스톤 도달 시 알림",
  info_campaign_status: "캠페인 시작/중지/종료 시 알림",
  success_automation_convert: "자동화로 전환된 건이 발생했을 때 표시",
  success_weekly_goal: "주간 목표를 달성했을 때 알림",
} as const;
```
