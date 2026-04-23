# 인테리어코치 백엔드 현황 조사 보고서

생성일: 2026-04-20
스택 메모: **Neon PostgreSQL + Drizzle ORM + Better Auth v1.5.6**. Supabase 미사용(레포 내 `supabase/` 폴더는 pgTAP 테스트와 TypeScript 시드 스크립트만 포함, Neon DB 전제로 동작).

프로젝트 루트: `/Users/justin/클로드코드 지난거/인테리어코치`
schema 파일: `src/lib/db/schema.ts` (1598라인, 87 테이블)
API 라우트: `src/app/api/**/route.ts` (142 파일)

---

## 1. DB 테이블 (총 87개)

> RLS 정책: **해당 없음** — Drizzle/Neon은 애플리케이션 레벨 멀티테넌시 격리. 거의 모든 테이블에 `workspace_id`(FK→`workspaces.id`) + `user_id`(FK→`user.id`) 컬럼이 존재하며 `src/lib/api-auth.ts`의 `requireWorkspaceAuth()`가 `user.activeWorkspaceId` + `workspace_members` 조인으로 필터링.

### companies
- 테이블: `companies` (레거시)
- 정의: `src/lib/db/schema.ts:18`
- PK: `id uuid default random`
- 필드: `name text NOT NULL`, `ceo_name text`, `business_number text UNIQUE`, `phone text`, `address text`, `plan text NOT NULL default 'free'`, `plan_expires_at timestamp`, `created_at`, `deleted_at`
- 참조: `user.company_id` → `companies.id`

### workspaces (멀티테넌트 루트)
- 정의: `schema.ts:33`
- PK: `id uuid`
- Unique: `slug`, `invite_code`
- 필드: `name`, `business_type default 'residential'`, `business_number`, `owner_id text NOT NULL`, `invite_expires_at`, `plan default 'free'`, `max_members int default 5`, `created_at`, `updated_at`

### user (Better Auth)
- 정의: `schema.ts:50`
- PK: `id text`
- Unique: `email`
- 필드: `name NOT NULL`, `email_verified bool default false`, `image`, `phone`, `company_id uuid → companies.id`, `role text default 'owner'` (owner|manager|worker|admin), `active_workspace_id uuid`, `created_at`, `updated_at`

### session (Better Auth)
- 정의: `schema.ts:64`
- PK: `id text`; Unique: `token`
- FK: `user_id → user.id`

### account (Better Auth)
- 정의: `schema.ts:77`
- PK: `id text`
- FK: `user_id → user.id`
- 필드: OAuth 토큰/비밀번호 저장 (`access_token`, `refresh_token`, `id_token`, `password` 등)

### verification (Better Auth)
- 정의: `schema.ts:95`
- PK: `id text`; 필드: `identifier`, `value`, `expires_at`

### workspace_members
- 정의: `schema.ts:106`
- PK: `id uuid`
- FK: `workspace_id → workspaces.id ON DELETE CASCADE`, `user_id → user.id`
- Unique: `(workspace_id, user_id)` via `workspace_members_workspace_user_idx`
- `role` default `member` (owner|admin|manager|member|viewer)

### workspace_permissions
- 정의: `schema.ts:120`
- FK: `workspace_id → workspaces.id ON DELETE CASCADE`, `member_id → workspace_members.id ON DELETE CASCADE`
- Unique: `(member_id, category)`
- `category` 값: site_management|estimates|marketing|accounting|customers|settings 등
- `access_level` default `none` (none|read|write|admin)

### workspace_invitations
- 정의: `schema.ts:134`
- FK: `workspace_id → workspaces.id ON DELETE CASCADE`, `invited_by → user.id`
- Unique: `token`
- `status` default `pending`

### customers
- 정의: `schema.ts:152`
- FK: `user_id → user.id`, `workspace_id → workspaces.id`
- `status` default `상담중`; `referred_by uuid` (self-reference 의도로 보이나 FK 미정의)

### sites
- 정의: `schema.ts:172`
- FK: `user_id → user.id`, `workspace_id → workspaces.id`, `customer_id → customers.id`
- `status`, `building_type`, `area_pyeong`, `progress int default 0`, `budget bigint`, `spent bigint`, `trades jsonb`

### estimates
- 정의: `schema.ts:198`
- FK: `user_id`, `workspace_id`, `site_id`
- Unique: `share_token`
- 필드: `version`, `total_amount`, `profit_rate`, `overhead_rate`, `vat_enabled`, `status`, `metadata jsonb`, `share_expires_at`

### estimate_items
- 정의: `schema.ts:220`; FK: `estimate_id → estimates.id ON DELETE CASCADE`

### estimate_history
- 정의: `schema.ts:237`; FK: `estimate_id → estimates.id ON DELETE CASCADE`, `user_id`
- 인덱스 (0003 SQL): `idx_estimate_history_estimate_id`, `idx_estimate_history_created_at`

### estimate_templates
- 정의: `schema.ts:253`; FK: `user_id`, `workspace_id`; 인덱스: `idx_estimate_templates_workspace_id`
- `items jsonb NOT NULL`, `usage_count`, 소프트 삭제

### contracts
- 정의: `schema.ts:274`; FK: `user_id`, `workspace_id`, `site_id`, `estimate_id → estimates.id`

### contract_payments
- 정의: `schema.ts:290`; FK: `contract_id → contracts.id ON DELETE CASCADE`
- `type` (계약금|중도금|잔금), `status` default `미수`

### construction_phases
- 정의: `schema.ts:305`; FK: `user_id`, `workspace_id`, `site_id`
- `category`, `planned_start/end`, `actual_start/end`, `progress`, `status` default `대기`

### workers
- 정의: `schema.ts:327`; FK: `user_id`, `workspace_id`
- `trade NOT NULL`, `daily_wage`, 소프트 삭제

### phase_workers
- 정의: `schema.ts:342`; FK: `phase_id → construction_phases.id ON DELETE CASCADE`, `worker_id → workers.id`

### materials
- 정의: `schema.ts:357`; FK: `user_id`(nullable), `workspace_id`
- `is_standard bool default false` (표준자재 플래그)

### material_orders
- 정의: `schema.ts:374`; FK: `user_id`, `workspace_id`, `site_id`, `material_id → materials.id`
- `status` default `발주`

### expenses
- 정의: `schema.ts:394`; FK: `user_id`, `workspace_id`, `site_id`
- `category` (자재비|인건비|운반비|장비비|기타), `receipt_url`, 소프트 삭제

### inventory
- 정의: `schema.ts:413`; FK: `user_id`, `workspace_id`, `material_id → materials.id`
- `current_stock real`, `location`, `last_updated`

### site_photos
- 정의: `schema.ts:429`; FK: `site_id → sites.id ON DELETE CASCADE`, `user_id`, `workspace_id`

### photo_comments
- 정의: `schema.ts:446`; FK: `photo_id → site_photos.id ON DELETE CASCADE`, `user_id`

### communication_logs
- 정의: `schema.ts:459`; FK: `customer_id → customers.id ON DELETE CASCADE`, `user_id`, `workspace_id`

### customer_portal_tokens
- 정의: `schema.ts:475`; FK: `customer_id → customers.id ON DELETE CASCADE`; Unique: `token`

### tax_revenue
- 정의: `schema.ts:487`; FK: `user_id`, `workspace_id`, `site_id`, `customer_id`

### tax_expenses
- 정의: `schema.ts:506`; FK: `user_id`, `workspace_id`, `site_id`; `vendor_id uuid`(FK 미정의)

### tax_vendors
- 정의: `schema.ts:527`; FK: `user_id`, `workspace_id`

### tax_invoices
- 정의: `schema.ts:546`; FK: `user_id`, `workspace_id`; `direction`(sale|purchase)

### tax_payroll
- 정의: `schema.ts:563`; FK: `user_id`, `workspace_id`, `site_id`, `worker_id → workers.id`

### tax_calendar
- 정의: `schema.ts:587`; FK: `user_id`, `workspace_id`

### tax_ai_consultations
- 정의: `schema.ts:602`; FK: `user_id`, `workspace_id`

### subscriptions
- 정의: `schema.ts:614`; FK: `user_id → user.id UNIQUE`, `workspace_id`
- `plan`, `billing_cycle default 'monthly'`, `status default 'active'`
- Toss 연동: `toss_billing_key`, `toss_customer_key`
- 트라이얼: `trial_ends_at`

### usage_records
- 정의: `schema.ts:634`; FK: `user_id`, `workspace_id`
- `feature`, `period`, `count`

### billing_records
- 정의: `schema.ts:646`; FK: `user_id`, `workspace_id`, `subscription_id → subscriptions.id`
- Unique: `order_id`; `status`(pending|paid|failed|refunded|canceled), `toss_response jsonb`

### analysis_credits
- 정의: `schema.ts:667`; FK: `user_id UNIQUE`, `workspace_id`
- `total_credits`, `used_credits`

### analysis_results
- 정의: `schema.ts:679`; FK: `user_id`, `workspace_id`

### threads_account
- 정의: `schema.ts:698`; FK: `user_id`, `workspace_id`

### threads_templates
- 정의: `schema.ts:712`; FK: `user_id`, `workspace_id`

### threads_posts
- 정의: `schema.ts:728`; FK: `user_id`, `workspace_id`, `site_id`
- `template_id uuid`, `auto_rule_id uuid` (FK 미정의)

### threads_auto_rules
- 정의: `schema.ts:752`; FK: `user_id`, `workspace_id`, `template_id → threads_templates.id`

### threads_comments
- 정의: `schema.ts:770`; FK: `user_id`, `workspace_id`, `post_id → threads_posts.id ON DELETE CASCADE`

### marketing_channels
- 정의: `schema.ts:789`; FK: `user_id`, `workspace_id`
- `channel`(threads|instagram|naver_blog|youtube|meta_ads), OAuth 토큰 저장

### marketing_content
- 정의: `schema.ts:807`; FK: `user_id`, `workspace_id`, `site_id`

### marketing_posts
- 정의: `schema.ts:829`; FK: `user_id`, `workspace_id`, `content_id → marketing_content.id`

### marketing_inquiries
- 정의: `schema.ts:856`; FK: `user_id`, `workspace_id`, `customer_id`

### marketing_campaigns
- 정의: `schema.ts:877`; FK: `user_id`, `workspace_id`

### marketing_keywords
- 정의: `schema.ts:899`; FK: `user_id`, `workspace_id`

### sms_leads
- 정의: `schema.ts:917`; FK: `user_id`, `workspace_id`, `customer_id`
- `grade` (A|B|C), `score`, `scoring_factors jsonb`

### sms_campaigns
- 정의: `schema.ts:943`; FK: `user_id`, `workspace_id`

### sms_outreach_log
- 정의: `schema.ts:963`; FK: `user_id`, `workspace_id`, `lead_id → sms_leads.id`, `campaign_id → sms_campaigns.id`
- `external_message_id`(Solapi message id)

### sms_conversions
- 정의: `schema.ts:984`; FK: `user_id`, `workspace_id`, `lead_id → sms_leads.id NOT NULL`, `campaign_id`, `outreach_log_id`

### sms_content
- 정의: `schema.ts:997`; FK: `user_id`, `workspace_id`

### sms_crawl_log
- 정의: `schema.ts:1013`; FK: `user_id`, `workspace_id`

### notifications (in-app)
- 정의: `schema.ts:1029`; FK: `user_id`, `workspace_id`

### schedule_plans
- 정의: `schema.ts:1046`; FK: `user_id`; Unique: `share_token`
- 소비자용 공정표 플래너 (`size_id`, `selected_trades`, `season`, `result_json`)

### qna_posts
- 정의: `schema.ts:1068`; PK: `serial id`
- 공개 QnA; `service` default `interior`; `status` default `answered`

### defects
- 정의: `schema.ts:1085`; FK: `site_id → sites.id ON DELETE CASCADE`, `user_id`, `workspace_id`, `reported_by → user.id`
- `severity` (minor|major|critical), `status` (reported|in_progress|resolved|closed)

### daily_logs
- 정의: `schema.ts:1115`; FK: `site_id → sites.id ON DELETE CASCADE`, `user_id`, `workspace_id`
- Unique: `(site_id, user_id, log_date)` via `daily_logs_site_author_date_idx`

### billings (수금관리 마일스톤)
- 정의: `schema.ts:1144`; FK: `site_id → sites.id ON DELETE CASCADE`, `user_id`, `workspace_id`
- `status` default `pending` (pending|invoiced|paid|overdue|cancelled)

### activity_log
- 정의: `schema.ts:1171`; FK: `site_id → sites.id ON DELETE CASCADE`(nullable), `user_id`, `workspace_id`

### attendance
- 정의: `schema.ts:1186`; FK: `site_id → sites.id ON DELETE CASCADE`, `user_id`, `workspace_id`, `member_id → workers.id`

### notification_queue
- 정의: `schema.ts:1211`; FK: `workspace_id → workspaces.id ON DELETE CASCADE`

### notification_settings
- 정의: `schema.ts:1227`; FK: `workspace_id → workspaces.id ON DELETE CASCADE`
- Unique: `(workspace_id, event_type)`

### notification_recipients
- 정의: `schema.ts:1244`; FK: `workspace_id → workspaces.id ON DELETE CASCADE`
- `role` (foreman|supplier|manager)

### notification_logs
- 정의: `schema.ts:1258`; FK: `workspace_id`, `queue_id → notification_queue.id`
- `channel` (in_app|sms), `solapi_message_id`

### feature_flags
- 정의: `schema.ts:1275`; Unique: `key`
- `allowed_workspaces jsonb`(nullable=전체 허용)

### change_requests
- 정의: `schema.ts:1288`; FK: `site_id → sites.id ON DELETE CASCADE`, `workspace_id`, `token_id → customer_portal_tokens.id`

### cwicr_items (DDC Skills 공종 마스터)
- 정의: `schema.ts:1317`; PK only, no workspace FK (글로벌)

### gyeonjeok_category_map
- 정의: `schema.ts:1336`; 글로벌

### market_price_samples
- 정의: `schema.ts:1347`; 글로벌 (Firecrawl 크롤링 결과)

### zone_ranges (5-Zone 레인지)
- 정의: `schema.ts:1363`; 글로벌

### site_chat_rooms
- 정의: `schema.ts:1378`; FK: `site_id → sites.id`, `workspace_id → workspaces.id`
- Unique: `client_portal_slug`

### site_chat_messages
- 정의: `schema.ts:1395`; FK: `room_id → site_chat_rooms.id ON DELETE CASCADE`, `sender_id → user.id`
- `reply_to_id uuid` (self-reference, FK 미정의)

### site_chat_attachments
- 정의: `schema.ts:1412`; FK: `message_id → site_chat_messages.id ON DELETE CASCADE`

### site_chat_participants
- 정의: `schema.ts:1426`; FK: `room_id → site_chat_rooms.id ON DELETE CASCADE`, `user_id → user.id`

### site_chat_pinned_summary
- 정의: `schema.ts:1440`; PK+FK: `room_id → site_chat_rooms.id ON DELETE CASCADE` (1:1)

### signature_requests (전자서명)
- 정의: `schema.ts:1455`; FK: `workspace_id`, `site_id`, `requested_by → user.id`
- Unique: `signer_token`

### tracking_links
- 정의: `schema.ts:1487`; FK: `workspace_id`, `site_id`, `created_by → user.id`
- Unique: `token`

### tracking_page_views
- 정의: `schema.ts:1510`; FK: `link_id → tracking_links.id ON DELETE CASCADE`

### n8n_webhook_logs
- 정의: `schema.ts:1530`; 글로벌 로그 테이블

### cron_execution_logs
- 정의: `schema.ts:1549`; 글로벌
- 인덱스 (0004 SQL): `idx_cron_execution_logs_name_completed`, `idx_cron_execution_logs_success`

### demo_requests
- 정의: `schema.ts:1564`; 글로벌 (랜딩 페이지 데모 신청)
- CHECK: `company_size IN ('solo','small','medium','large')`, `status IN ('new','contacted','scheduled','done')`
- 인덱스 (0005 SQL): `idx_demo_requests_status_created`, `idx_demo_requests_dedupe (email, phone, created_at DESC)`

### landing_events
- 정의: `schema.ts:1585`; 글로벌 (랜딩 트래킹)
- CHECK: `event_type IN ('page_view','section_view','cta_click','scroll_depth')`
- 인덱스: `idx_landing_events_created_type`, `idx_landing_events_session`

---

## 2. API 엔드포인트 (총 142 파일 / 220+ 메서드)

> 인증 헬퍼 위치: `src/lib/api-auth.ts`
> - `requireAuth()` (line 20): 세션 있는지 확인 → 워크스페이스 권한 체크 없음
> - `requireWorkspaceAuth(category?, action?)` (line 72): 세션 + `activeWorkspaceId` + 카테고리/액션 권한
> - `requireSystemAdmin()` (line 177): `SYSTEM_ADMIN_EMAILS` 또는 `user.role='admin'`

### Better Auth 프록시
- **GET/POST** `/api/auth/[...all]` — `src/app/api/auth/[...all]/route.ts:40,64` — Better Auth 커스텀 핸들러(Next.js 16 이슈 우회). HMAC 서명된 `better-auth.session_token` 쿠키. 인증: N/A(공개).

### 워크스페이스 / 멤버
- **GET/POST** `/api/workspace` — `workspace/route.ts:23,79` — 워크스페이스 생성/조회. `requireAuth`.
- **GET/PUT** `/api/workspace/current` — `current/route.ts:12,72` — 현재 활성 ws. `requireAuth`.
- **GET/PATCH/DELETE** `/api/workspace/members` — `members/route.ts:9,36,91` — `requireWorkspaceAuth` + `settings:admin` (PATCH/DELETE).
- **POST/GET/DELETE** `/api/workspace/invite` — `invite/route.ts:11,86,109` — `requireWorkspaceAuth("settings","admin"|"read")`.
- **POST** `/api/workspace/join` — `join/route.ts:8` — `requireAuth`.
- **GET/POST** `/api/workspaces` — `workspaces/route.ts:18,55` — 여러 ws 목록/생성.
- **GET/PATCH/DELETE** `/api/workspaces/[id]` — `workspaces/[id]/route.ts:19,60,94` — `requireAuth`.
- **POST** `/api/workspaces/[id]/invite-code` — `invite-code/route.ts:12`.
- **GET** `/api/workspaces/[id]/members` — `members/route.ts:11`.
- **POST** `/api/workspaces/[id]/members/invite` — `requireAuth`.
- **POST** `/api/workspaces/[id]/members/join` — `requireAuth`.
- **PATCH/DELETE** `/api/workspaces/[id]/members/[memberId]` — `requireAuth`.
- **GET/PUT** `/api/workspaces/[id]/permissions` — `requireAuth`.
- **PUT** `/api/workspaces/active` — `active/route.ts:14`.

### 고객 / 현장
- **GET/POST** `/api/customers` — `customers/route.ts:11,62`.
- **GET/PUT/DELETE** `/api/customers/[id]` — 10,76,102.
- **GET/POST** `/api/customers/[id]/communications` — `requireWorkspaceAuth("customers","read")`.
- **GET/POST** `/api/sites` — `requireWorkspaceAuth("sites","read"|"write")`.
- **GET/PUT/DELETE** `/api/sites/[id]` — `requireWorkspaceAuth()` (카테고리 없음).
- **GET/POST** `/api/sites/[id]/photos` — `requireWorkspaceAuth("sites","read"|"write")`. Vercel Blob put.
- **GET** `/api/sites/[id]/budget` — `sites:read`.
- **GET** `/api/sites/[id]/health-score` — `sites:read`.
- **POST** `/api/photos/[id]/comments` — `sites:write`.

### 견적
- **GET/POST** `/api/estimates` — `estimates/route.ts:11,56`.
- **GET/PUT/DELETE** `/api/estimates/[id]` — 9,84,169.
- **PUT** `/api/estimates/[id]/status` — `estimates:write`.
- **POST** `/api/estimates/[id]/duplicate`.
- **GET** `/api/estimates/[id]/history` — `requireWorkspaceAuth()`.
- **GET** `/api/estimates/[id]/compare` — `requireWorkspaceAuth()`.
- **GET** `/api/estimates/[id]/export`.
- **POST/DELETE** `/api/estimates/[id]/share` — 공유토큰 생성.
- **GET** `/api/estimates/shared/[token]` — **공개**(인증 없음).
- **GET** `/api/estimates/stats` — `requireWorkspaceAuth`.
- **GET/POST** `/api/estimates/templates` — `requireWorkspaceAuth()`.
- **POST** `/api/v1/estimates` — `estimates:write` (외부 API).
- **GET/POST** `/api/estimate-coach` — `estimates:write`.
- **POST** `/api/estimate-coach/generate-subs` — `estimates:write`.
- **POST** `/api/estimate-coach/parse-receipt` — `estimates:write`. Anthropic Claude.

### 계약 / 수금
- **GET/POST** `/api/contracts` — `requireWorkspaceAuth()`.
- **GET/PUT/DELETE** `/api/contracts/[id]`.
- **GET/POST** `/api/billings` — `construction:read|write`.
- **GET/PATCH/DELETE** `/api/billings/[id]` — `construction:read|write|delete`.
- **GET** `/api/unpaid` — `tax:read`.

### 공정 / 작업자 / 자재
- **GET/POST** `/api/construction` — `requireWorkspaceAuth()`.
- **PATCH/DELETE** `/api/construction/[id]`.
- **GET/POST/PUT/DELETE** `/api/materials` — `requireWorkspaceAuth()`.
- **GET/POST** `/api/workers`.
- **GET/PUT/DELETE** `/api/workers/[id]`.
- **POST/PUT/DELETE** `/api/schedule/phases` — `sites:write|delete`.
- **GET/POST/PUT/DELETE/PATCH** `/api/schedule` — `requireWorkspaceAuth()`.

### 업무일지 / 하자 / 출퇴근
- **GET/POST** `/api/daily-logs` — `construction:read|write`.
- **GET/PATCH/DELETE** `/api/daily-logs/[id]` — `construction:read|write|delete`.
- **GET/POST** `/api/defects` — `construction:read|write`.
- **GET/PATCH/DELETE** `/api/defects/[id]` — `construction:read|write|delete`.
- **GET/POST** `/api/attendance`.
- **GET/PATCH/DELETE** `/api/attendance/[id]`.
- **GET** `/api/activity-log` — `construction:read`.
- **GET** `/api/health-scores` — `dashboard:read`.

### 지출 / 세무
- **GET/POST** `/api/expenses`.
- **PUT/DELETE** `/api/expenses/[id]`.
- **POST/PUT** `/api/analyze-receipt` — `tax:write`. Anthropic Claude vision.
- **GET/POST/PUT/DELETE** `/api/tax` — 다건 tax_* CRUD.
- **GET/POST/PUT/DELETE** `/api/tax/payroll` — `tax:*`.
- **GET/POST** `/api/tax/ai-advisor` — Anthropic.
- **GET** `/api/reports/settlement` — `tax:read`.

### 대시보드 / 알림
- **GET** `/api/dashboard` — `dashboard:read`.
- **GET** `/api/dashboard/drilldown` — `dashboard:read`.
- **GET** `/api/dashboard/today` — `dashboard:read`.
- **GET/PUT** `/api/notifications` — `requireWorkspaceAuth()`.
- **GET/PUT** `/api/notification-settings` — `settings:read|write`.
- **GET/POST/DELETE** `/api/notification-recipients` — `settings:*`.
- **GET** `/api/notification-logs` — `settings:read`.

### 결제 / 구독 / 크레딧
- **GET/PUT/DELETE** `/api/billing` — `settings:read|write|delete`.
- **POST/DELETE** `/api/billing/billing-key` — Toss 빌링키 발급/해제.
- **POST** `/api/billing/payment` — `settings:write`. Toss 수동 결제.
- **POST** `/api/billing/cron` — CRON_SECRET 사용(아래 CRON 섹션 별도).
- **POST** `/api/billing/webhook` — Toss 웹훅(TOSS_WEBHOOK_SECRET).
- **GET/POST** `/api/subscription` — `settings:read|write`.
- **GET** `/api/pricing-plans` — **공개**(로그인 전).
- **GET** `/api/credits` — `settings:read`.
- **POST** `/api/credits/use` — `settings:write`.
- **GET** `/api/credits/analyses` — `settings:read`.
- **POST** `/api/credits/admin` — `settings:write`.

### 마케팅 (대분류)
- **GET** `/api/marketing` — `marketing:read`.
- **GET/POST/DELETE** `/api/marketing/channels` — `marketing:*`.
- **GET/POST** `/api/marketing/content` — `marketing:read|write`.
- **GET/PUT/DELETE** `/api/marketing/content/[id]`.
- **POST** `/api/marketing/content/generate` — `marketing:write`. Anthropic.
- **GET/POST** `/api/marketing/posts`, `[id]` — `marketing:*`.
- **GET/POST** `/api/marketing/campaigns`.
- **GET/POST** `/api/marketing/inquiries`.
- **GET/POST** `/api/marketing/keywords`.
- **POST** `/api/marketing/publish/[channel]` — `marketing:write`.

### 마케팅 OAuth + 채널별 통계
- **GET** `/api/marketing/oauth/[provider]` — `marketing:read`.
- **GET** `/api/marketing/oauth/[provider]/callback` — 콜백.
- **POST** `/api/marketing/oauth/refresh` — `marketing:write`.
- **GET/POST/DELETE** `/api/marketing/adlog/connect`.
- **GET/POST/DELETE/PATCH** `/api/marketing/adlog`.
- **GET** `/api/marketing/adlog/sync` — `marketing:read`.
- **GET/POST/DELETE** `/api/marketing/naver-blog/connect`.
- **GET** `/api/marketing/naver-blog/stats` — `marketing:read`.
- **GET** `/api/marketing/instagram/stats`.
- **GET** `/api/marketing/youtube/stats`.
- **GET** `/api/marketing/meta-ads/stats`, `insights`.
- **GET/POST/DELETE** `/api/marketing/sms/connect`.
- **GET/POST/PATCH/DELETE** `/api/marketing/sms/leads`.
- **GET/POST/PATCH/DELETE** `/api/marketing/sms/campaigns`.
- **GET/POST** `/api/marketing/sms/outreach`.
- **GET/POST/PATCH/DELETE** `/api/marketing/sms/content`.
- **GET** `/api/marketing/sms/stats`.

### Threads 마케팅
- **GET/POST/DELETE** `/api/marketing/threads/account`.
- **GET/POST/PUT/DELETE** `/api/marketing/threads/posts`.
- **GET/POST/PUT/DELETE** `/api/marketing/threads/templates`.
- **GET/POST/PUT/DELETE** `/api/marketing/threads/auto-rules`.
- **GET/POST/PUT** `/api/marketing/threads/comments` — `marketing:read|write`. Anthropic.
- **POST** `/api/marketing/threads/generate` — Anthropic.
- **GET** `/api/marketing/threads/stats`.

### 현장 톡방 / 포털
- **GET** `/api/site-chat/rooms` — `sites:read`.
- **POST** `/api/site-chat/rooms` — `sites:write`.
- **GET/PATCH/DELETE** `/api/site-chat/rooms/[roomId]`.
- **GET/POST** `/api/site-chat/messages` — `sites:read|write`.
- **PATCH/DELETE** `/api/site-chat/messages/[messageId]` — `sites:write`.
- **POST** `/api/site-chat/upload` — `sites:write`. Vercel Blob. 이미지면 Anthropic 호출.
- **GET** `/api/site-chat/sse` — Server-Sent Events.
- **POST** `/api/site-chat/onboarding` — `requireAuth`.
- **POST/DELETE** `/api/site-chat/convert-sample` — 샘플방 → 실제방 변환.
- **GET** `/api/portal/[token]` — **공개**(포털 토큰 기반).
- **POST** `/api/portal/[token]/change-request` — **공개**(토큰 기반).
- **POST** `/api/portal/generate` — `customers:write`.
- **GET** `/api/portal-v2/[slug]` — **공개**.
- **POST** `/api/portal-v2/[slug]/message` — **공개**.

### 공정매니저 플래너 (소비자)
- **GET/POST** `/api/schedule-planner`.
- **GET/PATCH/DELETE** `/api/schedule-planner/[id]` — `requireAuth`.
- **POST** `/api/schedule-planner/[id]/share`.
- **GET** `/api/schedule-planner/trades`.

### QnA
- **GET** `/api/qna` — 공개(로그인 전 가능).
- **GET** `/api/qna/[id]`.
- **GET** `/api/qna/generate` — **CRON** (createCronRoute로 감싸짐, `vercel.json` 21시 스케줄).

### 관리자 / 랜딩
- **POST/GET** `/api/demo-request` — POST 공개(랜딩 폼). GET은 `requireSystemAdmin`.
- **GET** `/api/admin/demo-requests` — 관리자.
- **PATCH** `/api/admin/demo-requests/[id]`.
- **GET** `/api/admin/landing-stats`.
- **POST** `/api/track-event` — **공개**(랜딩 이벤트 수집).

### 기타
- **POST** `/api/upload` — `sites:write`. Vercel Blob 일반 업로드.
- **GET** `/api/debug-auth` — 디버그용.

### CRON 엔드포인트 (CRON_SECRET Bearer 인증 필수)
- **POST** `/api/notifications/process` — `createCronRoute`, `vercel.json` 09시.
- **POST** `/api/notifications/check-payments` — `createCronRoute`, `vercel.json` 00시.
- **POST** `/api/cron/trial-reminders` — `createCronRoute`, `vercel.json` 01시.
- **POST** `/api/billing/cron` — 수동 호출 (CRON_SECRET 직접 체크).
- **GET** `/api/qna/generate` — `createCronRoute`, `vercel.json` 21시.

### 공개(인증 없음) 엔드포인트 요약
| 경로 | 이유 |
|---|---|
| `/api/auth/[...all]` | Better Auth 핸들러 |
| `/api/estimates/shared/[token]` | 견적 공유 링크 |
| `/api/portal/[token]`, `/change-request` | 고객 포털 토큰 |
| `/api/portal-v2/[slug]`, `/message` | 고객 포털 V2 |
| `/api/pricing-plans` | 랜딩 가격 노출 |
| `/api/demo-request` (POST) | 데모 신청 폼 |
| `/api/track-event` | 랜딩 이벤트 트래킹 |
| `/api/qna` (GET) | 공개 Q&A 게시판 |
| `/api/schedule-planner/trades` | 공정 카탈로그 |

---

## 3. 인증·권한

### Better Auth 설정 — `src/lib/auth.ts`
- `betterAuth({...})`
- `baseURL`: `process.env.BETTER_AUTH_URL`
- `database`: `drizzleAdapter(db, { provider: "pg", schema })`
- `trustedOrigins`: BETTER_AUTH_URL
- `emailAndPassword.enabled = true`, `minPasswordLength = 8`
- `socialProviders`: Google + Kakao (환경변수 있을 때만 활성화)

### 세션 구조
- 테이블 `session` (id/token/expiresAt/userId/ipAddress/userAgent)
- 쿠키: `better-auth.session_token` 또는 HTTPS 시 `__Secure-better-auth.session_token`
- 쿠키 값 형식: `{token}.{HMAC-signature}` — `makeSignature(token, BETTER_AUTH_SECRET)` 사용 (`src/app/api/auth/[...all]/route.ts:14`)
- httpOnly, sameSite=lax, path=/, maxAge=604800

### 역할 시스템
1. **`user.role`** text default `'owner'`: `owner | manager | worker | admin` (글로벌 역할; `admin`은 시스템 관리자)
2. **`workspace_members.role`** default `'member'`: `owner | admin | manager | member | viewer` (워크스페이스 역할)
3. **`workspace_permissions.category/accessLevel`**: 세분 권한 override (스키마상 존재하나 `checkPermission`은 role 기반 매트릭스를 직접 참조 — 이 테이블은 현재 UI-확장용으로 추측)

### 권한 체크 헬퍼 (`src/lib/api-auth.ts`)
- `requireAuth(): Promise<{ok, userId, session} | {ok:false, response}>` — 세션만 확인 (401 응답).
- `requireWorkspaceAuth(category?, action?)` — 세션 + `activeWorkspaceId` + `workspace_members.role` 조회 + `checkPermission()`. 실패 시 403 `NO_WORKSPACE|NOT_MEMBER|FORBIDDEN`.
- `getWorkspaceMemberIds(workspaceId)` — 멤버 userId 배열 반환 (IN 조건용).
- `requireSystemAdmin()` — 환경변수 `SYSTEM_ADMIN_EMAILS`(기본 `smalltablekorea@gmail.com`) 또는 `user.role='admin'`.

### `src/lib/workspace/permissions.ts`
**Category 값** (총 14개):
`dashboard | customers | sites | estimates | contracts | construction | schedule | materials | workers | expenses | marketing | settlement | tax | settings`

**Action 값**: `read | write | delete | admin`

**Role hierarchy** (배열 인덱스 = 권한 높음): `["viewer","member","manager","admin","owner"]`

**PERMISSION_MATRIX 요약**:
- `dashboard`: read=viewer, write=member, delete=admin, admin=owner
- `customers/sites/estimates/construction/schedule/materials/expenses`: read=viewer, write=member, delete=manager, admin=admin
- `contracts/workers`: read=viewer, write=manager, delete=admin, admin=admin
- `marketing`: read=member, write=manager, delete=admin, admin=admin
- `settlement/tax`: read=manager, write=admin, delete=admin, admin=owner
- `settings`: read=admin, write=admin, delete=owner, admin=owner

`admin`/`owner`는 `checkPermission`에서 모든 카테고리·액션 무조건 true.

**Helper 함수**: `getRoleLevel`, `isRoleAtLeast`, `checkPermission`, `getAccessibleCategories`, `pathToCategory`.

---

## 4. Supabase Storage

**사용하지 않음.** Neon PostgreSQL만 사용.

### 실제 사용 중인 파일 저장소: Vercel Blob
- 패키지: `@vercel/blob ^2.3.1` (package.json)
- `import { put } from "@vercel/blob"` 사용 파일:
  - `src/app/api/upload/route.ts:2` — 일반 업로드 엔드포인트
  - `src/app/api/sites/[id]/photos/route.ts:5` — 현장 사진
  - `src/app/api/site-chat/upload/route.ts:10` — 톡방 첨부파일

### 확인: 다른 스토리지 미사용
- `@aws-sdk/client-s3`, `Cloudflare R2`, `SUPABASE_*` 환경변수 import 없음 (Grep 결과 매치 없음).
- `src/lib/storage*`, `src/lib/upload*` 파일 없음.
- `site_chat_attachments.storage_path`, `signature_requests.signature_image_url`(주석: "Vercel Blob URL") 모두 Blob URL을 저장.

---

## 5. 외부 연동

### Solapi (SMS/알림톡)
- 위치: `src/lib/solapi.ts`
- 환경변수 3개: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_NUMBER`
- 사용 파일:
  - `src/lib/subscription/trial.ts` — 트라이얼 알림
  - `src/app/api/demo-request/route.ts` — 데모 신청 접수 알림 (관리자 번호: `DEMO_REQUEST_NOTIFY_NUMBER` 또는 `ADMIN_PHONE`)
  - `src/app/api/portal-v2/[slug]/message/route.ts` — 고객 메시지 알림
  - `src/app/api/marketing/sms/outreach/route.ts` — SMS 리드 아웃리치
  - `src/lib/notifications/queue.ts` — 알림 큐 처리

### Toss Payments (구독 결제)
- 위치: `src/lib/toss.ts`
- 함수: `issueBillingKey`, `executeBillingPayment`, `cancelPayment`, `getPayment`, `generateOrderId`, `generateCustomerKey`
- 환경변수: `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET`
- 연결 테이블: `subscriptions.toss_billing_key`, `subscriptions.toss_customer_key`, `billing_records.payment_key`, `billing_records.toss_response`
- API 라우트:
  - `/api/billing/billing-key` — 빌링키 발급/해제
  - `/api/billing/payment` — 수동 결제
  - `/api/billing/cron` — 정기 결제 배치
  - `/api/billing/webhook` — 토스 웹훅 (secret 검증)

### LLM (Anthropic Claude)
- 패키지: `@anthropic-ai/sdk ^0.80.0` (package.json)
- 환경변수: `ANTHROPIC_API_KEY`
- import `Anthropic from "@anthropic-ai/sdk"` 파일:
  - `src/lib/api/ai-helpers.ts:5` — 공용 AI 헬퍼
  - `src/app/api/estimate-coach/parse-receipt/route.ts:2` — 영수증 파싱
  - `src/app/api/tax/ai-advisor/route.ts:5` — 세무 AI 상담
  - `src/app/api/analyze-receipt/route.ts:2` — 영수증 분석
  - `src/app/api/site-chat/upload/route.ts:161` (dynamic import) — 현장 사진 자동 분류
  - `src/app/api/marketing/content/generate/route.ts:13`
  - `src/app/api/qna/generate/route.ts:1` — 일일 QnA 생성
  - `src/app/api/marketing/threads/generate/route.ts:3`
  - `src/app/api/marketing/threads/comments/route.ts:7`
- **OpenAI SDK 미사용** (Grep `from "openai"` 0건, `openai` package.json에 없음).
- `src/lib/ai/*` 디렉토리 없음. 대신 `src/lib/api/ai-helpers.ts`, `src/lib/api/ai-rate-limit.ts` 사용.

### 견적코치 연동 (프로젝트 내부)
- 엔드포인트:
  - `/api/estimate-coach` (GET/POST)
  - `/api/estimate-coach/generate-subs` (POST)
  - `/api/estimate-coach/parse-receipt` (POST)
  - `/api/estimates/**` (전체 14개 라우트 — `estimates`, `/[id]`, `/[id]/compare`, `/duplicate`, `/export`, `/history`, `/share`, `/status`, `/shared/[token]`, `/stats`, `/templates`)
- 외부 프로젝트(집코치·siteflow) 크로스 레포 연동 코드 없음 (import/fetch 매치 없음). `cwicr_items`, `gyeonjeok_category_map`, `market_price_samples`, `zone_ranges`는 DDC Skills/Antigravity 통합으로 schema.ts 내부에 포함.

### Resend (이메일)
- 패키지: `resend ^6.12.0`
- 위치: `src/lib/email.ts`
- 환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (기본 `noreply@interiorcoach.kr`)
- CRON 실패 알림 및 데모 알림 등에서 사용 (`src/lib/cron/monitor.ts:158`).

### 기타
- `cheerio` (네이버 블로그/애드로그 HTML 파싱 추정)
- `@neondatabase/serverless`(DATABASE_URL)
- `pg` (devDependencies)

---

## 6. Cron·스케줄러

### `vercel.json` crons (4개)
```json
[
  { "path": "/api/qna/generate",                "schedule": "0 21 * * *" },
  { "path": "/api/notifications/process",       "schedule": "0 9 * * *"  },
  { "path": "/api/notifications/check-payments","schedule": "0 0 * * *"  },
  { "path": "/api/cron/trial-reminders",        "schedule": "0 1 * * *"  }
]
```

### 각 cron 핸들러
| Path | 파일 | 메서드 | 역할 |
|---|---|---|---|
| `/api/qna/generate` | `src/app/api/qna/generate/route.ts:168` | `GET = createCronRoute` | Anthropic로 Q&A 자동 생성 → `qna_posts` 삽입 |
| `/api/notifications/process` | `src/app/api/notifications/process/route.ts:5` | `POST = createCronRoute` | `notification_queue` 처리 → 인앱/SMS 발송 |
| `/api/notifications/check-payments` | `src/app/api/notifications/check-payments/route.ts:8` | `POST = createCronRoute` | 연체 `billings`/`contract_payments` 스캔 → 알림 큐잉 |
| `/api/cron/trial-reminders` | `src/app/api/cron/trial-reminders/route.ts:5` | `POST = createCronRoute` | 트라이얼 만료 임박 `subscriptions` → 리마인드 |

### `src/lib/cron/monitor.ts` 동작
- `createCronRoute({ name, handler, requireAuth=true })` 공용 래퍼.
- 인증: `Authorization: Bearer ${CRON_SECRET}` 헤더 확인 (미설정 시 항상 401).
- 실행 전후 `cronExecutionLogs` 테이블에 `{ cronName, success, processed, durationMs, metadata, errorMessage, errorStack, startedAt, completedAt }` 적재.
- 실패 시 `sendCronFailureAlert` 호출 → Slack(`CRON_ALERT_SLACK_WEBHOOK`) + Resend 이메일(`CRON_ALERT_EMAIL`, `RESEND_API_KEY`).
- `countRecentConsecutiveFailures`로 최근 실패 연속 횟수 계산 → `ESCALATION_THRESHOLD = 3` 이상이면 `[CRITICAL]` 프리픽스로 격상.
- `getRecentCronRuns`, `getRecentCronFailures` 조회 헬퍼 제공.

### Supabase Edge Functions
**해당 없음** (Supabase 미사용).

### 추가 크론성 엔드포인트 (vercel.json 등록 없음)
- `/api/billing/cron` (POST) — `CRON_SECRET` 직접 검증. 수동/외부 트리거용으로 추정.

---

## 7. 모듈별 현황

| 모듈 | 상태 | 관련 테이블 | 관련 API | 현재 기능 | 미구현 기능(관찰) |
|---|---|---|---|---|---|
| **공정매니저** | 있음 | `construction_phases`, `phase_workers`, `schedule_plans` (소비자 플래너) | `/api/construction`, `/api/construction/[id]`, `/api/schedule`, `/api/schedule/phases`, `/api/schedule-planner`, `/api/schedule-planner/trades` | 공정 CRUD, 작업자 배정, 진행률, AI 공정표 플래너 (소비자용) | 공정 간 의존관계/CPM, 간트차트 API 엔드포인트 명시적 없음 |
| **자재·발주** | 있음 | `materials`, `material_orders`, `inventory` | `/api/materials` (GET/POST/PUT/DELETE) | 자재 마스터 CRUD, 발주, 재고 | `material_orders`/`inventory` 전용 API 엔드포인트 없음 (materials 테이블 단일 API로 통합된 듯) |
| **현장 손익** | 부분구현 | `sites.budget/spent`, `expenses`, `billings` + `sites/[id]/budget` | `/api/sites/[id]/budget`, `/api/dashboard/drilldown`, `/api/reports/settlement`, `/api/health-scores` | 현장별 예산/지출, 정산 리포트, 헬스스코어 | 별도 `site_pnl` 테이블 없음 — budget/spent 컬럼과 집계로 계산 |
| **수금관리** | 있음 | `billings`, `contract_payments` | `/api/billings`, `/api/billings/[id]`, `/api/unpaid` | 마일스톤 수금 스케줄, 연체 조회 | — |
| **하자관리** | 있음 | `defects` | `/api/defects`, `/api/defects/[id]` | 하자 등록/해결, 심각도, 담당자 지정 | — |
| **업무일지** | 있음 | `daily_logs` (Unique: site+author+date), `activity_log` | `/api/daily-logs`, `/api/daily-logs/[id]`, `/api/activity-log` | 일일 업무일지, 공종별 작업자수 기록, 고객 공유 플래그 | — |
| **근태급여** | 있음 | `attendance`, `tax_payroll`, `workers.daily_wage`, `phase_workers.daily_wage` | `/api/attendance`, `/api/attendance/[id]`, `/api/tax/payroll` | 출퇴근, 급여 대장, 4대보험 차감 | 근태→급여 자동 계산 API 명시 없음 |
| **반장·기사 인력풀** | 부분구현 | `workers`(workspace-scoped), `phase_workers` | `/api/workers`, `/api/workers/[id]` | 직종별 작업자 DB, 공정별 배정 | 크로스-워크스페이스 공유 인력풀 테이블 없음 |
| **견적서** | 있음 (가장 큰 모듈) | `estimates`, `estimate_items`, `estimate_history`, `estimate_templates`, `cwicr_items`, `gyeonjeok_category_map`, `market_price_samples`, `zone_ranges` | `/api/estimates/**` (14개), `/api/estimate-coach/**`(3개), `/api/v1/estimates` | 견적 CRUD, 버전/히스토리, 템플릿, 공유 토큰, AI 파싱, 5-Zone 레인지 | — |
| **통합 대시보드** | 있음 | 집계 (뷰 없음) | `/api/dashboard`, `/api/dashboard/drilldown`, `/api/dashboard/today`, `/api/health-scores` | 대시보드 메인, 드릴다운, 오늘의 할일, 현장 헬스스코어 | — |
| **월간 리포트** | 부분구현 | `tax_revenue`, `tax_expenses`, `expenses`, `billings` | `/api/reports/settlement` | 정산 리포트 1개 | 월간 리포트 전용 생성/보관 테이블 없음 |
| **추천 보상** | 부분구현 | `customers.referred_by`(FK 미정의) | 없음 (전용 API 없음) | 컬럼만 존재 | 추천 보상 적립/정산 테이블·API 전무 |
| **팀 권한 관리** | 있음 | `workspace_members`, `workspace_permissions`, `workspace_invitations` | `/api/workspace/*`, `/api/workspaces/[id]/members/*`, `/api/workspaces/[id]/permissions` | 초대, 역할 변경, 권한 매트릭스, `workspace_permissions` 테이블 존재(UI 확장) | `workspace_permissions` 테이블은 스키마에 있으나 런타임 `checkPermission()`은 역할 매트릭스만 사용 — 실제 per-member override 미구현 |
| **공사 유형 템플릿** | 있음 | `estimate_templates` (building_type, area_pyeong, grade_key) | `/api/estimates/templates` | 견적 템플릿 (공사 유형으로 재사용) | 공정 템플릿(건물 유형별 phase 세트) 전용 테이블 없음 |
| **데이터 내보내기** | 부분구현 | — | `/api/estimates/[id]/export` | 견적 PDF/Excel 내보내기 | 전체 워크스페이스 벌크 export API 없음 |
| **랜딩페이지 지원** | 있음 | `demo_requests`, `landing_events` | `/api/demo-request` (POST 공개/GET admin), `/api/admin/demo-requests`, `/api/admin/demo-requests/[id]`, `/api/admin/landing-stats`, `/api/track-event`, `/api/pricing-plans` | 데모 신청 폼, 이벤트 트래킹(PV/섹션/CTA/스크롤), 가격 플랜 공개 | `pricing_plans` 테이블 없음 — `/api/pricing-plans`는 상수 기반으로 추정(구현 확인 불가). |
| **OCR/STT/캡처 자동화** | 부분구현 | `expenses.receipt_url`, `site_chat_attachments` | `/api/analyze-receipt` (POST/PUT), `/api/estimate-coach/parse-receipt`, `/api/site-chat/upload`(이미지 auto-tag) | Anthropic vision으로 영수증 파싱, 톡방 이미지 자동 분류 태그 | 음성(STT) 관련 라우트/테이블 없음. 캡처 자동화 전용 테이블 없음 |

---

## 8. 데이터 상태

### `projects` 테이블
**schema.ts에 `projects` 테이블 없음** — 대신 `sites` 테이블 사용. schema.ts:172.

### `material_catalog` 테이블
**schema.ts에 `material_catalog` 테이블 없음.** `materials` 테이블이 존재하며 `is_standard bool` 플래그로 표준/프로젝트별 자재를 구분.

추가로 글로벌 가격 카탈로그 역할:
- `cwicr_items` (schema.ts:1317) — CWICR 공종 마스터 (material_cost/labor_cost/expense_cost/total_unit_cost/region)
- `gyeonjeok_category_map` (schema.ts:1336) — 18개 공종 ↔ CWICR 매핑
- `market_price_samples` (schema.ts:1347) — Firecrawl 크롤링 시장가
- `zone_ranges` (schema.ts:1363) — 5-Zone 가격 레인지

실제 레코드 수: **DB 미접근 — 확인 불가**. `supabase/seeds/` 디렉토리에 `cwicr_items`/`material_catalog`/`materials` 관련 SQL 시드 없음.

### `supabase/seeds/` 디렉토리 전체
```
supabase/seeds/sample-room-script.ts  — 284라인  (TypeScript 샘플 톡방 대본)
```
- 테이블 시드 SQL 0건. 유일한 파일은 신규 유저 가입 시 주입되는 "잠실 32평 리모델링" 샘플 톡방 대화 스크립트.

### `supabase/tests/` 디렉토리
```
supabase/tests/site-chat.sql  — 35라인 (pgTAP 테스트 12개)
```
- `site_chat_rooms/messages/attachments/participants/pinned_summary` 테이블·컬럼·PK·인덱스(`idx_site_chat_messages_room`, `idx_site_chat_rooms_workspace`)·트리거(`trg_create_pinned_summary`) 존재 검증.

### "잠실"·"한남" 키워드 grep 결과
- `supabase/seeds/sample-room-script.ts:18` — "샘플: 잠실 32평 리모델링", 주소 "서울 송파구 잠실동 레이크팰리스 A동 1203호"
- `src/components/landing/LiveDemo.tsx`, `FeatureMockup.tsx`, `sections/CaseStudySection.tsx`, `demo-script.ts`, `src/content/landing.ts` — 랜딩 UI 데모 데이터
- `scripts/seed-*.mjs` (8개) — seed 스크립트 (실제 DB 시드)
- `docs/research/**`, `docs/api/site-chat.md` — 문서상 예시
- `seed-schedule.mjs` (루트 1개)
- "한남"은 `src/content/landing.ts`, `docs/research/**` 등 주로 랜딩/문서에 등장

---

## 9. 잠재 충돌 포인트

### 이름 충돌 가능성 (관찰)
- **`billings` vs `billing_records`**: 전자는 수금관리 마일스톤(현장→고객), 후자는 Toss 결제 이력(유저→당사). 모듈 교차 작업 시 혼동 가능.
- **`notifications` vs `notification_queue` vs `notification_logs` vs `notification_settings` vs `notification_recipients`**: 5개 테이블 존재. 신규 알림 모듈 추가 시 역할 구분 필수.
- **`attendance` vs `workers` vs `phase_workers` vs `tax_payroll`**: 사람·시간 관련 4 테이블. 근태/급여 확장 시 어느 테이블에 컬럼을 추가할지 충돌 가능.
- **`construction_phases` vs `schedule_plans` vs `schedule_plans.selected_trades`**: 공정 관련 B2B 테이블(construction_phases)과 B2C 플래너(schedule_plans)가 분리되어 있음.
- **`materials` vs `material_orders` vs `inventory` vs `cwicr_items` vs `market_price_samples`**: 자재 관련 5 테이블. 가격 동기화 로직 추가 시 충돌 위험.
- **`estimates.metadata` / `estimate_templates.metadata`** 내 자유 JSON 구조 — 필드 추가 시 스키마 드리프트 위험.

### FK cascade 주의
- `sites` 삭제 시 **cascade** 대상: `construction_phases`(없음, CASCADE 미지정) / `site_photos` / `defects` / `daily_logs` / `billings` / `activity_log` / `attendance` / `change_requests`. → `sites` soft delete(`deleted_at`)가 권장 경로.
- `customers` 삭제 시 cascade: `communication_logs`, `customer_portal_tokens`.
- `estimates` 삭제 시 cascade: `estimate_items`, `estimate_history`.
- `contracts` 삭제 시 cascade: `contract_payments`.
- `workspaces` 삭제 시 cascade: `workspace_members`, `workspace_permissions`, `workspace_invitations`, `notification_queue`, `notification_settings`, `notification_recipients`. **매우 광범위** — 워크스페이스 삭제 시 다른 workspace_id 참조 테이블(거의 전체)은 cascade 없이 NULL로 남음 → 고아 데이터 생성 가능.
- `site_chat_rooms` 삭제 시 cascade: `site_chat_messages` → `site_chat_attachments`, `site_chat_participants`, `site_chat_pinned_summary`.

### 권한 카테고리 확장 영향 범위
- 새 `Category` 추가 시 `src/lib/workspace/permissions.ts`의 `PERMISSION_MATRIX`, `pathToCategory` 업데이트 필요.
- 모든 API 라우트에서 `requireWorkspaceAuth(category, action)` 호출 약 220+ 곳 — 카테고리 매핑 누락 시 403.
- `workspace_permissions.category` 컬럼 값도 동기화 필요(UI용 per-member override 테이블).

### 중복/혼동 가능
- `expenses` vs `tax_expenses`: 전자는 프로젝트 지출, 후자는 세무 지출. 통합/동기화 로직 부재.
- `communication_logs`(고객) vs `site_chat_messages`(톡방) vs `activity_log`(전체 활동): 3중 로깅 구조.

---

## 10. 환경변수·비밀키

(Grep `process\.env\.` 결과 기반, 값 제외)

| 이름 | 사용처 파일 | 설명 |
|---|---|---|
| `DATABASE_URL` | `src/lib/db/index.ts:9` | Neon PostgreSQL 커넥션 문자열 |
| `BETTER_AUTH_URL` | `src/lib/auth.ts:7,13`, `src/app/api/auth/[...all]/route.ts:24,137` | Better Auth base URL (HTTPS 여부로 쿠키 이름 결정) |
| `BETTER_AUTH_SECRET` | `src/lib/crypto.ts:8`, `src/app/api/auth/[...all]/route.ts:11` | 세션 쿠키 HMAC 서명 키 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `src/lib/auth.ts:20-24` | Google OAuth |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | `src/lib/auth.ts:28-32` | Kakao OAuth |
| `SYSTEM_ADMIN_EMAILS` | `src/lib/api-auth.ts:166` | 쉼표 구분 시스템 관리자 이메일(기본 `smalltablekorea@gmail.com`) |
| `ANTHROPIC_API_KEY` | `src/lib/api/ai-helpers.ts:66`, `src/app/api/analyze-receipt/route.ts:36`, `src/app/api/tax/ai-advisor/route.ts:57`, `src/app/api/qna/generate/route.ts:53`, `src/app/api/marketing/content/generate/route.ts:262`, `src/app/api/marketing/threads/generate/route.ts:19`, `src/app/api/marketing/threads/comments/route.ts:57`, `src/app/api/site-chat/upload/route.ts:142`, `src/app/api/estimate-coach/parse-receipt/route.ts` | Claude API 키 |
| `SOLAPI_API_KEY` | `src/lib/solapi.ts:3` | Solapi SMS API 키 |
| `SOLAPI_API_SECRET` | `src/lib/solapi.ts:4` | Solapi secret |
| `SOLAPI_SENDER_NUMBER` | `src/lib/solapi.ts:5` | 발신번호 |
| `TOSS_SECRET_KEY` | `src/lib/toss.ts:6` | Toss Payments API 비밀키 |
| `TOSS_WEBHOOK_SECRET` | `src/app/api/billing/webhook/route.ts:18` | Toss 웹훅 검증 시크릿 |
| `CRON_SECRET` | `src/lib/cron/monitor.ts:74`, `src/app/api/billing/cron/route.ts:10` | Vercel CRON Bearer 인증 |
| `CRON_ALERT_SLACK_WEBHOOK` | `src/lib/cron/monitor.ts:65` | CRON 실패 Slack 웹훅 |
| `CRON_ALERT_EMAIL` | `src/lib/cron/monitor.ts:66` | CRON 실패 알림 이메일 |
| `RESEND_API_KEY` | `src/lib/email.ts:5,25`, `src/lib/cron/monitor.ts:67` | Resend 이메일 API |
| `RESEND_FROM_EMAIL` | `src/lib/email.ts:9`, `src/lib/cron/monitor.ts:68` | 기본 `noreply@interiorcoach.kr` |
| `NEXT_PUBLIC_META_PIXEL_ID` | `src/app/layout.tsx:23` | 메타 픽셀 |
| `NEXT_PUBLIC_APP_URL` | `src/app/api/workspaces/[id]/members/invite/route.ts:112`, `src/app/api/workspace/invite/route.ts:57`, `src/app/api/marketing/oauth/[provider]/route.ts:39`, `src/app/api/marketing/oauth/[provider]/callback/route.ts:54` | 초대/콜백 링크 base (기본 `https://interiorcoach.kr`) |
| `DEMO_REQUEST_NOTIFY_NUMBER`, `ADMIN_PHONE` | `src/app/api/demo-request/route.ts:12-13` | 데모 신청 접수 알림 번호 |
| `NODE_ENV` | `src/lib/adlog-client.ts:245` | 개발 모드 디버그 출력 |
| — (없음) | — | `SUPABASE_*`, `OPENAI_API_KEY`, `R2_*`, `AWS_*`는 grep 결과 **0건** |

---

## 11. 최종 권장안 대비 GAP 분석

| 모듈 | 테이블 상태 | API 상태 | 추가 필요(관찰 기반) | 충돌 위험 |
|---|---|---|---|---|
| 공정매니저 | 있음 | 있음 | 공정 의존관계/CPM 전용 컬럼·엔드포인트 | schedule vs schedule-planner 2개 도메인 공존 |
| 자재·발주 | 있음 (5 테이블) | `material_orders`/`inventory` 전용 API 없음 | 발주/재고 전용 라우트 | `materials` 단일 API에 통합 여부 결정 |
| 현장 손익 | 부분 (컬럼 기반 집계) | 드릴다운/정산만 | `site_pnl` 집계 테이블 or 전용 뷰 | 계산 로직 산재 |
| 수금관리 | 있음 | 있음 | — | `billings` vs `billing_records` 혼동 |
| 하자관리 | 있음 | 있음 | — | `defects.assigned_to`가 text(FK 아님) |
| 업무일지 | 있음 | 있음 | — | — |
| 근태급여 | 있음 | 근태+급여 연동 로직 API 없음 | 근태→급여 자동 생성 라우트 | 4 테이블 조인 복잡 |
| 반장·기사 인력풀 | 부분(workspace-scoped) | 있음 | 크로스-워크스페이스 공유풀 테이블 | `workers` 테이블 확장 vs 신규 테이블 |
| 견적서 | 있음 (가장 성숙) | 있음 | — | metadata jsonb 필드 공유 |
| 통합 대시보드 | 집계형(뷰 없음) | 있음 | 마테리얼라이즈드 뷰·캐시 테이블 | 계산 중복 |
| 월간 리포트 | 부분 | `reports/settlement` 1개 | `monthly_reports` 테이블·생성 CRON | `/api/reports/**` 네임스페이스 확장 |
| 추천 보상 | 컬럼만 존재 | 없음 | `referrals` 테이블, 보상 계정/정산 API | `customers.referred_by`가 FK 미정의 — 참조 무결성 없음 |
| 팀 권한 관리 | 있음 (두 레이어) | 있음 | `workspace_permissions` override 런타임 반영 | 매트릭스+테이블 이중화 |
| 공사 유형 템플릿 | 견적 템플릿만 | 있음 | 공정 템플릿 별도 테이블 or `estimate_templates.type` 확장 | — |
| 데이터 내보내기 | 없음 | 견적 개별 export만 | 워크스페이스 벌크 export 라우트 | — |
| 랜딩페이지 지원 | `demo_requests`+`landing_events` | 있음 | `pricing_plans` 테이블 확인(현재 상수 추정) | `/api/pricing-plans`와 DB 동기화 여부 불명확 |
| OCR/STT/캡처 | OCR만 | OCR API 3개 | STT 테이블·라우트, 캡처 저장용 테이블 | `@anthropic-ai/sdk` 단일 의존 |

---

## 12. 추가 작업 시 주의 사항 (관찰된 사실만)

- `subscriptions.billing_cycle` default `'monthly'` — `trial` 상태는 별도 컬럼 `trial_ends_at`으로 관리됨. trial 관련 새 컬럼 추가 시 기존 로직(`src/lib/subscription/trial.ts`)과 충돌 가능.
- `subscriptions.user_id`가 **UNIQUE** — 한 유저당 1 구독. 멀티 워크스페이스 구독 확장 시 스키마 변경 필요.
- `user.active_workspace_id`는 FK가 아님(컬럼만) — 잘못된 ws id가 들어가도 DB 레벨 검증 없음. `requireWorkspaceAuth()`는 `workspace_members` 조인으로 런타임 검증.
- `workspace_permissions` 테이블 존재하지만 런타임 `checkPermission()`은 역할 매트릭스만 사용. per-member override 구현 시 기존 222+ 라우트 전부 영향.
- `customers.referred_by uuid`는 FK 미정의 — 추천 보상 기능 추가 시 먼저 FK 추가 필요.
- `site_chat_messages.reply_to_id`, `threads_posts.template_id`, `threads_posts.auto_rule_id`, `tax_expenses.vendor_id`, `tax_invoices.vendor_id` 모두 **UUID 컬럼이나 FK 미선언**. 참조 무결성 없음.
- 모든 `workspace_id` 컬럼은 `references(() => workspaces.id)`만 있고 `ON DELETE` 지정 없음 → 기본 NO ACTION. `workspaces` 삭제 시 해당 레코드 삭제 실패(직접 cascade 테이블 제외).
- Better Auth 세션 쿠키는 HMAC 시그니처 검증으로만 인증 — `BETTER_AUTH_SECRET` 변경 시 모든 활성 세션 무효화됨.
- `/api/estimates/shared/[token]`, `/api/portal/[token]`, `/api/portal-v2/[slug]`, `/api/track-event`, `/api/demo-request`(POST), `/api/pricing-plans`, `/api/qna`(GET)는 **인증 없는 공개 엔드포인트**. Rate limit 구현 위치 확인 필요(`src/lib/api/rate-limit.ts` 존재하나 적용 여부는 라우트별 상이).
- `billings.status` enum은 `pending/invoiced/paid/overdue/cancelled`, `contract_payments.status`는 `미수/완납` (한글) — 2개 테이블이 수금/결제 상태를 다르게 표현.
- `featureFlags.allowed_workspaces` jsonb가 null이면 전체 허용, 배열이면 해당 ws만 — 신규 플래그 추가 시 이 규칙 준수 필요.
- `notification_settings.sms_recipient_phone` 단일 전화번호 필드. 다중 수신자는 `notification_recipients` 별도 테이블로 관리.
- Drizzle 마이그레이션 번호가 **0000, 0001, 0003, 0004, 0005** — `0002`가 건너뛰어져 있음 (meta 폴더 확인 필요).

---

## 13. 마이그레이션 전략

### 기존 마이그레이션 파일 목록 (`drizzle/`)

| 파일 | 라인 | 테이블/변경 |
|---|---|---|
| `0000_plain_mongu.sql` | 1001 | 초기 스키마 — 대부분의 테이블 생성 (companies, user, session, account, verification, workspaces, workspace_members, customers, sites, estimates, estimate_items, contracts, contract_payments, construction_phases, workers, phase_workers, materials, material_orders, expenses, inventory, site_photos, photo_comments, communication_logs, customer_portal_tokens, tax_*, subscriptions, usage_records, billing_records, analysis_credits, analysis_results, threads_*, marketing_*, sms_*, notifications, schedule_plans, qna_posts, defects, daily_logs, billings, activity_log, attendance, notification_queue, notification_settings, notification_recipients, notification_logs, feature_flags, change_requests, cwicr_items, gyeonjeok_category_map, market_price_samples, zone_ranges, n8n_webhook_logs, workspace_permissions, workspace_invitations) |
| `0001_site_chat_and_portal.sql` | 117 | `site_chat_rooms`, `site_chat_messages`, `site_chat_attachments`, `site_chat_participants`, `site_chat_pinned_summary`, `signature_requests`, `tracking_links`, `tracking_page_views` 생성 |
| `0001_site_chat_and_portal_down.sql` | — | 위 마이그레이션 롤백 |
| `0002` | **결번** | — |
| `0003_estimate_enhancements.sql` | 37 | `estimates.share_token` / `share_expires_at` 컬럼 추가, `estimate_history` 테이블 + 인덱스 2개, `estimate_templates` 테이블 + 인덱스 1개 |
| `0004_cron_execution_logs.sql` | 23 | `cron_execution_logs` 테이블 + 인덱스 `idx_cron_execution_logs_name_completed`, `idx_cron_execution_logs_success` |
| `0005_landing_demo_and_events.sql` | 58 | `demo_requests` 테이블(CHECK 2개 + 인덱스 2개), `landing_events` 테이블(CHECK 1개 + 인덱스 2개) |
| `0005_landing_demo_and_events_down.sql` | — | 위 마이그레이션 롤백 |
| `drizzle/meta/` | — | Drizzle 메타데이터 |

### 새 테이블만 추가하면 되는 모듈
- 추천 보상(`referrals`, `referral_rewards` 등) — 기존 `customers.referred_by` 컬럼만 존재
- 월간 리포트(`monthly_reports`, `report_snapshots`)
- STT/캡처(`transcripts`, `capture_events`)
- 공정 템플릿(`construction_templates` — 현재 `estimate_templates`만 존재)
- 크로스-ws 인력풀(`global_workers` 등)
- 데이터 벌크 export 작업 추적(`export_jobs`)

### 기존 테이블 수정이 필요한 모듈
- 팀 권한 per-member override: `workspace_permissions` 테이블은 이미 있으나 `checkPermission` 로직 자체를 변경해야 함 (테이블 변경은 없음).
- 추천 보상 FK 연결: `customers.referred_by`에 FK 제약 추가.
- 멀티 구독: `subscriptions.user_id` UNIQUE 제거 + `workspace_id` UNIQUE 추가 검토.
- `defects.assigned_to`가 현재 text — 작업자 연결 시 `workers.id` FK로 변경 필요.
- `tax_expenses.vendor_id`, `tax_invoices.vendor_id`, `site_chat_messages.reply_to_id`, `threads_posts.template_id/auto_rule_id` FK 선언 추가.
- 모든 `workspace_id` 컬럼에 `ON DELETE` 정책 명시 (현재 기본 NO ACTION — 고아 레코드 위험).

### 빌드·테스트
- `drizzle.config.ts` 존재 (루트).
- `scripts/seed-*.mjs` 다수(seed-sites, seed-schedule, seed-threads, seed-expenses, seed-v2-backend, seed-real-schedules, seed-sites-schedule, seed-demo) — 개발/데모용 시드 스크립트.
- 테스트: `vitest` — `src/__tests__/cron-monitor.test.ts` 존재, `supabase/tests/site-chat.sql` pgTAP.

---

_끝._
