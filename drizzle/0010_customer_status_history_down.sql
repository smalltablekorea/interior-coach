-- Rollback for 0010_customer_status_history.sql
-- 테이블 전체 삭제 — 보관할 이력 행이 있다면 백업 후 실행.
--   SELECT count(*) FROM customer_status_history;

DROP INDEX IF EXISTS "customer_status_history_customer_idx";
DROP TABLE IF EXISTS "customer_status_history";
