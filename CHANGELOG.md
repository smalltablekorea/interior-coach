# Changelog — refactor/v2-landing-and-modules

브랜치: `refactor/v2-landing-and-modules` · main 직접 푸시 금지.

---

## 2026-04-21 — Part 0 · A · B · C

### Part 0 — 브랜치 분리
- main에서 `refactor/v2-landing-and-modules` 분기 생성.
- 작업 시작 시 워킹트리에 있던 미커밋 백엔드 변경(`auth route`, `api-auth`, `validate`, `schema`, `vercel.json`)은 stash@{0}로 보존.

### Part A — 철거 (프론트엔드)

**삭제된 페이지**
- `src/app/(dashboard)/chat/page.tsx` — 현장 톡방 리스트
- `src/app/(dashboard)/projects/[id]/chat/page.tsx` — 현장 톡방 상세 (상위 `projects/` 폴더째 제거)
- `src/app/p/[slug]/page.tsx` — 고객 포털 v2 (상위 `p/` 폴더째 제거)
- `src/app/portal/[token]/page.tsx`, `src/app/portal/[token]/layout.tsx` — 고객 포털 v1 (상위 `portal/` 폴더째 제거)

**삭제된 컴포넌트**
- `src/components/site-chat/` 디렉토리 전체 — ChatComposer / ChatMessage / ChatMessageList / ClientPortalToggle / RoomSidebar / types.ts
- `src/components/onboarding/FirstRoomChecklist.tsx`, `SampleRoomBanner.tsx`
- `src/components/landing/LiveDemo.tsx`, `demo-script.ts` (import 0회 잔재)

**수정된 파일**
- `src/app/(dashboard)/sites/[id]/page.tsx`
  - 탭 배열을 9개 → 5개로 축소 (`overview`, `construction`, `materials`, `expenses`, `defects`)
  - 우상단 "톡방" 바로가기 버튼 제거
  - dead code(workers/photos/estimates/contracts 탭 렌더 블록)는 이번 커밋에서 제거하지 않고 tabs 배열에서만 빠뜨림 → 탭 접근 불가. 추후 Part D-O에서 일괄 삭제 예정

**보존 (task 스코프: 프론트엔드 철거만)**
- 백엔드 `src/lib/site-chat/{pinned-summary,utils}.ts` 유지 (construction/[id] route에서 import 중)
- 백엔드 API `/api/site-chat/**`, `/api/portal/**`, `/api/portal-v2/**` 유지
- `site_chat_*`, `signature_requests`, `customer_portal_tokens` 등 DB 스키마 유지

### Part B — 가격 3티어 전환 (랜딩만)

**변경**
- `src/content/landing.ts` `pricing.plans`
  - Free / Starter(₩29k) / Pro(₩69k) / Enterprise → 무료 / 월간 결제(₩79k) / 연간 결제(₩790k)
  - 연간 결제에 `"가장 인기"` 배지, highlight=true
- `src/components/landing/sections/PricingSection.tsx` 재작성
  - 기존 month/year 토글 제거 (월간·연간이 이제 별도 플랜이므로 의미 상실)
  - `lg:grid-cols-4` → `lg:grid-cols-3`
  - 각 플랜 `priceLabel()` 헬퍼로 표시 (무료 / 월간 ₩ + `/월` / 연간은 월 환산가 + 연 합계 서브텍스트)
- FAQ Q3 교체: 고객 포털 설치 문의 → 모바일 대응 문의로 (포털 제거 반영)

**미변경 (구독·결제 시스템 영향으로 범위 초과)**
- `src/lib/plans.ts` — `PlanId = "free"|"starter"|"pro"` 런타임 ID 유지
- `src/app/pricing/page.tsx` (대시보드 밖 공개 페이지) — `PLANS` 상수 의존, 런타임 플랜 ID 리네이밍 후속 작업
- `src/components/subscription/PlanBadge.tsx`, `UpgradeModal.tsx` — 동일 사유
- TODO: 마케팅 봇 최종 카피 도착 후 `lib/plans.ts` + 구독 마이그레이션 계획 별도 PR로 분리

### Part C — 랜딩 Features 재구성 (4 + 8)

**Features 블록 확장**: 4개 → 12개
- 기존 4 유지: 공정 매니저 / 견적코치 AI / 지출·정산 리포트 / 자재 발주·재고
  - 톡방 블록 & 계약·전자 서명 블록 2개는 Part A와 함께 삭제
- 신규 8 (모두 `isNew: true`): 현장 손익 / 세금계산서 / 하자관리 / 업무일지 / 근태급여 / 반장·기사 인력풀 / 월간 리포트 / 공사 유형 템플릿

**FeatureMockup 재작성**: `src/components/landing/FeatureMockup.tsx`
- 삭제된 목업: `chat`, `contract`
- 신규 목업 8종: `pnl`, `invoice`, `defects`, `dailyLog`, `attendance`, `workers`, `monthly`, `templates` — 모두 스타일드 div + 더미 데이터 (기존 패턴)

**FeaturesSection**: `src/components/landing/sections/FeaturesSection.tsx`
- `isNew` 플래그 있는 블록에 오렌지 NEW 배지 렌더링 추가
- FEATURE 번호 2자리 패딩 (01, 02, … 12)

**Hero 섹션**: `src/components/landing/sections/HeroSection.tsx`
- 우측 합성 목업 교체: `schedule` + `chat` → `pnl` + `dailyLog`

**카피**: `src/content/landing.ts` `features.eyebrow` "6가지" → "12가지"

### 빌드 결과

- `npm run build` 성공
- 빌드 산출물에서 `/chat`, `/portal/[token]`, `/p/[slug]`, `/projects/[id]/chat` 라우트 제거 확인
- 프론트엔드(src/components, src/app/(dashboard) 범위) 기준 `ClientPortalToggle|RoomSidebar|FirstRoomChecklist|SampleRoomBanner|LiveDemo|demo-script` grep 0건

### 남은 과제 (Part D–O)

별도 세션에서 진행:
- Part D: 하자관리 UI (백엔드 API 완비)
- Part E: 업무일지 UI (백엔드 API 완비)
- Part F: 근태 UI + tax/payroll 연동
- Part G: 반장·기사 인력풀 확장
- Part H: 세금계산서 페이지 완성 + 알림
- Part I: 월간 리포트
- Part J: 공사 유형 템플릿
- Part K: 추천 보상
- Part L: 간트차트 뷰
- Part M: 현장 손익 강화
- Part N: 데이터 내보내기
- Part O: OCR UI 점검

위 Parts는 실질적인 신규 페이지/컴포넌트 작성이 필요해 세션당 2–3개가 현실적 범위.

### 후속 클린업 메모

- `src/app/(dashboard)/sites/[id]/page.tsx` dead code (workers/photos/estimates/contracts 탭 렌더 블록 ≈ 200~400라인) 제거
- `lib/plans.ts` 런타임 플랜 ID와 랜딩 카피 정합 (무료/월간/연간으로 통일)
- `src/app/pricing/page.tsx` 랜딩 pricing 구조와 일치시키기
- `UpgradeModal`/`PlanBadge` 3종 표기로 단순화
