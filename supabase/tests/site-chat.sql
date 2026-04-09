-- pgTAP 테스트: 현장 톡방 + 고객 포털
-- 실행: pg_prove -d interiorcoach supabase/tests/site-chat.sql

BEGIN;
SELECT plan(12);

-- ─── 1. 테이블 존재 확인 ───

SELECT has_table('site_chat_rooms', '톡방 테이블 존재');
SELECT has_table('site_chat_messages', '메시지 테이블 존재');
SELECT has_table('site_chat_attachments', '첨부파일 테이블 존재');
SELECT has_table('site_chat_participants', '참여자 테이블 존재');
SELECT has_table('site_chat_pinned_summary', 'pinned_summary 테이블 존재');

-- ─── 2. 컬럼 확인 ───

SELECT has_column('site_chat_rooms', 'is_sample', 'is_sample 컬럼 존재');
SELECT has_column('site_chat_rooms', 'client_portal_slug', 'client_portal_slug 컬럼 존재');
SELECT has_column('site_chat_messages', 'sender_type', 'sender_type 컬럼 존재');

-- ─── 3. 제약조건 확인 ───

SELECT col_is_pk('site_chat_pinned_summary', 'room_id', 'pinned_summary PK는 room_id');

-- ─── 4. 인덱스 확인 ───

SELECT has_index('site_chat_messages', 'idx_site_chat_messages_room', '메시지 room 인덱스 존재');
SELECT has_index('site_chat_rooms', 'idx_site_chat_rooms_workspace', '톡방 workspace 인덱스 존재');

-- ─── 5. 트리거 확인 ───

SELECT has_trigger('site_chat_rooms', 'trg_create_pinned_summary', 'pinned_summary 자동 생성 트리거');

SELECT * FROM finish();
ROLLBACK;
