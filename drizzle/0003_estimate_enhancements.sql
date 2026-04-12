-- 견적서 공유 토큰
ALTER TABLE "estimates" ADD COLUMN "share_token" TEXT UNIQUE;
ALTER TABLE "estimates" ADD COLUMN "share_expires_at" TIMESTAMP;

-- 견적 변경 이력 (Audit Log)
CREATE TABLE IF NOT EXISTS "estimate_history" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "estimate_id" UUID NOT NULL REFERENCES "estimates"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id"),
  "action" TEXT NOT NULL,
  "changes" JSONB,
  "snapshot" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "idx_estimate_history_estimate_id" ON "estimate_history"("estimate_id");
CREATE INDEX "idx_estimate_history_created_at" ON "estimate_history"("created_at");

-- 견적 템플릿
CREATE TABLE IF NOT EXISTS "estimate_templates" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id"),
  "workspace_id" UUID REFERENCES "workspaces"("id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "building_type" TEXT,
  "area_pyeong" REAL,
  "grade_key" TEXT,
  "items" JSONB NOT NULL,
  "metadata" JSONB,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP
);

CREATE INDEX "idx_estimate_templates_workspace_id" ON "estimate_templates"("workspace_id");
