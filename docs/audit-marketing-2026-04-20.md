# 인테리어코치 마케팅·브랜딩 현황 조사 보고서

> 작성일: 2026-04-20
> 목적: 랜딩 카피·브랜딩 가이드·SEO 콘텐츠 추가 작업 착수 전 **기존 자산 전수 조사**. 중복/누락 방지.
> 범위: 파일 수정·추가·삭제 금지. 읽기·조사만 수행. 주관적 카피 제안 포함하지 않음(사실 수집).
> 조사 대상:
> - 로컬 레포: `/Users/justin/클로드코드 지난거/인테리어코치`
> - 배포 사이트: `https://interior-coach-deploy.vercel.app`

---

## 1. 현재 랜딩페이지 스냅샷

> 출처: 배포 사이트(WebFetch) + 로컬 `src/content/landing.ts`
> 로컬 `src/app/page.tsx`는 `@/components/landing/LandingPage` 를 렌더. 실제 카피는 `landing.ts` 상수에서 옴.

### 1-1. 섹션 구성 (순서대로)

1. Nav
2. Hero
3. Pain Points (4 카드)
4. Features (6 블록)
5. Case Study (잠실르엘)
6. Why Us (3 카드)
7. Pricing (4 플랜)
8. FAQ (5 문항)
9. Final CTA

### 1-2. Hero 카피 (`landingCopy.hero`)

| 슬롯 | 카피 |
|---|---|
| Eyebrow | `인테리어 업체 현장 운영 올인원 SaaS` |
| Title (2줄) | `현장 5개, 카톡방 50개,` / `엑셀 100장 — 이제 한 곳에서.` |
| Subtitle | `공정 매니저, 현장 톡방, 견적·계약·정산까지.` / `현장 하나당 화면 하나로 정리됩니다.` |
| Primary CTA | `14일 무료 시작` → `/auth/signup` |
| Secondary CTA | `데모 신청` → `/demo-request` |
| Meta line | `카드 등록 불필요 · 2분 만에 첫 현장 등록` |

### 1-3. Pain Points (`landingCopy.painPoints`)

- Eyebrow: `이런 현장, 익숙하시죠`
- Title: `현장이 많아질수록 / 사장님만 손해 보는 구조`
- 4 카드:
  1. 카톡방이 폭발 — "현장마다 단톡, 자재상 톡, 고객 톡. 어느 방에 뭐가 있었는지 기억이 안 납니다."
  2. 엑셀이 버전 지옥 — "공정표_최종_진짜최종_v3.xlsx. 누가 뭘 고쳤는지 추적이 불가능합니다."
  3. 밤 11시에 울리는 전화 — "오늘 공정 어디까지 갔냐는 고객 문의. 사장님이 일일이 답하고 있습니다."
  4. 돈 흐름이 안 잡힘 — "받을 돈, 나갈 돈, 남는 돈. 월말에야 통장 보고 계산합니다."

### 1-4. Features (6 블록, 순서대로)

| # | 이름 | 문제 (problem) | 해결 (solution, 요약) |
|---|---|---|---|
| 1 | 공정 매니저 | 엑셀 공정표는 공유 즉시 구버전 | 현장별 공정 타임라인, 완료 체크→고객 포털 자동 반영 |
| 2 | 현장 톡방 + 고객 포털 | 카톡방에 고객·작업자·자재상 뒤섞임 | 현장당 톡방 1개, 고객은 별도 포털 |
| 3 | 견적코치 AI | 견적서 반나절 | 자재 단가 DB 868건 기반 AI 견적, PDF 자동 |
| 4 | 계약·전자 서명 | 도장 받으러 다님 | 링크 한 번, 모바일 서명, 이력 자동 보관 |
| 5 | 지출·정산 리포트 | 남는 돈 월말에야 확인 | 영수증 OCR, 카테고리 자동 분류, 현장별 원가율·수익률 실시간 |
| 6 | 자재 발주·재고 | 종이 장부 | DB 발주서 1분, 현장별 자재 투입량 자동 집계 |

### 1-5. Case Study

- 타이틀: `잠실르엘 리모델링` (32평 전체 리모델링, 공정 6주)
- Stats 3개: 계약 금액 `4,800만원` / 공사 기간 `6주` / 공정 진행률 `100%`
- Timeline 6주차(1주차~6주차) 각 라벨 포함.

### 1-6. Why Us (3 카드)

- 자재 단가 DB 868건 — "실제 공급가 기반 DB. 견적·발주·원가 계산이 같은 소스."
- 현직 인테리어 대표 설계 — "실제 현장을 10년 넘게 돌린 대표가 직접 설계. SaaS 기획자가 상상한 워크플로우가 아님."
- 견적부터 정산까지 올인원 — "툴 5개를 하나로 통합. 구독료·학습 비용·전환 스트레스 감소."

### 1-7. Pricing — 4 티어 (`landingCopy.pricing.plans`)

| 플랜 | 월 | 연 | 태그라인 | 주요 포함 | CTA | 강조 |
|---|---|---|---|---|---|---|
| Free | 0 | 0 | 혼자 운영하는 1인 사장님 | 현장 1 · 고객 5 · 기본 견적/계약 · 커뮤니티 지원 | 무료로 시작 | — |
| Starter | ₩29,000 | ₩290,000 | 작은 업체 · 팀원 2~3명 | 현장 10 · 팀원 3 · 견적코치 AI 월 20 · 고객 포털 · 이메일 지원 | 14일 무료 시작 | — |
| Pro | ₩69,000 | ₩690,000 | 성장 중인 업체 | 현장 무제한 · 팀원 10 · AI 월 100 · 자재/작업자 · 마케팅 자동화 · 우선 지원 | Pro 시작하기 | `highlight: true`, 배지 `가장 인기` |
| Enterprise | null | null | 다현장 · 지점 운영 | 현장/팀원 무제한 · 전담 매니저 · 데이터 마이그레이션 · 맞춤 교육 · SLA | 상담 요청 | — |

- 서브 타이틀: `모든 플랜 14일 무료 · 카드 등록 불필요`

### 1-8. FAQ (5 문항)

| # | 질문 | 답변 요약 |
|---|---|---|
| 1 | 14일 무료 체험은 정말 카드 등록 없이 되나요? | 이메일만, 14일 후 자동 결제 안 됨 |
| 2 | 기존 엑셀·카톡 데이터 옮길 수 있나요? | Starter+: CSV / Pro+: 전담 마이그레이션 |
| 3 | 고객이 별도 앱 설치? | 아니요. 모바일 웹 링크 |
| 4 | 현장에서 인터넷 안 되면? | 오프라인 임시 저장, 연결 시 자동 동기화 |
| 5 | 플랜 변경·해지 가능? | 언제든 버튼 한 번 |

### 1-9. Final CTA

- 타이틀: `오늘 현장 등록, 내일 바로 쓰실 수 있습니다`
- 서브: `14일 무료. 카드 등록 불필요. 해지는 버튼 한 번. 먼저 써보시고 결정하셔도 늦지 않습니다.`
- Primary: `14일 무료 시작` → `/auth/signup` / Secondary: `데모 신청` → `/demo-request`

### 1-10. Nav / Footer

- Nav 링크: 기능(`#features`) · 케이스(`#case`) · 요금제(`#pricing`) · FAQ(`#faq`) / 로그인 / 14일 무료 시작
- Footer (배포 사이트 기준): `© 2026 인테리어코치 · 스몰테이블디자인그룹`

---

## 2. 현재 브랜딩 자산

### 2-1. 로고 파일

- `/public/` 내 **실제 로고 이미지 파일 없음**. 기본 Next.js 자산만 존재:
  - `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- `favicon.ico` / `apple-touch-icon.png` / 브랜드 전용 PNG·SVG **없음**.
- `docs/brand-guidelines.md` §5 "로고 사용 가이드"에 **텍스트 명세만** 존재:
  - 구성: 녹색(`#00C471`) rounded-lg 사각형 + 흰색 Bold "IC" + "인테리어코치" 텍스트
  - 풀 로고 / 아이콘만(IC 뱃지) / 텍스트만 3버전 정의
- 사이드바(`src/components/layout/Sidebar.tsx`)에서 로고는 **텍스트 렌더**: 워크스페이스명 또는 "인테리어코치" (첫 글자 "I")

### 2-2. 폰트

- 실제 로드 중인 폰트 (`src/app/layout.tsx`): `Geist` + `Geist_Mono` (Google Fonts via `next/font/google`)
  - CSS 변수: `--font-geist-sans`, `--font-geist-mono`
  - body 기본: `var(--font-sans)` = Geist
- `docs/brand-guidelines.md` §4 에 명세된 폰트 계획:
  - 메인: **Pretendard Variable** (H1/H2/H3/Body/Caption/Badge 각 크기·웨이트 규정)
  - 광고 임팩트: Black Han Sans
  - 광고 본문: Paperlogy
- ⚠️ **괴리**: 가이드는 Pretendard이나 실제 코드는 Geist. Pretendard 로딩 설정 없음.

### 2-3. 컬러 (`src/app/globals.css` `:root` 기준, 다크 = 기본)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--background` | `#050505` | 페이지 배경 |
| `--foreground` | `#ededed` | 기본 텍스트 |
| `--card` | `#111111` | 카드 배경 |
| `--card-hover` | `#1a1a1a` | 카드 호버 |
| `--border` | `rgba(255,255,255,0.08)` | 테두리 |
| `--green` | `#00C471` | Primary CTA / 강조 |
| `--green-hover` | `#00d67e` | Primary hover |
| `--orange` | `#FF9F43` | — |
| `--red` | `#FF6B6B` | 경고/에러 |
| `--blue` | `#4A9EFF` | 보조 |
| `--muted` | `#888888` | 보조 텍스트 |
| `--sidebar` | `#0a0a0a` | 사이드바 배경 |

- 라이트 테마 변수는 `[data-theme="light"]` 블록에 별도 정의(배경 `#f8f9fa`, `--green` `#00A85E` 등).
- `docs/brand-guidelines.md` 명세 값과 일부 토큰 차이:
  - 가이드 `--background` `#0A0A0A` vs 실제 `#050505`
  - 가이드 `--card` `#141414` vs 실제 `#111111`
  - 가이드 `--blue` `#3B82F6` vs 실제 `#4A9EFF`
  - 가이드 `--amber` `#F59E0B` 는 코드에 **없음** (코드는 `--orange` `#FF9F43`)
- 컬러 사용 비율(가이드 기준): Green 20% / Dark 60% / White 15% / Accent 5%

### 2-4. 디자인 톤 (시각 기준)

- 다크 테마 기본 + 라이트 토글(`ThemeProvider` 존재).
- 컴포넌트 스타일: rounded-2xl / rounded-xl 라운딩, 반투명 테두리, 섹션별 `bg-white/[0.02]` 교차.
- 모션: `fade-up`, `fade-in`, `shimmer`, `pulse-glow` 키프레임 정의.
- 전반 인상(코드 기반): 미니멀·다크·프로덕트-테크 SaaS 룩. 인테리어/건축 업계의 전통적 "따뜻한 감성"보다 **툴·플랫폼 톤**에 가까움.

---

## 3. 기존 카피 리소스

### 3-1. 디렉토리

- ❌ `/content` 폴더 **없음**.
- ✅ `src/content/landing.ts` — 랜딩 카피 단일 상수 파일 (249줄, `landingCopy` export).
- 기타 하드코딩 카피는 각 페이지·컴포넌트(`src/app/page.tsx`, `src/components/landing/*`, `src/components/onboarding/WelcomeModal.tsx` 등)에 산재.

### 3-2. 문서 형태 카피/가이드 자산 (`docs/`)

| 파일 | 내용 요지 |
|---|---|
| `docs/brand-guidelines.md` | 브랜드 에센스·보이스·컬러·타이포·로고·레이아웃 전반 (v1.0 · 2026-03-23) |
| `docs/brand-consistency-checklist.md` | 브랜드 일관성 점검 체크리스트 |
| `docs/brand-content-review.md` | 브랜드 아이덴티티 + 콘텐츠 전략 + 전략 리뷰 |
| `docs/microcopy-guide.md` | 대시보드 UI 마이크로카피 (인사말·빈 상태·로딩 등, key 부여) |
| `docs/acquisition-strategy.md` | 획득 전략 |
| `docs/customer-funnel-strategy.md` | 전환 퍼널 전략 |
| `docs/content-calendar.md` | 4주 콘텐츠 캘린더 (채널별 발행 빈도 표 포함) |
| `docs/gongjungpyo-marketing-strategy.md` | 공정표 마케팅 전략 |
| `docs/payment-collection-patterns.md` | 수금 패턴 |
| `docs/portal-marketing-branding.md` | 고객 포털 포지셔닝·랜딩 카피·캘린더·경쟁 차별화 매트릭스 |
| `docs/infrastructure-positioning-strategy.md` | "필수 인프라" 포지셔닝 전략 Part 1-2 |
| `docs/infrastructure-strategy-part3-5.md` | 동 전략 Part 3-5 + 타겟 세분화 + 가격(Lite 4.9만 신설 제안) |
| `docs/seo-keywords.md` | SEO 키워드 50개(핵심 10 + 롱테일 20 + B2B 등) |
| `docs/ir-one-pager.md` | IR용 1-pager |
| `docs/sharktank-script.md` | 샤크탱크 스크립트 |
| `docs/saas-wtp-b2b-strategy.md` | B2B WTP 전략 |

> 산출물 형태의 상세 분석/리뷰 자산은 추가로 `docs/research/`, `docs/plans/`, `docs/qa-strategy/` 서브 폴더에 존재(본 조사는 상위 파일명 인덱스까지만 확인).

### 3-3. 분석 자산(참고, 외부 `/Users/justin/Projects/analysis/`)

- `인테리어코치_경쟁사분석.md` (16,967 B)
- `인테리어코치_랜딩페이지_리뉴얼.md` (13,992 B) — 프런트/백/마케팅 3봇 프롬프트 스펙 문서
- `인테리어코치_랜딩_카피_브랜드_v1.md` — 2026-04-20 작성 리뉴얼 산출물(이번 조사 대상 밖, 별도)
- `견적코치_경쟁사분석.md` (견적코치 자산, **혼동 금지**)

---

## 4. 기존 마케팅 콘텐츠 (인테리어코치 전용)

### 4-1. 네이버 블로그

- **발행된 URL 목록 — 이번 로컬 조사 범위에서는 확인되지 않음**(`docs/` 내 URL 언급 없음).
- 초안 문서: `docs/blog-naver-3posts.md` — 대시보드 v2 출시 마케팅 3편:
  1. "인테리어 현장 하자, 엑셀 말고 앱으로 관리하세요"
  2. (문서에 포스트 2, 3 존재)
  3. (동)
- 추가 블로그 글 파일은 발견되지 않음.

### 4-2. Threads / 인스타

- `docs/threads-build-in-public.md` — 계정 **@realzeroto1**, 빌드인퍼블릭 5편 초안:
  1. 대시보드 v2 출시 발표
  2. (본 조사에선 1편 내용만 샘플 확인)
- `docs/content-calendar.md`에 4주치 발행 플랜 정의:
  - Threads 주 5회 (4주 = 20건)
  - Instagram 스토리 주 2회 (8건)
  - Instagram 릴스 주 1회 (4건)
  - 네이버 블로그 주 2회 (8건)
- 실제 발행 URL·수행 이력은 로컬 문서에서 확인되지 않음(드래프트 중심).

### 4-3. 인테리어코치 vs 견적코치 자산 구분

- `docs/seo-keywords.md`에 "견적코치 랜딩 연결" / "견적코치 시뮬레이터 연결" 등 **견적코치 전용 키워드·연결이 혼재**. 본 리서치 추가 작업 시 견적코치용 자산과 인테리어코치용 자산을 분리해서 참조해야 함.
- `docs/portal-marketing-branding.md`에 "견적코치 → 인테리어코치 크로스셀" 섹션 존재. 두 제품의 관계는 "크로스셀" 구도.

---

## 5. 타겟·포지셔닝 현황

### 5-1. 드러나는 타겟 페르소나 (현재 랜딩 기준)

- Hero eyebrow가 "**인테리어 업체 현장 운영** 올인원 SaaS"로 타겟 명시.
- 플랜별 태그라인으로 세분화:
  - Free: "혼자 운영하는 1인 사장님"
  - Starter: "작은 업체 · 팀원 2~3명"
  - Pro: "성장 중인 업체"
  - Enterprise: "다현장 · 지점 운영"
- Pain Points 카피는 **여러 현장·카톡방·엑셀·고객 전화·월말 통장** 경험이 있는 대표를 가정.
- 문서 기준(`docs/infrastructure-strategy-part3-5.md`): 핵심 타겟 = **3~5인 겸업 업체**.

### 5-2. 주요 가치 제안 (Why Us + Hero + Features에서 도출)

1. 자재 단가 DB 868건 (실제 공급가 기반)
2. 현직 인테리어 대표 설계 (10년 이상 운영 경험)
3. 견적~정산 올인원 (툴 5개를 하나로)
4. 현장당 "화면 하나" 구조(현장 톡방 + 고객 포털)
5. 14일 무료, 카드 등록 불필요

### 5-3. 경쟁사 언급 여부 (랜딩 기준)

- 랜딩 페이지 본문에 **경쟁사명 노출 없음**.
- 내부 문서(`docs/competitor-analysis.md`, `docs/competitor-erp-saas.md`, `docs/competitor-dashboard-ux-benchmark.md`)에는 다수 경쟁사 비교표가 준비되어 있음:
  - 국내: 빌드온, 시공왕, 현장의신, 집닥, 하우빌드, 건설워커, 호갱노노, 오늘의집, 삼쩜삼, 자비스, 얼마에요
  - 해외: Buildertrend, CoConstruct, Houzz Pro, Jobber, Flex
- ⚠️ 본 조사 프롬프트에서 제시된 "오픈스튜디오 / 집닥 B2B / 인스팩 / 하우스텝 프로"는 내부 경쟁 분석 문서에 **직접 등장하지 않음**(집닥은 등장, 나머지 3개는 미등장).

---

## 6. 가격·플랜 현황

| 항목 | 값 |
|---|---|
| 티어 수 | **4개** (Free / Starter / Pro / Enterprise) |
| 가격(월) | ₩0 / ₩29,000 / ₩69,000 / null(문의) |
| 가격(연) | ₩0 / ₩290,000 / ₩690,000 / null |
| 무료 체험 | 있음, **14일**, 카드 등록 불필요 |
| 강조 플랜 | **Pro** (`highlight: true`, 배지 `가장 인기`) |
| 결제 수단 | (랜딩에서는 노출 없음) |

- 내부 문서 중 가격 대안:
  - `docs/infrastructure-strategy-part3-5.md`: **Lite ₩4.9만 신설 + Starter ₩9.9만으로 조정** 제안. 현재 랜딩은 반영되지 않음.
  - `docs/competitor-analysis.md`: 인테리어코치 Pro를 **월 ₩29.9만**으로 표기한 구버전 기술 존재. 현재 실제 가격(₩69,000)과 다름 → 문서 간 불일치.

---

## 7. SEO·GEO 상태

### 7-1. 메타 태그

- `src/app/layout.tsx`:
  - title: `인테리어코치 — 인테리어 업체 업무 관리`
  - description: `고객, 현장, 견적, 계약, 시공, 자재를 한곳에서 관리하세요.`
- `src/app/page.tsx` (랜딩):
  - title: `인테리어코치 | 인테리어 업체 현장 운영 올인원 SaaS`
  - description: `현장 5개, 카톡방 50개, 엑셀 100장 — 이제 한 곳에서. 공정 매니저·현장 톡방·견적·계약·정산을 통합 관리하는 인테리어 업체 전용 SaaS.`
  - openGraph: title/description/images(`/landing/og-hero.png`)/type=website/locale=ko_KR
  - twitter: card=summary_large_image, images 동일
- ⚠️ **OG 이미지 파일 실체 없음**: `public/landing/og-hero.png` 경로가 참조되지만 `/public/landing/` 디렉토리 자체가 존재하지 않음(SNS 공유 시 썸네일 미노출 위험).

### 7-2. robots.txt / sitemap.xml

| 파일 | 상태 |
|---|---|
| `public/robots.txt` | **없음** |
| `public/sitemap.xml` | **없음** |
| `src/app/robots.ts` | **없음** |
| `src/app/sitemap.ts` | **없음** |
| 배포 `/robots.txt` | 404 상당(랜딩 HTML이 fallback으로 반환) |
| 배포 `/sitemap.xml` | 동상 |

### 7-3. Google Search Console

- `<meta name="google-site-verification" …>` 태그 **없음**(레포 전수 grep 기준 랜딩/레이아웃에 단서 없음).
- GSC 연결 여부는 코드·저장된 문서만으로는 확정 불가.

### 7-4. 구조화된 데이터 (schema.org / JSON-LD)

- 랜딩 페이지에 JSON-LD **없음**.
- JSON-LD는 **`/qna` 페이지에만** 적용(`src/app/qna/page.tsx`, `src/app/qna/[id]/page.tsx`).
- 랜딩에 `SoftwareApplication`, `Organization`, `FAQPage`, `Offer`, `BreadcrumbList` 등 스키마 사용 없음.

### 7-5. 기타 분석/추적

- Meta Pixel 삽입 코드 존재 (`src/app/layout.tsx`). 단, `NEXT_PUBLIC_META_PIXEL_ID` 환경 변수가 설정된 경우에만 로드.
- GA4 / Naver Analytics / Hotjar 등 다른 분석 스크립트는 랜딩/레이아웃에서 확인되지 않음.

### 7-6. SEO 키워드 기 리서치

- `docs/seo-keywords.md`에 50개 키워드(월 검색량·경쟁도·매칭 콘텐츠 포함) 정리 완료.
- 핵심 B2B 키워드 예: "인테리어 업체 관리"(3,000+/경쟁도 낮음), "현장관리 앱"(5,000+/경쟁도 낮음).

---

## 8. 구매 전환 퍼널 현황

### 8-1. 랜딩에서 제공되는 CTA 경로

| 위치 | CTA | 이동 경로 |
|---|---|---|
| Nav | `14일 무료 시작` | `/auth/signup` |
| Nav | `로그인` | `/auth/login` |
| Hero | `14일 무료 시작` | `/auth/signup` |
| Hero | `데모 신청` | `/demo-request` |
| Pricing (Free) | `무료로 시작` | `/auth/signup` |
| Pricing (Starter) | `14일 무료 시작` | `/auth/signup?plan=starter` |
| Pricing (Pro) | `Pro 시작하기` | `/auth/signup?plan=pro` |
| Pricing (Enterprise) | `상담 요청` | `/demo-request` |
| Final CTA | `14일 무료 시작` / `데모 신청` | 동일 |

### 8-2. 데모 신청 기능

- `/demo-request` 페이지 **존재** (`src/app/demo-request/page.tsx`, `DemoRequestForm.tsx`).
- `/api/demo-request` 엔드포인트 존재.
- 관리자 화면 `/api/admin/demo-requests` 존재(데모 요청 어드민 리스트용 추정).

### 8-3. 체험→유료 전환 흐름 (랜딩 표기 기준)

- 모든 플랜 14일 무료.
- 카드 등록 불필요.
- FAQ #1 답변에 "14일 후에도 자동 결제되지 않습니다" 명시 → 체험 만료 시 자동 과금 없음.
- FAQ #5 답변에 "설정 화면에서 버튼 한 번" 업/다운그레이드·해지.
- 체험 종료 후 자동 다운그레이드 로직, 결제 전 알림 흐름 등은 랜딩만으로 확인 불가(본 조사 범위 밖).

---

## 9. 경쟁사 현재 상태 빠른 스냅샷 (2026-04-20 기준)

> 조사 방식: WebFetch로 각 경쟁사 추정 URL 요청.
> ⚠️ 4개 중 3개가 **접근 불가 / 도메인 상태 문제**. 2차 상세 리서치 단계에서 정확한 공식 URL 재확인 필요.

### 9-1. 오픈스튜디오

- 시도 URL: `https://openstudio.co.kr`, `https://www.openstudio.co.kr`
- 결과: **TLS 인증서 호스트 불일치**(`ERR_TLS_CERT_ALTNAME_INVALID`). 공식 도메인 또는 재배포 상태 확인 필요.
- 내부 경쟁 문서: **등장하지 않음**. 내부 분석 레이더에 없던 서비스일 가능성.

### 9-2. 집닥 (B2B 경로)

- URL: `https://zipdoc.co.kr` → 응답 정상.
- Hero 카피: **"인테리어가 쉬워지는 방법, 집닥"**
- Nav에 **"시공전문가 입점하기"** 경로 존재 → B2B 입점은 있음(업체 관리 SaaS는 별도 어드민, `docs/competitor-erp-saas.md` §3 "집닥 시공사 어드민" 참조).
- 메인 CTA: **"견적 상담 신청"** (소비자 대상)
- 공개 가격 정보 없음.
- 포지션: **소비자–업체 매칭 플랫폼** (본 제품의 직접 SaaS 경쟁자 아님, 크로스셀 대상 고객군 겹침).

### 9-3. 인스팩

- 시도 URL: `https://inspec.co.kr`(TLS 오류), `https://www.insspec.com`(hugedomains.com으로 리다이렉트 = **도메인 판매 중/서비스 오프라인**).
- 본 조사 시점에 공식 도메인 확정 불가. 서비스 운영 여부 미확인.
- 내부 경쟁 문서에는 **등장하지 않음**.

### 9-4. 하우스텝 프로

- 시도 URL: `https://housetep.com/pro`(hugedomains.com 리다이렉트), `https://housetep.kr`(ECONNREFUSED).
- 공식 운영 URL 확인 불가.
- 내부 경쟁 문서에 **등장하지 않음**.

### 9-5. 참고 — 내부 문서에 정리된 실제 경쟁 세트

`docs/competitor-analysis.md` / `docs/competitor-erp-saas.md` / `docs/competitor-dashboard-ux-benchmark.md` 기준:

- **국내 현장관리 직접 경쟁:** 빌드온(BuildOn), 시공왕, 현장의신
- **국내 중개 플랫폼(간접):** 집닥, 오늘의집, 호갱노노
- **국내 건설 SaaS:** 하우빌드, 건설워커
- **세무/회계:** 삼쩜삼, 자비스, 얼마에요
- **해외 SaaS:** Buildertrend, CoConstruct, Houzz Pro, Jobber, Flex, Procore
- 내부 문서의 Pro 가격 표기(₩29.9만)는 현재 랜딩(₩69,000)과 **불일치** — 문서 업데이트 필요(조사 관찰).

---

## 10. GAP 분석 — 현재 vs 프롬프트에서 요청된 추가 작업 항목

> 비교 기준: 이번 대화 이전에 받은 "랜딩 리뉴얼 + 브랜드 가이드 + SEO" 요청 항목 vs 본 조사로 확인된 실제 상태.
> ⚠️ 교체 방향 카피 제안은 포함하지 않음(요청 원칙: 사실 수집만).

| 항목 | 현재 상태 | 프롬프트 권장안 기준 | 추가 필요 여부 |
|---|---|---|---|
| Hero 헤드라인 | 1안 고정 (`현장 5개, 카톡방 50개, 엑셀 100장…`) | 3안 + A/B 분기 | **추가 필요** (다안 미확보) |
| Hero 서브 | 1안 고정 | 3안 | **추가 필요** |
| CTA 버튼 | 2개(1차/2차) 운영 중 | 2개 요건 충족 | 충족 |
| Pain Point | 4 카드 운영 중 | 4 시나리오 요건 | 충족(문구 재검토는 별도) |
| Features 섹션 | 6 블록(공정매니저/톡방/견적/계약/정산/자재) | 6 모듈(공정/톡방/하자/수금/업무일지/근태+포털) | **불일치** — 랜딩에 "하자관리·수금관리·업무일지·근태·근태 QR" 블록 없음 |
| Case Study | 잠실르엘 1건(단락형, timeline 포함) | 스토리 300자 + 하이라이트 3 수치 | 부분 충족(수치 3개 존재) |
| Why Us | 3 카드(868건 DB / 현직 대표 / 올인원) | 3 차별점 요건 | 충족 |
| Pricing 네이밍 | Free/Starter/Pro/Enterprise(영문) | "업계 친화 한국어 네이밍" 요구 | **차이 있음** |
| Pricing 티어 수 | 4 | 4 | 충족(문서 `infrastructure-strategy-part3-5`는 Lite 신설 제안, 미반영) |
| FAQ | 5 문항 | 5 문항 | 충족 |
| Final CTA | 1안 | 2안 배너 | **추가 필요** |
| 브랜드 톤앤매너 가이드 | `docs/brand-guidelines.md` 존재(v1.0) | 300~500자 압축본 요청 | **부분 중복** — 기존 가이드 풍부, 압축본 별도 필요 여부 판단 대상 |
| 금지/권장 표현 리스트 | `docs/brand-guidelines.md` §보이스에 부분 존재 | 표 형식 요구 | **부분 중복** — 확장 여부 판단 대상 |
| SEO 블로그 3건 | `docs/blog-naver-3posts.md`(대시보드 v2 3편) 존재 | 새 3개 주제(카톡방/수금/반장앱) | **주제 상이** — 신규 3건 필요 |
| 로고 실물 파일 | 없음(텍스트만) | — | 별도 과제(본 요청 외) |
| favicon/OG 이미지 | 미존재(OG 이미지 경로는 선언됨) | — | 별도 과제 |
| robots.txt / sitemap.xml | **미존재** | — | **추가 필요** |
| JSON-LD 구조화 데이터(랜딩) | 미존재 | FAQ/SoftwareApplication 권장 | **추가 필요** |
| 랜딩 경쟁사 언급 | 없음 | "집닥은…, 오늘의집은…" 포지셔닝 요청 | **추가 필요**(내부 문서에 재료 있음) |
| Pretendard 폰트 실제 로드 | 미로드 (Geist 사용) | 가이드는 Pretendard 지정 | **불일치** |
| 컬러 토큰 ↔ 가이드 정합 | 일부 값 차이 | — | **확인 필요**(가이드/코드 동기화) |

---

## 11. 추가 작업 시 주의 사항

### 11-1. 브랜딩 일관성 유지

- **단일 카피 소스**: 랜딩 카피를 수정할 때는 반드시 `src/content/landing.ts` 먼저 수정. `page.tsx`/`LandingPage.tsx`에 직접 하드코딩 금지(기존 구조 보존).
- **컬러 토큰은 CSS 변수만 참조**: 카피나 문서에 헥스 값을 또 박지 않고 `--green`, `--foreground` 등 토큰명으로 지시(가이드/코드 불일치가 이미 존재 → 신규 작업이 불일치를 악화시키지 않도록).
- **폰트 정책은 둘 중 하나로 통일 필요**(Geist vs Pretendard). 본 조사에선 판단하지 않음. 통일 전까지는 가이드 문서 타이포 섹션을 "TBD"로 처리하거나, 현 상태(Geist)를 그대로 인정한 임시 서술만 권장.
- **로고 실물 자산 부재**: 랜딩·OG·favicon에서 로고를 시각적으로 다루는 제안을 할 경우, 별도의 이미지 생성/발주 과제가 선행되어야 함.

### 11-2. 견적코치와의 구분 원칙

- **두 제품 분리**:
  - 인테리어코치 = **B2B SaaS** (인테리어 업체 대표용 현장 운영 도구)
  - 견적코치 = **B2C/툴** (소비자·업체 공용 견적 분석·시뮬레이션)
- `docs/seo-keywords.md`와 `docs/portal-marketing-branding.md`에 두 제품 키워드·CTA가 혼재. 인테리어코치 랜딩/블로그에는 **견적코치 전용 키워드(예: "인테리어 견적 적정가", "인테리어 바가지")가 주요 CTA가 되지 않도록** 분리.
- 크로스셀은 허용되지만, 인테리어코치 랜딩 히어로·요금제·FAQ에서 **견적코치가 메인 카피가 되면 타겟 혼선**. 견적코치 AI는 Features 내 1개 블록 수준(현재 구성)이 상한선.

### 11-3. 프롬프트에 제시된 경쟁사 리스트 재검증

- "오픈스튜디오 / 인스팩 / 하우스텝 프로"는 본 조사 시점 URL 접근 불가 또는 도메인 판매 상태.
- 내부 경쟁 문서(`docs/competitor-*.md`)에도 3개 중 3개 모두 등장하지 않음.
- 2단계 상세 리서치 착수 전, **정확한 공식 URL 또는 별도 경쟁 세트(빌드온·시공왕·현장의신·집닥 시공사 어드민·Buildertrend 등)로 교체 여부 확인 필요**.

### 11-4. 문서 간 가격 불일치 정리

- 현재 실제 가격: Pro ₩69,000/월(랜딩 `landing.ts`).
- 문서 내 구가(舊價) 표기:
  - `docs/competitor-analysis.md` — "인테리어코치 Pro = 월 29.9만 원"
  - `docs/infrastructure-strategy-part3-5.md` — Lite 4.9만 / Starter 9.9만 대안
- 추가 카피·자료를 새로 작성할 때 **어느 가격을 기준으로 할지 결정 후 진행**(둘 다 현재 랜딩과 다름).

### 11-5. SEO 기반 빠진 것 정리

- `robots.txt`, `sitemap.xml`, 랜딩 JSON-LD, `public/landing/og-hero.png`(OG 이미지), GSC 검증 태그 — 모두 **부재**. SEO·GEO 강화 작업은 카피 작업과 독립된 별도 과제로 정리.

### 11-6. 초안 대 라이브 구분

- 블로그 3편(`docs/blog-naver-3posts.md`), Threads 5편(`docs/threads-build-in-public.md`)은 **초안**. 실제 네이버 블로그·Threads 계정에 게시된 URL 목록은 본 조사 범위 내에서 확인되지 않음. "기 발행 콘텐츠"로 다루기 전에 실제 운영 여부 별도 확인.

---

> 조사 종료.
