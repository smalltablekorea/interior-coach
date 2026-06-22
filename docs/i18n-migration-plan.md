# i18n 마이그레이션 — 진행 상태와 잔여 계획

## 이번 PR 에서 한 것

### 인프라
- `src/i18n/navigation.ts` 신설 — `createNavigation(routing)` 으로 만든 locale-aware
  Link / useRouter / usePathname / redirect / getPathname.
- `src/components/layout/LanguageToggle.tsx` — Globe 아이콘 + 드롭다운(한국어/English).
  현재 경로·쿼리·해시를 유지한 채 router.replace 로 locale 만 교체. 로그인 사용자는
  `PATCH /api/me/locale` 도 백그라운드 호출 (실패해도 UI 전환 진행).
- `LanguageToggle` 을 `src/components/layout/Header.tsx` 우측에 마운트
  (테마 토글 옆) — 로그인 후 모든 페이지에서 노출.
- `PATCH /api/me/locale` — `user.preferred_locale` 저장 + `NEXT_LOCALE` 쿠키 굽기.

### 메시지
- `messages/ko.json`, `messages/en.json` 의 키 구조를 다음 영역으로 확장:
  - `common.*` (save / cancel / delete / edit / loading / search / add 등 18종)
  - `auth.*` (login / logout / signup / loginRequired)
  - `nav.*` (사이드바 메뉴 + groups.*, 22+5종)
  - `locale.*` (ko / en / switchTo)
- `npm run i18n:check` 통과 — ko/en 키 완전 일치.

### 코드 교체
- `src/components/layout/Sidebar.tsx` — 메뉴 항목 모두 `label` → `labelKey` 로
  치환, `useTranslations("nav")` 로 룩업. 그룹·아이템·모바일 탭 모두 적용.
  접힘 라벨에서 " 관리"·"코치 " 를 잘라 짧게 표시하던 코드도 키 기반으로 단순화
  (sitesShort / scheduleShort 같은 별도 키로 처리).

## 잔여 작업 — 별도 PR 로 분리

### A) 폴더 마이그레이션 (가장 큰 작업)
**현재**: `src/app/{(dashboard), (public), admin, auth, pricing, ...}` 가 flat.
`routing.ts` 는 `localePrefix: "as-needed"` 라 한국어 URL 은 prefix 없이 유지.
하지만 `/en/sites` 같은 영어 URL 이 실제로 동작하려면 페이지가 `app/[locale]/`
아래에 있어야 함 (next-intl 의 정공법).

**옮길 대상** (API 제외 모두):
```
src/app/(dashboard)  →  src/app/[locale]/(dashboard)
src/app/(public)     →  src/app/[locale]/(public)
src/app/admin        →  src/app/[locale]/admin
src/app/auth         →  src/app/[locale]/auth
src/app/d            →  src/app/[locale]/d
src/app/daily-logs   →  src/app/[locale]/daily-logs
src/app/demo-request →  src/app/[locale]/demo-request
src/app/landing-preview → src/app/[locale]/landing-preview
src/app/payment      →  src/app/[locale]/payment
src/app/portal       →  src/app/[locale]/portal
src/app/pricing      →  src/app/[locale]/pricing
src/app/qna          →  src/app/[locale]/qna
src/app/refund-policy → src/app/[locale]/refund-policy
src/app/sample       →  src/app/[locale]/sample
src/app/specbook     →  src/app/[locale]/specbook
src/app/terms        →  src/app/[locale]/terms
src/app/workspace    →  src/app/[locale]/workspace
src/app/page.tsx     →  src/app/[locale]/page.tsx
src/app/layout.tsx   →  분리: 루트 layout + src/app/[locale]/layout.tsx
src/app/global-error.tsx → 그대로 유지 (locale 무관)
```

**옮기지 않는 것** (locale 비관련):
- `src/app/api/*` — REST API
- `src/app/globals.css`, `favicon.ico`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`

**`src/app/[locale]/layout.tsx` 골격**:
```tsx
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES } from "@/i18n/routing";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as never)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```
루트 `src/app/layout.tsx` 는 (RSC `<html>` 없이) children 통과만 하는 형태로
축소 — globals.css 등 글로벌 리소스는 거기서 import.

**옮기는 방법**:
```bash
git mv src/app/'(dashboard)' src/app/'[locale]/(dashboard)'
# 위 패턴으로 17개 디렉터리 + 1개 page.tsx
```
한 번의 PR 로 일괄 이동 → 빌드 깨지면 layout.tsx 분리로 수정.

### B) 페이지·컴포넌트 텍스트 전수 교체
현재 한국어 하드코딩이 남아 있는 영역. 우선순위 순:

1. **공개·랜딩 (최우선)**: `(public)`, `pricing`, `terms`, `refund-policy`,
   `landing-preview`, `qna`, `demo-request`, `app/page.tsx`. 외부 노출 페이지라
   영어 미번역이면 즉시 티남.
2. **인증**: `auth/login`, `auth/signup`, 관련 모달·에러 메시지.
3. **헤더**: `Header.tsx` 의 워크스페이스 라벨, 알림 빈 상태, 검색 placeholder.
4. **대시보드 메인**: `(dashboard)/dashboard/page.tsx` 의 위젯 헤더·KPI 라벨.
5. **현장**: `sites/page.tsx`, `sites/quick-new`, `sites/[id]/quick` — 가장
   자주 쓰는 흐름.
6. **고객**: `customers/page.tsx`, `customers/[id]` — 상태/탭/이력.
7. **견적**: `estimates/new`, `estimates/builder` (StepClientInfo 등 step 4개),
   `estimates/[id]`. 견적서 인쇄 본문도 별도 키.
8. **나머지 도메인 페이지**: schedule, contracts, expenses, settlement, tax,
   specbook, daily-logs, defects, materials, workers, marketing, admin/*.
9. **공통 컴포넌트**: `Modal`, `StatusBadge` (상태 라벨), `EmptyState`,
   `subscription/UpgradeModal`, 토스트·alert 문구.
10. **에러 처리**: `error.tsx`, `not-found.tsx`, `serverError` 의 라벨.

**키 네이밍 컨벤션**:
- 페이지/도메인 네임스페이스 = 폴더명. 예: `sites.*`, `customers.*`, `estimates.*`,
  `daily-logs.*` (단어 단위 `dailyLogs` 권장).
- 페이지 단위 하위 영역 = `sites.list.*`, `sites.create.*`, `sites.detail.tabs.phases.*`.
- 공통 토큰 = `common.*` (save/cancel/delete/loading/search/add/all/empty 등).
- 상태값 = `status.customer.*`, `status.site.*`, `status.phase.*`.
- 알림·토스트 = `toast.<domain>.<event>` (예: `toast.sites.created`).
- 에러 = `error.<domain>.<code>`.

**작업 흐름 (페이지 1개 단위)**:
1. 페이지의 모든 한국어 리터럴을 grep 으로 추출.
2. 의미 단위로 키 설계 (위 컨벤션). `ko.json` 에 한국어 원문 그대로 입력.
3. `en.json` 에 같은 키 추가, 값은 영어 초벌 OR 빈 문자열로 두고 리서치 봇 인계.
4. 코드를 `useTranslations(...)` 또는 `getTranslations(...)` (서버 컴포넌트) 로 교체.
5. `npm run i18n:check` 통과 확인 후 커밋.

### C) 통화·날짜·숫자 포매팅
- `useFormatter()` (`next-intl`) 사용. `format.number(amount, { style: "currency",
  currency: locale === "ko" ? "KRW" : "USD" })` 또는 `format.dateTime(d, "long")`.
- 기존 `fmt`, `fmtDate`, `fmtKrw` 헬퍼는 locale 인자를 받아 분기. 점진 교체.

### D) 라우터 import 경로 일괄 교체
- 코드베이스 전체에서 `import Link from "next/link"`,
  `import { useRouter, usePathname } from "next/navigation"` 를
  `import { Link, useRouter, usePathname } from "@/i18n/navigation"` 로 교체.
- 폴더 마이그레이션 직후 한 번에 sed 로 처리 가능 (외부 URL Link 는 그대로).

### E) `next-intl`/`use-intl` 이슈
v4.13.0 에서 `next-intl` 의 client 진입에서 `useTranslations` 타입 해석이 깨지는
케이스를 만나, 현재 LanguageToggle / Sidebar 는 `use-intl` 에서 직접 import.
런타임 동작은 동일. 마이그레이션 마무리 후 next-intl 업그레이드 + 일괄 정리 권장.

## 리서치 봇 인계 — 영어 채워야 할 키
현재 `messages/en.json` 는 초벌 영어값으로 채워져 있음. 브랜드 톤·SaaS 용어
검증이 필요한 키 (특히 nav.estimatesCoach "Estimate Coach AI", common.* 의
짧은 동사형, locale.switchTo 의 ICU 문구) 는 리서치 봇이 최종 결정.

신규 키 추가 시 반드시 ko.json + en.json 양쪽에 동시 추가, `npm run i18n:check`
통과 후 커밋.

---

문서 작성: 2026-06-23 — `feat(i18n): foundation` PR 동반.
