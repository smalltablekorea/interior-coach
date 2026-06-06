-- AI 사용량 로그 (Anthropic 호출당 토큰 집계)
CREATE TABLE IF NOT EXISTS "ai_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "endpoint" text NOT NULL,
  "model" text NOT NULL,
  "input_tokens" integer NOT NULL DEFAULT 0,
  "output_tokens" integer NOT NULL DEFAULT 0,
  "cache_creation_tokens" integer NOT NULL DEFAULT 0,
  "cache_read_tokens" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- 일일 quota 조회용 (user_id, date(created_at))
CREATE INDEX IF NOT EXISTS "ai_usage_user_created_idx"
  ON "ai_usage" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "ai_usage_endpoint_created_idx"
  ON "ai_usage" ("endpoint", "created_at" DESC);
