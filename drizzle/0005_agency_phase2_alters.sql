-- Migration: agency_phase2_alters
-- Description: 마케팅 대행 Phase 2 — agency_weekly_uploads 보관 정책 컬럼
-- Created: 2026-05-13

-- ─── UP ───

ALTER TABLE "agency_weekly_uploads"
  ADD COLUMN IF NOT EXISTS "retain_until" timestamp;

CREATE INDEX IF NOT EXISTS "idx_agency_weekly_uploads_retain"
  ON "agency_weekly_uploads"("retain_until")
  WHERE "retain_until" IS NOT NULL;

-- ─── DOWN ───
-- DROP INDEX IF EXISTS "idx_agency_weekly_uploads_retain";
-- ALTER TABLE "agency_weekly_uploads" DROP COLUMN IF EXISTS "retain_until";
