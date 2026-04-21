# AI-65 결제 시스템 완성 테스트 가이드

## 구현된 기능

### 1. 결제 실패 재시도 시스템
- **재시도 스케줄**: 1차(6시간), 2차(24시간), 3차(72시간)
- **스마트 에러 분류**: 재시도 가능/불가능 에러 자동 판단
- **자동 구독 복구**: 재시도 성공시 구독 상태 자동 복원

### 2. 웹훅 검증 강화
- **중복 처리 방지**: Toss Event ID 기반 idempotency
- **완전한 감사 추적**: 모든 웹훅 수신/처리 내역 기록
- **에러 핸들링**: 웹훅 처리 실패 시 상태 추적

### 3. 데이터베이스 스키마 확장
- **billingRecords**: retryCount, nextRetryAt, lastRetryAt, maxRetries
- **webhookDeliveries**: 웹훅 수신/처리 이력 관리

## 테스트 방법

### 자동 테스트 실행
```bash
# 전체 기능 테스트
npx tsx scripts/test-payment-retry.ts
```

### 수동 테스트

#### 1. 데이터베이스 마이그레이션 확인
```sql
-- billingRecords 테이블에 새 필드 확인
SELECT retry_count, next_retry_at, last_retry_at, max_retries 
FROM billing_records LIMIT 1;

-- webhookDeliveries 테이블 존재 확인
SELECT COUNT(*) FROM webhook_deliveries;
```

#### 2. 재시도 로직 테스트
```bash
# 재시도 CRON 수동 실행 (CRON_SECRET 필요)
curl -X POST http://localhost:3000/api/billing/cron/retry \
  -H "Authorization: Bearer $CRON_SECRET"
```

#### 3. 웹훅 idempotency 테스트
```bash
# 동일한 웹훅을 2번 전송하여 중복 처리되지 않는지 확인
curl -X POST http://localhost:3000/api/billing/webhook \
  -H "toss-signature: [올바른_시그니처]" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "BILLING.PAYMENT.DONE", "data": {"id": "test-event-123", ...}}'

# 같은 요청을 다시 전송 - "Already processed" 응답 확인
```

#### 4. Vercel CRON 확인
```json
// vercel.json에서 CRON 스케줄 확인
{
  "crons": [
    {
      "path": "/api/billing/cron",
      "schedule": "0 */6 * * *"  // 6시간마다
    },
    {
      "path": "/api/billing/cron/retry", 
      "schedule": "30 */6 * * *" // 6시간마다 (30분 오프셋)
    }
  ]
}
```

## 환경 변수 확인

배포 전 다음 환경변수들이 설정되어 있는지 확인:

```bash
DATABASE_URL=postgresql://...
TOSS_SECRET_KEY=test_sk_...
TOSS_WEBHOOK_SECRET=...
CRON_SECRET=...
RESEND_API_KEY=... (알림용)
```

## 예상 동작 시나리오

### 시나리오 1: 결제 실패 → 자동 재시도
1. 정기결제 실행 중 카드 잔액 부족으로 실패
2. `billing.ts`에서 재시도 가능한 에러로 판단
3. `nextRetryAt`을 6시간 후로 설정
4. 6시간 후 CRON이 재시도 실행
5. 성공시 구독 활성화, 실패시 24시간 후 재스케줄

### 시나리오 2: 웹훅 중복 수신
1. Toss에서 결제 완료 웹훅 전송
2. 네트워크 문제로 응답 지연
3. Toss에서 동일 웹훅 재전송
4. 두 번째 웹훅은 "Already processed"로 무시
5. 결제 상태는 중복 업데이트되지 않음

### 시나리오 3: 영구 실패 처리
1. 카드 만료로 결제 실패
2. `INVALID_CARD_EXPIRATION` 에러 코드 확인
3. 재시도 불가능한 에러로 판단
4. `maxRetries`를 0으로 설정하여 재시도 중단
5. 사용자에게 카드 교체 요청 알림

## 모니터링 포인트

### 핵심 지표
- **재시도 성공률**: 전체 실패 대비 재시도 성공 비율
- **웹훅 처리율**: 웹훅 수신 대비 성공 처리 비율
- **중복 웹훅 비율**: 전체 웹훅 중 중복 처리 시도 비율

### 로그 확인
```bash
# 재시도 CRON 로그
grep "Billing Retry CRON" /var/log/vercel.log

# 웹훅 처리 로그  
grep "Toss Webhook" /var/log/vercel.log

# 에러 패턴 모니터링
grep "Max retries exceeded\|Non-retryable error" /var/log/vercel.log
```

## 알려진 제한사항

1. **CRON 실행 간격**: Vercel의 최소 CRON 간격은 1분이므로 더 짧은 재시도는 불가
2. **동시성 제어**: 동일 사용자의 결제가 동시에 재시도되는 것을 방지하는 락 없음
3. **웹훅 순서**: 웹훅이 순서대로 도착한다고 가정 (실제로는 순서가 바뀔 수 있음)

## 문제 발생시 체크리스트

- [ ] 데이터베이스 마이그레이션 완료 확인
- [ ] 환경변수 설정 확인 (특히 CRON_SECRET)
- [ ] Vercel CRON 배포 및 활성화 확인
- [ ] Toss 웹훅 엔드포인트 URL 업데이트
- [ ] 알림 시스템 (Resend) 연동 확인