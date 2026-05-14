-- Part A 철거 롤백 — 드롭된 12 테이블 재생성 + 인덱스 + 트리거 복구
-- 주의: 데이터 복구는 이 스크립트로 불가. pg_dump 백업 restore 필요.

BEGIN;

-- ─── 1. communication_logs (0000 원본 DDL) ───
CREATE TABLE IF NOT EXISTS "communication_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL,
  "user_id" text,
  "workspace_id" uuid,
  "date" date NOT NULL,
  "type" text NOT NULL,
  "content" text,
  "staff_name" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "communication_logs_customer_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
  CONSTRAINT "communication_logs_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id"),
  CONSTRAINT "communication_logs_workspace_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
);

-- ─── 2. customer_portal_tokens ───
CREATE TABLE IF NOT EXISTS "customer_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_portal_tokens_customer_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
);

-- ─── 3. photo_comments ───
CREATE TABLE IF NOT EXISTS "photo_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "photo_id" uuid NOT NULL,
  "user_id" text,
  "author_name" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "photo_comments_photo_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "site_photos"("id") ON DELETE CASCADE,
  CONSTRAINT "photo_comments_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
);

-- ─── 4. change_requests (schema.ts 참조) ───
CREATE TABLE IF NOT EXISTS "change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "workspace_id" uuid,
  "token_id" uuid,
  "customer_name" text NOT NULL,
  "category" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "photo_urls" jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "reviewed_by" text,
  "review_note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "change_requests_site_id_fk"
    FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE,
  CONSTRAINT "change_requests_workspace_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id"),
  CONSTRAINT "change_requests_token_id_fk"
    FOREIGN KEY ("token_id") REFERENCES "customer_portal_tokens"("id")
);

-- ─── 5. signature_requests ───
CREATE TABLE IF NOT EXISTS "signature_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "site_id" uuid,
  "document_type" text NOT NULL,
  "document_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "requested_by" text NOT NULL,
  "signer_name" text NOT NULL,
  "signer_email" text,
  "signer_phone" text,
  "signer_token" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'pending',
  "signed_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "signature_image_url" text,
  "signed_ip" text,
  "signed_user_agent" text,
  "document_hash" text,
  "pdf_url" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "signature_requests_workspace_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id"),
  CONSTRAINT "signature_requests_site_id_fk"
    FOREIGN KEY ("site_id") REFERENCES "sites"("id"),
  CONSTRAINT "signature_requests_requested_by_fk"
    FOREIGN KEY ("requested_by") REFERENCES "user"("id")
);

-- ─── 6. tracking_links ───
CREATE TABLE IF NOT EXISTS "tracking_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "site_id" uuid,
  "token" text NOT NULL UNIQUE,
  "target_type" text NOT NULL,
  "target_id" uuid,
  "target_url" text NOT NULL,
  "recipient_name" text,
  "recipient_contact" text,
  "created_by" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "total_views" integer NOT NULL DEFAULT 0,
  "unique_views" integer NOT NULL DEFAULT 0,
  "last_viewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tracking_links_workspace_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id"),
  CONSTRAINT "tracking_links_site_id_fk"
    FOREIGN KEY ("site_id") REFERENCES "sites"("id"),
  CONSTRAINT "tracking_links_created_by_fk"
    FOREIGN KEY ("created_by") REFERENCES "user"("id")
);

-- ─── 7. tracking_page_views ───
CREATE TABLE IF NOT EXISTS "tracking_page_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "link_id" uuid NOT NULL,
  "session_id" text NOT NULL,
  "viewer_ip" text,
  "user_agent" text,
  "referrer" text,
  "section" text,
  "scroll_depth" integer,
  "dwell_time_seconds" integer DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "last_ping_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  CONSTRAINT "tracking_page_views_link_id_fk"
    FOREIGN KEY ("link_id") REFERENCES "tracking_links"("id") ON DELETE CASCADE
);

-- ─── 8~12. site_chat_* (drizzle/0001_site_chat_and_portal.sql 원본 참조) ───
-- 테이블·인덱스·트리거 풀 복구는 0001을 다시 실행:
--   psql $DATABASE_URL -f drizzle/0001_site_chat_and_portal.sql

COMMIT;
