# 견적코치 마케팅 센터 — 세그먼트 정의서

> 최종 수정: 2026-03-21

---

## 개요

세그먼트는 유사한 행동 패턴을 가진 사용자 그룹이다.
각 세그먼트에 대해 맞춤형 자동화·캠페인을 운영하여 퍼널 전환율을 높인다.

세그먼트 규칙은 JSON 기반으로 관리하며, 사용자가 동시에 여러 세그먼트에 속할 수 있다.

---

## 세그먼트 목록 (9개 기본 시드)

### SEG-01: 가입만 함 (signed_up_only)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `signup_completed` 이벤트 있음 AND `upload_started` 이벤트 없음 |
| **제외 조건** | 가입 후 1시간 미만 (대기 시간) |
| **세그먼트 규칙** | `{ "has": ["signup_completed"], "not_has": ["upload_started"], "min_age_hours": 1 }` |
| **마케팅 목표** | 업로드 시작 유도 |
| **권장 액션** | 업로드 가이드 이메일/카카오 발송, 서비스 가치 리마인더 |
| **예상 비율** | 전체 가입자의 30–40% |
| **우선순위** | ★★★★★ (최고) — 퍼널 첫 이탈 지점 |

**운영 문구 예시:**
> "고객님, 견적서 사진만 올리면 AI가 항목별 시세와 절감 포인트를 분석해 드려요. 지금 업로드 시작하기 →"

---

### SEG-02: 로그인 후 업로드 안 함 (logged_in_no_upload)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `login_completed` 이벤트 2회 이상 AND `upload_started` 이벤트 없음 |
| **제외 조건** | 마지막 로그인 1시간 미만 |
| **세그먼트 규칙** | `{ "has": ["login_completed"], "event_count": { "login_completed": { "gte": 2 } }, "not_has": ["upload_started"], "last_event_age_hours": { "login_completed": { "gte": 1 } } }` |
| **마케팅 목표** | 업로드 시작 동기 부여 |
| **권장 액션** | 가치 제안 강화 (절감 사례 포함), 업로드 방법 안내 |
| **예상 비율** | 전체 가입자의 10–15% |
| **우선순위** | ★★★★☆ — 관심은 있으나 행동 미전환 |

**운영 문구 예시:**
> "견적서를 올려보세요. 최근 분석 고객 평균 340만원 절감 포인트를 발견했습니다."

---

### SEG-03: 업로드 시작 후 미제출 (upload_started_not_submitted)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `upload_started` 이벤트 있음 AND `upload_submitted` 이벤트 없음 AND 시작 후 6시간 경과 |
| **제외 조건** | 업로드 시작 후 1시간 미만, 또는 이미 자동화 메시지 수신 24시간 이내 |
| **세그먼트 규칙** | `{ "has": ["upload_started"], "not_has": ["upload_submitted"], "event_age_hours": { "upload_started": { "gte": 6 } } }` |
| **마케팅 목표** | 업로드 완료 유도 |
| **권장 액션** | 이어하기 링크 발송, 파일 포맷/크기 가이드 안내 |
| **예상 비율** | 업로드 시작자의 20–30% |
| **우선순위** | ★★★★★ — 가장 전환 가능성 높은 이탈 지점 |

**운영 문구 예시:**
> "업로드 중이시던 견적서가 저장되어 있어요. 이어서 제출하면 바로 분석이 시작됩니다. 이어하기 →"

---

### SEG-04: 분석 완료 후 미결제 (analysis_done_not_paid)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `analysis_completed` 이벤트 있음 AND `payment_succeeded` 이벤트 없음 AND 분석 완료 후 12시간 경과 |
| **제외 조건** | 결제 실패 3회 이상 (CS 대상), 분석 완료 후 30일 초과 (Cold로 이동) |
| **세그먼트 규칙** | `{ "has": ["analysis_completed"], "not_has": ["payment_succeeded"], "event_age_hours": { "analysis_completed": { "gte": 12, "lte": 720 } } }` |
| **마케팅 목표** | 결제 전환 |
| **권장 액션** | 무료 프리뷰 하이라이트, 절감 가능 금액 미리보기, 한정 할인 코드 |
| **예상 비율** | 분석 완료자의 60–75% |
| **우선순위** | ★★★★★ — 매출 직결 세그먼트 |

**운영 문구 예시:**
> "고객님 견적 분석이 완료됐어요! 예상 절감 포인트가 확인되었습니다. 전체 리포트에서 항목별 시세 비교와 협상 팁을 확인하세요."

---

### SEG-05: 결제 성공 후 리포트 미확인 (paid_not_viewed)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `payment_succeeded` 이벤트 있음 AND `report_viewed` 이벤트 없음 AND 결제 후 2시간 경과 |
| **제외 조건** | 결제 후 1시간 미만 |
| **세그먼트 규칙** | `{ "has": ["payment_succeeded"], "not_has": ["report_viewed"], "event_age_hours": { "payment_succeeded": { "gte": 2 } } }` |
| **마케팅 목표** | 리포트 확인 → 업체문의 유도 |
| **권장 액션** | 리포트 링크 재발송, 리포트 활용 가이드 |
| **예상 비율** | 결제자의 5–10% (대부분 즉시 확인) |
| **우선순위** | ★★★☆☆ — 소수지만 고객 경험에 중요 |

**운영 문구 예시:**
> "분석 리포트가 준비되어 있어요. 항목별 시세 비교와 절감 방법을 확인해 보세요. 리포트 보기 →"

---

### SEG-06: 업체추천 관심 고객 (company_interest)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `companies_viewed` 또는 `company_clicked` 이벤트 있음 AND `inquiry_submitted` 없음 |
| **제외 조건** | 이미 문의 제출 완료한 유저 |
| **세그먼트 규칙** | `{ "has_any": ["companies_viewed", "company_clicked"], "not_has": ["inquiry_submitted"] }` |
| **마케팅 목표** | 업체문의 전환 |
| **권장 액션** | 업체 비교 팁 콘텐츠, 협상 가이드, 무료 상담 연결 |
| **예상 비율** | 리포트 확인자의 40–50% |
| **우선순위** | ★★★★☆ — 높은 전환 가능성 |

**운영 문구 예시:**
> "관심 있는 업체를 찾으셨나요? 견적코치가 분석한 시세 기준으로 업체와 협상하는 팁을 확인해 보세요."

---

### SEG-07: 7일 휴면 (dormant_7d)

| 항목 | 값 |
|------|-----|
| **진입 조건** | 마지막 이벤트 발생일로부터 7일 이상 경과 AND 결제 미완료 |
| **제외 조건** | 결제 성공 유저 (이미 전환 완료), 14일 휴면 세그먼트 우선 |
| **세그먼트 규칙** | `{ "last_activity_days_ago": { "gte": 7, "lt": 14 }, "not_has": ["payment_succeeded"] }` |
| **마케팅 목표** | 서비스 재방문 |
| **권장 액션** | 서비스 가치 리마인더, 새로운 기능/콘텐츠 알림 |
| **예상 비율** | 전체 가입자의 15–20% |
| **우선순위** | ★★★☆☆ |

**운영 문구 예시:**
> "인테리어 견적 비교, 아직 고민 중이시라면 — 최근 분석 고객들의 평균 절감 사례를 확인해 보세요."

---

### SEG-08: 14일 휴면 (dormant_14d)

| 항목 | 값 |
|------|-----|
| **진입 조건** | 마지막 이벤트 발생일로부터 14일 이상 경과 AND 결제 미완료 |
| **제외 조건** | 결제 성공 유저, 30일 이상 경과 시 자동 세그먼트 해제 (마케팅 피로도 관리) |
| **세그먼트 규칙** | `{ "last_activity_days_ago": { "gte": 14, "lt": 30 }, "not_has": ["payment_succeeded"] }` |
| **마케팅 목표** | 최종 재활성화 시도 |
| **권장 액션** | 강한 가치 제안 (할인/인센티브), 마지막 리마인더 |
| **예상 비율** | 전체 가입자의 10–15% |
| **우선순위** | ★★☆☆☆ — 전환 확률 낮지만 비용도 낮음 |

**운영 문구 예시:**
> "인테리어 공사 준비 중이시라면, 견적코치의 시세 분석으로 적정가를 확인해 보세요. 아직 늦지 않았어요."

---

### SEG-09: 후기 요청 대상 (review_eligible)

| 항목 | 값 |
|------|-----|
| **진입 조건** | `payment_succeeded` AND `report_viewed` AND 결제일로부터 3–14일 경과 |
| **제외 조건** | 이미 후기 작성 완료, 환불 요청, 부정 피드백 있는 유저 |
| **세그먼트 규칙** | `{ "has": ["payment_succeeded", "report_viewed"], "event_age_days": { "payment_succeeded": { "gte": 3, "lte": 14 } }, "not_has": ["review_submitted", "refund_requested"] }` |
| **마케팅 목표** | 후기/추천코드 확산 |
| **권장 액션** | 후기 작성 요청, 추천코드 안내, 간편 후기 폼 링크 |
| **예상 비율** | 결제자의 60–80% |
| **우선순위** | ★★★★☆ — 바이럴 성장의 핵심 |

**운영 문구 예시:**
> "견적코치가 도움이 되셨나요? 30초면 되는 후기를 남겨주시면, 다음 견적 분석 20% 할인코드를 드려요."

---

## 세그먼트 운영 규칙

### 우선순위 충돌 처리

한 유저가 여러 세그먼트에 속할 경우, **가장 퍼널 하단에 가까운 세그먼트**를 우선 적용한다.

```
우선순위 (높음 → 낮음):
1. SEG-09 후기 요청 대상 (이미 결제 완료)
2. SEG-05 결제 후 리포트 미확인
3. SEG-06 업체추천 관심
4. SEG-04 분석 완료 후 미결제
5. SEG-03 업로드 시작 후 미제출
6. SEG-02 로그인 후 업로드 안 함
7. SEG-01 가입만 함
8. SEG-07 7일 휴면
9. SEG-08 14일 휴면
```

### 세그먼트 갱신 주기

| 방식 | 설명 |
|------|------|
| 실시간 | 이벤트 발생 시 세그먼트 재계산 (권장) |
| 배치 | 1시간 단위 크론잡으로 전체 재계산 (MVP) |
| 하이브리드 | 핵심 세그먼트(SEG-03, 04)는 실시간, 나머지는 배치 |

### 세그먼트별 메시징 빈도 제한

| 세그먼트 | 최대 발송 빈도 | 근거 |
|----------|---------------|------|
| SEG-01~03 | 48시간에 1회 | 가입 초기 피로도 관리 |
| SEG-04 | 24시간에 1회 (최대 3회) | 결제 유도는 강하게 |
| SEG-05 | 12시간에 1회 (최대 2회) | 결제 완료자 — 빠른 안내 |
| SEG-06 | 72시간에 1회 | 탐색 중 — 부담 주지 않기 |
| SEG-07 | 7일에 1회 | 휴면 — 가벼운 터치 |
| SEG-08 | 14일에 1회 (최대 2회) | 마지막 시도 |
| SEG-09 | 1회 (후기 미작성 시 7일 후 1회 리마인더) | 피로도 최소화 |

---

## 세그먼트 규칙 JSON 스키마 (백엔드 구현용)

```typescript
interface SegmentRule {
  id: string;
  name: string;
  slug: string;
  description: string;
  priority: number;  // 낮을수록 높은 우선순위
  rules: {
    // 필수 이벤트 (모두 충족해야 함)
    has?: string[];
    // 하나라도 있으면 충족
    has_any?: string[];
    // 없어야 하는 이벤트
    not_has?: string[];
    // 이벤트 발생 횟수 조건
    event_count?: Record<string, { gte?: number; lte?: number }>;
    // 특정 이벤트 경과 시간 (시간 단위)
    event_age_hours?: Record<string, { gte?: number; lte?: number }>;
    // 특정 이벤트 경과 일수
    event_age_days?: Record<string, { gte?: number; lte?: number }>;
    // 마지막 활동 경과 일수
    last_activity_days_ago?: { gte?: number; lt?: number };
    // 가입 후 최소 경과 시간
    min_age_hours?: number;
  };
  marketing_goal: string;
  recommended_actions: string[];
  max_messages_per_period: {
    count: number;
    period_hours: number;
  };
}
```

---

## 세그먼트 시드 데이터 (DB 또는 config 삽입용)

```typescript
export const DEFAULT_SEGMENTS: SegmentRule[] = [
  {
    id: "seg_01",
    name: "가입만 함",
    slug: "signed_up_only",
    description: "회원가입 후 업로드를 시작하지 않은 사용자",
    priority: 7,
    rules: {
      has: ["signup_completed"],
      not_has: ["upload_started"],
      min_age_hours: 1,
    },
    marketing_goal: "업로드 시작 유도",
    recommended_actions: ["업로드 가이드 이메일", "서비스 가치 리마인더"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_02",
    name: "로그인 후 업로드 안 함",
    slug: "logged_in_no_upload",
    description: "2회 이상 로그인했으나 업로드를 시작하지 않은 사용자",
    priority: 6,
    rules: {
      has: ["login_completed"],
      event_count: { login_completed: { gte: 2 } },
      not_has: ["upload_started"],
    },
    marketing_goal: "업로드 시작 동기 부여",
    recommended_actions: ["절감 사례 소개", "업로드 방법 안내"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_03",
    name: "업로드 시작 후 미제출",
    slug: "upload_started_not_submitted",
    description: "업로드를 시작했으나 6시간 이상 제출하지 않은 사용자",
    priority: 5,
    rules: {
      has: ["upload_started"],
      not_has: ["upload_submitted"],
      event_age_hours: { upload_started: { gte: 6 } },
    },
    marketing_goal: "업로드 완료 유도",
    recommended_actions: ["이어하기 링크 발송", "파일 포맷 가이드"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_04",
    name: "분석 완료 후 미결제",
    slug: "analysis_done_not_paid",
    description: "AI 분석이 완료됐으나 결제하지 않은 사용자",
    priority: 4,
    rules: {
      has: ["analysis_completed"],
      not_has: ["payment_succeeded"],
      event_age_hours: { analysis_completed: { gte: 12, lte: 720 } },
    },
    marketing_goal: "결제 전환",
    recommended_actions: ["무료 프리뷰 하이라이트", "절감 금액 미리보기", "한정 할인"],
    max_messages_per_period: { count: 1, period_hours: 24 },
  },
  {
    id: "seg_05",
    name: "결제 성공 후 리포트 미확인",
    slug: "paid_not_viewed",
    description: "결제했으나 리포트를 아직 확인하지 않은 사용자",
    priority: 2,
    rules: {
      has: ["payment_succeeded"],
      not_has: ["report_viewed"],
      event_age_hours: { payment_succeeded: { gte: 2 } },
    },
    marketing_goal: "리포트 확인 → 업체문의 유도",
    recommended_actions: ["리포트 링크 재발송", "리포트 활용 가이드"],
    max_messages_per_period: { count: 1, period_hours: 12 },
  },
  {
    id: "seg_06",
    name: "업체추천 관심 고객",
    slug: "company_interest",
    description: "업체 목록을 조회했으나 문의를 제출하지 않은 사용자",
    priority: 3,
    rules: {
      has_any: ["companies_viewed", "company_clicked"],
      not_has: ["inquiry_submitted"],
    },
    marketing_goal: "업체문의 전환",
    recommended_actions: ["업체 비교 팁", "협상 가이드", "무료 상담 안내"],
    max_messages_per_period: { count: 1, period_hours: 72 },
  },
  {
    id: "seg_07",
    name: "7일 휴면",
    slug: "dormant_7d",
    description: "7일 이상 활동이 없는 미결제 사용자",
    priority: 8,
    rules: {
      last_activity_days_ago: { gte: 7, lt: 14 },
      not_has: ["payment_succeeded"],
    },
    marketing_goal: "서비스 재방문",
    recommended_actions: ["가치 리마인더", "절감 사례 콘텐츠"],
    max_messages_per_period: { count: 1, period_hours: 168 },
  },
  {
    id: "seg_08",
    name: "14일 휴면",
    slug: "dormant_14d",
    description: "14일 이상 활동이 없는 미결제 사용자",
    priority: 9,
    rules: {
      last_activity_days_ago: { gte: 14, lt: 30 },
      not_has: ["payment_succeeded"],
    },
    marketing_goal: "최종 재활성화",
    recommended_actions: ["강한 가치 제안", "할인 인센티브", "마지막 리마인더"],
    max_messages_per_period: { count: 1, period_hours: 336 },
  },
  {
    id: "seg_09",
    name: "후기 요청 대상",
    slug: "review_eligible",
    description: "결제 및 리포트 확인 후 3~14일 경과한 사용자",
    priority: 1,
    rules: {
      has: ["payment_succeeded", "report_viewed"],
      event_age_days: { payment_succeeded: { gte: 3, lte: 14 } },
      not_has: ["review_submitted", "refund_requested"],
    },
    marketing_goal: "후기/추천코드 확산",
    recommended_actions: ["후기 작성 요청", "추천코드 안내", "간편 후기 폼"],
    max_messages_per_period: { count: 1, period_hours: 168 },
  },
];
```
