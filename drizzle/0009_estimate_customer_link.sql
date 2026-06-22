-- 견적 ↔ 고객 직접 연결 추가.
-- 기존엔 estimate → site → customer 로만 연결됐는데,
-- 견적 작성 시 "고객만 선택" 단계가 가능하도록 estimates.customer_id (nullable FK) 신설.
-- nullable 이므로 기존 estimates 행은 모두 NULL 로 남아 영향 없음.

ALTER TABLE "estimates"
  ADD COLUMN IF NOT EXISTS "customer_id" uuid
  REFERENCES "customers"("id");

-- workspace 단위 "고객별 견적 목록" 조회를 빠르게 하기 위한 인덱스.
CREATE INDEX IF NOT EXISTS "estimates_customer_idx"
  ON "estimates" ("customer_id");

-- 고객 상태(customers.status) 는 enum/CHECK 가 아닌 text 컬럼이므로
-- 신규 값(현장실측 / 견적미팅 / 상담중단·취소) 추가에는 DDL 이 필요 없다.
-- 앱 레벨(CUSTOMER_STATUSES, customerSchema.status) 에서만 갱신.
-- 향후 status 를 enum 으로 좁힐 일이 생기면 그때 별도 마이그레이션으로 처리.

COMMENT ON COLUMN "customers"."status" IS
  '상담중, 현장실측, 견적미팅, 계약완료, 시공중, 시공완료, A/S, VIP, 상담중단/취소';
