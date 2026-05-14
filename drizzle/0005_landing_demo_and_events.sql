-- 랜딩페이지 리뉴얼: 데모 신청 + 이벤트 트래킹
-- 데모 신청 접수, 랜딩 이벤트 수집 (PV/섹션뷰/CTA/스크롤)

CREATE TABLE IF NOT EXISTS "demo_requests" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_name" TEXT NOT NULL,
  "owner_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company_size" TEXT NOT NULL,
  "current_pain" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "notified_at" TIMESTAMP,
  "contacted_at" TIMESTAMP,
  "scheduled_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "memo" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "demo_requests_company_size_chk"
    CHECK ("company_size" IN ('solo','small','medium','large')),
  CONSTRAINT "demo_requests_status_chk"
    CHECK ("status" IN ('new','contacted','scheduled','done'))
);

-- 상태별/최근 신청 조회 인덱스
CREATE INDEX IF NOT EXISTS "idx_demo_requests_status_created"
  ON "demo_requests"("status", "created_at" DESC);

-- 중복 방지 조회 (같은 이메일+전화 24h 내 재신청 차단)
CREATE INDEX IF NOT EXISTS "idx_demo_requests_dedupe"
  ON "demo_requests"("email", "phone", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "landing_events" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "section_name" TEXT,
  "cta_name" TEXT,
  "scroll_depth" INTEGER,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "referrer" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "landing_events_type_chk"
    CHECK ("event_type" IN ('page_view','section_view','cta_click','scroll_depth'))
);

-- 통계 집계용 (일자별 이벤트)
CREATE INDEX IF NOT EXISTS "idx_landing_events_created_type"
  ON "landing_events"("created_at" DESC, "event_type");

-- 세션 기반 퍼널 조회
CREATE INDEX IF NOT EXISTS "idx_landing_events_session"
  ON "landing_events"("session_id", "created_at");
