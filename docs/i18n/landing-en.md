# InteriorCoach — English Landing, SEO, Legal Scope

> Last updated: 2026-06-23
> Owner: i18n / marketing
> Audience: US market entry + Korea-resident English speakers
> Brand rule: **InteriorCoach** (one word). Never "Interior Coach".

---

## 1. Positioning for the US Market (not a direct translation)

The Korean version targets the pain "엑셀·카톡으로 흩어져 있어 시간 도둑맞는 인테리어 사장님". For the US market, the pain shape is different:

| Korea (current) | US (positioning shift) |
|---|---|
| 사장님 한 명이 운영 + 영업 + 자재선정 + 정산 | Small GC (1–5 person) juggling 8–15 active jobs |
| 카톡 폭발, 엑셀 버전 지옥 | Texting + email chains + spreadsheets across tools |
| 자재 단가 DB 868건이 핵심 차별점 | **Job-level P&L visibility** + **payment milestones** + **client selections** matter more than material DB |
| "사장님" 친근 호칭 | "You" — direct, conversational, but professional |

**US positioning one-liner**:
> **"Every job site, every dollar, every selection — in one place. Built for small interior contractors."**

**Alternative variations**:
- "The operating system for small interior contractors."
- "Stop tracking jobs across 6 tools. One job, one place."
- "Job-level P&L, client selections, and payment schedules — without the spreadsheet hell."

---

## 2. Landing Page Copy (en-US)

### 2-1. Hero

**Eyebrow**
```
Job management for interior contractors
```

**Headline (2 lines)**
```
Run every job site in one place.
Selections, schedules, and payments included.
```

**Subhead**
```
InteriorCoach is the operating system for small interior contractors.
Set up a job in one step. Send clients a selection link. Track P&L per job.
```

**Primary CTA**: `Start free` (links to /auth/signup)
**Secondary CTA**: `Book a 30-min demo` (links to /demo-request)

**Meta line**
```
No credit card · 14-day trial · Free through July 31
```

---

### 2-2. Pain section — "Why you're losing hours every week"

```
You're tracking active jobs across 6+ tools.

Spreadsheets for finish selections. Texts for material approvals.
Email for payment milestones. Paper for the punch list.

Something always falls through the cracks. Usually right before a draw.
```

---

### 2-3. Features — 4 cards

**Card 1: One-step job setup**
> Enter the job name, square footage, and start date. InteriorCoach generates 14 construction phases, a Gantt-style schedule, the contract, and a 4-installment payment schedule. Adjust anything you want.

**Card 2: SpecBook — client selections without the email chain**
> Build a finish catalog once. Send a link to the homeowner. They pick from your approved options — flooring, tile, paint, fixtures, and more. You see their decisions in one screen.

**Card 3: Draw schedule that follows the work**
> Payment milestones tied to actual phases. 2 to 6 installments per job. When the schedule slips, due dates shift with it. No more chasing payments past their date.

**Card 4: Job-level P&L without the spreadsheet**
> Estimate vs. actual on every cost line. Materials, labor, subs, overhead. See profit per job the day you close it out — not three weeks later when QuickBooks catches up.

---

### 2-4. How it works — 3 steps

**Step 1 — Set up your first job in 2 minutes**
> Job name, address, square footage, start date, tier. InteriorCoach lays out the phases and the payment schedule automatically.

**Step 2 — Send selections and contracts from one place**
> SpecBook builds the catalog. The contract pulls from the same data. Your client signs, picks finishes, and you never re-enter anything.

**Step 3 — Run the job — and see the P&L close**
> Phases auto-progress as you log work. Payments fire on the milestones you set. When the punch list closes, the P&L closes with it.

---

### 2-5. Social proof placeholder

```
"I stopped spending Sunday nights building spreadsheets."
— [Beta contractor, 4-person shop, Austin]
```
> Note: replace with real US beta testimonial after launch. Until then, use Korean testimonials translated and clearly attributed.

---

### 2-6. Pricing teaser

```
Pricing built for small shops.
Starter $49/mo · Pro $149/mo · Free through July 31.
```

> Final US pricing pending market test. See [pricing strategy doc] (separate, not in this file).

---

### 2-7. Final CTA

**Headline**
```
Stop running jobs from 6 tools.
```

**Subhead**
```
You can have your first job set up in InteriorCoach in under 5 minutes.
```

**Primary CTA**: `Start free`
**Secondary CTA**: `Book a demo`

---

### 2-8. FAQ (en-US)

| Q | A |
|---|---|
| Is this an estimate tool? | InteriorCoach handles estimating, but it's a job-management platform — selections, schedules, payments, and P&L are first-class, not bolted on. |
| Does my client need an account? | No. SpecBook and progress views work via a link. No signup required for clients. |
| How does it compare to Buildertrend or Houzz Pro? | We're built for the 1–5 person interior contractor who doesn't need a full enterprise build platform. Set up a job in minutes, not an afternoon. |
| Can I import an existing project? | Yes — CSV import for past jobs, clients, and materials. |
| Where does my data live? | Encrypted, US region (AWS / Vercel). Korean operations on a separate region. |
| Is the team based in the US? | The team is based in Seoul. Support hours overlap US Pacific 6 PM – 1 AM. Self-serve documentation in English is comprehensive. |

---

## 3. SEO Keyword Plan

### 3-1. Target keyword themes

| Tier | Theme | Example queries | Intent | Difficulty |
|---|---|---|---|---|
| Core | Construction job management | "construction job management software", "interior contractor software" | Commercial | High |
| Core | Selections / SpecBook | "client selections software", "finish selection tool for contractors" | Commercial | Mid |
| Core | Payment schedule | "construction draw schedule template", "payment schedule software contractors" | Commercial | Mid |
| Long-tail | Small contractor | "best software for small remodeling business" | Commercial | Low |
| Long-tail | Comparisons | "Buildertrend alternative for small contractors", "Houzz Pro vs ..." | Commercial | Low |
| Educational | How-to | "how to write a draw schedule", "how to manage finish selections" | Informational | Low |
| Educational | Industry | "construction phase checklist", "remodel timeline 1000 sqft" | Informational | Mid |

### 3-2. Page-level keyword assignment

| URL | Primary keyword | Secondary | Title (≤60) | Description (≤155) |
|---|---|---|---|---|
| `/en` | interior contractor software | small remodeling | InteriorCoach — Job Management for Interior Contractors | Run every job in one place. Selections, schedules, draws, and job-level P&L for small interior contractors. |
| `/en/pricing` | interior contractor software pricing | construction software cost | Pricing — InteriorCoach | Plans for small interior contractors. Starter $49, Pro $149. Free through July 31. |
| `/en/features/specbook` | client selections software | finish selection tool | SpecBook — Client Selections Without the Email Chain | Build a catalog once. Send clients a link. See finish picks in one screen. |
| `/en/features/job-setup` | construction job setup | one-click project setup | One-Step Job Setup — InteriorCoach | Enter name + square footage + start date. Phases, schedule, contract, and draws auto-generate. |
| `/en/features/payment-schedule` | construction draw schedule | payment milestone software | Draw Schedule — InteriorCoach | 2 to 6 installments per job. Milestones tied to phase progress. |
| `/en/blog/draw-schedule-template` | construction draw schedule template | payment schedule template | How to Write a Draw Schedule (Free Template) | A simple draw schedule template for small remodeling jobs. |
| `/en/blog/finish-selection-checklist` | finish selection checklist | remodel selections list | Finish Selection Checklist for Every Room | Print-ready checklist for client selections — flooring, tile, paint, hardware, lighting. |

### 3-3. Long-tail content plan (90 days)

| Month | Title | Target |
|---|---|---|
| M1 | "How to Write a Draw Schedule" | "construction draw schedule template" |
| M1 | "Finish Selection Checklist for Every Room" | "finish selection checklist" |
| M2 | "Buildertrend vs. InteriorCoach (for Small Contractors)" | "buildertrend alternative" |
| M2 | "Job-Level P&L: What Small Contractors Track" | "construction job profitability" |
| M3 | "Standard Construction Phases for an Interior Remodel" | "construction phase checklist" |
| M3 | "How to Send Finish Selections to a Client (Without Email)" | "client selections process" |

---

## 4. hreflang & URL Structure Plan

### 4-1. URL structure (as-needed locale prefix)

Already implemented in `src/i18n/routing.ts`:
- Korean (default): `https://www.interiorcoach.co.kr/dashboard`
- English: `https://www.interiorcoach.co.kr/en/dashboard`

### 4-2. hreflang tags (add to `<head>` for every public page)

**For Korean default page** (e.g. `/`):
```html
<link rel="alternate" hreflang="ko-KR" href="https://www.interiorcoach.co.kr/" />
<link rel="alternate" hreflang="en-US" href="https://www.interiorcoach.co.kr/en" />
<link rel="alternate" hreflang="x-default" href="https://www.interiorcoach.co.kr/" />
```

**For English page** (e.g. `/en/pricing`):
```html
<link rel="alternate" hreflang="ko-KR" href="https://www.interiorcoach.co.kr/pricing" />
<link rel="alternate" hreflang="en-US" href="https://www.interiorcoach.co.kr/en/pricing" />
<link rel="alternate" hreflang="x-default" href="https://www.interiorcoach.co.kr/pricing" />
```

### 4-3. Action for frontend bot

Add to `src/app/layout.tsx` metadata or per-page `generateMetadata`:

```ts
alternates: {
  canonical: `https://www.interiorcoach.co.kr${pathname}`,
  languages: {
    "ko-KR": `https://www.interiorcoach.co.kr${koPath}`,
    "en-US": `https://www.interiorcoach.co.kr${enPath}`,
    "x-default": `https://www.interiorcoach.co.kr${koPath}`,
  },
},
```

Where `koPath` = canonical path (no locale prefix) and `enPath` = `/en${canonical}`. Same path tree on both locales.

### 4-4. Action for backend bot — sitemap

Update `src/app/sitemap.ts` to emit two entries per public URL (one per locale) with proper `alternates`:

```ts
{
  url: `${BASE}/pricing`,
  lastModified: now,
  alternates: {
    languages: { "ko-KR": `${BASE}/pricing`, "en-US": `${BASE}/en/pricing` },
  },
},
```

Pages that **must** be in both locales:
- `/` (landing)
- `/pricing`
- `/qna` (translate or block for en-US — see Legal §5)
- `/terms` (English version required — see Legal §5)
- `/refund-policy` (English version required)
- `/demo-request`

Pages that **stay Korean-only**:
- Blog posts unless translated
- 견적코치 sub-product pages (Korean-only product currently)
- 동반성장 / 스몰테이블 references

---

## 5. Legal / ToS English Localization Scope

| Document | Korean exists? | English needed? | Scope | Owner |
|---|---|---|---|---|
| Terms of Service (이용약관) | Yes | **Yes, full translation + US-specific clauses** | Liability, dispute resolution, governing law, billing | Legal (not i18n) |
| Privacy Policy (개인정보처리방침) | Yes | **Yes, full translation + US disclosures** | CCPA disclosure, data residency, cookies, third-party processors | Legal |
| Refund Policy (환불 정책) | Yes | **Yes** | 14-day trial, cancellation, refund window | Legal + finance |
| Cookie Notice | Partial | **Yes** | EU/CCPA banner if shipping to EU/CA | Legal |
| Contractor Agreement (for white-label) | No | Not yet | Future | Legal |
| Subprocessor List | No | **Yes** | AWS, Vercel, Resend, Solapi, Anthropic, Toss/Stripe | Legal + engineering |
| Data Processing Addendum (DPA) | No | **Yes if B2B enterprise** | GDPR / CCPA standard contractual clauses | Legal |
| Acceptable Use Policy | No | **Yes** | Spam, abuse, illegal use | Legal |

### 5-1. ToS English — translator instructions

- **Do not direct-translate.** Korean ToS references Korean law (전자상거래법, 개인정보보호법). The English ToS must reference applicable US law:
  - Governing law: Delaware (recommended for SaaS) or Korea (cheaper, but harder for US disputes)
  - Arbitration clause (AAA) if going B2B
  - California CCPA disclosures
  - DMCA notice & takedown
- **Refund policy adjustment**: Korea's 7-day cooling-off rule does not apply to US SaaS the same way. Substitute with 14-day satisfaction guarantee.
- **Tax invoice (세금계산서) section**: Remove from English ToS. Add note: "Tax handling differs by jurisdiction; see Pricing FAQ."

### 5-2. Privacy Policy English — translator instructions

- Required disclosures for US: CCPA (California consumer rights), GLBA if handling financial info (we do — payment data via Stripe), COPPA (n/a, no children).
- Disclose all third-party processors:
  - Vercel (hosting, US)
  - AWS / Neon (database, US)
  - Resend (email, US)
  - Anthropic (AI processing, US)
  - Stripe (payments, US) — when US billing ships
  - Meta (Pixel, optional)
- Add "Right to Delete" / "Right to Know" sections.
- Cookies: list all cookies set (better-auth session, has_workspace flag).

### 5-3. Items the i18n bot DOES not touch

- Legal text drafting → external counsel.
- The i18n bot's job: **flag** Korean phrases in ToS/Privacy that don't translate cleanly, and **list** required US-specific additions (above).

---

## 6. Sub-Brand & Co-Marketing English Style

| Korean | English | Use case |
|---|---|---|
| 스몰테이블 | Smalltable | Parent company. Footer: "© 2026 Smalltable Design Group." |
| 동반성장 프로그램 | Partner Program | Replace literal "Co-growth" with idiomatic US term. |
| 견적코치 | EstimateCoach | Sister product (Korea-only currently, but brand naming consistent). |
| 카톡 채널 | Kakao Channel | Korea-specific; in en-US copy don't reference, use "Email updates" instead. |

---

## 7. Quality Checklist — Before Shipping English Pages

- [ ] Every instance of "Interior Coach" replaced with "InteriorCoach"
- [ ] `i18n:check` passes (no missing keys)
- [ ] Glossary terms used consistently (e.g., always "Wallcovering", never mix with "Wallpaper")
- [ ] Page meta title ≤ 60 chars, description ≤ 155 chars
- [ ] hreflang tags present on every public page (ko-KR, en-US, x-default)
- [ ] Sitemap includes en-US URLs with proper alternates
- [ ] Cookies / Privacy notice respects CCPA for /en/* pages
- [ ] No "Interior Coach" / "interior coach" / "INTERIOR COACH" anywhere
- [ ] No marketing jargon (revolutionize, leverage, synergy, etc. — see glossary.md §10)
- [ ] Currency: USD for US pricing, KRW for Korean pricing (no auto-convert displayed)
- [ ] Unit display: sqft for en-US, m² and 평 for ko-KR (handled by helper, not translation)
- [ ] Date format: `MM/DD/YYYY` for en-US, `YYYY.MM.DD` for ko-KR

---

## 8. Handoff Checklist (when transferring to frontend/backend bot)

**For frontend bot**
- [ ] `messages/en.json` has every key from `ko.json` filled.
- [ ] `i18n:check` passes.
- [ ] hreflang implementation per §4.
- [ ] Date/currency formatting respects locale.

**For backend bot**
- [ ] `name_en` populated per [master-data-en.md](master-data-en.md).
- [ ] `category_en` populated.
- [ ] `code-maps.ts` updated per "Changes vs current code-maps.ts" in master-data-en.md §3, §4.
- [ ] Sitemap emits en-US URLs with alternates.
- [ ] US-specific subprocessor list ready for Privacy Policy.

**For legal counsel (external)**
- [ ] Draft English ToS / Privacy / Refund with US clauses per §5.
- [ ] Review final English landing copy for compliance claims.
