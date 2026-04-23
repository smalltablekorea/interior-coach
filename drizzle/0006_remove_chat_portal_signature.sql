-- Part A 철거: 톡방 / 고객 포털 / 전자서명 / 추적 / 커뮤니케이션 로그 / 사진 코멘트
-- 전제: 운영 DB에서 백업(pg_dump) 완료 후 실행.
-- 의존 순서: 자식 → 부모. CASCADE로 트리거/뷰도 정리됨.

BEGIN;

-- 0. 트리거 및 함수 (0001 마이그레이션에서 정의)
DROP TRIGGER IF EXISTS trg_create_pinned_summary ON site_chat_rooms;
DROP TRIGGER IF EXISTS trg_site_chat_message_update_room ON site_chat_messages;
DROP FUNCTION IF EXISTS create_pinned_summary_on_room();
DROP FUNCTION IF EXISTS update_site_chat_room_timestamp();

-- 1. 톡방 관련 (자식 → 부모)
DROP TABLE IF EXISTS site_chat_pinned_summary CASCADE;
DROP TABLE IF EXISTS site_chat_attachments CASCADE;
DROP TABLE IF EXISTS site_chat_messages CASCADE;
DROP TABLE IF EXISTS site_chat_participants CASCADE;
DROP TABLE IF EXISTS site_chat_rooms CASCADE;

-- 2. 고객 포털
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS customer_portal_tokens CASCADE;

-- 3. 전자서명 추적
DROP TABLE IF EXISTS tracking_page_views CASCADE;
DROP TABLE IF EXISTS tracking_links CASCADE;
DROP TABLE IF EXISTS signature_requests CASCADE;

-- 4. 커뮤니케이션 로그 + 사진 코멘트
DROP TABLE IF EXISTS communication_logs CASCADE;
DROP TABLE IF EXISTS photo_comments CASCADE;

COMMIT;
