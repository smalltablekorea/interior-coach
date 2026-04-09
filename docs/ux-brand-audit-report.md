# 인테리어코치 UX 분석 및 브랜드 일관성 점검 종합 리포트

> 분석일: 2026-04-03 | 분석 범위: 코드베이스 전체 + 경쟁사 5개 벤치마크

---

## Executive Summary

인테리어코치는 올인원 기능 범위(14개 메뉴)와 빠른 온보딩(1-2분), 다크 모드 프리미엄 UX에서 경쟁 우위를 가지고 있다. 그러나 **3개의 Critical 이슈**가 "페이지 전환 시 끊기는 느낌"의 근본 원인이다:

1. **loading.tsx 2개뿐** — 30+ 페이지에 라우트 레벨 로딩 상태 없음
2. **error.tsx / not-found.tsx 0개** — API 에러를 모두 무시 처리
3. **톤앤매너 불일치** — 13개 파일에서 "~하시겠습니까?" 사용 (브랜드 가이드 위반)

즉시 개선하면 체감 품질이 크게 향상될 수 있는 항목들이다.

---

## Part 1: UX 오류 리포트

### 1-1. 로딩 상태 처리 — Critical

| 항목 | 현재 상태 | 심각도 |
|------|----------|--------|
| `loading.tsx` 파일 수 | **2개** (대시보드 루트, 견적코치) | **Critical** |
| 나머지 30+ 페이지 | 로딩 상태 없음 → 페이지 전환 시 빈 화면 | **Critical** |
| 전역 로딩 바 (NProgress) | 미사용 | **High** |
| `useTransition` | 미사용 | **Medium** |
| Link prefetch | 기본값만 사용 (명시적 설정 없음) | **Low** |

**현재 패턴의 문제:**
각 페이지에서 `useState(true)` + `fetch` + `setLoading(false)` 를 반복. App Router의 Suspense 기반 자동 로딩(`loading.tsx`)을 전혀 활용하지 않아, 라우트 전환 시 로딩 인디케이터가 표시되지 않음.

**영향 받는 주요 페이지:**
- `/sites`, `/sites/[id]` — 현장 목록/상세
- `/estimates`, `/estimates/[id]`, `/estimates/new` — 견적 관련
- `/contracts`, `/contracts/[id]` — 계약 관련
- `/expenses` — 지출 관리
- `/workers`, `/workers/[id]` — 작업자 관리
- `/customers`, `/customers/[id]` — 고객 관리
- `/construction` — 시공 관리
- `/schedule` — 일정 관리
- `/marketing/*` (6개 하위 페이지) — 마케팅 섹션
- `/tax/*` (4개 하위 페이지) — 세무 섹션

### 1-2. 에러 처리 — Critical

| 항목 | 현재 상태 | 심각도 |
|------|----------|--------|
| `error.tsx` (Error Boundary) | **0개** — 전체 미존재 | **Critical** |
| `not-found.tsx` | **0개** — 전체 미존재 | **High** |
| API 에러 사용자 피드백 | `.catch(() => setLoading(false))` — 에러 무시 | **Critical** |
| 네트워크 에러 구분 (401/403/404/500) | 없음 | **High** |
| Toast/알림 시스템 | 미사용 | **Medium** |

**치명적 시나리오:**
- API 호출 실패 시 로딩만 끝나고 빈 배열 표시 → 사용자는 "데이터 없음"과 "에러" 구분 불가
- 세션 만료(401) 시 조용히 실패 → 사용자는 빈 페이지에서 혼란

### 1-3. 빈 상태(Empty State) — Medium

| 항목 | 현재 상태 |
|------|----------|
| `EmptyState` 공통 컴포넌트 | 존재 (icon, title, description, action props) |
| CTA 포함 여부 | 대부분 포함하나 일부 누락 (expenses 등) |
| 톤 일관성 | "~없습니다" (합니다체) 사용 — 가이드 위반 |

### 1-4. 모바일 반응형 — Good (일부 개선 필요)

| 항목 | 현재 상태 | 상태 |
|------|----------|------|
| Bottom Navigation | 5개 탭 (대시보드/현장/시공/일정/정산) | **양호** |
| 터치 타겟 44px | `@media (pointer: coarse)` 전역 적용 | **양호** |
| Safe Area (노치) | `env(safe-area-inset-bottom)` 적용 | **양호** |
| 100dvh 대응 | `@supports` 분기 | **양호** |
| 네이티브 앱 / PWA | **없음** | **개선필요** |
| 오프라인 지원 | **없음** | **개선필요** |

### 1-5. SEO 메타태그 — High

| 항목 | 현재 상태 | 심각도 |
|------|----------|--------|
| Root metadata | `title` + `description` 설정됨 | **양호** |
| 페이지별 metadata | **없음** — 모든 페이지 동일 title | **High** |
| OG Image | **없음** | **High** |
| `robots.txt` | **없음** | **Medium** |
| `sitemap.xml` | **없음** | **Medium** |
| Apple Touch Icon | **없음** | **Medium** |

---

## Part 2: 카피라이팅 수정 제안

### 2-1. 삭제 확인 메시지 — 13개 파일 일괄 수정

**현재 (위반):**
```
"정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
```

**제안 (해요체):**
```
"정말 삭제할까요? 이 작업은 되돌릴 수 없어요."
```

| 파일 | 현재 텍스트 |
|------|----------|
| `customers/[id]/page.tsx:157` | "정말 삭제하시겠습니까?" |
| `schedule/page.tsx` | "이 공정을 삭제하시겠습니까?" |
| `materials/page.tsx` | "이 발주를 삭제하시겠습니까?" |
| `expenses/page.tsx` | "이 지출 내역을 삭제하시겠습니까?" |
| `contracts/[id]/page.tsx` | "정말 삭제하시겠습니까?" |
| `tax/vendors/page.tsx` | "이 거래처를 삭제하시겠습니까?" |
| `tax/expenses/page.tsx` | "이 경비를 삭제하시겠습니까?" |
| `tax/payroll/page.tsx` | "이 급여 내역을 삭제하시겠습니까?" |
| `tax/revenue/page.tsx` | "이 매출을 삭제하시겠습니까?" |
| `workers/[id]/page.tsx` | "정말 삭제하시겠습니까?" |
| `sites/[id]/page.tsx` | "{name} 현장을 삭제하시겠습니까?" |
| `construction/page.tsx` | "이 공정을 삭제하시겠습니까?" |
| `naver-blog/page.tsx` | "이 포스트를 삭제하시겠습니까?" |

### 2-2. 에러 메시지 톤 수정

| 파일:라인 | 현재 | 제안 |
|----------|------|------|
| `auth/login/page.tsx:39` | "회원가입에 실패했습니다." | "회원가입에 실패했어요." |
| `auth/login/page.tsx:74` | "Google 로그인에 실패했습니다." | "Google 로그인이 안 됐어요." |
| `portal/[token]/page.tsx` | "데이터를 불러올 수 없습니다" | "데이터를 불러올 수 없어요" |

### 2-3. 빈 상태 메시지 톤 수정

| 파일 | 현재 | 제안 |
|------|------|------|
| `customers/page.tsx:139` | "등록된 고객이 없습니다" | "등록된 고객이 없어요" |
| `schedule/page.tsx` | "이번 달 진행 중인 현장이 없습니다" | "이번 달 진행 중인 현장이 없어요" |
| `materials/page.tsx` | "발주 내역이 없습니다" | "발주 내역이 없어요" |
| `tax/vendors/page.tsx` | "거래처가 없습니다" | "거래처가 없어요" |
| `dashboard/page.tsx` | "오늘 처리할 긴급 항목이 없습니다" | "오늘 처리할 긴급 항목이 없어요" |
| `dashboard/page.tsx` | "계약된 프로젝트가 없습니다" | "계약된 현장이 없어요" |

### 2-4. 용어 통일

| 혼용 | 통일안 | 사유 |
|------|--------|------|
| "프로젝트" vs "현장" | **현장** | 사이드바/메뉴에서 "현장"으로 통일됨. "프로젝트"는 1곳만 남아 있음 |
| "되돌릴 수 없습니다" vs "다시 불러올 수 없습니다" | **되돌릴 수 없어요** | 하나의 표현으로 통일 |

---

## Part 3: SEO 메타태그 수정 제안

### 현재 (Root만 설정)
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "인테리어코치 — 인테리어 업체 업무 관리",
  description: "고객, 현장, 견적, 계약, 시공, 자재를 한곳에서 관리하세요.",
};
```

### 제안: 페이지별 metadata 추가

| 페이지 | title | description |
|--------|-------|-------------|
| `/` (랜딩) | 인테리어코치 — 인테리어 업체 올인원 관리 | 현장관리, 견적, 마케팅, 세무까지 하나로. 14일 무료 체험. |
| `/login` | 로그인 \| 인테리어코치 | 인테리어코치에 로그인하세요. |
| `/dashboard` | 대시보드 \| 인테리어코치 | 매출, 현장, 수금 현황을 한눈에. |
| `/sites` | 현장 관리 \| 인테리어코치 | 모든 현장 정보를 한곳에서 관리하세요. |
| `/estimates` | 견적 관리 \| 인테리어코치 | 견적서 작성부터 발송까지. |
| `/contracts` | 계약 관리 \| 인테리어코치 | 계약금, 중도금, 잔금을 체계적으로. |
| `/schedule` | 공정 스케줄 \| 인테리어코치 | 공정 일정을 한눈에 관리하세요. |

### 추가 필요 파일

```
public/robots.txt
public/apple-touch-icon.png (180x180)
public/opengraph-image.png (1200x630)
src/app/sitemap.ts
```

---

## Part 4: 로딩 UX 개선 제안

### 즉시 적용 (P0) — loading.tsx 추가

**방법:** 기존 `animate-shimmer` + `stagger-*` CSS를 활용해 각 라우트에 `loading.tsx` 추가

```
추가 대상 (우선순위순):
src/app/(dashboard)/sites/loading.tsx
src/app/(dashboard)/sites/[id]/loading.tsx
src/app/(dashboard)/estimates/loading.tsx
src/app/(dashboard)/estimates/[id]/loading.tsx
src/app/(dashboard)/contracts/loading.tsx
src/app/(dashboard)/contracts/[id]/loading.tsx
src/app/(dashboard)/expenses/loading.tsx
src/app/(dashboard)/workers/loading.tsx
src/app/(dashboard)/customers/loading.tsx
src/app/(dashboard)/construction/loading.tsx
src/app/(dashboard)/schedule/loading.tsx
src/app/(dashboard)/tax/loading.tsx
```

### 단기 적용 (P1) — error.tsx + API 에러 처리

1. **전역 Error Boundary**: `src/app/(dashboard)/error.tsx`
2. **404 페이지**: `src/app/(dashboard)/not-found.tsx`
3. **API 에러 공통화**: `fetchAPI()` 헬퍼에서 상태코드별 분기 처리
4. **Toast 알림**: 에러/성공 메시지를 사용자에게 피드백

### 중기 적용 (P2) — 체감 속도 개선

1. **NProgress 로딩 바**: 페이지 전환 시 상단 프로그레스 바
2. **SWR/React Query**: `stale-while-revalidate` 패턴으로 재방문 즉시 표시
3. **Optimistic UI**: 상태 변경(수금 확인 등) 시 즉시 반영
4. **Link prefetch 명시화**: 자주 접근하는 상세 페이지에 `prefetch={true}`

### 장기 적용 (P3) — PWA 전환

1. **Service Worker**: 핵심 페이지 캐싱
2. **IndexedDB**: 최근 조회 데이터 로컬 저장
3. **manifest.json**: 홈 화면 추가 지원
4. **백그라운드 동기화**: 오프라인 작업 큐

---

## Part 5: 경쟁사 비교 분석 요약

### 비교 매트릭스

| 항목 | 인테리어코치 | 집닥 | 숨고 | 오늘의집 프로 | 하우빌드 | 현장의신 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 온보딩 속도 | **A** | C | B | D | B | B |
| 로딩 UX | B | C | A | A | B | D |
| 모바일 최적화 | B- | A | A | A | **A+** | A |
| 데이터 시각화 | B+ | C | B | B | A | A |
| 올인원 기능 범위 | **A+** | B | C | B | B | B |
| 오프라인 지원 | F | C | D | C | **A** | **A** |
| 가격 경쟁력 | **A** | C | B | B | C | C |

### 인테리어코치 UX 강점 3가지

1. **올인원 풀스택**: 14개 메뉴(고객/현장/견적/계약/시공/자재/작업자/지출/마케팅 6채널/세무/정산)를 단일 SaaS에서 제공. 경쟁사 중 이 범위를 커버하는 곳 없음.
2. **빠른 온보딩 + 낮은 진입 장벽**: 사업자 인증 없이 1-2분 가입. 오늘의집 프로(심사 1-3일) 대비 압도적.
3. **다크 모드 프리미엄 UX**: 업계 유일의 다크 모드. #00C471 그린 + #0A0A0A 다크 조합으로 독보적 시각적 정체성.

### 인테리어코치 UX 개선 3가지

1. **네이티브 앱/PWA 부재**: 현장 모바일 사용 70%+ 환경에서 카메라 연동, 푸시 알림, 오프라인 불가는 치명적.
2. **로딩/에러 처리 미흡**: loading.tsx 2개, error.tsx 0개 → "끊기는 느낌"의 직접 원인.
3. **행동 유도형 온보딩 부재**: 현재 모달은 기능 소개만. 첫 현장 등록 → 첫 견적 작성 유도하는 인터랙티브 투어 필요.

### 현장 실무자 관점 개선 제안

1. **현장 사진 퀵 액션**: 모바일 FAB 버튼으로 사진 촬영/일지 작성/지출 기록 1탭 접근
2. **수금 알림 위젯**: 대시보드 상단에 "오늘의 액션" 고정 (미수금 D+7 이상 빨강 강조)
3. **PWA 오프라인 캐시**: 대시보드/현장 목록/일정을 로컬 캐시해 지하/신축 현장에서도 접근 가능

---

## 개선 우선순위 로드맵

### P0 — 이번 주 (체감 즉시 개선)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 1 | 주요 라우트 12개에 `loading.tsx` 추가 | 페이지 전환 "끊김" 해소 |
| 2 | `error.tsx` + `not-found.tsx` 추가 | 에러 시 빈 화면 → 안내 메시지 |
| 3 | 삭제 확인 "~하시겠습니까?" → "~할까요?" 일괄 치환 (13개 파일) | 브랜드 톤 일관성 |

### P1 — 1-2주 (품질 향상)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 4 | API 에러 공통 처리 + Toast 알림 | 에러 시 사용자 피드백 |
| 5 | 빈 상태 "~없습니다" → "~없어요" 일괄 치환 | 톤 일관성 |
| 6 | 페이지별 SEO metadata 추가 | 검색 노출 개선 |
| 7 | `robots.txt` + `sitemap.xml` + OG Image 추가 | SEO 기본 |

### P2 — 2-4주 (경쟁력 강화)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 8 | NProgress 전역 로딩 바 | 페이지 전환 체감 속도 |
| 9 | Pretendard 한글 폰트 전역 적용 | 브랜드 신뢰도 |
| 10 | 마케팅 섹션 Tailwind → CSS 변수 마이그레이션 | 다크/라이트 모드 안정성 |
| 11 | PWA manifest + Service Worker 기초 | 모바일 홈 화면 추가 |

### P3 — 1-2개월 (차별화)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 12 | 모바일 FAB 퀵 액션 (사진/일지/지출) | 현장 사용성 대폭 향상 |
| 13 | SWR/React Query 전환 | 재방문 즉시 로딩 |
| 14 | Optimistic UI (상태 변경) | 인터랙션 즉시 반응 |
| 15 | 인터랙티브 온보딩 투어 | 활성화율 향상 |
