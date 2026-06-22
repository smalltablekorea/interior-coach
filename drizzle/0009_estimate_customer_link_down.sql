-- Rollback for 0009_estimate_customer_link.sql
-- 주의: customer_id 에 값이 들어있는 행이 있으면 데이터 손실 발생.
-- 운영 환경 롤백 전엔 백업 또는 dry-run 으로 row 수를 확인할 것.
--   SELECT count(*) FROM estimates WHERE customer_id IS NOT NULL;

DROP INDEX IF EXISTS "estimates_customer_idx";

ALTER TABLE "estimates" DROP COLUMN IF EXISTS "customer_id";

-- 컬럼 주석 원복 (이전엔 주석 없었음)
COMMENT ON COLUMN "customers"."status" IS NULL;
