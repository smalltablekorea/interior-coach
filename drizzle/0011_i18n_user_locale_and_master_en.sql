-- i18n Phase 1
--   (a) user.preferred_locale — 로그인 사용자 언어 선호 ("ko" | "en")
--   (b) 마스터 데이터 영어 컬럼 추가 — 모두 nullable, 없으면 한국어로 폴백
--       대상: cwicr_items, gyeonjeok_category_map, materials
--       제외: brand / supplier (고유명사) / memo (자유 입력) / material_orders (스냅샷)

-- ── (a) user.preferred_locale
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "preferred_locale" text NOT NULL DEFAULT 'ko';

-- ── (b) cwicr_items 영어 필드
ALTER TABLE "cwicr_items"
  ADD COLUMN IF NOT EXISTS "item_name_en" text,
  ADD COLUMN IF NOT EXISTS "category_en" text,
  ADD COLUMN IF NOT EXISTS "subcategory_en" text;

-- ── (b) gyeonjeok_category_map 영어 필드
ALTER TABLE "gyeonjeok_category_map"
  ADD COLUMN IF NOT EXISTS "gyeonjeok_category_en" text;

-- ── (b) materials 영어 필드
ALTER TABLE "materials"
  ADD COLUMN IF NOT EXISTS "name_en" text,
  ADD COLUMN IF NOT EXISTS "category_en" text;
