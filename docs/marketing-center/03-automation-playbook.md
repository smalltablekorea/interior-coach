# 견적코치 마케팅 센터 — 자동화 플로우 정의서

> 최종 수정: 2026-03-21

---

## 개요

자동화는 "트리거 → 조건 → 지연 → 액션" 구조로 동작한다.
수동 개입 없이 퍼널 이탈자에게 적시에 넛지를 보내 전환을 높인다.

---

## 공통 안전장치

모든 자동화에 아래 안전장치가 기본 적용된다.

| 안전장치 | 규칙 | 설명 |
|----------|------|------|
| **야간 발송 금지** | 21:00~08:00 KST 발송 보류, 08:00에 일괄 발송 | 사용자 불편 방지 |
| **최근 결제자 제외** | 결제 성공 후 24시간 이내 마케팅 메시지 발송 금지 | 결제 직후 스팸 방지 |
| **중복 발송 제한** | 동일 자동화 → 동일 유저, 해당 자동화의 발송 주기 이내 재발송 금지 | 반복 피로도 방지 |
| **일일 발송 한도** | 유저당 하루 최대 2건 (채널 합산) | 전체 피로도 관리 |
| **동일 유저 재진입 방지** | 동일 자동화 완료 후 7일 이내 재진입 불가 (옵션 on/off) | 반복 루프 방지 |
| **수신 거부 존중** | 마케팅 수신 동의 철회 시 즉시 발송 중단 | 법적 준수 |
| **발송 실패 재시도** | 최대 2회 재시도 (30분/2시간 간격), 이후 포기 | 시스템 부하 방지 |

---

## 자동화 #1: 가입 후 업로드 미시작

### AUTO-01: 가입 환영 + 업로드 유도

```
[트리거] signup_completed 발생
   ↓
[조건] 24시간 이내 upload_started 이벤트 없음
   ↓
[지연] 24시간 (가입 시점 기준)
   ↓
[조건 재확인] 여전히 upload_started 없음
   ↓
[액션] 업로드 가이드 메시지 발송
   ↓
[후속] 48시간 후 여전히 미시작 → 2차 메시지 (사례 중심)
   ↓
[종료] upload_started 발생 시 자동화 즉시 종료
```

| 항목 | 값 |
|------|-----|
| **트리거 이벤트** | `signup_completed` |
| **진입 조건** | `NOT EXISTS upload_started` |
| **1차 지연** | 24시간 |
| **1차 액션** | 이메일 또는 카카오 알림톡 발송 |
| **2차 지연** | 48시간 (1차 발송 후) |
| **2차 액션** | 2차 메시지 발송 (절감 사례 중심) |
| **종료 조건** | `upload_started` 발생 또는 2차 발송 완료 |
| **재진입 방지** | 7일 |

#### 1차 발송 문구 (카카오 알림톡)

```
[견적코치] 고객님, 가입을 환영합니다!

인테리어 견적서를 올려보셨나요?
사진 한 장이면 AI가 항목별 시세와 절감 포인트를 분석해 드려요.

✓ 공종별 적정가 비교
✓ 과다 청구 항목 발견
✓ 자재 등급별 가격 차이 분석

지금 견적서를 올려보세요.
▶ 업로드 시작하기: {upload_url}
```

#### 2차 발송 문구 (이메일)

**제목:** 고객님, 인테리어 견적 비교 아직 안 해보셨나요?

```
안녕하세요, 견적코치입니다.

최근 분석을 이용한 고객님들의 결과를 공유해 드려요.

📊 최근 30일 분석 결과
• 분석 건수: 1,247건
• 평균 절감 발견 금액: 340만원
• 가장 많이 발견된 과다 청구 항목: 목공사, 타일공사

견적서 사진만 올리면 3분 이내에 분석이 시작됩니다.
복잡한 절차 없이, 사진 한 장이면 충분해요.

[업로드 시작하기 →]
```

---

## 자동화 #2: 업로드 시작 후 미제출

### AUTO-02: 이어하기 유도

```
[트리거] upload_started 발생
   ↓
[조건] 6시간 이내 upload_submitted 이벤트 없음
   ↓
[지연] 6시간
   ↓
[조건 재확인] 여전히 upload_submitted 없음
   ↓
[액션] 이어하기 링크 발송
   ↓
[종료] upload_submitted 발생 시 즉시 종료
```

| 항목 | 값 |
|------|-----|
| **트리거 이벤트** | `upload_started` |
| **진입 조건** | `NOT EXISTS upload_submitted` |
| **1차 지연** | 6시간 |
| **1차 액션** | 이어하기 링크 카카오/이메일 발송 |
| **종료 조건** | `upload_submitted` 발생 또는 1차 발송 완료 |
| **재진입 방지** | 48시간 |

#### 발송 문구 (카카오 알림톡)

```
[견적코치] 업로드 중이시던 견적서가 있어요

고객님이 시작하신 견적 분석이 저장되어 있습니다.
이어서 제출하시면 바로 AI 분석이 시작돼요.

💡 팁: 견적서 전체가 보이는 사진이면 분석 정확도가 높아져요.
지원 형식: JPG, PNG, PDF (최대 20MB)

▶ 이어서 업로드하기: {continue_url}
```

---

## 자동화 #3: 분석 완료 후 미결제

### AUTO-03: 결제 유도

```
[트리거] analysis_completed 발생
   ↓
[조건] 12시간 이내 payment_succeeded 이벤트 없음
   ↓
[지연] 12시간
   ↓
[조건 재확인] 여전히 payment_succeeded 없음
   ↓
[액션 1] 결제 유도 메시지 (분석 하이라이트 포함)
   ↓
[지연] 24시간 (1차 발송 후)
   ↓
[조건 재확인] 여전히 미결제
   ↓
[액션 2] 2차 유도 (긴급성/한정 혜택)
   ↓
[지연] 48시간 (2차 발송 후)
   ↓
[조건 재확인] 여전히 미결제
   ↓
[액션 3] 마지막 리마인더 (소프트 톤)
   ↓
[종료] payment_succeeded 발생 또는 3차 발송 완료
```

| 항목 | 값 |
|------|-----|
| **트리거 이벤트** | `analysis_completed` |
| **진입 조건** | `NOT EXISTS payment_succeeded` |
| **1차 지연** | 12시간 |
| **2차 지연** | 24시간 (1차 후) |
| **3차 지연** | 48시간 (2차 후) |
| **최대 발송** | 3회 |
| **종료 조건** | `payment_succeeded` 발생 또는 3차 발송 완료 |
| **재진입 방지** | 30일 |

#### 1차 발송 문구 (카카오 알림톡)

```
[견적코치] 고객님 견적 분석이 완료됐어요!

AI가 고객님의 견적서를 분석한 결과,
확인이 필요한 항목이 발견되었습니다.

전체 리포트에서 확인할 수 있는 내용:
✓ 공종별 시세 대비 적정가 판단
✓ 과다 청구 가능성이 있는 항목
✓ 자재 등급 대비 가격 적정성
✓ 업체 협상 시 활용할 수 있는 근거

▶ 전체 리포트 확인하기: {payment_url}
```

#### 2차 발송 문구 (이메일)

**제목:** 견적 분석 리포트가 대기 중이에요 — 확인해 보세요

```
고객님, 견적코치입니다.

AI 분석이 완료된 리포트가 대기 중입니다.

리포트를 확인하지 않으시면 업체와 협상할 때
중요한 근거 자료를 놓칠 수 있어요.

참고로, 견적코치를 이용한 고객의 87%가
"업체와 대화할 때 자신감이 생겼다"고 응답했습니다.

[리포트 확인하기 →]

* 리포트는 결제 후 30일간 열람 가능합니다.
```

#### 3차 발송 문구 (카카오 알림톡)

```
[견적코치] 마지막 안내드려요

고객님의 견적 분석 결과가 저장되어 있습니다.

급하지 않으시더라도, 업체 미팅 전에
시세 기준을 확인해 두시면 협상에 도움이 됩니다.

필요하실 때 언제든 확인해 주세요.
▶ 리포트 확인하기: {payment_url}
```

---

## 자동화 #4: 결제 성공 후 후속 유도

### AUTO-04: 리포트 확인 + 업체추천 + 협상팁

```
[트리거] payment_succeeded 발생
   ↓
[즉시 액션] 결제 감사 + 리포트 링크 발송
   ↓
[지연] 2시간
   ↓
[조건] report_viewed 이벤트 없음
   ↓
[액션] 리포트 확인 리마인더
   ↓
[지연] 24시간 (결제 시점 기준)
   ↓
[조건] report_viewed 있음 AND inquiry_submitted 없음
   ↓
[액션] 업체추천/협상팁 안내
   ↓
[종료]
```

| 항목 | 값 |
|------|-----|
| **트리거 이벤트** | `payment_succeeded` |
| **즉시 액션** | 결제 완료 감사 메시지 + 리포트 링크 |
| **2시간 후** | 리포트 미확인 시 리마인더 |
| **24시간 후** | 리포트 확인자 대상 업체추천/협상팁 |
| **종료 조건** | 자동화 완료 (3단계 모두 실행) |
| **재진입 방지** | 무제한 (결제는 1회성) |

#### 즉시 발송 문구 (카카오 알림톡)

```
[견적코치] 결제가 완료되었습니다!

고객님의 견적 분석 리포트가 준비됐어요.

리포트에서 확인하실 수 있는 내용:
📋 공종별 시세 비교표
💰 절감 가능 항목과 예상 금액
🔍 자재 등급별 가격 적정성
💬 업체 협상 시 활용 멘트

▶ 리포트 보기: {report_url}

* 리포트는 30일간 열람 가능합니다.
```

#### 24시간 후 발송 문구 (이메일)

**제목:** 리포트를 확인하셨나요? 업체 협상에 활용하는 팁을 알려드려요

```
고객님, 견적코치입니다.

리포트를 잘 확인하셨나요?
업체와 만나기 전, 아래 협상 팁을 참고해 보세요.

🤝 업체 협상 3가지 핵심 포인트

1. 공종별 시세 근거 제시
   "견적서의 목공사 부분이 시세 평균 대비 15% 높은데,
   조정이 가능할까요?"

2. 자재 등급 확인
   "도배 자재가 실크 기준인데, 합지와 가격 차이가
   어느 정도인지 확인하고 싶어요."

3. 추가/누락 항목 체크
   "리포트에서 보양 비용이 별도인데,
   견적서에는 포함인지 확인 부탁드려요."

추천 업체에 바로 문의하고 싶으시면:
[업체 추천 보기 →]
```

---

## 자동화 #5: 리포트 확인 후 후기 요청

### AUTO-05: 후기/추천코드 요청

```
[트리거] report_viewed 발생 (결제 성공 유저만)
   ↓
[지연] 3일
   ↓
[조건] 환불 요청 없음 AND 부정 피드백 없음
   ↓
[액션] 후기 요청 + 추천코드 안내
   ↓
[지연] 7일 (1차 후)
   ↓
[조건] 후기 미작성
   ↓
[액션] 2차 리마인더 (더 짧은 톤)
   ↓
[종료]
```

| 항목 | 값 |
|------|-----|
| **트리거 이벤트** | `report_viewed` (단, `payment_succeeded` 있는 유저만) |
| **1차 지연** | 3일 (리포트 확인 후 업체 미팅/활용 시간) |
| **1차 액션** | 후기 요청 + 추천코드 안내 |
| **2차 지연** | 7일 (1차 후) |
| **2차 액션** | 간단 리마인더 |
| **최대 발송** | 2회 |
| **종료 조건** | 후기 작성 완료 또는 2차 발송 완료 |
| **재진입 방지** | 90일 |

#### 1차 발송 문구 (카카오 알림톡)

```
[견적코치] 견적 분석, 도움이 되셨나요?

고객님의 의견이 다른 분들에게 큰 도움이 됩니다.

30초면 되는 간단한 후기를 남겨주시면,
다음 견적 분석 시 20% 할인코드를 드려요.

또한, 추천코드를 공유하시면
지인분도 첫 분석 10% 할인을 받으실 수 있어요.

📝 후기 남기기: {review_url}
🎁 내 추천코드: {referral_code}
```

#### 2차 발송 문구 (카카오 알림톡)

```
[견적코치] 간단한 후기 부탁드려요 😊

고객님, 한 줄 후기만으로도 충분합니다.
작성해 주시면 다음 분석 20% 할인코드를 바로 보내드릴게요.

📝 후기 남기기: {review_url}
```

---

## 자동화 요약 매트릭스

| 자동화 | 트리거 | 1차 지연 | 최대 발송 | 핵심 채널 | 재진입 방지 |
|--------|--------|---------|-----------|-----------|------------|
| AUTO-01 | signup_completed | 24시간 | 2회 | 카카오+이메일 | 7일 |
| AUTO-02 | upload_started | 6시간 | 1회 | 카카오 | 48시간 |
| AUTO-03 | analysis_completed | 12시간 | 3회 | 카카오+이메일 | 30일 |
| AUTO-04 | payment_succeeded | 즉시 | 3회(단계별) | 카카오+이메일 | 무제한 |
| AUTO-05 | report_viewed | 3일 | 2회 | 카카오 | 90일 |

---

## 자동화 스텝 JSON 스키마 (백엔드 구현용)

```typescript
interface AutomationDefinition {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger: {
    event: string;                    // 트리거 이벤트명
    conditions?: {                    // 진입 추가 조건
      has?: string[];
      not_has?: string[];
    };
  };
  steps: AutomationStep[];
  safety: {
    no_night_send: boolean;           // 야간 발송 금지
    exclude_recent_payers: boolean;   // 최근 결제자 제외
    max_daily_messages: number;       // 일일 발송 한도
    reentry_cooldown_hours: number;   // 재진입 방지 (시간)
    respect_opt_out: boolean;         // 수신 거부 존중
  };
  exit_conditions: string[];          // 종료 이벤트 목록
}

interface AutomationStep {
  step_index: number;
  delay_hours: number;                // 이전 스텝 또는 트리거 후 대기 시간
  delay_from: "trigger" | "previous_step";
  condition_check?: {                 // 발송 전 조건 재확인
    not_has?: string[];
    has?: string[];
  };
  action: {
    type: "send_message";
    channel: "email" | "kakao" | "sms";
    template_id: string;
    fallback_channel?: "email" | "sms"; // 1차 채널 실패 시
  };
}
```

### 시드 데이터 예시

```typescript
export const DEFAULT_AUTOMATIONS: AutomationDefinition[] = [
  {
    id: "auto_01",
    name: "가입 후 업로드 미시작",
    description: "가입 후 24시간 내 업로드를 시작하지 않은 사용자에게 가이드를 발송합니다.",
    is_active: true,
    trigger: {
      event: "signup_completed",
      conditions: { not_has: ["upload_started"] },
    },
    steps: [
      {
        step_index: 0,
        delay_hours: 24,
        delay_from: "trigger",
        condition_check: { not_has: ["upload_started"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_welcome_upload_guide",
          fallback_channel: "email",
        },
      },
      {
        step_index: 1,
        delay_hours: 48,
        delay_from: "previous_step",
        condition_check: { not_has: ["upload_started"] },
        action: {
          type: "send_message",
          channel: "email",
          template_id: "tmpl_upload_case_study",
        },
      },
    ],
    safety: {
      no_night_send: true,
      exclude_recent_payers: true,
      max_daily_messages: 2,
      reentry_cooldown_hours: 168,
      respect_opt_out: true,
    },
    exit_conditions: ["upload_started"],
  },
  {
    id: "auto_02",
    name: "업로드 시작 후 미제출",
    description: "업로드를 시작했으나 6시간 내 제출하지 않은 사용자에게 이어하기 링크를 발송합니다.",
    is_active: true,
    trigger: {
      event: "upload_started",
      conditions: { not_has: ["upload_submitted"] },
    },
    steps: [
      {
        step_index: 0,
        delay_hours: 6,
        delay_from: "trigger",
        condition_check: { not_has: ["upload_submitted"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_continue_upload",
          fallback_channel: "sms",
        },
      },
    ],
    safety: {
      no_night_send: true,
      exclude_recent_payers: false,
      max_daily_messages: 2,
      reentry_cooldown_hours: 48,
      respect_opt_out: true,
    },
    exit_conditions: ["upload_submitted"],
  },
  {
    id: "auto_03",
    name: "분석 완료 후 미결제",
    description: "AI 분석 완료 후 결제하지 않은 사용자에게 단계적 결제 유도 메시지를 발송합니다.",
    is_active: true,
    trigger: {
      event: "analysis_completed",
      conditions: { not_has: ["payment_succeeded"] },
    },
    steps: [
      {
        step_index: 0,
        delay_hours: 12,
        delay_from: "trigger",
        condition_check: { not_has: ["payment_succeeded"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_payment_nudge_1",
          fallback_channel: "email",
        },
      },
      {
        step_index: 1,
        delay_hours: 24,
        delay_from: "previous_step",
        condition_check: { not_has: ["payment_succeeded"] },
        action: {
          type: "send_message",
          channel: "email",
          template_id: "tmpl_payment_nudge_2",
        },
      },
      {
        step_index: 2,
        delay_hours: 48,
        delay_from: "previous_step",
        condition_check: { not_has: ["payment_succeeded"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_payment_nudge_3",
        },
      },
    ],
    safety: {
      no_night_send: true,
      exclude_recent_payers: true,
      max_daily_messages: 2,
      reentry_cooldown_hours: 720,
      respect_opt_out: true,
    },
    exit_conditions: ["payment_succeeded"],
  },
  {
    id: "auto_04",
    name: "결제 성공 후 후속 유도",
    description: "결제 완료 후 리포트 확인, 업체추천, 협상팁을 단계적으로 안내합니다.",
    is_active: true,
    trigger: {
      event: "payment_succeeded",
    },
    steps: [
      {
        step_index: 0,
        delay_hours: 0,
        delay_from: "trigger",
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_payment_success",
        },
      },
      {
        step_index: 1,
        delay_hours: 2,
        delay_from: "trigger",
        condition_check: { not_has: ["report_viewed"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_report_reminder",
        },
      },
      {
        step_index: 2,
        delay_hours: 24,
        delay_from: "trigger",
        condition_check: { has: ["report_viewed"], not_has: ["inquiry_submitted"] },
        action: {
          type: "send_message",
          channel: "email",
          template_id: "tmpl_negotiation_tips",
        },
      },
    ],
    safety: {
      no_night_send: true,
      exclude_recent_payers: false,
      max_daily_messages: 3,
      reentry_cooldown_hours: -1,
      respect_opt_out: true,
    },
    exit_conditions: [],
  },
  {
    id: "auto_05",
    name: "리포트 확인 후 후기 요청",
    description: "리포트를 확인한 결제 고객에게 3일 후 후기 작성을 요청합니다.",
    is_active: true,
    trigger: {
      event: "report_viewed",
      conditions: { has: ["payment_succeeded"] },
    },
    steps: [
      {
        step_index: 0,
        delay_hours: 72,
        delay_from: "trigger",
        condition_check: { not_has: ["review_submitted", "refund_requested"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_review_request",
        },
      },
      {
        step_index: 1,
        delay_hours: 168,
        delay_from: "previous_step",
        condition_check: { not_has: ["review_submitted"] },
        action: {
          type: "send_message",
          channel: "kakao",
          template_id: "tmpl_review_reminder",
        },
      },
    ],
    safety: {
      no_night_send: true,
      exclude_recent_payers: false,
      max_daily_messages: 2,
      reentry_cooldown_hours: 2160,
      respect_opt_out: true,
    },
    exit_conditions: ["review_submitted"],
  },
];
```
