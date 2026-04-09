# Site Chat API 계약 문서

현장 톡방 + 고객 포털 백엔드 API 명세.
Frontend 봇이 이 문서 기반으로 UI를 구현합니다.

---

## TypeScript 타입 정의

```typescript
// ─── 공통 ───

type UUID = string;
type SenderType = "owner" | "team" | "partner" | "client" | "system";
type ContentType = "text" | "image" | "file" | "system_event";
type ParticipantRole = "owner" | "team" | "partner" | "client";
type JoinedVia = "direct" | "invite_link" | "client_portal";

// ─── Room ───

interface SiteChatRoom {
  id: UUID;
  siteId: UUID;
  workspaceId: UUID;
  title: string;
  clientPortalSlug: string | null;
  clientPortalEnabled: boolean;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Message ───

interface SiteChatMessage {
  id: UUID;
  roomId: UUID;
  senderId: string | null;
  senderType: SenderType;
  senderDisplayName: string;
  content: string | null;
  contentType: ContentType;
  replyToId: UUID | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachments?: SiteChatAttachment[];
}

// ─── Attachment ───

interface SiteChatAttachment {
  id: UUID;
  messageId: UUID;
  storagePath: string;
  fileType: string | null;
  fileSize: number | null;
  thumbnailPath: string | null;
  exifTakenAt: string | null;
  autoCategorizedTag: string | null;
  createdAt: string;
}

// ─── Participant ───

interface SiteChatParticipant {
  id: UUID;
  roomId: UUID;
  userId: string | null;
  role: ParticipantRole;
  displayName: string;
  joinedVia: JoinedVia;
  lastReadAt: string | null;
  notificationEnabled: boolean;
  createdAt: string;
}

// ─── Pinned Summary ───

interface SiteChatPinnedSummary {
  roomId: UUID;
  currentProgressPercent: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDate: string | null;
  pendingPaymentAmount: number;
  pendingPaymentDueDate: string | null;
  openDefectsCount: number;
  updatedAt: string;
}
```

---

## 엔드포인트

### 1. 톡방 목록

```
GET /api/site-chat/rooms
Authorization: 세션 쿠키 (워크스페이스 인증)
```

**Response 200:**
```json
{
  "rooms": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "title": "잠실 32평 리모델링",
      "clientPortalSlug": "jamsil-a7k2",
      "clientPortalEnabled": true,
      "createdAt": "2026-04-09T...",
      "updatedAt": "2026-04-09T...",
      "progressPercent": 45,
      "nextMilestone": "타일 시공",
      "nextMilestoneDate": "2026-04-18",
      "pendingPayment": 15000000,
      "openDefects": 0
    }
  ]
}
```

### 2. 톡방 생성

```
POST /api/site-chat/rooms
Authorization: 세션 쿠키
Content-Type: application/json
```

**Request:**
```json
{
  "siteId": "uuid",
  "title": "잠실 32평 리모델링",
  "enablePortal": true,
  "portalPassword": "1234"
}
```

**Response 201:**
```json
{
  "room": { ...SiteChatRoom }
}
```

### 3. 톡방 상세

```
GET /api/site-chat/rooms/:roomId
Authorization: 세션 쿠키
```

**Response 200:**
```json
{
  "room": { ...SiteChatRoom },
  "participants": [ ...SiteChatParticipant[] ],
  "summary": { ...SiteChatPinnedSummary | null }
}
```

### 4. 톡방 설정 수정

```
PATCH /api/site-chat/rooms/:roomId
Authorization: 세션 쿠키
```

**Request:**
```json
{
  "title": "새 이름",
  "clientPortalEnabled": true,
  "portalPassword": "newpass"
}
```

### 5. 톡방 삭제

```
DELETE /api/site-chat/rooms/:roomId
Authorization: 세션 쿠키
```

### 6. 메시지 목록 (커서 페이지네이션)

```
GET /api/site-chat/messages?roomId=uuid&cursor=uuid&limit=50
Authorization: 세션 쿠키
```

**Response 200:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderType": "owner",
      "senderDisplayName": "김사장",
      "content": "오늘 철거 완료했습니다",
      "contentType": "text",
      "createdAt": "2026-04-09T...",
      "attachments": []
    }
  ],
  "nextCursor": "uuid | null",
  "hasMore": true
}
```

### 7. 메시지 전송

```
POST /api/site-chat/messages
Authorization: 세션 쿠키
```

**Request:**
```json
{
  "roomId": "uuid",
  "content": "메시지 내용",
  "contentType": "text",
  "replyToId": "uuid (optional)",
  "metadata": {} 
}
```

**Response 201:**
```json
{
  "message": { ...SiteChatMessage }
}
```

### 8. 메시지 수정

```
PATCH /api/site-chat/messages/:messageId
Authorization: 세션 쿠키 (본인 메시지만)
```

**Request:**
```json
{
  "content": "수정된 내용"
}
```

### 9. 메시지 삭제 (소프트)

```
DELETE /api/site-chat/messages/:messageId
Authorization: 세션 쿠키 (본인 또는 owner)
```

### 10. 파일 업로드

```
POST /api/site-chat/upload
Authorization: 세션 쿠키
Content-Type: multipart/form-data
```

**Form Fields:**
- `file`: 파일 (max 20MB)
- `roomId`: UUID
- `caption`: string (optional)

**Response 201:**
```json
{
  "message": { ...SiteChatMessage },
  "attachment": { ...SiteChatAttachment }
}
```

### 11. SSE Realtime 구독

```
GET /api/site-chat/sse?roomId=uuid
Authorization: 세션 쿠키
```

**이벤트:**
- `connected` — 연결 성공
- `new_message` — 새 메시지
- `message_edited` — 메시지 수정
- `message_deleted` — 메시지 삭제 `{ id: uuid }`
- `summary_updated` — pinned summary 갱신

**예시:**
```
event: new_message
data: {"id":"uuid","senderType":"owner","content":"안녕하세요",...}

event: summary_updated
data: {"currentProgressPercent":60,"nextMilestoneTitle":"도배",...}
```

---

## 고객 포털 (공개 API)

### 12. 포털 조회

```
GET /api/portal/:slug?password=1234
```

**Response 200:**
```json
{
  "room": { "id": "uuid", "title": "...", "clientPortalEnabled": true },
  "messages": [ ...최근 200개 (system_event 제외) ],
  "summary": { ...SiteChatPinnedSummary | null }
}
```

**Response 401 (비밀번호 필요):**
```json
{
  "error": "비밀번호가 필요합니다",
  "requiresPassword": true
}
```

### 13. 포털 메시지 남기기

```
POST /api/portal/:slug/message
Content-Type: application/json
```

**Request:**
```json
{
  "content": "메시지 내용 (3~2000자)",
  "displayName": "고객 이름",
  "password": "1234 (비밀번호 설정된 방)"
}
```

**Rate Limit:** IP당 분당 5회

---

## 셀프 온보딩 API

### 14. 샘플 톡방 생성

```
POST /api/site-chat/onboarding
Authorization: 세션 쿠키
```

가입 직후 호출. 워크스페이스 + 샘플 프로젝트 + 톡방 + 대화 30개 자동 생성.

**Response 201:**
```json
{
  "message": "샘플 톡방이 생성되었습니다",
  "workspaceId": "uuid",
  "siteId": "uuid",
  "roomId": "uuid"
}
```

### 15. 진짜 프로젝트 전환

```
POST /api/site-chat/convert-sample
Authorization: 세션 쿠키
```

**Request:**
```json
{
  "name": "강남 24평 리모델링",
  "address": "서울 강남구...",
  "buildingType": "아파트",
  "areaPyeong": 24
}
```

### 16. 샘플 방 삭제

```
DELETE /api/site-chat/convert-sample
Authorization: 세션 쿠키
```

---

## Rate Limit 정리

| 엔드포인트 | 제한 |
|---|---|
| `GET /api/portal/:slug` | IP당 30회/분 |
| `POST /api/portal/:slug/message` | IP당 5회/분 |
| 인증 API 전체 | 세션 기반 (제한 없음) |

## 스팸 필터 (고객 포털)

- 메시지 길이: 3자 미만 또는 2000자 초과 → 거부
- URL 3개 이상 포함 → 거부
