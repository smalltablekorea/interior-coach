-- Migration: site_chat_and_portal
-- Description: 현장 톡방 + 고객 포털 백엔드 인프라
-- Created: 2026-04-09

-- ─── UP ───

-- 현장 톡방
CREATE TABLE IF NOT EXISTS "site_chat_rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id"),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "title" text NOT NULL,
  "client_portal_slug" text UNIQUE,
  "client_portal_enabled" boolean NOT NULL DEFAULT false,
  "client_portal_password_hash" text,
  "is_sample" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_site_chat_rooms_workspace" ON "site_chat_rooms" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_site_chat_rooms_site" ON "site_chat_rooms" ("site_id");
CREATE INDEX IF NOT EXISTS "idx_site_chat_rooms_slug" ON "site_chat_rooms" ("client_portal_slug") WHERE "client_portal_slug" IS NOT NULL;

-- 메시지
CREATE TABLE IF NOT EXISTS "site_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_id" uuid NOT NULL REFERENCES "site_chat_rooms"("id") ON DELETE CASCADE,
  "sender_id" text REFERENCES "user"("id"),
  "sender_type" text NOT NULL CHECK ("sender_type" IN ('owner', 'team', 'partner', 'client', 'system')),
  "sender_display_name" text NOT NULL,
  "content" text,
  "content_type" text NOT NULL DEFAULT 'text' CHECK ("content_type" IN ('text', 'image', 'file', 'system_event')),
  "reply_to_id" uuid REFERENCES "site_chat_messages"("id"),
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "edited_at" timestamp,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_site_chat_messages_room" ON "site_chat_messages" ("room_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_site_chat_messages_sender" ON "site_chat_messages" ("sender_id") WHERE "sender_id" IS NOT NULL;

-- 첨부파일
CREATE TABLE IF NOT EXISTS "site_chat_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" uuid NOT NULL REFERENCES "site_chat_messages"("id") ON DELETE CASCADE,
  "storage_path" text NOT NULL,
  "file_type" text,
  "file_size" bigint,
  "thumbnail_path" text,
  "exif_taken_at" timestamptz,
  "auto_categorized_tag" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_site_chat_attachments_message" ON "site_chat_attachments" ("message_id");

-- 참여자
CREATE TABLE IF NOT EXISTS "site_chat_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_id" uuid NOT NULL REFERENCES "site_chat_rooms"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id"),
  "role" text NOT NULL CHECK ("role" IN ('owner', 'team', 'partner', 'client')),
  "display_name" text NOT NULL,
  "joined_via" text NOT NULL DEFAULT 'direct' CHECK ("joined_via" IN ('direct', 'invite_link', 'client_portal')),
  "last_read_at" timestamp,
  "notification_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_site_chat_participants_room" ON "site_chat_participants" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_site_chat_participants_user" ON "site_chat_participants" ("user_id") WHERE "user_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_site_chat_participants_room_user" ON "site_chat_participants" ("room_id", "user_id") WHERE "user_id" IS NOT NULL;

-- 사이드바 고정 요약
CREATE TABLE IF NOT EXISTS "site_chat_pinned_summary" (
  "room_id" uuid PRIMARY KEY REFERENCES "site_chat_rooms"("id") ON DELETE CASCADE,
  "current_progress_percent" integer DEFAULT 0,
  "next_milestone_title" text,
  "next_milestone_date" date,
  "pending_payment_amount" bigint DEFAULT 0,
  "pending_payment_due_date" date,
  "open_defects_count" integer DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ─── Trigger: updated_at 자동 갱신 ───

CREATE OR REPLACE FUNCTION update_site_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "site_chat_rooms" SET "updated_at" = now() WHERE "id" = NEW."room_id";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_chat_message_update_room
AFTER INSERT ON "site_chat_messages"
FOR EACH ROW
EXECUTE FUNCTION update_site_chat_room_timestamp();

-- ─── Trigger: pinned_summary 자동 초기화 ───

CREATE OR REPLACE FUNCTION create_pinned_summary_on_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "site_chat_pinned_summary" ("room_id") VALUES (NEW."id")
  ON CONFLICT ("room_id") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_pinned_summary
AFTER INSERT ON "site_chat_rooms"
FOR EACH ROW
EXECUTE FUNCTION create_pinned_summary_on_room();
