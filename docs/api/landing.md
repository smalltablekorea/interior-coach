# 랜딩페이지 리뉴얼 API

랜딩페이지 전환 최적화를 위해 추가한 엔드포인트.

## 마이그레이션

- `drizzle/0005_landing_demo_and_events.sql` — `demo_requests`, `landing_events` 테이블 생성
- `drizzle/0005_landing_demo_and_events_down.sql` — 롤백

적용:

```bash
psql $DATABASE_URL < drizzle/0005_landing_demo_and_events.sql
```

## 환경변수

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER_NUMBER` | 기존 Solapi 설정 (신청 알림 SMS) | — |
| `DEMO_REQUEST_NOTIFY_NUMBER` | 신규 데모 신청 시 관리자에게 LMS를 받을 번호 | `ADMIN_PHONE` fallback |
| `SYSTEM_ADMIN_EMAILS` | 시스템 관리자 이메일 (쉼표 구분) | `smalltablekorea@gmail.com` |

---

## 퍼블릭 엔드포인트

### `POST /api/demo-request`

랜딩에서 데모 신청 접수.

**요청 본문**

```json
{
  "companyName": "스몰테이블",
  "ownerName": "배다솜",
  "phone": "010-1234-5678",
  "email": "owner@example.com",
  "companySize": "small",
  "currentPain": "카톡 단톡방 관리가 힘들어요",
  "source": "threads"
}
```

- `phone`: 010/02 등 한국 번호. 하이픈/공백 자동 제거.
- `companySize`: `solo` | `small` | `medium` | `large`
- `currentPain`, `source`는 optional.

**보안/제약**
- IP당 분당 3회 (버킷: `demo-request`)
- 같은 이메일·전화 24시간 내 재신청 → 409

**응답**
- 201/200: `{ success: true, id, message }`
- 성공 직후 Solapi로 다솜에게 LMS + 신청자에게 접수 확인 SMS를 fire-and-forget 발송. 발송 실패해도 응답은 성공.

---

### `POST /api/track-event`

랜딩 이벤트 수집. 프론트에서 `navigator.sendBeacon` 또는 `fetch`로 fire-and-forget 호출.

**요청 본문**

```json
{
  "sessionId": "s_abc123",
  "eventType": "cta_click",
  "sectionName": "hero",
  "ctaName": "hero-primary",
  "scrollDepth": 75,
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "q2-launch",
  "referrer": "https://www.google.com/"
}
```

- `eventType`: `page_view` | `section_view` | `cta_click` | `scroll_depth`
- IP 미저장, user-agent만 저장 (브라우저 분포 분석용)
- IP당 분당 120회 soft limit

**응답**
- 항상 `204 No Content` (DB 실패 포함해 스왈로우)

---

### `GET /api/pricing-plans`

랜딩/가격 섹션에 렌더링할 플랜 목록. 프론트는 하드코딩 없이 이 응답을 그대로 렌더링.

**응답**

```json
{
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "nameKo": "무료",
      "description": "...",
      "monthlyPrice": 0,
      "yearlyPrice": 0,
      "features": ["현장 3개 관리", "..."],
      "recommended": false,
      "ctaLabel": "무료로 시작하기",
      "contactOnly": false
    },
    { "id": "starter", "...": "..." },
    { "id": "pro", "recommended": true, "...": "..." },
    { "id": "enterprise", "contactOnly": true, "...": "..." }
  ]
}
```

- `yearlyPrice`: 연간 결제 시 **총액** (`yearlyMonthlyPrice × 12`). 프론트에서 월 환산/할인율 계산.

---

## 관리자 전용 엔드포인트

모두 `requireSystemAdmin` 통과 필요:
- Better Auth 세션이 있고
- `SYSTEM_ADMIN_EMAILS`에 포함되거나 `user.role === "admin"`

### `GET /api/demo-request`

최근 데모 신청 200건 (`createdAt DESC`). 간이 조회용.

### `GET /api/admin/demo-requests`

쿼리:
- `status` — `new|contacted|scheduled|done`
- `cursor` — ISO 날짜, 그 이전 건 반환
- `limit` — 1~200 (기본 50)

**응답**

```json
{
  "items": [...],
  "total": 123,
  "nextCursor": "2026-04-18T09:00:00.000Z" ,
  "statusCounts": [{ "status": "new", "count": 12 }, ...]
}
```

### `PATCH /api/admin/demo-requests/:id`

상태/메모/스케줄 업데이트. 상태 전환 시 타임스탬프 자동 기록:
- `contacted` → `contacted_at`
- `done` → `completed_at`

**요청**

```json
{ "status": "contacted", "memo": "3월 15일 오후 2시 예정", "scheduledAt": "2026-04-23T05:00:00.000Z" }
```

### `GET /api/admin/landing-stats?days=14`

일자별 집계 (Asia/Seoul 기준, 연속 일자 버킷). `days`: 1~90 (기본 14).

**응답**

```json
{
  "range": { "days": 14, "since": "2026-04-06T..." },
  "daily": [
    { "day": "2026-04-06", "pageView": 312, "sectionView": 912, "ctaClick": 48, "scrollDepth": 1020, "demoRequests": 3 },
    ...
  ],
  "topCtas": [{ "ctaName": "hero-primary", "count": 87 }, ...]
}
```

---

## 체험 구독 플로우

**가입 시 자동 시작** — `POST /api/auth/sign-up/email` 후 `startTrialForNewUser(userId)`가
`subscriptions`에 `{ plan: "pro", status: "trialing", trialEndsAt: +14d }` 행을 생성한다.
기존 행이 있으면 멱등하게 스킵.

**일일 배치** — `/api/cron/trial-reminders` (Vercel Cron, 매일 01:00 UTC = 10:00 KST).
- 종료 3일 전 ±12h → 리마인드 SMS, `billing_cycle='trial-reminded'`로 중복 방지
- 종료 당일 이후 → `plan=free`, `status=active`로 전환 + 종료 안내 SMS

`CRON_SECRET` 헤더로 보호됨 (`createCronRoute` 공통 처리).

---

## 테스트 체크리스트

- [ ] 마이그레이션 적용 후 `demo_requests`, `landing_events` 존재
- [ ] `POST /api/demo-request` 유효값 → 200, `demo_requests` 1행, 관리자에게 LMS 도착
- [ ] 같은 이메일+전화 재신청 → 409
- [ ] 분당 4번째 요청 → 429
- [ ] `POST /api/track-event` → 204, `landing_events` 1행
- [ ] 잘못된 payload → 204 (스왈로우)
- [ ] `GET /api/pricing-plans` → 4개 플랜 반환
- [ ] 비관리자 계정으로 `/api/admin/*` → 403
- [ ] 관리자 계정으로 `GET /api/admin/landing-stats?days=7` → daily 7건
- [ ] 회원가입 → `subscriptions.status='trialing'`, `trial_ends_at = +14d`
- [ ] Cron 수동 호출 → `cron_execution_logs`에 성공 기록
