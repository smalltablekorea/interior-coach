-- Rollback for 0011_i18n_user_locale_and_master_en.sql
-- 주의: 영어 컬럼에 번역 데이터가 들어있다면 모두 소실. 운영 적용 전 백업 필수.
--   SELECT count(*) FROM cwicr_items WHERE item_name_en IS NOT NULL;
--   SELECT count(*) FROM materials WHERE name_en IS NOT NULL;
--   SELECT count(*) FROM gyeonjeok_category_map WHERE gyeonjeok_category_en IS NOT NULL;
--   SELECT count(*) FROM "user" WHERE preferred_locale <> 'ko';

ALTER TABLE "materials"
  DROP COLUMN IF EXISTS "category_en",
  DROP COLUMN IF EXISTS "name_en";

ALTER TABLE "gyeonjeok_category_map"
  DROP COLUMN IF EXISTS "gyeonjeok_category_en";

ALTER TABLE "cwicr_items"
  DROP COLUMN IF EXISTS "subcategory_en",
  DROP COLUMN IF EXISTS "category_en",
  DROP COLUMN IF EXISTS "item_name_en";

ALTER TABLE "user"
  DROP COLUMN IF EXISTS "preferred_locale";
