-- Migration DOWN: site_chat_and_portal
-- Rollback: 현장 톡방 + 고객 포털 백엔드 인프라 제거

DROP TRIGGER IF EXISTS trg_create_pinned_summary ON "site_chat_rooms";
DROP FUNCTION IF EXISTS create_pinned_summary_on_room();

DROP TRIGGER IF EXISTS trg_site_chat_message_update_room ON "site_chat_messages";
DROP FUNCTION IF EXISTS update_site_chat_room_timestamp();

DROP TABLE IF EXISTS "site_chat_pinned_summary" CASCADE;
DROP TABLE IF EXISTS "site_chat_participants" CASCADE;
DROP TABLE IF EXISTS "site_chat_attachments" CASCADE;
DROP TABLE IF EXISTS "site_chat_messages" CASCADE;
DROP TABLE IF EXISTS "site_chat_rooms" CASCADE;
