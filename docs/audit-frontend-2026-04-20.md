# 인테리어코치 프론트엔드 현황 조사 보고서
작성일: 2026-04-20
조사 범위: `src/` 전체 (app router / components / hooks / lib / middleware)
조사 방식: 읽기 전용 — 코드 변경 없음

---

## 1. 라우트 구조

### 1.1 App Router 페이지 (`src/app/**/page.tsx`)

#### 공개 라우트 (로그인 불필요)

| 경로 | 파일 | 용도 |
|------|------|------|
| `/` | `src/app/page.tsx` | 랜딩페이지(8섹션) 서버 컴포넌트 + metadata |
| `/landing-preview` | `src/app/landing-preview/page.tsx` | 랜딩 미리보기 (noindex) |
| `/demo-request` | `src/app/demo-request/page.tsx` | 데모 신청 폼 (클라이언트 로깅) |
| `/pricing` | `src/app/pricing/page.tsx` | 요금제 페이지 |
| `/auth/login` | `src/app/auth/login/page.tsx` | 로그인 |
| `/sample` | `src/app/sample/page.tsx` | 32평 스탠다드 샘플 견적 분석 (blur-lock UX) |
| `/analyze` | `src/app/analyze/page.tsx` | 영수증/견적서 업로드 분석 입구 |
| `/terms` | `src/app/terms/page.tsx` | 이용약관 |
| `/refund-policy` | `src/app/refund-policy/page.tsx` | 환불정책 |
| `/qna`, `/qna/[id]` | `src/app/qna/**/page.tsx` | 공개 Q&A 커뮤니티 |
| `/p/[slug]` | `src/app/p/[slug]/page.tsx` | 고객 포털 v2 (슬러그 기반, 로그인 불필요) |
| `/portal/[token]` | `src/app/portal/[token]/page.tsx` | 고객 포털 v1 (토큰 기반) |

#### 보호된 라우트 (세션 쿠키 필요, `(dashboard)` 그룹)

| 경로 | 파일 | 용도 |
|------|------|------|
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | 통합 대시보드 (1,547 라인) |
| `/customers` | `src/app/(dashboard)/customers/page.tsx` | 고객 목록 |
| `/customers/[id]` | `src/app/(dashboard)/customers/[id]/page.tsx` | 고객 상세 |
| `/sites` | `src/app/(dashboard)/sites/page.tsx` | 현장 목록 |
| `/sites/[id]` | `src/app/(dashboard)/sites/[id]/page.tsx` | 현장 상세 (1,321라인, 9개 탭) |
| `/estimates` | `src/app/(dashboard)/estimates/page.tsx` | 견적 목록 |
| `/estimates/[id]` | `src/app/(dashboard)/estimates/[id]/page.tsx` | 견적 상세/편집 |
| `/estimates/new` | `src/app/(dashboard)/estimates/new/page.tsx` | 수동 견적 생성 |
| `/estimates/builder` | `src/app/(dashboard)/estimates/builder/page.tsx` | 견적 빌더 (7라인, redirect) |
| `/estimates/coach` | `src/app/(dashboard)/estimates/coach/page.tsx` | 견적코치 AI (1,709라인) |
| `/contracts` | `src/app/(dashboard)/contracts/page.tsx` | 계약 목록 |
| `/contracts/[id]` | `src/app/(dashboard)/contracts/[id]/page.tsx` | 계약 상세 |
| `/construction` | `src/app/(dashboard)/construction/page.tsx` | 공정/시공 관리 |
| `/schedule` | `src/app/(dashboard)/schedule/page.tsx` | 일정 캘린더/테이블 뷰 |
| `/schedule/generator` | `src/app/(dashboard)/schedule/generator/page.tsx` | AI 공정표 생성기 (1,407라인, 5탭) |
| `/materials` | `src/app/(dashboard)/materials/page.tsx` | 자재 DB + 발주 |
| `/workers` | `src/app/(dashboard)/workers/page.tsx` | 작업자 목록 |
| `/workers/[id]` | `src/app/(dashboard)/workers/[id]/page.tsx` | 작업자 상세 |
| `/expenses` | `src/app/(dashboard)/expenses/page.tsx` | 지출 관리 |
| `/settlement` | `src/app/(dashboard)/settlement/page.tsx` | 정산 리포트 |
| `/chat` | `src/app/(dashboard)/chat/page.tsx` | 현장 톡방 리스트 (사이드바 메뉴에선 제거됨) |
| `/projects/[id]/chat` | `src/app/(dashboard)/projects/[id]/chat/page.tsx` | 특정 현장 톡방 |
| `/marketing` | `src/app/(dashboard)/marketing/page.tsx` | 마케팅 허브 |
| `/marketing/adlog` | 〃/adlog/page.tsx | 광고 로그 |
| `/marketing/instagram` | 〃/instagram/page.tsx | 인스타그램 |
| `/marketing/meta-ads` | 〃/meta-ads/page.tsx | 메타 광고 |
| `/marketing/naver-blog` | 〃/naver-blog/page.tsx | 네이버 블로그 |
| `/marketing/sms` | 〃/sms/page.tsx | SMS 캠페인 |
| `/marketing/threads` | 〃/threads/page.tsx | Threads |
| `/marketing/youtube` | 〃/youtube/page.tsx | YouTube |
| `/tax` | `src/app/(dashboard)/tax/page.tsx` | 세무 허브 |
| `/tax/ai-advisor` | 〃/ai-advisor/page.tsx | AI 세무 상담 |
| `/tax/expenses` | 〃/expenses/page.tsx | 세무 지출 |
| `/tax/invoices` | 〃/invoices/page.tsx | 세금계산서 |
| `/tax/payroll` | 〃/payroll/page.tsx | 급여 관리 |
| `/tax/revenue` | 〃/revenue/page.tsx | 매출 |
| `/tax/vendors` | 〃/vendors/page.tsx | 거래처 |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | 설정 허브 |
| `/settings/notifications` | 〃/notifications/page.tsx | 알림 설정 |
| `/settings/workspace/members` | 〃/workspace/members/page.tsx | 워크스페이스 멤버 관리 |
| `/mypage` | `src/app/(dashboard)/mypage/page.tsx` | 내 페이지 (크레딧/이력) |
| `/forbidden` | `src/app/(dashboard)/forbidden/page.tsx` | 권한 없음 |
| `/workspace/setup` | `src/app/workspace/setup/page.tsx` | 워크스페이스 초기 설정 |

#### 공유 링크 라우트 (토큰 기반, 공개)

| 경로 | 파일 | 용도 |
|------|------|------|
| `/(public)/estimates/shared/[token]` | `src/app/(public)/estimates/shared/[token]/page.tsx` | 공유된 견적 열람 |

### 1.2 인증 방식 및 라우트 보호

`src/middleware.ts` 구현:
- `/` 는 완전 공개
- 세션 쿠키(`better-auth.session_token` 또는 `__Secure-better-auth.session_token`) 존재 여부로 보호
- `matcher`로 다음 경로 제외: `_next/static`, `_next/image`, `favicon.ico`, `auth`, `portal`, `pricing`, `qna`, `terms`, `refund-policy`, `api/auth`, `api/portal`, `api/qna`, `api/v1`
- 로그인 안 한 상태로 보호 경로 접근 시 → `/auth/login?callbackUrl=...` 리다이렉트
- API 요청은 401 JSON 반환
- 워크스페이스 미설정 사용자 → `/workspace/setup` 리다이렉트 (쿠키 `has_workspace=1` 기반)

### 1.3 API 라우트 (`src/app/api/**/route.ts`)

136개 API 엔드포인트. 주요 그룹:

| 그룹 | 엔드포인트 수 | 비고 |
|------|-------------|------|
| auth, workspace, workspaces | 15 | 세션/워크스페이스 관리 |
| sites, customers, contracts, estimates | 20+ | 기본 엔티티 CRUD |
| construction, schedule, materials, workers, expenses | 15+ | 공정/자재/작업자 |
| marketing (adlog, threads, naver-blog, sms, meta-ads, youtube, instagram) | 30+ | 마케팅 자동화 |
| tax (ai-advisor, payroll, invoices, vendors, expenses, revenue) | 10 | 세무 |
| site-chat (rooms/messages/upload/sse/onboarding) | 10 | 실시간 현장 톡방 |
| portal, portal-v2 | 5 | 고객 포털 |
| notifications, notification-settings, notification-recipients, notification-logs | 6 | 알림 |
| billing, billings, subscription | 7 | 결제/구독 |
| credits, analysis 관련 | 4 | 견적 분석 크레딧 |
| defects, daily-logs, attendance | 6 | **UI 페이지 미존재** (백엔드만) |
| admin/demo-requests, admin/landing-stats | 3 | 어드민 |
| track-event, pricing-plans, demo-request | 3 | 랜딩/신청 |
| upload, analyze-receipt | 2 | 업로드/OCR |
| qna, reports/settlement, cron/trial-reminders, health-scores, activity-log, unpaid, v1/estimates | 기타 |

---

## 2. 컴포넌트 목록

### 2.1 전체 컴포넌트 (`src/components/`)

총 41개 파일. 그룹별 용도 + import 횟수(다른 파일에서 참조):

#### UI 기본 (`components/ui/`)

| 컴포넌트 | 파일 | 용도 | 외부 참조 |
|---------|------|------|---------|
| `Modal` | `components/ui/Modal.tsx` | Portal 기반 드래그 가능 모달 | **24** |
| `EmptyState` | `components/ui/EmptyState.tsx` | 빈 상태 표시 | **20** |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | 상태 배지 | **14** |
| `KPICard` | `components/ui/KPICard.tsx` | KPI 카드(값/추세/경고) | **8** |
| `KoreanInput` / `KoreanTextarea` | `components/ui/KoreanInput.tsx` | IME 호환 한글 입력 | **7** |
| `GaugeChart` | `components/ui/GaugeChart.tsx` | 반원 게이지 차트 | 1 |

#### 레이아웃 (`components/layout/`)

| 컴포넌트 | 파일 | 용도 | 외부 참조 |
|---------|------|------|---------|
| `Sidebar` | `components/layout/Sidebar.tsx` | 대시보드 사이드바 (데스크탑 + 모바일 탭) | 2 |
| `Header` | `components/layout/Header.tsx` | 대시보드 상단 헤더 | 1 |

#### 인증/권한/구독 (`components/auth`, `components/subscription`, `components/workspace`, `components/theme`)

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `AuthProvider` | `components/auth/AuthProvider.tsx` — 세션 컨텍스트 | 3 |
| `WorkspaceProvider` | `components/workspace/WorkspaceProvider.tsx` — 현재 워크스페이스 컨텍스트 | 2 |
| `ThemeProvider` | `components/theme/ThemeProvider.tsx` — 다크/라이트 토글 | 1 |
| `FeatureGate` | `components/subscription/FeatureGate.tsx` — 플랜 기반 차단 래퍼 | 4 |
| `UpgradeModal` | `components/subscription/UpgradeModal.tsx` — 업그레이드 안내 모달 | 3 |
| `PlanBadge` | `components/subscription/PlanBadge.tsx` — 플랜 배지 | 1 |

#### 온보딩 (`components/onboarding/`)

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `OnboardingModal` | 신규 회원 온보딩 모달 | 1 |
| `WelcomeModal` | 환영 모달 | 1 |
| `FirstRoomChecklist` | 첫 톡방 체크리스트 | 1 (내부 전용) |
| `SampleRoomBanner` | 샘플 현장 배너 | 1 |

#### 현장 톡방 (`components/site-chat/`)

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `ChatComposer` | 메시지 작성 입력 | 1 |
| `ChatMessage` | 단일 메시지 버블 | 4 |
| `ChatMessageList` | 메시지 목록 렌더러 | 1 |
| `ClientPortalToggle` | 고객 포털 on/off 토글 | 1 |
| `RoomSidebar` | 방 사이드바(진행률/마일스톤/미수금/하자) | 1 |
| `types.ts` | 공통 타입 | - |

#### 랜딩 (`components/landing/`)

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `LandingPage` | 8섹션 조립 | 3 (`/`, `/landing-preview` 등) |
| `LandingNav` | 랜딩 전용 네비 | 2 |
| `FadeIn` | framer-motion 스크롤 페이드인 래퍼 | 8 |
| `MockupFrame` | 브라우저 크롬 스타일 목업 프레임 | 2 |
| `FeatureMockup` | 기능별 스타일드 목업 (schedule/chat/estimate/contract/settlement/materials) | 3 |
| `LiveDemo` | 과거 라이브 데모 위젯 (현재 미사용) | 0 |
| `sections/HeroSection` | 메인 카피 + CTA | 1 |
| `sections/PainPointSection` | 4카드 시나리오 | 1 |
| `sections/FeaturesSection` | 6기능 좌우 교차 | 1 |
| `sections/CaseStudySection` | 잠실르엘 사례 | 1 |
| `sections/WhyUsSection` | 3차별점 | 1 |
| `sections/PricingSection` | 4플랜 + 월/연 토글 | 1 |
| `sections/FAQSection` | 5문항 아코디언 | 1 |
| `sections/FinalCTASection` | 배너 CTA | 1 |
| `demo-script.ts` | 과거 데모 시나리오 데이터 | 0 |

#### 차트 (`components/charts/`)

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `MonthlyTrendChart` | recharts 월별 추이 | 2 |
| `GradeComparisonChart` | recharts 등급 비교 | 2 |

#### 마케팅/기타

| 컴포넌트 | 용도 | 외부 참조 |
|---------|------|---------|
| `InAppBrowserBanner` | 인앱 브라우저 경고 배너 | 1 (layout) |
| `SocialProofWidget` | 견적 분석 완료 토스트 위젯 | 1 |
| `marketing/AccountConnectionBanner` | 마케팅 채널 연결 안내 | 7 |

### 2.2 공통 컴포넌트 부재

- **Toast 시스템**: 전역 토스트 없음. 개별 페이지에서 지역 state로 구현 (`settings/notifications/page.tsx:224` "Error Toast" 주석 참고)
- **ErrorBoundary**: 전용 컴포넌트 없음. `src/app/(dashboard)/error.tsx` 가 Next.js 기본 에러 UI로만 사용됨
- **공통 Form 컴포넌트**: `<KoreanInput>` / `<KoreanTextarea>` 외 폼 래퍼 없음. select/radio/checkbox 는 native 엘리먼트를 매 페이지에서 tailwind로 스타일링
- **공통 Table**: 없음. 각 페이지가 직접 `<table>` / `<div>` 그리드 구현
- **Tooltip / Popover**: 없음 (아이콘 버튼은 `title` 속성 사용)

---

## 3. 랜딩페이지 현황

### 3.1 파일 경로

- **Root `/`**: `src/app/page.tsx` — 서버 컴포넌트, metadata 정의, `<LandingPage>` 렌더
- **Preview `/landing-preview`**: `src/app/landing-preview/page.tsx` — 동일 `<LandingPage>` + 상단 경고 배너 (noindex)
- **조립 파일**: `src/components/landing/LandingPage.tsx` — 8섹션 import + footer

### 3.2 섹션 구성 (상단→하단)

| # | 섹션 | 파일 | 주요 요소 |
|---|------|------|----------|
| 1 | Hero | `HeroSection.tsx` | Eyebrow / 타이틀(2줄) / 서브카피 / CTA 2개(14일 무료 시작, 데모 신청) / Schedule+Chat 목업 |
| 2 | PainPoint | `PainPointSection.tsx` | 4카드 그리드 (카톡방 폭발 / 엑셀 버전 지옥 / 밤 11시 전화 / 돈 흐름) |
| 3 | Features | `FeaturesSection.tsx` | 6기능 좌우 교차(공정매니저/톡방/견적코치AI/계약서명/정산/자재) |
| 4 | CaseStudy | `CaseStudySection.tsx` | 잠실르엘, 그라디언트 플레이스홀더 이미지, 3수치 박스, 6주 타임라인 |
| 5 | WhyUs | `WhyUsSection.tsx` | 3카드(자재DB 868건 / 현직 대표 설계 / 올인원) |
| 6 | Pricing | `PricingSection.tsx` | 월/연 토글, 4플랜 카드(Free/Starter/Pro/Enterprise), Pro 하이라이트 |
| 7 | FAQ | `FAQSection.tsx` | 아코디언 5문항 |
| 8 | FinalCTA | `FinalCTASection.tsx` | 배너형 CTA |

### 3.3 카피 예시 발췌

메인 카피 3개 (`src/content/landing.ts`):

- Hero 타이틀: `"현장 5개, 카톡방 50개, 엑셀 100장 — 이제 한 곳에서."`
- Hero 서브: `"공정 매니저, 현장 톡방, 견적·계약·정산까지. 현장 하나당 화면 하나로 정리됩니다."`
- PainPoint 타이틀: `"현장이 많아질수록 사장님만 손해 보는 구조"`

### 3.4 수정 시 건드려야 할 파일

| 수정 목적 | 파일 |
|----------|------|
| 카피만 교체 | `src/content/landing.ts` (단일 파일에서 집중) |
| 섹션 순서 변경 | `src/components/landing/LandingPage.tsx` |
| metadata / OG | `src/app/page.tsx` |
| 전역 네비 | `src/components/landing/LandingNav.tsx` |
| 특정 섹션 레이아웃 | `src/components/landing/sections/<Name>Section.tsx` |
| 목업 이미지 | `src/components/landing/FeatureMockup.tsx` (스타일드 div 기반, 실사진 교체 시 여기 혹은 `<Image>` 추가) |
| 애니메이션 타이밍 | `src/components/landing/FadeIn.tsx` |
| 디자인 토큰 / 색 | `src/app/globals.css` (`--green`, `--orange` 등) |

### 3.5 구 랜딩 잔재

- `src/components/landing/LiveDemo.tsx` — 과거 인터랙티브 데모, 현재 `<LandingPage>` 에서 사용 안 함 (import 0회)
- `src/components/landing/demo-script.ts` — 동일, 미사용

---

## 4. 대시보드 현황

### 4.1 구조

`src/app/(dashboard)/dashboard/page.tsx` — 1,547라인, 클라이언트 컴포넌트. 단일 페이지에 모든 위젯 구현.

### 4.2 데이터 소스

- 주 호출: `GET /api/dashboard`
- 추가: `GET /api/dashboard/today`, `GET /api/dashboard/drilldown` (현장별 예산 비교)
- 헬스 스코어: `GET /api/health-scores` / `GET /api/sites/:id/health-score`

### 4.3 표시 위젯 (페이지 구조 순서)

1. **KPI 카드 4개**: 진행현장 / 이번달 수금(+추세) / 이번달 지출(+예산 대비) / 이번주 일정
2. **Quick Actions 2×2**: 새 프로젝트, AI 견적(`/estimates/coach`), 공정 생성(`/schedule/generator`), 지출 등록
3. **전체 메뉴 그리드 12개**: 고객, 현장, 견적, 계약, 시공, 일정, 자재, 작업자, 지출, 정산, 세무, 설정
4. **수금 요약 카드**: 이번달 수금/지출 비교, 연체 미수금
5. **Health Score 게이지**: 현장별 0–100 점수 (progressScore / budgetScore / paymentScore / issueScore / responseScore 5개 서브 점수)
6. **현장별 수익률 카드** (`projectProfits`): 저마진 현장 경고
7. **Action Items 3탭**: 미수금 연체 / 지연 공정 / 발주 필요
8. **월별 수금/지출 추이 차트**: `MonthlyTrendChart` (recharts, dynamic import, ssr:false)
9. **Recent Activity 피드**: `activity-log` 기반
10. **Upcoming Milestones**: 다가오는 결제/공정
11. **Onboarding Modal**: 첫 접속 시

### 4.4 차트 렌더링

- `recharts` 사용, Next.js 16 SSR 호환을 위해 `dynamic(() => import(), { ssr: false })` 패턴 강제 (이미 적용됨)

---

## 5. 모듈별 기존 UI 현황

각 모듈 판정: ✅있음 / ⚠️부분 / ❌없음

### 5.1 공정매니저 (간트차트, 일정 관리) — ⚠️ 부분 구현

- **관련 파일**
  - `src/app/(dashboard)/construction/page.tsx` — 공정 목록/CRUD
  - `src/app/(dashboard)/schedule/page.tsx` — 일정 캘린더 + 테이블 뷰
  - `src/app/(dashboard)/schedule/generator/page.tsx` — AI 기반 공정표 생성기 (5탭: 공정표/비용분석/발주·준비/품질체크/패키지)
  - `src/lib/schedule-engine.ts`, `src/lib/schedule-planner/engine.ts` — 스케줄 엔진
  - API: `/api/construction`, `/api/schedule`, `/api/schedule/phases`, `/api/schedule-planner/*`
- **구현된 기능**: 공정 목록, 진행률/상태/메모, 캘린더 뷰(월/주/현장별), 테이블 뷰, AI 생성기(공종별 의존성/계절/면적 기반), 공정 템플릿(엔진 내)
- **미구현**: **간트차트(horizontal Gantt UI)** 없음. 달력 + 테이블 위주. Gantt 라이브러리 미설치
- **영향 받는 파일**: `schedule/page.tsx` (간트 뷰 모드 추가 시), `construction/page.tsx` (편집 UI 연동)

### 5.2 자재·발주 관리 — ✅ 있음

- **관련 파일**
  - `src/app/(dashboard)/materials/page.tsx` (1,111라인)
  - `src/lib/materials-catalog.ts`
  - API: `/api/materials`
- **구현된 기능**: 자재 DB(868건 카탈로그), 자재 등록/수정/삭제, 발주 목록, 현장별 필터, 영수증 OCR 업로드(Pro 한정), 파싱 아이템 선택 일괄 입력
- **미구현**: 재고 관리 별도 페이지(`inventory` 테이블은 있으나 UI 없음), 발주서 PDF/이메일 발송

### 5.3 현장 손익 관리 — ✅ 있음

- **관련 파일**
  - `src/app/(dashboard)/settlement/page.tsx` — 정산 리포트
  - `src/app/(dashboard)/sites/[id]/page.tsx` 의 overview/expenses 탭
  - `src/app/(dashboard)/expenses/page.tsx` (지출과 함께)
  - API: `/api/reports/settlement`, `/api/sites/:id/budget`, `/api/dashboard/drilldown`
- **구현된 기능**: 현장별 계약금액 vs 지출 vs 수익률, 카테고리별 예산 대비 실지출, 수익률 추세, 대시보드 카드
- **미구현**: 현장별 손익 상세 PDF 출력, 다현장 손익 비교 차트

### 5.4 수금 관리 (세금계산서 알림) — ⚠️ 부분 구현

- **관련 파일**
  - `src/app/(dashboard)/contracts/page.tsx` — 계약 + 수금 현황 (착수금/중도금/잔금 payments)
  - `src/app/(dashboard)/tax/invoices/page.tsx` — 세금계산서 (43라인, placeholder 수준)
  - `src/lib/billing.ts` — 빌링 로직
  - API: `/api/unpaid`, `/api/billings`, `/api/notifications/check-payments`, `/api/contracts`
- **구현된 기능**: 미수금 요약(30/60/90일 연체), 수금률, 계약별 payments 상태, 알림 큐/큐 처리 API
- **미구현**: 세금계산서 페이지 본문이 43라인 placeholder 수준, 세금계산서 자동 발행/알림 UI 미흡. `tax/invoices/page.tsx` 가 세금계산서 리스트만 스텁
- **영향**: 세금계산서 상세 화면, 자동 알림 on/off 설정, PG 연동 확장 시 `billing.ts` / `notifications/queue.ts` 건드림

### 5.5 하자관리 — ❌ 없음 (백엔드만 존재)

- **관련 파일**
  - 백엔드: `src/app/api/defects/route.ts`, `/api/defects/[id]/route.ts`
  - 타입: `src/types/defect.ts`
  - 스키마: `defects` 테이블 (`src/lib/db/schema.ts:1085`)
  - UI: `src/app/(dashboard)/sites/[id]/page.tsx:1280` "하자" 탭이 있지만 **플레이스홀더** — "하자 관리로 이동" 링크만 존재 (`/construction?siteId=${id}&tab=defects`)
  - `RoomSidebar.tsx` 에서 `openDefectsCount` 표시만
- **구현된 기능 (백엔드)**: 하자 CRUD, severity(minor/major/critical), status(reported/in_progress/resolved/closed)
- **미구현 (프론트)**: 독립 `/defects` 페이지 없음. `/construction?tab=defects` 도 UI 연결 안 됨

### 5.6 업무일지 — ❌ 없음 (백엔드만 존재)

- **관련 파일**
  - 백엔드: `src/app/api/daily-logs/route.ts`, `/api/daily-logs/[id]/route.ts`
  - 타입: `src/types/daily-log.ts`
  - 스키마: `dailyLogs` 테이블 (`src/lib/db/schema.ts:1115`)
- **구현된 기능 (백엔드)**: 날씨(weather), 현장별/기간별 조회, CRUD
- **미구현 (프론트)**: UI 페이지/컴포넌트 전무

### 5.7 근태급여 — ⚠️ 부분 구현

- **관련 파일**
  - 백엔드: `/api/attendance`, `/api/attendance/[id]`, `/api/tax/payroll`
  - 프론트: `src/app/(dashboard)/tax/payroll/page.tsx` — 급여 관리 (347라인)
  - 스키마: `attendance` (`schema.ts:1186`), `taxPayroll` (`schema.ts:563`)
  - `src/lib/attendance-utils.ts`
- **구현된 기능**: 급여 목록 CRUD(일용직/프리랜서/정규직), 총지급액/4대보험/세액/실수령, 지급일 상태
- **미구현 (프론트)**: **근태(출퇴근) 입력 UI 없음** — `attendance` API는 있지만 `/attendance` 페이지 없음. 급여와 근태 연결 안 됨
- **영향**: 신규 `/attendance` 페이지, `/tax/payroll`에 근태 기반 자동 산출 연동

### 5.8 반장·기사 인력풀 — ⚠️ 부분 구현

- **관련 파일**
  - `src/app/(dashboard)/workers/page.tsx`, `/workers/[id]/page.tsx`
  - API: `/api/workers`, `/api/workers/[id]`
  - 스키마: `workers`, `phaseWorkers` (공정-작업자 연결)
- **구현된 기능**: 작업자 목록/상세, 직종(TRADES 상수), 전화번호, 일당, 메모, 공정별 할당
- **미구현**: 반장/기사/협력사 구분 플래그 없음, 평점/이력 없음, 가용성 캘린더 없음, 공통 인력풀(다현장 매칭) UI 없음

### 5.9 견적서 작성 — ✅ 있음

- **관련 파일**
  - `src/app/(dashboard)/estimates/page.tsx` — 목록
  - `src/app/(dashboard)/estimates/[id]/page.tsx` — 상세/편집
  - `src/app/(dashboard)/estimates/new/page.tsx` — 수동 생성
  - `src/app/(dashboard)/estimates/coach/page.tsx` — AI 견적코치 (1,709라인, 대화형)
  - `src/lib/estimate-engine.ts`
  - API: `/api/estimates/*`, `/api/estimate-coach/*`, `/api/v1/estimates`
- **구현된 기능**: 수동 견적 CRUD, 카테고리/항목/수량/단가, 공유 링크(`/estimates/shared/[token]`), 템플릿(Starter 3개/Pro 무제한), 이력(history), 비교(compare), 복제(duplicate), CSV 내보내기, AI 대화형 견적 생성, 영수증 OCR
- **미구현**: PDF 출력(현재 CSV만), 견적서 디자인 테마 커스터마이즈

### 5.10 통합 대시보드 — ✅ 있음

§4 참조. 1,547라인, 11개 위젯 블록. recharts 기반.

### 5.11 월간 리포트 — ❌ 없음

- **검색 결과**: `monthly.report`, `월간 리포트`, `monthlyReport` 전부 코드에서 0건
- **관련 자료**: 대시보드 내 `monthlyTrend` 6개월 추이 차트는 존재. 하지만 월간 리포트 페이지/자동 발송 없음
- **미구현**: 월 단위 자동 리포트 생성, PDF/이메일 발송, 이력 보관 UI
- **영향 받을 파일 (신규 추가 시)**: 신규 `/reports/monthly/*` 디렉토리, 사이드바 `Sidebar.tsx` 에 메뉴 추가, `/api/reports/monthly/*` 신규, 이메일 템플릿 `src/lib/email.ts` 확장, 크론 `cron/monitor.ts` 연동

### 5.12 추천 보상 — ❌ 없음

- **검색 결과**: `referral`, `추천 보상`, `reward` 전부 코드에서 0건 (credits 시스템만 존재 — 견적 분석 크레딧이라 별개)
- **미구현**: 초대 코드는 워크스페이스 멤버 초대에만 사용됨(`workspaces.inviteCode`), 외부 추천 보상 시스템은 전무
- **영향 받을 파일 (신규 추가 시)**: 스키마 신규 테이블(`referrals` / `referralRewards`), 신규 페이지 `/referrals/*`, 사이드바 메뉴, 결제 시스템(`billing.ts`) 할인/크레딧 연동

### 5.13 팀 권한 관리 — ✅ 있음

- **관련 파일**
  - `src/lib/workspace/permissions.ts` — 역할 계층 + 권한 매트릭스
  - `src/app/(dashboard)/settings/workspace/members/page.tsx` — 멤버 관리 UI
  - `src/components/workspace/WorkspaceProvider.tsx` — 현재 워크스페이스 상태
  - API: `/api/workspaces/[id]/members`, `/api/workspaces/[id]/permissions`, `/api/workspaces/[id]/invite-code`, `/api/workspace/invite`, `/api/workspace/join`
  - 스키마: `workspaceMembers`, `workspacePermissions`, `workspaceInvitations`
- **구현된 기능**: 5단계 역할(owner/admin/manager/member/viewer), 14개 카테고리 × 4 액션(read/write/delete/admin) 매트릭스, 멤버 목록/초대(이메일 또는 초대코드)/삭제, 사이드바에서 역할별 메뉴 필터 (`checkPermission(myRole, category, "read")`), 읽기전용 Eye 아이콘 표시
- **미구현**: **카테고리별 사용자 지정 권한 오버라이드 UI 없음** — `workspacePermissions` 테이블은 있지만 프론트에서 편집 화면 없음. 매트릭스는 코드 상수

### 5.14 공사 유형 템플릿 — ⚠️ 부분 구현

- **관련 파일**
  - `estimateTemplates` 테이블 (`schema.ts:253`) — 견적서 템플릿
  - `schedulePlans` 테이블 (`schema.ts:1046`) — 공정 계획
  - `schedule-planner/*` — 공정 엔진에 "패키지" 개념 있음 (`schedule/generator/page.tsx` TABS에 `package`)
  - API: `/api/estimates/templates`, `/api/schedule-planner/*`, `/api/schedule-planner/trades`
- **구현된 기능**: 견적 템플릿(plan별 개수 제한: Free 0, Starter 3, Pro 무제한), 공정 생성기 내 패키지 탭
- **미구현**: **"공사 유형"별 통합 템플릿**(아파트 올수리 / 상가 / 주택 리모델링 등 유형 프리셋) 없음. 견적 템플릿과 공정 템플릿이 분리되어 있고, 공사 유형으로 묶인 일괄 프리셋 부재

### 5.15 데이터 내보내기 — ⚠️ 부분 구현

- **관련 파일**
  - `src/app/api/estimates/[id]/export/route.ts` — **견적만** CSV 내보내기 (BOM + 한글 호환)
  - 프론트 내 `downloadCSV`/`exportExcel` 관련 헬퍼 검색: 0건
  - 플랜 `hasExcelExport`: Starter 이상 true
- **구현된 기능**: 견적 CSV 다운로드 (서버 측)
- **미구현**: 전역 내보내기 UI 없음. 고객/현장/계약/지출/정산 등 다른 엔티티 내보내기 API 없음. Excel(.xlsx) 없음(현재 CSV만, 헤더에 Excel 호환 BOM 포함). 정기 백업/다운로드 센터 없음

---

## 6. 공통 레이어

### 6.1 인증

- **라이브러리**: `better-auth ^1.5.6` + `drizzleAdapter`
- **설정**: `src/lib/auth.ts` — 이메일/비번(최소 8자), Google/Kakao 소셜 로그인(환경변수 있을 때만 활성)
- **클라이언트**: `src/lib/auth-client.ts` — `better-auth/react` 기반, `useSession`/`signIn`/`signUp`/`signOut` export
- **서버 API 가드**: `src/lib/api-auth.ts` — `requireWorkspaceAuth(category, action)` 헬퍼
- **라우트 가드**: `src/app/api/auth/[...all]/route.ts` — better-auth Next.js 16 호환성 이슈로 커스텀 구현. HMAC 시그니처 수동 서명 (CLAUDE.md 기록된 알려진 이슈)

### 6.2 권한 체크

- **훅**: 전용 훅 없음. 페이지마다 `useWorkspace().workspace.myRole` → `checkPermission(role, category, action)` 직접 호출
- **사이드바 필터**: `src/components/layout/Sidebar.tsx` 내 `renderNavItem` 에서 `pathToCategory` + `checkPermission` 실행
- **API 보호**: `requireWorkspaceAuth` 래퍼가 401/403 반환
- **UI 구독 가드**: `src/components/subscription/FeatureGate.tsx` — `hasFeature` 기반 차단 (플랜 기능)

### 6.3 전역 상태

- **React Context**:
  - `ThemeProvider` (다크/라이트)
  - `AuthProvider` (세션)
  - `WorkspaceProvider` (현재 워크스페이스)
  - `SubscriptionContext` (플랜/사용량) — `src/hooks/useSubscription.tsx`
- **상태관리 라이브러리**: Zustand/Jotai/Redux **없음**. Context + useState 조합만
- **서버 상태**: React Query **없음**. `fetch` + `useEffect` 패턴

### 6.4 디자인 시스템

- **Tailwind**: v4 (`@tailwindcss/postcss`), `@import "tailwindcss"` CSS 기반. **`tailwind.config.js` 파일 없음** (v4 CSS-first 설정)
- **디자인 토큰**: `src/app/globals.css` `:root` 안의 CSS 변수
  - 다크: `--background: #050505`, `--foreground: #ededed`, `--card: #111111`, `--green: #00C471`, `--orange: #FF9F43`, `--red: #FF6B6B`, `--blue: #4A9EFF`, `--muted: #888888`, `--sidebar: #0a0a0a`
  - 라이트 오버라이드(`[data-theme="light"]`)도 동일 변수명
- **폰트**: `Geist` / `Geist_Mono` (next/font/google). Pretendard 미사용
- **공통 애니메이션**: `@keyframes fade-up`, `fade-in`, `shimmer`, `pulse-glow` — globals.css 내 정의

### 6.5 이미지 업로드

- **스토리지**: Vercel Blob (`@vercel/blob ^2.3.1`) `put()` 기반
- **업로드 엔드포인트 3종**:
  - `/api/upload` — 범용 업로드
  - `/api/sites/[id]/photos` — 현장 사진
  - `/api/site-chat/upload` — 톡방 첨부 (파일명 sanitize, blob 안전 경로)
- **OCR**: `/api/analyze-receipt` (영수증), `/api/estimate-coach/parse-receipt` (견적코치)
- **음성 인식**: 없음 (SpeechRecognition/MediaRecorder/getUserMedia 코드 0건)
- **PDF 생성**: 없음 (jsPDF 미설치, CSV만 지원)

### 6.6 에러/토스트/모달 공통

- **전역 ErrorBoundary**: 없음. `src/app/(dashboard)/error.tsx` 만 존재 (Next.js segment error)
- **Toast 시스템**: 없음 — 페이지별 state 기반
- **Modal**: `src/components/ui/Modal.tsx` 포털 + 드래그 + 포커스 트랩 구현, 24곳에서 사용
- **EmptyState**: `components/ui/EmptyState.tsx`, 20곳에서 사용
- **StatusBadge**: `components/ui/StatusBadge.tsx`, 14곳
- **KPICard**: `components/ui/KPICard.tsx`, 8곳

---

## 7. 외부 라이브러리

`package.json` 실제 의존성:

### 7.1 dependencies

| 카테고리 | 패키지 | 버전 |
|---------|--------|------|
| 프레임워크 | `next` | 16.1.7 |
| | `react`, `react-dom` | 19.2.3 |
| 인증 | `better-auth` | ^1.5.6 |
| DB | `drizzle-orm` | ^0.45.1 |
| | `@neondatabase/serverless` | ^1.0.2 |
| 스토리지 | `@vercel/blob` | ^2.3.1 |
| AI | `@anthropic-ai/sdk` | ^0.80.0 |
| 스크래핑 | `cheerio` | ^1.2.0 |
| 차트 | `recharts` | ^3.8.0 |
| 아이콘 | `lucide-react` | ^0.577.0 |
| 애니메이션 | `framer-motion` | ^12.38.0 |
| 이메일 | `resend` | ^6.12.0 |
| 스키마 검증 | `zod` | ^4.3.6 |

### 7.2 devDependencies

| 용도 | 패키지 |
|------|--------|
| CSS | `tailwindcss` ^4, `@tailwindcss/postcss` ^4 |
| 테스트 | `vitest` ^4.1.4 |
| 드리즐 | `drizzle-kit` ^0.31.9 |
| DB(로컬) | `pg` ^8.20.0 |
| 기타 | `typescript` ^5, `eslint` ^9, `eslint-config-next` 16.1.7, `dotenv` ^17.3.1 |

### 7.3 부재 (최종 권장안 추가 시 도입 필요 가능성)

| 기능 | 현재 | 필요 시 후보 |
|------|------|-----------|
| UI 라이브러리 | Radix/shadcn **없음** (native + tailwind) | shadcn/ui, Radix primitives |
| 간트차트 | 없음 | `dhtmlx-gantt`, `@wojtekmaj/react-daterange-picker`, `frappe-gantt`, 또는 직접 구현 |
| PDF 생성 | 없음 | `pdf-lib`, `jspdf`, `@react-pdf/renderer` |
| Excel(.xlsx) | CSV만 | `exceljs`, `xlsx` |
| 음성 | 없음 | Web Speech API 또는 Whisper API |
| 서버 상태 | 없음 | TanStack Query |
| 토스트 | 없음 | `sonner`, `react-hot-toast` |
| 폼 | native | `react-hook-form` + `@hookform/resolvers/zod` |

---

## 8. 잠재 충돌 포인트

### 8.1 컴포넌트 네이밍 충돌 우려

| 기존 이름 | 충돌 가능 영역 |
|----------|----------------|
| `KPICard` | 월간 리포트에 KPI 카드 추가 시 — 기존 것이 `color`/`trend`/`href` 받으므로 재사용 가능 |
| `Modal` | 신규 모달은 기존 `<Modal>` 재사용 권장 (이미 24곳에서 사용) |
| `EmptyState` | 동일, 재사용 |
| `FadeIn` | 랜딩 전용이지만 대시보드에서도 import 가능 |
| `LandingPage` | 파일명이므로 충돌 없음 |

### 8.2 라우트 충돌 가능성

| 추가 예정 경로 | 기존 사용 여부 | 결론 |
|---------------|-------------|------|
| `/reports/monthly` | 없음 | 안전 |
| `/defects` | 없음 (백엔드 API만) | 안전 |
| `/daily-logs` | 없음 | 안전 |
| `/attendance` | 없음 | 안전 |
| `/referrals` | 없음 | 안전 |
| `/templates` (공사 유형) | **`/estimates/templates` API 존재** | `/project-templates` 또는 `/work-types` 권장 |
| `/exports` | 없음 | 안전 |
| `/settings/permissions` | `/settings/workspace/members` 존재 | 하위 경로 `settings/permissions` 별도 페이지로 가능 |

### 8.3 디자인 토큰 / 스타일 충돌

- CSS 변수가 글로벌 하나뿐이므로 **추가 색 도입 시 globals.css `:root`와 `[data-theme="light"]` 두 곳 동시 수정 필수**
- 랜딩에서 새로 쓴 `#d3a777`(베이지), `#2d3c64`(네이비)는 현재 **인라인 gradient로만 존재**, 토큰화 안 됨. 대시보드 모듈에 같은 톤 쓰려면 토큰화 필요
- Tailwind v4 CSS-first 설정이라 `tailwind.config.ts` 대신 CSS `@theme` 블록 확장 방식

### 8.4 권한 매트릭스 확장 충돌

- `Category` 타입은 14개 고정 리터럴 유니온(`src/lib/workspace/permissions.ts:3-17`). 신규 모듈(`reports`, `defects`, `dailyLogs`, `attendance`, `referrals`, `exports`, `templates`) 추가 시:
  - `Category` 타입 확장
  - `PERMISSION_MATRIX` 에 역할별 기본 권한 5줄 추가
  - `pathToCategory` 맵에 경로 추가
  - `Sidebar.tsx`의 `NAV_GROUPS` 에 메뉴 추가 (사이드바는 이미 그룹 단위: operations / money / tools)
- 해당 기능 UI 접근 가드 배치하지 않으면 매트릭스는 자동 적용되지 않음

### 6 어수선 방지를 위한 기존 패턴 강제

- 대시보드 페이지들은 모두 `"use client"` 최상단, `useState` + `useEffect(fetch)` + apiFetch 사용 패턴 **반복** — 신규 페이지도 동일 패턴 유지 권장
- 폼 상태는 `useState({...form})` + 수동 onChange. react-hook-form 도입 시 기존 페이지와 혼재 주의

### 8.5 랜딩 – 대시보드 분리

- 랜딩(`src/app/page.tsx`, `LandingPage.tsx`, `LandingNav.tsx`) 은 `Sidebar`/`Header`/`AuthProvider`를 쓰지 않음
- 랜딩에서만 쓰는 `FadeIn`/`MockupFrame`/`FeatureMockup` 을 대시보드로 끌어올 경우 import 경계 흐려질 수 있음 — `/src/components/landing/` 폴더 밖으로 이동하거나 `/components/ui/` 로 일반화 필요

### 8.6 Next.js 16 특이 이슈 (CLAUDE.md 기록 반영)

- `auth.handler()` / `toNextJsHandler()` 깨짐 → 수동 route handler 유지 필수
- `recharts` 는 `dynamic(..., { ssr: false })` 필수 (이미 적용됨)
- `drizzleAdapter` 에 `schema` 인자 필수

### 8.7 데이터 내보내기 추가 시

- 이미 견적 CSV는 서버사이드(`/api/estimates/[id]/export`) 구현. 다른 엔티티에 같은 패턴 확장 가능
- 프론트에서 zip 묶기 / 여러 포맷(xlsx, pdf) 지원하려면 새 라이브러리 도입 불가피

### 8.8 미사용 잔재 파일

- `src/components/landing/LiveDemo.tsx`, `src/components/landing/demo-script.ts` — 현재 import 0. 삭제 여부 판단 필요 (이번 보고서에선 변경 금지)

---

## 9. 최종 권장안 대비 GAP 분석 표

| 모듈 | 현재 상태 | 미구현 부분 | 추가 영향 |
|------|---------|------------|-----------|
| 공정매니저(간트차트) | ⚠️ 부분 | 간트 뷰 모드, Gantt 라이브러리 | `schedule/page.tsx`, `construction/page.tsx`, package.json, 사이드바 |
| 자재·발주 | ✅ 있음 | 발주서 PDF/이메일, 재고 독립 페이지 | `materials/page.tsx`, `/api/materials`, 이메일 템플릿 |
| 현장 손익 | ✅ 있음 | 손익 PDF 출력, 다현장 비교 뷰 | `settlement/page.tsx`, `/api/reports/settlement`, PDF 라이브러리 |
| 수금관리 (세금계산서 알림) | ⚠️ 부분 | 세금계산서 페이지 placeholder, 자동 알림 설정 UI | `tax/invoices/page.tsx`, `/api/billings`, `notifications/queue.ts` |
| 하자관리 | ❌ 프론트 없음 | 독립 페이지, 현장별 탭 실제 구현 | 신규 `/defects/*`, `sites/[id]/page.tsx` 탭 교체, 사이드바 |
| 업무일지 | ❌ 프론트 없음 | 독립 페이지, 현장 상세 연동 | 신규 `/daily-logs/*`, `sites/[id]/page.tsx`, 사이드바 |
| 근태급여 | ⚠️ 부분 | 근태 입력 UI, 급여-근태 연동 | 신규 `/attendance/*`, `tax/payroll/page.tsx` 확장 |
| 반장·기사 인력풀 | ⚠️ 부분 | 역할 구분, 평점/이력, 가용성 | `workers/page.tsx`, `workers/[id]/page.tsx`, 스키마 확장 |
| 견적서 작성 | ✅ 있음 | PDF 출력, 디자인 테마 | `estimates/[id]/page.tsx`, `/api/estimates/[id]/export`, PDF 라이브러리 |
| 통합 대시보드 | ✅ 있음 | — | (본 과업 외) |
| 월간 리포트 | ❌ 없음 | 페이지/자동 생성/이메일 발송 | 신규 `/reports/monthly/*`, `/api/reports/monthly/*`, `email.ts`, 크론, 사이드바 |
| 추천 보상 | ❌ 없음 | 전체 | 신규 `/referrals/*`, 스키마 신규 테이블, 결제 할인 연동, 사이드바 |
| 팀 권한 관리 | ✅ 있음 | 카테고리별 오버라이드 편집 UI | `settings/workspace/members/page.tsx` 또는 신규 `settings/permissions`, `/api/workspaces/[id]/permissions` |
| 공사 유형 템플릿 | ⚠️ 부분 | 유형별 통합 프리셋(견적+공정+자재 묶음) | 신규 `/project-templates` 또는 `/work-types`, `estimateTemplates`/`schedulePlans` 확장, 사이드바 |
| 데이터 내보내기 | ⚠️ 부분 | 전역 내보내기 UI, 다엔티티, xlsx/PDF | 신규 `/exports` 센터, `/api/*/export` 다수, `exceljs` 등 라이브러리 |

---

## 10. 추가 작업 시 주의 사항

### 10.1 아키텍처 일관성

1. **클라이언트 컴포넌트 기본**: 모든 대시보드 페이지는 `"use client"` + `useState` + `useEffect(fetch via apiFetch)`. 새 페이지도 동일 패턴 유지 권장.
2. **API 가드**: 모든 보호 API 라우트는 `requireWorkspaceAuth(category, action)` 래퍼 시작. 신규 카테고리 추가 시 `permissions.ts`의 `Category` 타입·매트릭스·`pathToCategory` 3곳 동시 수정.
3. **응답 포맷**: `ok(...)` / `err(...)` / `serverError(...)` / `notFound(...)` 헬퍼 (`src/lib/api/response.ts`) 사용.

### 10.2 디자인 토큰

4. **색 토큰 추가** 시 `globals.css` `:root` + `[data-theme="light"]` 두 블록 모두 기재. 신규 색은 `--color-name` 네이밍 유지.
5. **Tailwind v4 CSS-first**: `tailwind.config.ts` 만들지 말 것. `@theme` 블록으로 확장.
6. **랜딩 전용 색**(베이지 `#d3a777`, 네이비 `#2d3c64`)이 현재 인라인 하드코딩됨. 대시보드에서 같은 톤 쓸 경우 토큰화 먼저.

### 10.3 Next.js 16 호환

7. `recharts` / 클라이언트 전용 DOM 의존 컴포넌트는 `dynamic(..., { ssr: false })` 필수. (대시보드에 이미 적용)
8. better-auth `toNextJsHandler()` 깨짐 — 기존 수동 핸들러 패턴(`src/app/api/auth/[...all]/route.ts`) 유지. HMAC 쿠키 서명 로직 건드리지 말 것.

### 10.4 공통 UI 재사용

9. 새 모달은 `<Modal>` 재사용. 새로 만들지 말 것.
10. 빈 상태는 `<EmptyState icon={...} title=... description=... action={...} />`.
11. 상태 배지는 `<StatusBadge>`. KPI 카드는 `<KPICard>` (이미 `trend`/`color`/`href`/`warning` 지원).
12. 한글 입력 필드는 반드시 `<KoreanInput>` / `<KoreanTextarea>`. native `<input>` 로 한글 타이핑 시 IME 버그 발생 확인됨 (파일 내 주석).

### 10.5 부재 인프라 — 신규 라이브러리 도입 전 검토

13. Toast / ErrorBoundary / 서버 상태 관리 / 폼 라이브러리 모두 부재. 새 기능을 위해 도입하면 기존 페이지와 혼재 발생 → 전역 적용할지 국소 적용할지 사전 결정 필요.
14. PDF / Excel / 간트 라이브러리 선정 시 번들 사이즈 고려. `next/dynamic` 으로 code-split 권장.

### 10.6 권한 확장

15. 카테고리 신설 시 5단계 역할 각각의 read/write/delete/admin 초기값 설계 필요. `workspacePermissions` 테이블에 오버라이드 저장 가능하지만 편집 UI는 현재 없음.
16. 사이드바는 `checkPermission(myRole, category, "read")` 결과에 따라 자동 숨김. 따라서 신규 모듈의 `pathToCategory` 매핑 누락 시 **모든 역할에 대해 항상 노출** 되는 사이드 이펙트 발생.

### 10.7 잔재 파일 / 중복

17. `src/components/landing/LiveDemo.tsx`, `demo-script.ts` — 현재 사용처 0. 이번 과업 범위가 아니므로 그대로 둠.
18. `estimates/builder/page.tsx` (7라인)도 스텁 상태.
19. `tax/invoices/page.tsx` (43라인)은 거의 비어있음 — 수금관리 모듈 작업과 겹침.

### 10.8 라우트 네이밍

20. `/templates` 루트는 `/api/estimates/templates` 와 혼동 여지 있음. 공사 유형 템플릿은 `/work-types` 또는 `/project-templates` 권장.
21. 신규 사이드바 그룹 추가 시 기존 3그룹(operations / money / tools)에 편입하거나 새 그룹 추가 고려.

### 10.9 모바일 대응

22. Sidebar는 md 이하에서 하단 고정 탭바(`MOBILE_TABS` 5개)로 전환됨. 신규 모듈 모바일 접근성 확보 시 `MOBILE_TABS` 또는 "더보기" 드로어 확장 필요.
23. 대시보드 페이지들은 이미 모바일 반응형. 신규 페이지도 375px 이상에서 깨지지 않도록 확인.

### 10.10 이미지/파일 업로드

24. Vercel Blob 기반. 신규 업로드가 필요한 기능(월간 리포트 PDF, 하자 사진 등)은 기존 `/api/upload` 패턴 재사용 또는 엔티티별 전용 엔드포인트 추가.
25. 파일명 XSS sanitize 이미 적용됨 (`site-chat/upload/route.ts` 참고).

### 10.11 빌드 안정성

26. 모듈 로드 시점에 환경변수 의존 인스턴스를 즉시 생성하지 말 것 (`Resend` 같은 경우 빌드 타임 크래시 발생 사례 있음 — 지연 초기화 패턴 사용).

### 10.12 테스트

27. `vitest` 설치됨. 기존 테스트: `src/__tests__/ai-helpers.test.ts`, `estimate-engine.test.ts`, `validate.test.ts`, `ai-rate-limit.test.ts` 등. 신규 모듈도 도메인 로직은 unit test 작성 가능.

---

조사 완료. 코드 변경 없음.
