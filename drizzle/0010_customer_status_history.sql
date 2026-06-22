-- 고객 진행상태 변경 이력. PUT /api/customers/[id] 에서 status 가 바뀔 때마다 1행 INSERT.
-- 생성 시점에도 1행을 남겨 "최초 상태 = 상담중 (또는 명시 값)" 을 기록.
-- 기존 고객 데이터엔 이력이 없을 수 있으므로, 화면에서 빈 이력은 "기록 없음" 으로 처리.

CREATE TABLE IF NOT EXISTS "customer_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "workspaces"("id"),
  -- 변경 이전 상태. 최초 생성 시엔 NULL.
  "from_status" text,
  -- 변경 이후 상태. 항상 채워짐.
  "to_status" text NOT NULL,
  -- 변경 주체 user.id. 시스템 자동(예: 마이그레이션) 인 경우 NULL.
  "changed_by" text REFERENCES "user"("id"),
  -- 자유 메모 (선택). 예: "고객이 일정 변경 요청"
  "note" text,
  "changed_at" timestamp NOT NULL DEFAULT now()
);

-- 고객별 타임라인 조회 빠르게.
CREATE INDEX IF NOT EXISTS "customer_status_history_customer_idx"
  ON "customer_status_history" ("customer_id", "changed_at" DESC);
