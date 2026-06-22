# 고객관리 진행상태 체계 & 화면 문구 스펙

> 작성일: 2026-06-21
> 대상: 프론트엔드/백엔드 봇 (복붙해서 그대로 사용)
> 원칙: 평범한 한국어, 영어·마케팅 용어 금지, 사장님 호칭, 검증 가능한 표기

---

## 1. 진행상태 체계

### 1-1. 전체 상태 한 줄 정의

| 코드(slug) | 이름 | 한 줄 정의 (언제 이 상태가 되는가) |
|---|---|---|
| `consulting` | 상담중 | 사장님이 처음 연락을 받았거나 카톡·전화로 상담을 시작한 시점부터, 현장 방문 약속이 잡히기 전까지. |
| `site_visit` | 현장실측 | 사장님이 현장 방문 일정을 잡고 실측을 다녀온 직후까지. 도면·사진·요청사항이 정리되는 단계. |
| `estimate_meeting` | 견적미팅 | 견적서를 만들어 고객에게 보내고, 미팅·통화로 금액·자재·일정을 함께 검토하는 단계. |
| `contracted` | 계약완료 | 계약서에 도장·서명이 끝나고 계약금이 입금된 상태. |
| `in_progress` | 시공중 | 철거 시작일 이후부터 입주청소 직전까지 공정이 돌아가는 상태. |
| `completed` | 시공완료 | 입주청소·마감 검수가 끝나 고객에게 인도된 시점. |
| `as_service` | A/S | 시공완료 이후 하자·보수 요청이 들어와 처리 중인 상태. |
| `vip` | VIP | (단계가 아니라 라벨) 단골·고액 거래·재의뢰 가능성 높은 고객. |
| `paused` | 상담중단 | 진행이 일시 멈춘 상태. 고객 사정·예산 검토·다른 업체 비교 등. 다시 살아날 수 있음. |
| `canceled` | 취소 | 명확히 끝난 상태. 고객이 다른 업체 선택·시공 포기·연락두절 확정 등. |

### 1-2. 퍼널 순서 (단계)

```
상담중 → 현장실측 → 견적미팅 → 계약완료 → 시공중 → 시공완료 → A/S
```

- 위 7개가 정식 퍼널.
- 각 단계는 다음 단계로 진입하면 자동 이전 (계약금 입금 → `contracted`, 시공 시작일 도래 → `in_progress` 등 자동 전환 권장).
- 뒤로 되돌리는 것도 허용 (예: 계약완료 후 고객 요청으로 견적 재조정 → 견적미팅으로 회귀).

### 1-3. VIP · 상담중단 · 취소 다루는 방식

**VIP는 단계가 아니라 "라벨(플래그)"**
- DB 구조: `customers.status` 와 별개로 `customers.isVip` (boolean) 필드.
- 동작: 어느 단계에 있든 VIP 라벨을 켤 수 있음. 시공완료 후에도 라벨 유지.
- 화면: 고객 카드에 단계 뱃지 + VIP 별 아이콘(⭐) 함께 표시.

**상담중단 vs 취소 — 두 개로 분리 권장**

| 항목 | 상담중단 (`paused`) | 취소 (`canceled`) |
|---|---|---|
| 의미 | 일시 정지. 다시 살아날 수 있음 | 명확히 끝. 더 진행 안 함 |
| 사용 사례 | 고객 예산 재검토 / 다른 업체 비교 중 / 일정 미정 | 다른 업체 계약 / 시공 포기 / 연락두절 확정 |
| 복귀 가능 | 다시 단계 변경 가능 | 별도로 "재오픈"하기 전엔 잠금 |
| 리포팅 카운트 | 진행 잠재 고객 | 실패 고객 (전환율 분모에서 분리 가능) |

**분리 이유**:
- 영업 사장님 입장에서 "잠시 멈춘 사람"과 "끝난 사람"은 후속 액션이 완전히 다름. 보류 30일 후 다시 카톡 보낼지, 아예 잊을지 판단 기준이 됨.
- 합치면 전환율 계산 시 "잠재 손님"과 "실패 손님"이 섞여 의사결정이 흐려짐.

### 1-4. 상태별 뱃지 색상

진행 단계는 옅은 청에서 진한 그린으로 점진적으로 진해지는 흐름. A/S는 주의 계열(주황), VIP는 별도 강조, 상담중단/취소는 회색 톤.

| 상태 | 색상명 | 배경 hex | 글자 hex | 톤 설명 |
|---|---|---|---|---|
| 상담중 | 옅은 청 | `#DBEAFE` | `#1E40AF` | 시작점, 가장 옅음 |
| 현장실측 | 청 | `#BFDBFE` | `#1E3A8A` | 한 단계 진해짐 |
| 견적미팅 | 진한 청 | `#93C5FD` | `#172554` | 청 마지막 |
| 계약완료 | 옅은 그린 | `#A7F3D0` | `#064E3B` | 청→그린 전환점 (확정된 느낌) |
| 시공중 | 그린 | `#6EE7B7` | `#064E3B` | 활성 진행 |
| 시공완료 | 진한 그린 | `#00C471` | `#FFFFFF` | 인테리어코치 brand green, 완성 |
| A/S | 주황 | `#FED7AA` | `#9A3412` | 주의·돌봄 필요 |
| VIP | 금색 | `#FEF3C7` | `#92400E` | 별도 강조 (다른 단계와 시각 분리) |
| 상담중단 | 옅은 회색 | `#E5E7EB` | `#374151` | 보류 |
| 취소 | 회색 | `#9CA3AF` | `#FFFFFF` | 종료, 가장 어두운 회색 |

**다크모드 보정** (인테리어코치 기본 다크 테마용):

| 상태 | 다크 배경 hex | 다크 글자 hex |
|---|---|---|
| 상담중 | `rgba(147, 197, 253, 0.15)` | `#93C5FD` |
| 현장실측 | `rgba(96, 165, 250, 0.18)` | `#60A5FA` |
| 견적미팅 | `rgba(74, 158, 255, 0.20)` | `#4A9EFF` |
| 계약완료 | `rgba(52, 211, 153, 0.18)` | `#34D399` |
| 시공중 | `rgba(16, 185, 129, 0.22)` | `#10B981` |
| 시공완료 | `rgba(0, 196, 113, 0.25)` | `#00C471` |
| A/S | `rgba(255, 159, 67, 0.20)` | `#FF9F43` |
| VIP | `rgba(251, 191, 36, 0.18)` | `#FBBF24` |
| 상담중단 | `rgba(156, 163, 175, 0.18)` | `#9CA3AF` |
| 취소 | `rgba(107, 114, 128, 0.25)` | `#6B7280` |

**아이콘 (lucide-react)**

| 상태 | 아이콘 |
|---|---|
| 상담중 | `MessageCircle` |
| 현장실측 | `Ruler` |
| 견적미팅 | `FileText` |
| 계약완료 | `FileCheck` |
| 시공중 | `Hammer` |
| 시공완료 | `CheckCircle2` |
| A/S | `Wrench` |
| VIP | `Star` |
| 상담중단 | `PauseCircle` |
| 취소 | `XCircle` |

### 1-5. DB 스키마 권장

```ts
// customers 테이블 추가/수정
status: text("status")
  .notNull()
  .default("consulting"),
  // enum: 'consulting'|'site_visit'|'estimate_meeting'|'contracted'
  //     |'in_progress'|'completed'|'as_service'|'paused'|'canceled'

isVip: boolean("is_vip").notNull().default(false),

statusChangedAt: timestamp("status_changed_at"),  // 마지막 단계 변경 시각
pauseReason: text("pause_reason"),                // 상담중단 시 자유 메모
canceledReason: text("canceled_reason"),          // 취소 시 자유 메모
```

### 1-6. 자동 전환 규칙 (권장)

| 트리거 | 자동 전환 |
|---|---|
| 현장 일정에 "실측" 캘린더 등록 | `consulting` → `site_visit` |
| 견적서 발행 | `site_visit` → `estimate_meeting` |
| 계약금 입금 확인 | `estimate_meeting` → `contracted` |
| 첫 공정 시작일 도래 | `contracted` → `in_progress` |
| 입주청소 완료 체크 | `in_progress` → `completed` |
| 하자 신고 접수 | `completed` → `as_service` |
| 하자 해결 완료 체크 | `as_service` → `completed` |

자동 전환은 사장님이 끌 수 있어야 함 (워크스페이스 설정).

---

## 2. 화면 문구 — 고객 불러오기

### 2-1. 버튼 문구

| 위치 | 문구 |
|---|---|
| 신규 현장 등록 화면 — 고객 입력 영역 위 | **`기존 고객 불러오기`** |
| 견적·계약 화면 등 다른 곳에서 고객 선택 | **`고객 불러오기`** |
| 아이콘 옵션 | `Users` (lucide) |

### 2-2. 검색창 안내문 (placeholder)

```
이름·전화번호 끝 4자리·주소로 검색
```

대안 (짧은 버전):
```
이름이나 전화번호 뒷자리
```

### 2-3. 검색 결과 없을 때

```
이 조건으로 등록된 고객이 없어요.
새 고객으로 등록하실 수 있습니다.

[ 새 고객으로 등록 ]
```

### 2-4. 검색 중 (로딩)

```
찾는 중...
```

### 2-5. 검색 결과 행 표시 형식

```
{고객 이름}        {전화번호 마지막 4자리 노출}        [단계 뱃지]
{주소(시·구·동까지)}                                {마지막 연락일}
```

### 2-6. 고객 선택 후 표시 문구

선택 직후 인풋이 채워지면서 보일 안내:

```
✓ {고객 이름} 고객님 정보를 불러왔어요.
   이전 현장 {N}건의 기록이 함께 연결됩니다.
```

이전 현장이 없으면:
```
✓ {고객 이름} 고객님 정보를 불러왔어요.
```

### 2-7. 이미 선택된 상태 변경

```
다른 고객으로 바꾸기
```

(작은 텍스트 버튼)

### 2-8. 권한 없음 (다른 워크스페이스 고객)

```
이 고객은 다른 워크스페이스에 등록돼 있어요.
같은 워크스페이스의 고객만 불러올 수 있습니다.
```

---

## 3. 상태 뱃지 툴팁·짧은 설명

뱃지에 마우스 올렸을 때 / 모바일에서 길게 누르면 보일 한 줄 설명.

| 상태 | 툴팁 문구 (짧고 명확) |
|---|---|
| 상담중 | 처음 연락받고 현장 방문 잡기 전까지 |
| 현장실측 | 현장 다녀와서 도면·사진 정리하는 중 |
| 견적미팅 | 견적서 보내고 금액·자재 같이 검토 중 |
| 계약완료 | 계약서 도장 끝나고 계약금 받음 |
| 시공중 | 철거 시작부터 입주청소 직전까지 |
| 시공완료 | 검수 끝나고 고객한테 인도됨 |
| A/S | 하자·보수 요청이 들어와 처리 중 |
| VIP | 단골·재의뢰 가능성 높은 고객 |
| 상담중단 | 잠시 멈춤. 다시 살릴 수 있어요 |
| 취소 | 진행 안 함. 재오픈하기 전엔 닫혀 있어요 |

---

## 4. 상태 변경 UI 문구

### 4-1. 상태 변경 버튼

```
단계 바꾸기
```

(또는 단계 뱃지 자체를 클릭 가능하게)

### 4-2. 단계 선택 드롭다운 헤더

```
지금 어느 단계인가요?
```

### 4-3. 단계 변경 확인 (특정 단계만)

**계약완료로 바꿀 때**
```
계약완료로 바꾸면 계약 모듈에서 계약서를 발행하실 수 있어요.
계약금 입금일은 입력하셨나요?

[ 그래도 진행 ]   [ 취소 ]
```

**시공완료로 바꿀 때**
```
시공완료로 바꾸면 정산 리포트가 마감됩니다.
하자가 생기면 A/S 단계로 다시 옮길 수 있어요.

[ 시공완료로 ]   [ 잠시만 ]
```

**취소로 바꿀 때**
```
이 고객을 취소 상태로 두시겠어요?
다시 살리실 일이 있을 것 같으면 "상담중단"이 더 맞습니다.

[ 취소로 ]   [ 상담중단으로 ]   [ 그냥 두기 ]
```

### 4-4. 상담중단 시 메모 입력

```
멈춘 이유를 짧게 적어두시면 다음에 다시 연락하실 때 도움이 돼요.
(선택 입력)
```

예시 자동완성 칩:
- "예산 재검토 중"
- "다른 업체 비교 중"
- "일정 미정"
- "연락 닿지 않음"

### 4-5. VIP 라벨 토글

```
☆ VIP로 표시
```

켜진 상태:
```
⭐ VIP 고객
```

---

## 5. 빈 상태 / 안내 문구

### 5-1. 고객 목록 비어있을 때

```
아직 등록한 고객이 없어요.

상담 들어온 고객부터 한 분씩 등록해 두시면
견적·계약 만들 때 자동으로 불러올 수 있습니다.

[ 새 고객 등록 ]
```

### 5-2. 특정 단계의 고객이 없을 때

```
"{단계명}" 단계의 고객이 없어요.
```

### 5-3. 단계별 카운트 (목록 상단)

```
상담중 12 · 실측 4 · 견적 3 · 계약 2 · 시공중 5 · 완료 18 · A/S 2
```

(긴 라벨 줄여서. 모바일은 더 줄여도 됨.)

---

## 6. 인테리어코치 사용 업체 공지 (선택 작업 3)

### 6-1. 인앱 배너

```
🆕 고객 진행상태 — 상담중부터 A/S까지 한눈에 보입니다.
```

### 6-2. 첫 모달

**제목**
```
고객을 어디까지 진행했는지 한눈에 보세요
```

**본문**
```
상담중 → 현장실측 → 견적미팅 → 계약완료 → 시공중 → 시공완료 → A/S.

7단계로 단계가 자동으로 따라옵니다.
견적 발행하면 견적미팅으로, 계약금 받으면 계약완료로 바뀝니다.
사장님이 직접 손으로 바꾸셔도 됩니다.

VIP 고객은 별도 라벨로 표시하고,
상담이 잠시 멈춘 분은 "상담중단", 끝난 분은 "취소"로 나눠둬요.
```

**CTA**: `고객 단계 보러가기`

### 6-3. 카카오톡 채널 공지

```
[인테리어코치] 고객 진행상태가 바뀌었어요

상담중부터 A/S까지 7단계로 정리해 봤어요.

📋 어느 고객이 지금 어느 단계인지 한 화면에서.
📥 견적서 발행·계약금 입금되면 단계가 자동으로 따라옵니다.
⭐ 단골·VIP 고객은 별도 라벨로.

▸ 인테리어코치 들어가시면 고객 목록에서 바로 보실 수 있어요
   www.interiorcoach.co.kr
```

**짧은 버전**:
```
[인테리어코치] 고객 진행상태 7단계

상담중 → 현장실측 → 견적미팅 → 계약완료 → 시공중 → 시공완료 → A/S.
상담이 잠시 멈춘 분과 취소된 분도 따로 표시됩니다.

▸ www.interiorcoach.co.kr
```

---

## 7. 봇 핸드오프 요약 — 한 화면 정리

### 7-1. 프론트엔드 봇이 가져가는 값

**Enum 값 (코드)**
```ts
export const CUSTOMER_STATUSES = [
  "consulting",
  "site_visit",
  "estimate_meeting",
  "contracted",
  "in_progress",
  "completed",
  "as_service",
  "paused",
  "canceled",
] as const;

export const CUSTOMER_STATUS_FUNNEL = [
  "consulting",
  "site_visit",
  "estimate_meeting",
  "contracted",
  "in_progress",
  "completed",
  "as_service",
] as const;

export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  consulting: "상담중",
  site_visit: "현장실측",
  estimate_meeting: "견적미팅",
  contracted: "계약완료",
  in_progress: "시공중",
  completed: "시공완료",
  as_service: "A/S",
  paused: "상담중단",
  canceled: "취소",
};

export const CUSTOMER_STATUS_TOOLTIP: Record<string, string> = {
  consulting: "처음 연락받고 현장 방문 잡기 전까지",
  site_visit: "현장 다녀와서 도면·사진 정리하는 중",
  estimate_meeting: "견적서 보내고 금액·자재 같이 검토 중",
  contracted: "계약서 도장 끝나고 계약금 받음",
  in_progress: "철거 시작부터 입주청소 직전까지",
  completed: "검수 끝나고 고객한테 인도됨",
  as_service: "하자·보수 요청이 들어와 처리 중",
  paused: "잠시 멈춤. 다시 살릴 수 있어요",
  canceled: "진행 안 함. 재오픈하기 전엔 닫혀 있어요",
};
```

**색상 토큰 (다크 테마 기준)**
```ts
export const CUSTOMER_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  consulting:       { bg: "rgba(147, 197, 253, 0.15)", fg: "#93C5FD" },
  site_visit:       { bg: "rgba(96, 165, 250, 0.18)",  fg: "#60A5FA" },
  estimate_meeting: { bg: "rgba(74, 158, 255, 0.20)",  fg: "#4A9EFF" },
  contracted:       { bg: "rgba(52, 211, 153, 0.18)",  fg: "#34D399" },
  in_progress:      { bg: "rgba(16, 185, 129, 0.22)",  fg: "#10B981" },
  completed:        { bg: "rgba(0, 196, 113, 0.25)",   fg: "#00C471" },
  as_service:       { bg: "rgba(255, 159, 67, 0.20)",  fg: "#FF9F43" },
  paused:           { bg: "rgba(156, 163, 175, 0.18)", fg: "#9CA3AF" },
  canceled:         { bg: "rgba(107, 114, 128, 0.25)", fg: "#6B7280" },
};

// VIP는 status가 아니라 별도 boolean. 별 아이콘 색
export const VIP_COLOR = { bg: "rgba(251, 191, 36, 0.18)", fg: "#FBBF24" };
```

### 7-2. 백엔드 봇이 가져가는 값

**드리즐 schema 패치**
```ts
// src/lib/db/schema.ts customers 테이블에 추가/수정
status: text("status").notNull().default("consulting"),
isVip: boolean("is_vip").notNull().default(false),
statusChangedAt: timestamp("status_changed_at"),
pauseReason: text("pause_reason"),
canceledReason: text("canceled_reason"),
```

**자동 전환 트리거 (서버 측에서 실행)**

| 트리거 이벤트 | 조건 | 변경 |
|---|---|---|
| `POST /api/schedule` 에 `type='site_visit'` 추가 | 현재 status = `consulting` | → `site_visit` |
| `POST /api/estimates` 발행 | 현재 status ∈ {`consulting`,`site_visit`} | → `estimate_meeting` |
| `PUT /api/contracts/.../payments` 첫 `완납` | 현재 status = `estimate_meeting` | → `contracted` |
| 일별 cron: 첫 공정 `plannedStart ≤ today` | 현재 status = `contracted` | → `in_progress` |
| `PUT /api/construction` 입주청소 완료 체크 | 현재 status = `in_progress` | → `completed` |
| `POST /api/defects` 신규 하자 | 현재 status = `completed` | → `as_service` |
| `PUT /api/defects/.../resolve` 마지막 하자 해결 | 현재 status = `as_service` | → `completed` |

자동 전환 시 `statusChangedAt` 도 함께 갱신, 활동 로그(`activity_log`)에 기록.

**API 응답에 함께 보내는 필드**
```ts
{
  id: string,
  name: string,
  phone: string,
  email: string | null,
  address: string | null,
  status: string,         // enum
  statusLabel: string,    // "상담중" 등 한글 라벨 (서버에서 lookup)
  isVip: boolean,
  statusChangedAt: string | null,
  pauseReason: string | null,
  canceledReason: string | null,
  // ... 기존 필드
}
```

### 7-3. 봇이 절대 쓰면 안 되는 표현

영문/마케팅 용어 금지 — 한국어로 교체.

| ❌ 금지 | ✅ 대체 |
|---|---|
| Lead / Prospect | 상담중 고객 |
| Opportunity | 견적 진행 고객 |
| Pipeline | 진행 상태 |
| Won / Lost | 계약완료 / 취소 |
| Hot / Warm / Cold | (사용 안 함) |
| Activated | 활성 (또는 "지금 진행 중") |
| Status enum: ACTIVE/INACTIVE | "상담중단" / "취소" 같이 의미 명확한 한글 |
| Funnel | 단계 / 흐름 |
| Conversion rate | 계약 전환율 |
| Customer Lifecycle | (그냥 "고객 진행상태") |

---

## 8. 체크리스트 (배포 전)

- [ ] DB enum 9개 값 마이그레이션 적용
- [ ] 기존 데이터 마이그레이션: 기존 status 값 매핑 표 (개발팀 합의 필요)
- [ ] 자동 전환 트리거 7종 구현 + 사장님이 끌 수 있는 워크스페이스 설정
- [ ] 다크/라이트 두 테마 모두 색상 적용
- [ ] 뱃지 라벨이 모바일에서 두 줄 안 넘게 폭 확인
- [ ] VIP 라벨은 status와 별개로 항상 보임
- [ ] 단계별 카운트 합계가 전체 고객 수와 일치 (VIP 중복 카운트 안 함)
- [ ] 취소된 고객은 기본 검색 결과에서 제외, "취소 포함" 토글로 노출
