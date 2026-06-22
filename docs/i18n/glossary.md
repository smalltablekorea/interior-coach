# InteriorCoach — Korean ↔ English Glossary

> Last updated: 2026-06-23
> Owner: i18n / localization
> Scope: Single source of truth for every Korean ↔ English term used in UI, DB, marketing, contracts.
> Rule: **Same Korean term ⇒ same English term, everywhere.**

---

## 0. Brand & Product Names (NEVER translate, NEVER change casing)

| Korean | English (locked) | Notes |
|---|---|---|
| 인테리어코치 | **InteriorCoach** | One word, camel case. **Never** "Interior Coach", "interiorcoach", or "INTERIOR COACH". |
| 견적코치 | **EstimateCoach** | Sibling product. Same convention as InteriorCoach. |
| 스몰테이블 / 스몰테이블디자인그룹 | **Smalltable** / **Smalltable Design Group** | Parent company. |
| 스펙북 | **SpecBook** | One word, camel case. Module name inside InteriorCoach. |
| 견적코치 AI | **EstimateCoach AI** | AI is uppercase, space before "AI" allowed. |

**Approved usage examples**
- "InteriorCoach helps Korean interior contractors manage every job site in one place." ✅
- "Sign in to InteriorCoach to access SpecBook." ✅
- "Powered by Smalltable Design Group." ✅
- ❌ "Interior Coach"
- ❌ "interior coach"
- ❌ "Spec book"

---

## 1. Trades / 공종 (US construction industry standard)

The primary list lives in `src/lib/estimate-engine.ts` (CATS array, 15 trades) and `src/i18n/code-maps.ts` (TRADE_LABELS, 35 secondary codes). When a Korean trade appears in any UI, contract, estimate, or invoice, it must map to exactly the English term below.

### 1-1. Primary trade categories (CATS — 15)

| Code | Korean | English | Notes for US contractors |
|---|---|---|---|
| `demolition` | 철거공사 | **Demolition** | Standard. |
| `plumbing` | 설비공사 | **Mechanical & Plumbing** | "Mechanical" covers HVAC/water/sewer; matches US contractor scope better than "Plumbing" alone. |
| `electrical` | 전기공사 | **Electrical** | Standard. |
| `window` | 창호공사 | **Windows & Doors** | Includes 샷시 (sash). |
| `carpentry` | 목공사 | **Carpentry** | Includes framing + finish carpentry. |
| `tile` | 타일공사 | **Tile Work** | "Tiling" reads British; US uses "Tile work". |
| `bathroom` | 욕실도기 | **Bathroom Fixtures** | Includes toilets, sinks, shower enclosure, faucets. |
| `paint` | 도장공사 | **Painting** | Standard. |
| `wallpaper` | 도배공사 | **Wallcovering** | US contractors say "wallcovering installation"; "wallpaper" is consumer term. |
| `kitchen` | 주방가구 | **Kitchen Cabinetry** | Cabinets + countertops + island. Range hood listed separately. |
| `furniture` | 가구(신발장 등) | **Built-in Furniture** | Built-ins: closets, shoe storage, wardrobes. |
| `flooring` | 바닥(마루) | **Flooring** | Hardwood / engineered / SPC / vinyl. |
| `film` | 필름공사 | **Adhesive Film** | Industry term for self-adhesive vinyl wraps on doors / cabinets / trim. |
| `door` | 도어 | **Interior Doors** | Inner doors only; entry doors covered under Windows & Doors. |
| `etc` | 기타공사 | **Other** | Catch-all. |

### 1-2. Secondary trades (TRADE_LABELS in code-maps.ts — 35 codes)

| Korean | English | Notes |
|---|---|---|
| 철거 | Demolition | |
| 설비 | Mechanical & Plumbing | |
| 전기 | Electrical | |
| 창호 | Windows & Doors | |
| 목공 | Carpentry | |
| 타일 | Tile Work | |
| 도배 | Wallcovering | |
| 도장 | Painting | |
| 금속 | Metalwork | |
| 필름 | Adhesive Film | |
| 가구 | Furniture | |
| 세라믹 | Ceramic | |
| 도기 | Sanitaryware | Sinks, toilets, fixtures. |
| 중문 | Inner Door | |
| 도어 | Door | |
| 철물 | Hardware | Hinges, locks, knobs. |
| 유리 | Glass | |
| 거울 | Mirror | |
| IoT | IoT | Lock as-is. |
| 커텐 | Window Treatments | "Curtain" is partial; "window treatments" is the US industry term (curtains + blinds + shades). |
| 장판 | Sheet Vinyl Flooring | "Vinyl flooring" is ambiguous (vs SPC); "sheet vinyl" disambiguates. |
| 강마루 | Engineered Wood Flooring | 강마루 ≠ Laminate. It's engineered hardwood. US term: "engineered wood". |
| 원목마루 | Solid Hardwood Flooring | |
| 후드 | Range Hood | |
| 돔천장 | Domed Ceiling | |
| 실리콘 | Caulking | US contractors say "caulking" for silicone sealant work. |
| 보양 | Site Protection | |
| 양중 | Material Hoisting | |
| 촬영 | Photography | |
| 입주민동의서 | Resident Consent Form | |
| 입주청소 | Final Cleaning | "Move-in cleaning" is direct; US contractor norm is "final cleaning" at project end. |
| 폐기물 | Waste Disposal | |
| 이사 | Moving | |
| 조명 | Lighting | |
| 기타 | Other | |

---

## 2. Product Concepts (InteriorCoach-specific)

| Korean | English | Use case |
|---|---|---|
| 현장 | **Job site** (UI) / **Project** (contracts) | UI prefers "Job site"; contracts/legal use "Project". |
| 현장 등록 | **Add a job site** | Button label / CTA. Avoid "Create project" in UI. |
| 현장 한 번에 등록 | **One-step job site setup** | Feature name. |
| 작업지시서 | **Work order** | Standard US construction term. |
| 대금 분할 | **Payment schedule** | Industry term. Each row = "installment" or "draw". |
| 계약금 | **Deposit** | |
| 착수금 | **Mobilization payment** | "Mobilization fee" is also used; "payment" preferred for consistency. |
| 중도금 | **Progress payment** | US construction industry standard. "Interim payment" sounds legal. |
| 잔금 | **Final payment** | |
| 자재비 | **Materials payment** | When used as a payment milestone. |
| 기성 1차/2차/3차 | **Draw #1 / #2 / #3** | "Draw" is the standard US term for progress-based releases. |
| 하자보수보증금 | **Warranty retainage** | |
| 공정 | **Phase** | Construction phase. Same as "stage". |
| 공정표 | **Project schedule** | Gantt-style visual. Avoid "Gantt chart" in UI. |
| 일정 | **Schedule** | |
| 견적 | **Estimate** | Plural: "estimates". |
| 견적서 | **Estimate document** / **Estimate PDF** | |
| 계약 | **Contract** | |
| 계약서 | **Contract document** | |
| 정산 | **Settlement** / **Job-level P&L** | "Settlement" in UI is fine; for marketing prefer "Job-level P&L" (clearer to US contractors). |
| 정산 리포트 | **Settlement report** | |
| 수금 | **Collections** | |
| 미수금 | **Receivables** | |
| 지출 | **Expenses** | |
| 영수증 | **Receipt** | |
| 세금계산서 | **Tax invoice** | Korean-specific document; explain in onboarding for US users. |
| 부가세 | **VAT** | Korea-specific; for US version use "Sales tax" or "Tax" depending on context. |
| 자재 | **Materials** | |
| 자재 DB | **Materials library** | "Database" sounds technical; "library" is consumer-friendly. |
| 자재 발주 | **Material order** | |
| 자재 카탈로그 | **Materials catalog** | (SpecBook module concept) |
| 마감재 | **Finish materials** | |
| 공종별 마감재 선택안 | **Finish selections by trade** | SpecBook UI label. |
| 고객 자재 선택 링크 | **Client selection link** | |
| 고객 포털 | **Client portal** | |
| 워크스페이스 | **Workspace** | |
| 사장님 | **You** (UI) / **Contractor** (docs) / **Site owner** (system) | Korean "사장님" is honorific; in English UI use direct second person "you". In marketing/docs use "contractor". |
| 반장 | **Foreman** | |
| 기사 | **Tradesperson** | "Worker" is too generic; "tradesperson" matches US union convention. |
| 작업자 | **Worker** | |
| 인테리어 업체 | **Interior contractor** | "Interior business" is direct but reads odd; "interior contractor" is US standard. |
| 시공사 | **General contractor** | |
| 건축주 | **Owner** | |

---

## 3. Customer / Site Statuses

### 3-1. Customer status (9-state funnel + flags)

Already defined in [docs/customer-status-spec/spec.md](../customer-status-spec/spec.md). Mirror here for translation alignment.

| Slug | Korean | English |
|---|---|---|
| `consulting` | 상담중 | **In Consultation** |
| `site_visit` | 현장실측 | **Site Measurement** |
| `estimate_meeting` | 견적미팅 | **Estimate Meeting** |
| `contracted` | 계약완료 | **Contracted** |
| `in_progress` | 시공중 | **In Progress** |
| `completed` | 시공완료 | **Completed** |
| `as_service` | A/S | **After-sales** |
| `paused` | 상담중단 | **On Hold** |
| `canceled` | 취소 | **Canceled** |
| (flag) | VIP | **VIP** |

### 3-2. Site status (6 states — from SITE_STATUS_LABELS)

| Korean | English |
|---|---|
| 상담중 | In Consultation |
| 견적중 | Quoting |
| 계약완료 | Contracted |
| 시공중 | In Progress |
| 시공완료 | Completed |
| A/S | After-sales |

### 3-3. Phase status

| Korean | English |
|---|---|
| 예정 | Scheduled |
| 진행중 | In Progress |
| 완료 | Done |
| 보류 | On Hold |

### 3-4. Estimate status

| Korean | English |
|---|---|
| 작성중 | Draft |
| 발송 | Sent |
| 승인 | Approved |
| 거절 | Declined |

> ⚠️ Update: `거절` was previously "Rejected" in code-maps.ts. **Standardize to "Declined"** — "rejected" implies refusal; "declined" matches US sales context (the prospect declined the estimate).

### 3-5. Order status (material orders)

| Korean | English |
|---|---|
| 발주 | Ordered |
| 배송중 | In Transit |
| 입고 | Received |
| 취소 | Canceled |

> Update: `배송중` was "Shipping" — change to **"In Transit"** for clarity.

---

## 4. Building Types

| Korean | English |
|---|---|
| 아파트 | Apartment |
| 빌라 | Multi-family Home |
| 오피스텔 | Live/Work Unit |
| 상가 | Commercial |
| 주택 | Single-family Home |
| 사무실 | Office |
| 기타 | Other |

> Notes for US market: 아파트 ≠ US "apartment" exactly (Korea's 아파트 is owned, US apartment is rented). For US-facing marketing, prefer "Condo / Apartment". For internal UI keep "Apartment".
> 빌라 ≠ US "Villa". Closest equivalent is "Multi-family home" or "Townhouse".

---

## 5. Materials — Categories, Grades, Units

### 5-1. Material categories (extending existing CategoryEn)

| Korean | English (DB `category_en`) |
|---|---|
| 가구 | Furniture |
| 도배 | Wallcovering |
| 도어 | Doors |
| 목공 | Carpentry |
| 목자재 | Lumber & Sheet Goods |
| 바닥 | Flooring |
| 보일러 | Boiler |
| 샷시 | Windows |
| 설비 | Mechanical & Plumbing |
| 에어컨 | HVAC |
| 욕실 | Bathroom |
| 전기 | Electrical |
| 주방 | Kitchen |
| 중문 | Inner Door |
| 타일 | Tile |
| 필름 | Adhesive Film |
| 기타 | Other |

### 5-2. Material grades

| Korean | English |
|---|---|
| 일반 | Standard |
| 중급 | Mid-grade |
| 고급 | Premium |

### 5-3. Project tier (GRADES — estimate-engine)

| Code | Korean | English |
|---|---|---|
| `basic` | 베이직 | Basic |
| `economy` | 실속형 | Economy |
| `standard` | 스탠다드 | Standard |
| `comfort` | 컴포트 | Comfort |
| `premium` | 프리미엄 | Premium |
| `highend` | 하이엔드 | High-End |
| `luxury` | 럭셔리 | Luxury |
| `ultralux` | 시그니처 | Signature |

### 5-4. Units of measurement

| Korean | English | Notes |
|---|---|---|
| 개 | EA | Industry shorthand for "each". |
| 박스 | Box | |
| m² | sqft for US market display | DB stores m². US-facing display converts to sqft (1 m² ≈ 10.764 sqft). UI shows whichever based on locale. |
| 롤 | Roll | |
| 식 | Lot | |
| m | m (or ft for US) | Same conversion logic as area. |
| 평 | pyeong (Korea) / sqft (US) | 1 평 ≈ 35.58 sqft. For US display, convert. |

> ⚠️ Unit conversion is a runtime concern (pickLocale helper), not translation. Glossary lists labels only.

---

## 6. Region (Korea-only — keep ko-only in US version)

| Korean | English |
|---|---|
| 전국 | Nationwide |
| 서울 | Seoul |
| 경기 | Gyeonggi Province |
| 인천 | Incheon |
| 부산 | Busan |
| 대구 | Daegu |
| 광주 | Gwangju |
| 대전 | Daejeon |
| 미상 | Unknown |

> For US market expansion, this list is replaced with US states (TX, CA, NY, ...) — separate `REGION_US_LABELS` map.

---

## 7. Plan / Subscription Labels

| Korean | English |
|---|---|
| 무료 (Free) | Free |
| 스타터 | Starter |
| 프로 | Pro |
| 엔터프라이즈 | Enterprise |
| 체험중 | Trial |
| 결제 완료 | Active |
| 해지 | Canceled |
| 갱신 예정 | Renewing |

---

## 8. UI Patterns — Approved Translations

These are short, high-frequency UI strings. Translate consistently across all screens.

| Korean | English |
|---|---|
| 저장 | Save |
| 저장하기 | Save |
| 취소 | Cancel |
| 삭제 | Delete |
| 수정 | Edit |
| 닫기 | Close |
| 확인 | OK |
| 뒤로 | Back |
| 다음 | Next |
| 검색 | Search |
| 추가 | Add |
| 제거 | Remove |
| 더보기 | More |
| 전체 | All |
| 데이터가 없습니다 | No data |
| 예 / 아니오 | Yes / No |
| 불러오는 중… | Loading… |
| 진행률 | Progress |
| 새로고침 | Refresh |
| 발송 | Send |
| 발행 | Issue |
| 복사 | Copy |
| 다운로드 | Download |
| 업로드 | Upload |
| 내보내기 | Export |
| 가져오기 | Import |
| 정렬 | Sort |
| 필터 | Filter |
| 활성화 / 비활성화 | Enable / Disable |
| 켜기 / 끄기 | On / Off |
| 한 번 입력하면 끝 | Enter once, done. |
| 자동으로 깔립니다 | Auto-generated |
| 사장님이 조정 가능 | You can adjust |
| 미리보기 | Preview |
| 단계 바꾸기 | Change status |
| 단계 추가 | Add row |
| 비율 (%) | Ratio (%) |
| 받는 날 / 받은 날 | Due date / Paid date |
| 완납 | Paid |
| 미수 | Outstanding |
| 일부 받음 | Partial |
| 새 고객 등록 | Add new client |
| 기존 고객 불러오기 | Pick from existing clients |

---

## 9. Reserved / Do-Not-Translate

| Term | Reason |
|---|---|
| InteriorCoach, EstimateCoach, SpecBook, Smalltable | Brand. |
| Brand names of materials (한샘, LX, 동화, 노바리아 …) | Proper nouns. Keep as-is even in English UI. |
| Supplier names | Proper nouns. |
| User-entered memo, notes, free-text descriptions | Free text — no translation. |
| Korea-specific legal docs (사업자등록번호, 세금계산서 ID) | Domain-specific; keep with explanation in English UI footnotes. |
| 평 (when shown in Korea-locale UI) | Korea-specific unit; convert to sqft only in US-locale UI. |

---

## 10. Forbidden English Marketing Jargon (do not use)

Use plain US business English. **Never** use these:

| ❌ Avoid | ✅ Use instead |
|---|---|
| Solution / Platform | (the actual feature) |
| Game-changer | (skip) |
| Best-in-class, world-class | (skip) |
| Synergy | (skip) |
| Revolutionize, transform | improve, streamline |
| Empower | help, let you |
| Leverage | use |
| Cutting-edge, next-gen | new |
| Onboard (as verb) | get started |
| Persona / funnel / pipeline / SSOT | (don't use in user-facing copy) |
| Disrupt | (skip) |
| Ecosystem | (skip) |
| AI-powered (as decoration) | (only if it's literally the differentiator) |

---

## 11. Glossary Governance

1. **Single source**: this file. Any disagreement between this file and code-maps.ts → this file wins, update code-maps.ts.
2. **Adding a new term**: PR must update this glossary first.
3. **Changing an existing term**: requires reviewing every UI screen that uses it (search by Korean string in repo).
4. **DB master data** (materials catalog, region list, etc.): English values must match this glossary exactly. See `master-data-en.md`.
5. **Review cadence**: quarterly, or when a major feature ships.
