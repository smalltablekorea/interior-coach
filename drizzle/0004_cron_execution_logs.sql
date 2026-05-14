-- AI-14: CRON 작업 모니터링
-- Vercel CRON 핸들러 실행 결과를 기록한다.
-- 실패 시 알림(Slack/이메일)과 연속 실패 에스컬레이션의 근거 데이터.

CREATE TABLE IF NOT EXISTS "cron_execution_logs" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cron_name" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "processed" INTEGER DEFAULT 0,
  "duration_ms" INTEGER NOT NULL,
  "metadata" JSONB,
  "error_message" TEXT,
  "error_stack" TEXT,
  "started_at" TIMESTAMP NOT NULL,
  "completed_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 연속 실패 판정 + 최근 실행 조회용 인덱스
CREATE INDEX IF NOT EXISTS "idx_cron_execution_logs_name_completed"
  ON "cron_execution_logs"("cron_name", "completed_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_cron_execution_logs_success"
  ON "cron_execution_logs"("success", "completed_at" DESC);
