-- Migration: agency_marketing
-- Description: 마케팅 대행 모듈 Phase 1 — 클라이언트/포털토큰/주간업로드/콘텐츠잡/초안/발행/알림/리포트
-- Created: 2026-05-13

-- ─── UP ───

-- 대행 클라이언트 (스몰테이블이 서비스하는 인테리어 업체)
CREATE TABLE IF NOT EXISTS "agency_clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "operator_workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "linked_workspace_id" uuid REFERENCES "workspaces"("id"),
  "business_name" text NOT NULL,
  "contact_person" text,
  "contact_phone" text,
  "contact_email" text,
  "brand_tone" jsonb,
  "target_audience" text,
  "categories" jsonb,
  "region" text,
  "naver_blog_url" text,
  "threads_handle" text,
  "instagram_business_id" text,
  "contract_start" date,
  "contract_months" integer NOT NULL DEFAULT 3,
  "monthly_price" integer NOT NULL DEFAULT 300000,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "deleted_at" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_agency_clients_operator" ON "agency_clients"("operator_workspace_id");
CREATE INDEX IF NOT EXISTS "idx_agency_clients_linked" ON "agency_clients"("linked_workspace_id");
CREATE INDEX IF NOT EXISTS "idx_agency_clients_status" ON "agency_clients"("status");

-- 클라이언트 포털 토큰 (약정 기간 장기 토큰, 회전/폐기 정책 지원)
CREATE TABLE IF NOT EXISTS "agency_client_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'active',
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_used_at" timestamp,
  "rotated_to_token_id" uuid REFERENCES "agency_client_portal_tokens"("id"),
  "revoked_at" timestamp,
  "revoked_by" text REFERENCES "user"("id"),
  "revoked_reason" text
);
CREATE INDEX IF NOT EXISTS "idx_agency_portal_tokens_client" ON "agency_client_portal_tokens"("client_id");
CREATE INDEX IF NOT EXISTS "idx_agency_portal_tokens_status" ON "agency_client_portal_tokens"("status");

-- 브랜드 자산 (과거 시공 사례, 스타일 레퍼런스)
CREATE TABLE IF NOT EXISTS "agency_brand_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "image_url" text NOT NULL,
  "caption" text,
  "uploaded_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_agency_brand_assets_client" ON "agency_brand_assets"("client_id");

-- 주간 시공 사진 업로드 (클라이언트 → 운영자)
CREATE TABLE IF NOT EXISTS "agency_weekly_uploads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "week_of_date" date NOT NULL,
  "image_urls" jsonb NOT NULL,
  "notes_text" text,
  "uploaded_via" text NOT NULL DEFAULT 'portal',
  "uploaded_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_agency_weekly_uploads_client_week" ON "agency_weekly_uploads"("client_id", "week_of_date");

-- 콘텐츠 생성 잡 (채널별)
CREATE TABLE IF NOT EXISTS "agency_content_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "weekly_upload_id" uuid REFERENCES "agency_weekly_uploads"("id"),
  "channel" text NOT NULL,
  "status" text NOT NULL DEFAULT 'generating',
  "generation_attempts" integer NOT NULL DEFAULT 0,
  "ai_input_snapshot" jsonb,
  "generated_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_agency_content_jobs_client_status" ON "agency_content_jobs"("client_id", "status");
CREATE INDEX IF NOT EXISTS "idx_agency_content_jobs_created" ON "agency_content_jobs"("created_at");

-- 콘텐츠 초안 (job 1:1, image_markers는 위치 메타 포함, material_citations는 Phase 3 자재 단가 검증용 선행 슬롯)
CREATE TABLE IF NOT EXISTS "agency_content_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid NOT NULL UNIQUE REFERENCES "agency_content_jobs"("id") ON DELETE CASCADE,
  "title" text,
  "body_markdown" text NOT NULL,
  "hashtags" jsonb,
  "image_markers" jsonb,
  "material_citations" jsonb,
  "qc_score" integer,
  "qc_feedback" text,
  "qc_passed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 발행 기록 (네이버는 publish_started_at/duration 측정, SNS는 publish_started_at NULL)
CREATE TABLE IF NOT EXISTS "agency_publications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "draft_id" uuid NOT NULL REFERENCES "agency_content_drafts"("id") ON DELETE CASCADE,
  "channel" text NOT NULL,
  "publish_started_at" timestamp,
  "published_at" timestamp,
  "publish_duration_seconds" integer,
  "external_post_url" text,
  "search_rank_check_scheduled_at" timestamp,
  "search_rank_result" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_agency_publications_draft" ON "agency_publications"("draft_id");
CREATE INDEX IF NOT EXISTS "idx_agency_publications_published_at" ON "agency_publications"("published_at");

-- 운영자 알림 (이상 케이스만)
CREATE TABLE IF NOT EXISTS "agency_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "job_id" uuid REFERENCES "agency_content_jobs"("id") ON DELETE SET NULL,
  "publication_id" uuid REFERENCES "agency_publications"("id") ON DELETE SET NULL,
  "type" text NOT NULL,
  "severity" text NOT NULL DEFAULT 'warning',
  "message" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp,
  "resolved_by" text REFERENCES "user"("id")
);
CREATE INDEX IF NOT EXISTS "idx_agency_alerts_client" ON "agency_alerts"("client_id");
CREATE INDEX IF NOT EXISTS "idx_agency_alerts_unresolved" ON "agency_alerts"("created_at") WHERE "resolved_at" IS NULL;

-- 월간 리포트
CREATE TABLE IF NOT EXISTS "agency_monthly_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "agency_clients"("id") ON DELETE CASCADE,
  "year_month" text NOT NULL,
  "total_published" integer NOT NULL DEFAULT 0,
  "search_visibility" jsonb,
  "avg_publish_time_seconds" integer,
  "report_url" text,
  "generated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "agency_monthly_reports_client_month_idx" UNIQUE("client_id", "year_month")
);
CREATE INDEX IF NOT EXISTS "idx_agency_monthly_reports_client" ON "agency_monthly_reports"("client_id");

-- ─── DOWN ───
-- 롤백 시 (역순):
-- DROP TABLE IF EXISTS "agency_monthly_reports";
-- DROP TABLE IF EXISTS "agency_alerts";
-- DROP TABLE IF EXISTS "agency_publications";
-- DROP TABLE IF EXISTS "agency_content_drafts";
-- DROP TABLE IF EXISTS "agency_content_jobs";
-- DROP TABLE IF EXISTS "agency_weekly_uploads";
-- DROP TABLE IF EXISTS "agency_brand_assets";
-- DROP TABLE IF EXISTS "agency_client_portal_tokens";
-- DROP TABLE IF EXISTS "agency_clients";
