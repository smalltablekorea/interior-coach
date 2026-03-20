# 견적코치 마케팅 센터 — Frontend/Backend 구현 메모

> 최종 수정: 2026-03-21
> 작성자: 리서치/마케팅/브랜딩 창
> 대상: 프론트엔드 창, 백엔드 창

---

## 1. 이 문서의 목적

이 문서는 리서치/마케팅 창에서 정의한 전략·규칙·카피를 바탕으로,
프론트엔드와 백엔드 창이 **바로 구현에 사용할 수 있는 데이터 구조와 UI 레이블**을 정리한 것이다.

참조 문서:
- `00-strategy-overview.md` — 전체 전략
- `01-kpi-definitions.md` — KPI 계산식과 표시 규칙
- `02-segment-definitions.md` — 세그먼트 규칙 JSON과 시드
- `03-automation-playbook.md` — 자동화 스텝 JSON과 시드
- `04-campaign-templates.md` — 캠페인 시드와 카피
- `05-brand-tone-guide.md` — 브랜드 톤
- `06-operator-alerts.md` — 알림 규칙과 설정 타입

---

## 2. 프론트엔드 구현 메모

### 2-1. admin 사이드바 수정

**파일**: `src/components/layout/Sidebar.tsx`

navItems 배열에 추가:

```typescript
{ href: "/admin/marketing", icon: Target, label: "마케팅 센터" }
```

- `Target` 아이콘은 lucide-react에서 import
- 기존 `Megaphone`의 `/marketing`은 시공업체 마케팅 → 건드리지 않음
- `requiredFeature`는 추후 논의 (MVP에서는 demo 접근 허용)

### 2-2. 라우팅 구조

```
src/app/(dashboard)/admin/marketing/
├── layout.tsx          ← 탭 내비게이션 (개요/퍼널/리드/세그먼트/자동화/캠페인/콘텐츠/실험/설정)
├── page.tsx            ← 개요 (Overview)
├── funnel/page.tsx     ← 퍼널
├── leads/page.tsx      ← 리드
├── segments/page.tsx   ← 세그먼트
├── automations/page.tsx ← 자동화
├── campaigns/page.tsx  ← 캠페인
├── content/page.tsx    ← 콘텐츠 스튜디오
├── experiments/page.tsx ← 실험
└── settings/page.tsx   ← 설정
```

### 2-3. 탭 내비게이션 정의

```typescript
const MARKETING_TABS = [
  { href: "/admin/marketing", label: "개요", icon: BarChart3 },
  { href: "/admin/marketing/funnel", label: "퍼널", icon: Filter },
  { href: "/admin/marketing/leads", label: "리드", icon: Users },
  { href: "/admin/marketing/segments", label: "세그먼트", icon: Layers },
  { href: "/admin/marketing/automations", label: "자동화", icon: Zap },
  { href: "/admin/marketing/campaigns", label: "캠페인", icon: Megaphone },
  { href: "/admin/marketing/content", label: "콘텐츠", icon: PenTool },
  { href: "/admin/marketing/experiments", label: "실험", icon: FlaskConical },
  { href: "/admin/marketing/settings", label: "설정", icon: Settings },
];
```

### 2-4. 개요 페이지 UI 사양

#### KPI 카드 8개 (4열 × 2행)

```typescript
const OVERVIEW_KPIS = [
  { key: "signups", label: "신규가입", icon: UserPlus, color: "var(--green)" },
  { key: "upload_started", label: "업로드 시작", icon: Upload, color: "var(--blue)" },
  { key: "upload_submitted", label: "업로드 제출", icon: FileCheck, color: "var(--blue)" },
  { key: "analysis_completed", label: "분석 완료", icon: Brain, color: "var(--green)" },
  { key: "checkout_started", label: "결제 시작", icon: CreditCard, color: "var(--orange)" },
  { key: "payment_succeeded", label: "결제 성공", icon: CircleCheck, color: "var(--green)" },
  { key: "revenue", label: "매출", icon: Banknote, color: "var(--green)" },
  { key: "inquiries", label: "업체문의", icon: MessageSquare, color: "var(--blue)" },
];
```

각 카드:
- KPICard 컴포넌트 사용 (기존 `src/components/ui/KPICard.tsx`)
- value: 절대값 (숫자)
- trend: { direction: "up"|"down", label: "전일 대비 +12.5%" }
- 매출은 `fmtShort()` 포맷 사용

#### 오늘 액션 필요 카드 (2열 좌측)

```typescript
const ACTION_ITEMS = [
  {
    key: "unpaid_waiting",
    label: "미결제 대기",
    description: "분석 완료 후 24시간 미결제",
    icon: Clock,
    severity: (count: number) => count >= 20 ? "critical" : count >= 10 ? "warning" : "normal",
  },
  {
    key: "upload_abandoned",
    label: "업로드 중단",
    description: "업로드 시작 후 6시간 미제출",
    icon: AlertTriangle,
    severity: (count: number) => count >= 15 ? "warning" : "normal",
  },
  {
    key: "payment_failed_repeat",
    label: "결제 실패 반복",
    description: "7일 내 2회 이상 실패",
    icon: XCircle,
    severity: (count: number) => count >= 5 ? "critical" : "normal",
  },
  {
    key: "dormant_eligible",
    label: "휴면 복귀 대상",
    description: "7일+ 미접속, 미결제 유저",
    icon: Moon,
    severity: () => "normal",
  },
];
```

#### 이상징후 카드 (1열 우측)

```typescript
const ANOMALY_CHECKS = [
  {
    key: "conversion_drop",
    label: "전환율 급락",
    check: "주요 전환율 전주 대비 20%p+ 하락",
    status: "normal" | "warning" | "critical",
  },
  {
    key: "payment_success_rate",
    label: "결제 성공률",
    check: "결제 성공/(성공+실패) 기준",
    status: "normal" | "warning" | "critical",
  },
  {
    key: "upload_failure_rate",
    label: "업로드 실패율",
    check: "시스템 에러 기준",
    status: "normal" | "warning" | "critical",
  },
];
```

### 2-5. 퍼널 페이지 UI 사양

10단계 퍼널:

```typescript
const FUNNEL_STEPS = [
  { key: "visit", label: "방문", event: null },
  { key: "signup", label: "회원가입", event: "signup_completed" },
  { key: "login", label: "로그인", event: "login_completed" },
  { key: "upload_start", label: "업로드 시작", event: "upload_started" },
  { key: "upload_submit", label: "업로드 제출", event: "upload_submitted" },
  { key: "analysis_done", label: "분석 완료", event: "analysis_completed" },
  { key: "checkout_start", label: "결제 시작", event: "checkout_started" },
  { key: "payment_success", label: "결제 성공", event: "payment_succeeded" },
  { key: "report_view", label: "리포트 확인", event: "report_viewed" },
  { key: "inquiry", label: "업체문의", event: "inquiry_submitted" },
];
```

필터:
- 날짜 범위: 시작일~종료일 + 프리셋 (오늘, 7일, 30일, 90일)
- 채널: 전체, 검색광고, 블로그, 카카오, 추천, 직접유입
- 디바이스: 전체, 데스크탑, 모바일, 태블릿
- 지역: 전체, 서울, 경기, 기타

시각화:
- 가로 막대 차트 (단계별 폭이 전환율에 비례)
- 각 단계 간 전환율 % 표시
- 이탈이 가장 큰 단계 빨간색 하이라이트

### 2-6. 리드 페이지 UI 사양

테이블 컬럼:

```typescript
const LEAD_COLUMNS = [
  { key: "name", label: "사용자", width: "20%" },
  { key: "last_action", label: "최근 행동", width: "15%" },
  { key: "source", label: "유입채널", width: "10%" },
  { key: "campaign", label: "캠페인", width: "10%" },
  { key: "lead_score", label: "리드 점수", width: "10%" },
  { key: "segment", label: "세그먼트", width: "12%" },
  { key: "last_seen", label: "마지막 접속", width: "10%" },
  { key: "status", label: "상태", width: "8%" },
];
```

리드 점수 뱃지:

```typescript
const LEAD_SCORE_COLORS = {
  hot: { bg: "bg-red-500/10", text: "text-red-400", label: "Hot" },    // 80+
  warm: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Warm" }, // 40-79
  cold: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Cold" },  // 0-39
  dormant: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]", label: "Dormant" }, // 음수
};
```

리드 상세 패널 (모달 또는 슬라이드):
- 행동 타임라인 (이벤트 시간순 나열)
- 현재 세그먼트
- 결제/리포트/문의 여부 (O/X)
- **업로드 원문 파일 내용 노출 금지** — "업로드 제출 완료" 같은 상태만
- 추천 다음 액션 표시

### 2-7. 세그먼트 페이지 UI 사양

세그먼트 카드 목록:
- 세그먼트명, 설명, 현재 유저 수, 전주 대비 변화
- 규칙 요약 (진입조건/제외조건 텍스트)
- 상태: 활성/비활성

시드 데이터: `02-segment-definitions.md`의 `DEFAULT_SEGMENTS` 배열 사용

### 2-8. 자동화 페이지 UI 사양

자동화 카드 목록:
- 자동화명, 설명, 상태(활성/비활성), 총 진입/완료/전환 수
- 플로우 시각화 (트리거 → 조건 → 지연 → 액션 단계 표시)

시드 데이터: `03-automation-playbook.md`의 `DEFAULT_AUTOMATIONS` 배열 사용

안전장치 표시:
- 야간 금지: "21:00~08:00 발송 보류"
- 중복 방지: "동일 자동화 재진입 {n}시간 방지"
- 일일 한도: "유저당 하루 최대 {n}건"

### 2-9. 캠페인 페이지 UI 사양

상태 표시:

```typescript
const CAMPAIGN_STATUSES = [
  { key: "draft", label: "초안", color: STATUS_COLORS["작성중"] },
  { key: "pending_approval", label: "승인대기", color: STATUS_COLORS["예약"] },
  { key: "active", label: "집행중", color: STATUS_COLORS["진행중"] },
  { key: "paused", label: "일시중지", color: STATUS_COLORS["보류"] },
  { key: "completed", label: "종료", color: STATUS_COLORS["완료"] },
];
```

채널 표시:

```typescript
const CAMPAIGN_CHANNELS = [
  { key: "email", label: "이메일", icon: Mail },
  { key: "kakao", label: "카카오", icon: MessageSquare },
  { key: "search_ad", label: "검색광고", icon: Search },
  { key: "retargeting", label: "리타게팅", icon: Target },
  { key: "content", label: "콘텐츠", icon: FileText },
];
```

### 2-10. 콘텐츠 스튜디오 UI 사양

카테고리:

```typescript
const CONTENT_CATEGORIES = [
  { key: "search_ad", label: "검색광고 카피" },
  { key: "email_subject", label: "이메일 제목" },
  { key: "email_body", label: "이메일 본문" },
  { key: "kakao_message", label: "카카오 메시지" },
  { key: "blog_title", label: "블로그 제목" },
  { key: "landing_cta", label: "랜딩 CTA" },
  { key: "review_request", label: "후기 요청" },
  { key: "referral_share", label: "추천코드 공유" },
];
```

시드 카피: `04-campaign-templates.md` 섹션 2~7의 텍스트를 DB/config 시드로 삽입

### 2-11. 실험 페이지 UI 사양

```typescript
const EXPERIMENT_TARGETS = [
  { key: "headline", label: "헤드라인" },
  { key: "cta", label: "CTA 문구" },
  { key: "price_copy", label: "가격 카피" },
  { key: "review_placement", label: "후기 블록 배치" },
];

const EXPERIMENT_METRICS = [
  { key: "click_rate", label: "클릭률" },
  { key: "upload_start_rate", label: "업로드 시작률" },
  { key: "checkout_start_rate", label: "결제 시작률" },
  { key: "payment_success_rate", label: "결제 성공률" },
];
```

### 2-12. 설정 페이지 UI 사양

섹션:
1. **채널 연동** — 이메일/카카오/SMS 연동 상태 표시 + 연결/해제
2. **발송 정책** — `06-operator-alerts.md`의 `SendingPolicy` 타입 참조
3. **UTM 규칙** — 기본 utm_source/medium/campaign 프리셋
4. **운영자 알림** — `06-operator-alerts.md`의 `AlertSettings` 타입 참조
5. **개인정보** — 마케팅 수신동의 문구, 수신거부 안내 문구

---

## 3. 백엔드 구현 메모

### 3-1. DB 스키마 추가 (mkt_ 접두사)

기존 `marketing*` 테이블과 충돌 방지를 위해 `mkt_` 접두사 사용.

```
mkt_events          — 이벤트 스트림 (00-strategy-overview.md §3 참조)
mkt_sessions        — 세션 추적 (UTM 포함)
mkt_leads           — 리드 프로필 (점수, 세그먼트, 마지막 행동)
mkt_segments        — 세그먼트 정의 (규칙 JSON)
mkt_campaigns       — 캠페인 (상태, 채널, 예산, UTM)
mkt_campaign_assets — 캠페인 에셋 (카피, 이미지 URL)
mkt_automations     — 자동화 정의 (트리거, 안전장치)
mkt_automation_steps — 자동화 단계 (지연, 조건, 액션)
mkt_automation_enrollments — 유저별 자동화 진행 상태
mkt_messages        — 발송 메시지 로그 (채널, 상태, 발송/수신 시각)
mkt_experiments     — A/B 실험 정의
mkt_experiment_variants — 실험 변형 (변형별 지표)
mkt_daily_metrics   — 일별 집계 메트릭 (배치 계산)
mkt_content_templates — 콘텐츠 템플릿 (카테고리, 본문)
mkt_settings        — 마케팅 설정 (채널 연동, 발송 정책, 알림 설정)
```

### 3-2. 이벤트 필드 정의

`00-strategy-overview.md` §3의 `MarketingEvent` 인터페이스 참조.

핵심: `user_id`, `event_name`, `occurred_at`, `session_id`, UTM 5종, `device_type`, `experiment_variant`

### 3-3. 리드 점수 계산 규칙

`00-strategy-overview.md` §4 참조.

```typescript
const LEAD_SCORE_RULES: Record<string, number> = {
  signup_completed: 10,
  login_completed: 5,       // 일 1회만
  upload_started: 20,
  upload_submitted: 30,
  analysis_completed: 15,
  paywall_viewed: 10,
  checkout_started: 20,
  payment_succeeded: 50,
  companies_viewed: 10,
  inquiry_submitted: 30,
  inactive_7d: -15,         // 매 7일
  inactive_14d: -25,        // 7일 감점과 누적
};
```

### 3-4. 세그먼트 규칙 타입

`02-segment-definitions.md` 하단의 `SegmentRule` 인터페이스 참조.

시드 데이터: `DEFAULT_SEGMENTS` 배열 (9개)

### 3-5. 자동화 스텝 타입

`03-automation-playbook.md` 하단의 `AutomationDefinition`/`AutomationStep` 인터페이스 참조.

시드 데이터: `DEFAULT_AUTOMATIONS` 배열 (5개)

### 3-6. 알림 설정 타입

`06-operator-alerts.md` §6의 `AlertSettings`/`SendingPolicy` 인터페이스 참조.

### 3-7. API 라우트 구조

```
src/app/api/admin/marketing/
├── overview/route.ts       — KPI 집계, 액션 아이템, 이상징후
├── funnel/route.ts         — 퍼널 단계별 유저 수 (필터 포함)
├── leads/route.ts          — 리드 리스트 (검색/필터/정렬/페이지네이션)
├── leads/[id]/route.ts     — 리드 상세 (타임라인, 세그먼트, 점수)
├── segments/route.ts       — 세그먼트 CRUD
├── automations/route.ts    — 자동화 CRUD
├── campaigns/route.ts      — 캠페인 CRUD
├── content/route.ts        — 콘텐츠 템플릿 CRUD
├── experiments/route.ts    — 실험 CRUD
├── settings/route.ts       — 마케팅 설정 R/W
└── events/route.ts         — 이벤트 수집 엔드포인트
```

### 3-8. 이벤트 수집 엔드포인트

```
POST /api/admin/marketing/events
Body: { event_name, user_id, session_id, properties, utm_* }
```

이 엔드포인트는 프론트엔드(서비스)에서 사용자 행동 이벤트를 전송하는 데 사용.
별도의 이벤트 수집 미들웨어나 클라이언트 SDK 필요.

### 3-9. 일별 메트릭 배치

```
mkt_daily_metrics 테이블에 매일 00:00 KST에 배치 집계:
- 날짜, 이벤트별 카운트, 전환율, 매출, 세그먼트별 유저 수
- 이 테이블을 읽어서 개요/퍼널 페이지에 빠르게 제공
```

---

## 4. Mock 데이터 가이드

DB 연결 전 또는 이벤트 수집 전, UI가 비어 보이지 않도록 **견적코치 도메인에 맞는 목 데이터**를 사용한다.

### Mock 유저 예시

| 이름 | 세그먼트 | 리드 점수 | 최근 행동 | 유입채널 |
|------|----------|-----------|-----------|----------|
| 김지현 | 분석 완료 후 미결제 | 85 (Hot) | paywall_viewed | 네이버 검색 |
| 이현수 | 업로드 시작 후 미제출 | 35 (Cold) | upload_started | 블로그 |
| 박서연 | 결제 성공 후 리포트 미확인 | 95 (Hot) | payment_succeeded | 카카오 |
| 정민호 | 후기 요청 대상 | 120 (Hot) | report_viewed | 추천코드 |
| 최영진 | 가입만 함 | 10 (Cold) | signup_completed | 구글 검색 |
| 한수미 | 7일 휴면 | -5 (Dormant) | login_completed (8일 전) | 네이버 검색 |
| 강태윤 | 업체추천 관심 | 105 (Hot) | company_clicked | 직접 유입 |
| 윤지은 | 14일 휴면 | -20 (Dormant) | upload_started (16일 전) | 인스타그램 |

### Mock KPI 예시 (일간)

```typescript
const MOCK_DAILY_KPIS = {
  signups: { value: 23, prev: 18, diff: "+27.8%" },
  upload_started: { value: 15, prev: 12, diff: "+25.0%" },
  upload_submitted: { value: 11, prev: 9, diff: "+22.2%" },
  analysis_completed: { value: 10, prev: 9, diff: "+11.1%" },
  checkout_started: { value: 6, prev: 5, diff: "+20.0%" },
  payment_succeeded: { value: 4, prev: 3, diff: "+33.3%" },
  revenue: { value: 396000, prev: 297000, diff: "+33.3%" },
  inquiries: { value: 2, prev: 1, diff: "+100%" },
};
```

### Mock 문구 규칙

- **"Campaign 1", "Lorem ipsum" 절대 금지**
- 캠페인명: "봄 이사철 검색광고", "미결제 유도 자동화", "후기 수집 카카오"
- 세그먼트명: "분석 완료 후 미결제", "7일 휴면", "업로드 시작 후 미제출"
- 콘텐츠: `04-campaign-templates.md`의 실제 카피 사용

---

## 5. 빈 상태 / 에러 상태 문구

### 빈 상태 (데이터 없음)

| 페이지 | 아이콘 | 제목 | 설명 |
|--------|--------|------|------|
| 개요 | BarChart3 | "아직 데이터가 없어요" | "사용자 이벤트가 수집되면 여기에 KPI가 표시됩니다." |
| 퍼널 | Filter | "퍼널 데이터를 수집 중이에요" | "이벤트가 쌓이면 단계별 전환율을 확인할 수 있습니다." |
| 리드 | Users | "등록된 리드가 없어요" | "사용자가 가입하면 자동으로 리드 목록에 추가됩니다." |
| 세그먼트 | Layers | "세그먼트가 비어 있어요" | "기본 세그먼트를 추가하면 자동으로 유저가 분류됩니다." + [기본 세그먼트 추가] 버튼 |
| 자동화 | Zap | "자동화가 없어요" | "자동화를 추가하면 이탈 유저에게 자동으로 메시지를 보냅니다." + [기본 자동화 추가] 버튼 |
| 캠페인 | Megaphone | "아직 캠페인이 없어요" | "첫 캠페인을 만들어 보세요." + [캠페인 만들기] 버튼 |
| 콘텐츠 | PenTool | "콘텐츠 템플릿이 없어요" | "기본 템플릿을 추가하면 바로 사용할 수 있습니다." + [기본 템플릿 추가] 버튼 |
| 실험 | FlaskConical | "실험이 없어요" | "A/B 테스트를 만들어서 전환율 개선 가설을 검증해 보세요." + [실험 만들기] 버튼 |

### 에러 상태

| 상황 | 메시지 |
|------|--------|
| API 실패 | "데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." + [다시 시도] 버튼 |
| 권한 없음 | "이 기능에 접근할 수 없어요. 관리자 권한이 필요합니다." |
| 데이터 로딩 | 기존 animate-shimmer 스켈레톤 패턴 사용 |

### 로딩 상태

기존 패턴을 따름:
```tsx
{loading ? (
  <div className="grid grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-shimmer" />
    ))}
  </div>
) : (
  <KPIGrid data={kpiData} />
)}
```

---

## 6. 주의사항 체크리스트

### 절대 하지 말 것

- [ ] 로그인 강제 완화 (비회원 업로드 허용 등)
- [ ] 기존 analyze/payment/my/admin 접근 제어 약화
- [ ] 업로드 원문 파일 내용을 마케팅 UI에 노출
- [ ] 기존 결제/분석/admin 기능 깨뜨리기
- [ ] 기존 `/marketing` 페이지 (시공업체 마케팅) 수정
- [ ] "Campaign 1", "Lorem ipsum" 같은 더미 문구 사용

### 반드시 할 것

- [ ] 기존 디자인 시스템 (CSS 변수, 컴포넌트 패턴) 유지
- [ ] 한국어로 모든 UI 텍스트 작성
- [ ] 빈 상태/에러 상태/로딩 상태 모두 구현
- [ ] 견적코치 도메인에 맞는 실제 운영용 문구 사용
- [ ] 민감 데이터 (파일 원문, 개인정보) 마케팅 UI 노출 금지
- [ ] 모바일/태블릿에서 깨지지 않는 반응형 구현
