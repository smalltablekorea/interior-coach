-- 현장 중심 데이터 통합 — 한 번 입력으로 자식(고객/계약/대금분할/공정/일정) 자동 생성
-- 변경 요약:
--   sites.scope                   공사범위(예: 전체 / 부분 / 부분-주방 등)
--   construction_phases.task_name 공종 + 개별 작업명 보관 (기존 category 는 공종만)
--   payment_splits (신규)         고정형 contract_payments 대체용 분할표 (2~6개, 항목명/순서/예정일)
--   site_schedules (신규)         공종/작업 단위 일정 (캘린더 항목, 공정 진행과 별개)

ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "scope" text;

ALTER TABLE "construction_phases" ADD COLUMN IF NOT EXISTS "task_name" text;

CREATE TABLE IF NOT EXISTS "payment_splits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "contract_id" uuid NOT NULL REFERENCES "contracts"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL,
  "item_name" text NOT NULL,
  "amount" integer NOT NULL,
  "status" text NOT NULL DEFAULT '예정',
  "scheduled_date" date,
  "paid_date" date,
  "memo" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "payment_splits_contract_idx"
  ON "payment_splits" ("contract_id");

CREATE TABLE IF NOT EXISTS "site_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "workspace_id" uuid REFERENCES "workspaces"("id"),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "trade" text NOT NULL,
  "task_name" text,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "memo" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "site_schedules_site_idx"
  ON "site_schedules" ("site_id");
