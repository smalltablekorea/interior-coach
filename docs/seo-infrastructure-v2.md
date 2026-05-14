# SEO 기반 구축 명세 v2 — 인테리어코치

> 작성일: 2026-04-21
> 현재 부재 항목: `robots.txt` · `sitemap.xml` · 랜딩 JSON-LD · 실제 OG 이미지 파일
> 본 문서는 **명세**. 실제 파일 생성·배포는 프론트엔드/데브옵스 봇의 후속 과제.
> 참조 프로젝트 루트: `/Users/justin/클로드코드 지난거/인테리어코치`

---

## 4-1. robots.txt 내용 제안

### 배치 위치

- 생성 위치: `public/robots.txt` (정적) **또는** `src/app/robots.ts` (동적, Next.js App Router 권장)
- Next.js 16 App Router 기준 **동적 생성**이 정석(배포 환경별 BETTER_AUTH_URL을 자동 반영 가능).

### `src/app/robots.ts` 샘플 (동적)

```ts
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://interiorcoach.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/qna",
          "/qna/*",
          "/terms",
          "/refund-policy",
          "/privacy",
          "/demo-request",
          "/estimates/shared/*",  // 공유 견적(공개 토큰)은 허용
          "/portal/*",            // 고객 포털 경로는 철거됐지만 기존 링크 잔존 가능 → 후속 제거
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/auth",
          "/auth/*",
          "/api",
          "/api/*",
          "/admin",
          "/admin/*",
          "/sites",
          "/sites/*",
          "/customers",
          "/customers/*",
          "/estimates",             // 리스트는 인증
          "/estimates/new",
          "/estimates/[0-9a-f-]+",
          "/contracts/*",
          "/construction/*",
          "/schedule/*",
          "/materials/*",
          "/workers/*",
          "/expenses/*",
          "/tax/*",
          "/settings/*",
          "/marketing/*",
          "/mypage",
          "/onboarding/*",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

### 정적 `public/robots.txt` 대체본

```
# 인테리어코치 robots.txt
User-agent: *
Allow: /
Allow: /pricing
Allow: /qna
Allow: /terms
Allow: /refund-policy
Allow: /privacy
Allow: /demo-request
Disallow: /dashboard
Disallow: /auth
Disallow: /api
Disallow: /admin
Disallow: /sites
Disallow: /customers
Disallow: /contracts
Disallow: /construction
Disallow: /schedule
Disallow: /materials
Disallow: /workers
Disallow: /expenses
Disallow: /tax
Disallow: /settings
Disallow: /marketing
Disallow: /mypage
Disallow: /onboarding

Sitemap: https://interiorcoach.kr/sitemap.xml
```

---

## 4-2. sitemap.xml 엔트리 제안

### 배치 위치

- 생성 위치: `src/app/sitemap.ts` (동적 권장)
- Next.js가 `/sitemap.xml` 로 자동 서빙.

### `src/app/sitemap.ts` 샘플

```ts
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://interiorcoach.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 공개 페이지
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/pricing`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/qna`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/demo-request`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/terms`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  // 동적: 공개 QnA
  const qnaRows = await db
    .select({ id: qnaPosts.id, updatedAt: qnaPosts.updatedAt })
    .from(qnaPosts)
    .where(eq(qnaPosts.status, "answered"));

  const qnaUrls: MetadataRoute.Sitemap = qnaRows.map((row) => ({
    url: `${BASE_URL}/qna/${row.id}`,
    lastModified: row.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticUrls, ...qnaUrls];
}
```

### 우선순위 요약

| URL | 우선순위 | 빈도 |
|---|---|---|
| `/` | 1.0 | weekly |
| `/pricing` | 0.9 | monthly |
| `/qna` | 0.8 | daily |
| `/qna/[id]` | 0.6 | monthly |
| `/demo-request` | 0.7 | monthly |
| `/terms` · `/privacy` · `/refund-policy` | 0.3 | yearly |

---

## 4-3. 랜딩 JSON-LD 스키마 3종

> 삽입 위치: `src/app/page.tsx` 내 `<LandingPage />` 렌더 직전에 `<Script id="..." type="application/ld+json" ...>` 3개 주입.
> 기존 `/qna` 페이지의 JSON-LD 패턴을 참조(`src/app/qna/page.tsx`).

### 4-3-A. `SoftwareApplication`

```jsonc
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "인테리어코치",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "Construction Management",
  "operatingSystem": "Web",
  "description": "인테리어 업체 대표를 위한 현장 운영 올인원 B2B SaaS. OCR·AI 자동화, 자재 단가 DB 868건, 견적부터 정산까지 한 라인.",
  "url": "https://interiorcoach.kr",
  "inLanguage": "ko-KR",
  "offers": [
    {
      "@type": "Offer",
      "name": "체험하기",
      "price": "0",
      "priceCurrency": "KRW",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "현장 올인원 (월간 결제)",
      "price": "79000",
      "priceCurrency": "KRW",
      "eligibleDuration": { "@type": "QuantitativeValue", "unitCode": "MON", "value": 1 }
    },
    {
      "@type": "Offer",
      "name": "연간 올인원 (연간 결제)",
      "price": "790000",
      "priceCurrency": "KRW",
      "eligibleDuration": { "@type": "QuantitativeValue", "unitCode": "ANN", "value": 1 }
    }
  ],
  "featureList": [
    "공정 매니저",
    "자재·발주 관리 (OCR)",
    "현장 손익 관리",
    "견적코치 AI",
    "수금관리",
    "세금계산서 관리",
    "하자관리 (사진 AI)",
    "업무일지",
    "근태급여",
    "반장·기사 인력풀",
    "월간 리포트",
    "공사 유형 템플릿"
  ],
  "publisher": {
    "@type": "Organization",
    "name": "스몰테이블디자인그룹"
  }
}
```

### 4-3-B. `Organization`

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "스몰테이블디자인그룹",
  "legalName": "스몰테이블디자인그룹",
  "url": "https://interiorcoach.kr",
  "logo": "https://interiorcoach.kr/brand/logo-full.png",
  "sameAs": [
    "https://www.threads.net/@realzeroto1",
    "https://www.instagram.com/realzeroto1/"
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@interiorcoach.kr",
      "areaServed": "KR",
      "availableLanguage": ["ko"]
    }
  ]
}
```

### 4-3-C. `FAQPage`

```jsonc
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "OCR 정확도는 어느 정도인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "한국 인테리어 영수증 기준 금액·자재명 92~96% 자동 인식. 어긋나는 항목은 한 탭으로 수정되며 그 내역이 AI를 더 똑똑하게 만듭니다."
      }
    },
    {
      "@type": "Question",
      "name": "엑셀로 충분한데 굳이 바꿔야 하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "엑셀은 기록만 하지만 인테리어코치는 기록이 그대로 견적·수금·세금계산서로 이어집니다. 같은 숫자를 두 번 치지 않게 됩니다."
      }
    },
    {
      "@type": "Question",
      "name": "기존에 쓰던 엑셀·카톡 데이터를 옮길 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSV 일괄 업로드가 기본으로 제공되고, 연간 플랜에서는 전담 도입 지원으로 마이그레이션을 도와드립니다."
      }
    },
    {
      "@type": "Question",
      "name": "해지하면 내 데이터는 어떻게 되나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "해지 후 30일 동안 전체 데이터를 엑셀·PDF로 내려받을 수 있습니다. 그 뒤에는 자동 파기되며 사장님 동의 없이 공유되지 않습니다."
      }
    },
    {
      "@type": "Question",
      "name": "보안은 어떻게 관리되나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "국내 데이터센터에 저장·전송 암호화 적용, 워크스페이스 단위 격리, 권한은 역할별 차등. 결제는 토스페이먼츠 표준 절차를 따릅니다."
      }
    }
  ]
}
```

### 삽입 패턴 예시 (Next.js 16)

```tsx
// src/app/page.tsx
import Script from "next/script";

const jsonLdApp = { /* 4-3-A */ };
const jsonLdOrg = { /* 4-3-B */ };
const jsonLdFaq = { /* 4-3-C */ };

export default function Page() {
  return (
    <>
      <Script id="ld-app"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <Script id="ld-org"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
      <Script id="ld-faq"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <LandingPage />
    </>
  );
}
```

---

## 4-4. OG 이미지 사양

### 파일 스펙

| 항목 | 값 |
|---|---|
| 크기 | **1200 × 630 px** (페이스북·네이버·카카오 호환) |
| 형식 | **PNG** (투명도 X) 또는 **JPG 품질 90** |
| 최종 경로 | `public/brand/og-hero.png` (현재 `landing.ts` 의 `/landing/og-hero.png` 경로와 맞춰 재선언 필요 — **둘 중 하나로 일원화**) |
| 파일 크기 | 300 KB 이하 권장 (모바일 로딩) |
| 텍스트 안전 영역 | 중앙 세로 60%, 좌우 여백 120px 이상 |

### 구성 요소

1. **배경**: 다크 그라디언트 `#050505 → #0a0a0a` (배경 톤 일관).
2. **좌측 40%**:
   - 로고 아이콘 (녹색 사각형 + "IC"), 크기 120×120.
   - 워드마크 "인테리어코치" (Geist Bold, `--foreground` 흰색).
3. **좌측 하단**:
   - 핵심 카피 1줄: "사진 찍고 지나가면, AI가 장부를 씁니다." (Geist Bold 60px, white).
   - 서브 1줄: "868건 자재 DB · 12개 모듈 · 한 라인" (Regular 28px, `--muted`).
4. **우측 60%**:
   - 대시보드 목업 스크린샷 (현장 손익 3개 비교 카드 + 월간 리포트 썸네일).
   - 경사 각도 6° 기울여 입체감.
   - 그림자: `rgba(0,196,113,0.2)` 발광 효과.
5. **하단 우측**:
   - 배지 "무료 시작 · 카드 등록 불필요" (녹색 캡슐, 12px radius).

### 금지 요소

- 사람 얼굴 / 스톡 이미지 (진정성 저하).
- 느낌표 3개, 과장 이모지 (🔥🚀).
- 실제 고객명·주소·전화번호.

### 제작 체크리스트

- [ ] 실 배포 URL(`https://interiorcoach.kr/brand/og-hero.png`) 기준 HTTPS 접근 가능
- [ ] 카카오톡·페이스북 공유 디버거에서 미리보기 확인
- [ ] 네이버 OG 미리보기(검색엔진 스니펫) 확인
- [ ] 경로 일원화: `landing.ts` 의 openGraph.images 경로와 실제 파일 경로가 동일

---

## 4-5. Meta 태그 완성형

### 공통 원칙

- **title**: 60자 이내. 브랜드 | 핵심 카피 구조.
- **description**: 120~160자. 키워드 + 차별점 + 행동 유도.
- **keywords**: 구글은 무시하지만 네이버 일부 수집기 대응용으로 5~10개 유지.
- **locale**: `ko_KR` (전 세트 동일).

### 랜딩 `/` 메타 완성형

```tsx
// src/app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "인테리어코치 | 현장·견적·수금·세금까지 한 라인 SaaS",
  description:
    "인테리어 업체 대표를 위한 현장 운영 올인원 SaaS. OCR·AI가 영수증을 자동 분류하고, 자재 단가 DB 868건으로 견적부터 정산·세금계산서까지 한 라인으로 이어집니다. 14일 무료 체험.",
  keywords: [
    "인테리어 업체 관리",
    "현장관리 앱",
    "인테리어 견적 프로그램",
    "인테리어 회계",
    "인테리어 세금계산서",
    "영수증 OCR 인테리어",
    "자재 단가 DB",
    "인테리어 SaaS",
    "공정관리 앱",
    "반장 근태 관리"
  ],
  authors: [{ name: "스몰테이블디자인그룹" }],
  creator: "스몰테이블디자인그룹",
  publisher: "스몰테이블디자인그룹",
  metadataBase: new URL("https://interiorcoach.kr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://interiorcoach.kr/",
    siteName: "인테리어코치",
    title: "인테리어코치 | 현장·견적·수금·세금까지 한 라인 SaaS",
    description:
      "OCR·AI가 영수증을 자동 분류, 자재 단가 DB 868건, 견적부터 정산까지 한 라인. 14일 무료 체험.",
    images: [
      {
        url: "/brand/og-hero.png",
        width: 1200,
        height: 630,
        alt: "인테리어코치 — 사진 찍고 지나가면, AI가 장부를 씁니다.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@realzeroto1",
    creator: "@realzeroto1",
    title: "인테리어코치 | 현장·견적·수금·세금까지 한 라인 SaaS",
    description:
      "OCR·AI 자동 분류 + 자재 DB 868건. 견적부터 정산까지 한 라인.",
    images: ["/brand/og-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};
```

### 레이아웃 `layout.tsx` 공통 메타 (전체 페이지 기본값)

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: "%s | 인테리어코치",
    default: "인테리어코치 — 인테리어 업체 현장 운영 올인원 SaaS",
  },
  description: "현장·견적·수금·세금까지 한 라인. 인테리어 업체 대표를 위한 올인원 B2B SaaS.",
  metadataBase: new URL("https://interiorcoach.kr"),
  icons: {
    icon: "/brand/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
};
```

---

## 4-6. GSC / Naver Webmaster 연결 (후속 과제)

- Google Search Console: `<meta name="google-site-verification" content="..." />` 를 `layout.tsx` `<head>` 에 삽입, 또는 DNS TXT 레코드.
- 네이버 웹마스터 도구: `<meta name="naver-site-verification" content="..." />` 삽입 후 `/sitemap.xml` 등록.
- 본 문서는 삽입 지시만 기록 — 실 토큰은 환경 변수로 관리:
  - `NEXT_PUBLIC_GSC_VERIFICATION`
  - `NEXT_PUBLIC_NAVER_VERIFICATION`

---

## 4-7. 배포 체크리스트

- [ ] `src/app/robots.ts` 생성 및 배포 URL 확인 (`https://interiorcoach.kr/robots.txt`)
- [ ] `src/app/sitemap.ts` 생성 및 동적 QnA 포함 확인
- [ ] `src/app/page.tsx` 에 JSON-LD 3종 삽입 (`Script` 태그)
- [ ] `public/brand/og-hero.png` 파일 실물 생성 + 공유 디버거 통과
- [ ] `src/app/page.tsx` + `src/app/layout.tsx` 메타 전체 세트 이식
- [ ] GSC·네이버 웹마스터에 사이트 등록 + 사이트맵 제출
- [ ] 기존 `/landing/og-hero.png` 참조는 경로 일원화 후 제거
