# Phase 1: 알림 자동화 백엔드

## Goal
시공 현장 이벤트(공정 지연, 수금 기한, 하자 상태 변경)를 감지하여 워크스페이스 멤버에게 인앱 알림 + SMS 자동 발송하는 백엔드 시스템 구축.

## Architecture

```
┌─────────────────┐   ┌──────────────────────┐   ┌────────────────┐
│  Event Sources   │   │  Notification Queue   │   │  Delivery      │
│                  │   │                       │   │                │
│ ● API Routes     │──▶│  notification_queue    │──▶│ ● In-app       │
│   (CRUD 변경 시  │   │  (Drizzle table)      │   │   (notifications│
│    큐에 추가)    │   │                       │   │    table)      │
│                  │   │  Fields:              │   │                │
│ ● Vercel Cron    │──▶│  - event_type         │──▶│ ● SMS/LMS      │
│   (5분 간격      │   │  - payload            │   │   (Solapi API) │
│    수금기한 체크) │   │  - processed          │   │                │
│                  │   │  - retry_count        │   │ ● notification  │
│ ● Feature Flags  │   │  - created_at         │   │   _logs        │
│   (워크스페이스별 │   └──────────────────────┘   └────────────────┘
│    ON/OFF)       │              │
└─────────────────┘              ▼
                    ┌──────────────────────┐
                    │  /api/notifications/  │
                    │  process (Cron)       │
                    │                       │
                    │  1. SELECT queue      │
                    │     WHERE !processed  │
                    │     LIMIT 50          │
                    │  2. Resolve template  │
                    │  3. Send SMS (Solapi) │
                    │  4. Insert in-app     │
                    │  5. Mark processed    │
                    │  6. Log result        │
                    └──────────────────────┘
```

## Tech Stack
- **DB**: Drizzle ORM + Neon PostgreSQL (no Supabase)
- **Queue**: notification_queue table (poll-based, Vercel Cron 5분)
- **SMS**: Solapi REST API (HMAC-SHA256, SMS/LMS auto-switch)
- **Feature Flags**: feature_flags table + helper function
- **Auth**: 기존 requireWorkspaceAuth + CRON_SECRET

## Data Flow

### Event → Queue
1. API route에서 CRUD 수행 시 `enqueueNotification()` 호출
2. Vercel Cron이 5분마다 수금 기한(D-3, D-1, D-Day) 체크 → 큐 추가

### Queue → Delivery
1. Cron이 `/api/notifications/process` POST 호출
2. 미처리 큐 아이템 최대 50건 SELECT (processed=false, retry_count<3)
3. Feature flag 체크 → 비활성이면 skip
4. 워크스페이스 알림 설정 체크 → SMS 비활성이면 인앱만
5. 메시지 템플릿 렌더링 (한국어)
6. Solapi SMS 발송 (rate limit: 10건/초 → 100ms delay)
7. 인앱 알림 INSERT
8. notification_logs INSERT
9. 큐 아이템 processed=true 마킹

### 실패 시나리오
- Solapi 실패 → retry_count++ (3회 초과 시 processed=true + error 로그)
- Cron 중복 실행 → processed_at 체크로 이미 처리된 건 skip
- 대량 일괄 변경 → 큐에 쌓이고 다음 Cron 사이클에서 처리
- 환경변수 누락 → SMS skip, 인앱만 발송

## Tasks

### Task 1: Schema — notification_queue, notification_settings, notification_logs, feature_flags, change_requests
- `src/lib/db/schema.ts` — 5개 테이블 추가
- `drizzle-kit push` — DB 반영

### Task 2: Feature Flag helper
- `src/lib/feature-flags.ts` — isFeatureEnabled(key, workspaceId)

### Task 3: Notification templates
- `src/lib/notifications/templates.ts` — 이벤트별 한국어 메시지 템플릿

### Task 4: Solapi SMS client
- `src/lib/solapi.ts` — HMAC-SHA256 서명, SMS/LMS 자동분기, rate limiting

### Task 5: Queue helper (enqueue + process)
- `src/lib/notifications/queue.ts` — enqueueNotification, processQueue

### Task 6: Cron API — /api/notifications/process
- 큐 처리 + 수금기한 체크 + SMS 발송

### Task 7: Cron API — /api/notifications/check-payments
- D-3, D-1, D-Day 수금 알림 큐 추가

### Task 8: Change request API
- `src/app/api/portal/[token]/change-request/route.ts`

### Task 9: vercel.json cron 설정 + 배포

## Commit Messages
- `feat: add notification queue schema + feature flags`
- `feat: Solapi SMS client + notification templates`
- `feat: notification queue processor + payment cron`
- `feat: customer portal change request API`
- `feat: vercel cron config for notification automation`
