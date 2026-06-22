# Master Data — English Values (`name_en`, `category_en`)

> Last updated: 2026-06-23
> Owner: i18n
> Purpose: English values for DB columns that the backend bot inserts/updates. Use the rows verbatim — copy/paste into SQL `UPDATE` statements or the backend bot's seed script.
> Reference: [glossary.md](glossary.md) is the source of truth. This file is the operational handoff for DB seed.

---

## 1. Materials Table — `category_en`

Apply via:
```sql
UPDATE materials SET category_en = '<value>' WHERE category = '<korean>';
```

CSV-style (paste into backend bot's seed script):

| category (ko) | category_en |
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

---

## 2. Materials Table — `name_en` (top 100 frequently used)

Each row: Korean name → suggested English. Backend bot to apply via `UPDATE materials SET name_en = '<value>' WHERE name = '<ko>'`.

### Flooring
| name (ko) | name_en |
|---|---|
| 강마루 | Engineered Wood Flooring |
| 원목마루 | Solid Hardwood Flooring |
| 장판 | Sheet Vinyl Flooring |
| SPC 마루 | SPC Flooring |
| 헤링본 마루 | Herringbone Flooring |
| 마루 걸레받이 | Floor Baseboard |
| 마루 접착제 | Floor Adhesive |
| 비탈 마감재 | Floor Reducer Strip |

### Wallcovering
| name (ko) | name_en |
|---|---|
| 실크 벽지 | Vinyl Wallcovering |
| 합지 벽지 | Paper Wallcovering |
| 친환경 벽지 | Eco-friendly Wallcovering |
| 포인트 벽지 | Accent Wallcovering |
| 벽지 풀 | Wallcovering Paste |
| 벽지 프라이머 | Wallcovering Primer |

### Tile
| name (ko) | name_en |
|---|---|
| 욕실 바닥 타일 | Bathroom Floor Tile |
| 욕실 벽 타일 | Bathroom Wall Tile |
| 주방 바닥 타일 | Kitchen Floor Tile |
| 주방 벽 타일 (포세린) | Kitchen Porcelain Wall Tile |
| 현관 타일 | Entry Tile |
| 줄눈제 | Tile Grout |
| 타일 접착제 | Tile Adhesive |
| 본드 | Bonding Agent |

### Bathroom
| name (ko) | name_en |
|---|---|
| 양변기 | Toilet |
| 비데 | Bidet |
| 세면대 | Bathroom Sink |
| 수전 (세면대) | Sink Faucet |
| 수전 (욕조) | Tub Faucet |
| 샤워 부스 | Shower Enclosure |
| 욕조 | Bathtub |
| 거울 (욕실) | Bathroom Mirror |
| 액세서리 (수건걸이) | Towel Bar |

### Kitchen
| name (ko) | name_en |
|---|---|
| 싱크대 | Kitchen Sink |
| 싱크대 도어 | Cabinet Door |
| 상판 (인조대리석) | Engineered Stone Countertop |
| 상판 (세라믹) | Ceramic Countertop |
| 상판 (스톤) | Natural Stone Countertop |
| 후드 | Range Hood |
| 가스레인지 | Gas Range |
| 인덕션 | Induction Cooktop |
| 빌트인 식기세척기 | Built-in Dishwasher |

### Door & Hardware
| name (ko) | name_en |
|---|---|
| 방문 (실내) | Interior Door |
| 현관문 | Entry Door |
| 중문 (슬라이딩) | Sliding Inner Door |
| 중문 (스윙) | Swing Inner Door |
| 도어 손잡이 | Door Handle |
| 도어 경첩 | Door Hinge |
| 실린더 자물쇠 | Cylinder Lock |
| 디지털 도어록 | Digital Door Lock |

### Windows
| name (ko) | name_en |
|---|---|
| 시스템 창호 | System Window |
| 일반 창호 | Standard Window |
| 발코니 도어 | Balcony Door |
| 이중창 | Double-pane Window |
| 삼중창 | Triple-pane Window |

### Electrical
| name (ko) | name_en |
|---|---|
| 스위치 | Switch |
| 콘센트 | Outlet |
| 분전반 | Electrical Panel |
| 배선 | Wiring |
| 다운라이트 | Downlight |
| 등기구 | Light Fixture |
| 펜던트 조명 | Pendant Light |
| LED 바 | LED Strip |

### Mechanical & Plumbing
| name (ko) | name_en |
|---|---|
| 급수 배관 | Supply Piping |
| 배수 배관 | Drain Piping |
| 방수 시공 | Waterproofing |
| 보일러 (가정용) | Residential Boiler |

### Carpentry
| name (ko) | name_en |
|---|---|
| 합판 | Plywood |
| MDF | MDF (Medium-Density Fiberboard) |
| 몰딩 | Trim Molding |
| 걸레받이 | Baseboard |
| 우물천장 | Coffered Ceiling |
| 간접 조명 박스 | Cove Lighting Box |
| 루버 | Louver |

### Furniture
| name (ko) | name_en |
|---|---|
| 붙박이장 | Built-in Wardrobe |
| 신발장 | Shoe Cabinet |
| 드레스룸 | Dressing Room |
| 수납장 | Storage Cabinet |

### Film
| name (ko) | name_en |
|---|---|
| 인테리어 필름 (도어) | Door Adhesive Film |
| 인테리어 필름 (몰딩) | Trim Adhesive Film |
| 인테리어 필름 (싱크대) | Cabinet Adhesive Film |
| 랩핑 필름 | Wrap Film |
| 시트지 | Decorative Vinyl |

### Other
| name (ko) | name_en |
|---|---|
| 실리콘 | Silicone Sealant |
| 입주청소 | Final Cleaning Service |
| 폐기물 처리 (1t) | Waste Disposal (1T Vehicle) |
| 양중 | Material Hoisting |
| 미화 | Janitorial |

> Backend bot: when inserting new materials, also fill name_en using this glossary. If no match, leave NULL and flag for review.

---

## 3. Trade Codes — Already in code-maps.ts

The 14 primary trades + 35 secondary trades are listed in [glossary.md §1](glossary.md#1-trades--공종-us-construction-industry-standard). The backend bot should pull translations from `TRADE_LABELS` in `src/i18n/code-maps.ts`, not duplicate them in DB.

**Action required**: update `TRADE_LABELS` in `src/i18n/code-maps.ts` with these corrections:

```ts
// CHANGES vs current code-maps.ts:
설비:     { ko: "설비",     en: "Mechanical & Plumbing" },   // was "Plumbing"
타일:     { ko: "타일",     en: "Tile Work" },               // was "Tiling"
도배:     { ko: "도배",     en: "Wallcovering" },            // was "Wallpapering"
필름:     { ko: "필름",     en: "Adhesive Film" },           // was "Film Wrap"
커텐:     { ko: "커텐",     en: "Window Treatments" },       // was "Curtain"
장판:     { ko: "장판",     en: "Sheet Vinyl Flooring" },    // was "Vinyl Flooring"
강마루:   { ko: "강마루",   en: "Engineered Wood Flooring" },// was "Laminate Flooring"
원목마루: { ko: "원목마루", en: "Solid Hardwood Flooring" }, // was "Hardwood Flooring"
실리콘:   { ko: "실리콘",   en: "Caulking" },                // was "Silicone Sealing"
입주청소: { ko: "입주청소", en: "Final Cleaning" },          // was "Move-in Cleaning"
```

---

## 4. Status Codes — Updates to `code-maps.ts`

```ts
// ESTIMATE_STATUS_LABELS
거절: { ko: "거절", en: "Declined" },    // was "Rejected"

// ORDER_STATUS_LABELS
배송중: { ko: "배송중", en: "In Transit" },  // was "Shipping"
```

---

## 5. Customer / Site Status — Final values

```ts
// CUSTOMER_STATUS_LABELS  (existing)
상담중:           { ko: "상담중",           en: "In Consultation" },   // refine from "Consulting"
현장실측:         { ko: "현장실측",         en: "Site Measurement" },
견적미팅:         { ko: "견적미팅",         en: "Estimate Meeting" },  // refine from "Quote Meeting"
계약완료:         { ko: "계약완료",         en: "Contracted" },
시공중:           { ko: "시공중",           en: "In Progress" },
시공완료:         { ko: "시공완료",         en: "Completed" },
"A/S":            { ko: "A/S",              en: "After-sales" },
VIP:              { ko: "VIP",              en: "VIP" },
"상담중단/취소":  { ko: "상담중단/취소",    en: "On Hold / Canceled" }, // was "Discontinued/Canceled"

// SITE_STATUS_LABELS — match same rules
상담중: en: "In Consultation"   // was "Consulting"
견적중: en: "Quoting"            // ok
계약완료: en: "Contracted"       // ok
시공중: en: "In Progress"        // ok
시공완료: en: "Completed"        // ok
"A/S": en: "After-sales"         // ok
```

---

## 6. Plan Tier (GRADES) — `gradeLabel_en`

Add column `grade_label_en` to your tier table, or use a runtime map:

```ts
const GRADE_LABEL_EN: Record<string, string> = {
  basic:    "Basic",
  economy:  "Economy",
  standard: "Standard",
  comfort:  "Comfort",
  premium:  "Premium",
  highend:  "High-End",
  luxury:   "Luxury",
  ultralux: "Signature",
};
```

---

## 7. Building Type — `building_type_en`

```ts
const BUILDING_TYPE_EN: Record<string, string> = {
  아파트:   "Apartment",          // US display: "Condo / Apartment"
  빌라:     "Multi-family Home",  // was "Villa"
  오피스텔: "Live/Work Unit",     // was "Officetel"
  상가:     "Commercial",
  주택:     "Single-family Home", // was "House"
  사무실:   "Office",
  기타:     "Other",
};
```

---

## 8. Region — Korea (existing) + US (new for expansion)

Korea list unchanged. Add new `REGION_US_LABELS` map for US version:

```ts
export const REGION_US_LABELS: Readonly<Record<string, LabelPair>> = {
  Nationwide:   { ko: "전국 (미국)",      en: "Nationwide" },
  CA:           { ko: "캘리포니아",      en: "California" },
  TX:           { ko: "텍사스",          en: "Texas" },
  NY:           { ko: "뉴욕",            en: "New York" },
  FL:           { ko: "플로리다",        en: "Florida" },
  IL:           { ko: "일리노이",        en: "Illinois" },
  WA:           { ko: "워싱턴",          en: "Washington" },
  GA:           { ko: "조지아",          en: "Georgia" },
  // ... extend to all 50 states when needed
};
```

> Backend bot decides which map to load based on workspace locale. UI just calls `translateRegion(locale, code)`.

---

## 9. Handoff Notes for Backend Bot

1. Use [glossary.md](glossary.md) as the single source of truth.
2. When a new material/trade/region is added, **first** update glossary.md, **then** code-maps.ts, **then** insert DB rows.
3. NULL is acceptable for `name_en` if no glossary match — `pickLocale` helper falls back to `name`. Don't auto-translate; flag for human review.
4. For free-text columns (`memo`, `supplier`, `brand`, `description`), **do not translate** at the DB layer. Translation (if any) happens at display time only.
5. Idempotency: all `UPDATE materials SET name_en = ... WHERE name = ...` statements are safe to re-run. Use `WHERE name_en IS NULL OR name_en = ''` to avoid overwriting human edits.
