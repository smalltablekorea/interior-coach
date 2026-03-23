# Backend Changelog

## 2026-03-23 — P0 백엔드 고도화

### 보안 수정 (Critical)
- **userId 격리 누락 수정**: customers, sites, contracts, expenses GET 쿼리에서 `userId` 필터 누락으로 모든 사용자 데이터 노출되던 버그 수정
- **customers/[id], sites/[id], contracts/[id]**: GET/PUT/DELETE에서 소유권 확인 없이 ID만으로 접근 가능하던 취약점 수정
- **Tax AI Advisor**: 하드코딩된 `USER_ID = "demo"` 제거, `requireAuth()` 적용
- **materials API**: 인증 없이 접근 가능하던 문제 수정, `requireAuth()` 추가
- **materials POST**: `userId: "system"` 하드코딩 제거, 세션 userId 사용

### 신규 인프라
- **공유 타입** (`/src/types/api.ts`): `ApiResponse<T>`, `PaginationMeta`, 엔티티 타입 정의 (Customer, Site, Estimate, Contract, Worker, Material, Expense, Schedule, Notification)
- **API 응답 표준화** (`/src/lib/api/response.ts`): `ok()`, `err()`, `notFound()`, `forbidden()`, `serverError()` 헬퍼
- **쿼리 헬퍼** (`/src/lib/api/query-helpers.ts`): `parsePagination()`, `buildPaginationMeta()`, `parseFilters()`, `searchPattern()`, `countSql()`
- **Zod 검증** (`/src/lib/api/validate.ts`): `validateBody()` + 엔티티별 스키마 (customer, site, estimate, contract, worker, expense, material)
- **플랜 가드** (`/src/lib/api/plan-guard.ts`): `requireFeature()`, `requireUsageLimit()` — 구독 플랜 기반 기능 접근 제어

### API 리팩토링
모든 핵심 CRUD API에 적용:
- `{ success: boolean, data?: T, error?: string, meta?: PaginationMeta }` 표준 응답 형식
- Zod 스키마 기반 입력 검증
- 페이지네이션 (`?page=1&limit=20`) + 전체 카운트 메타 정보
- 검색 (`?search=`) + 상태 필터 (`?status=`)
- userId 기반 데이터 격리

대상 라우트:
- `/api/customers` + `/api/customers/[id]`
- `/api/sites` + `/api/sites/[id]`
- `/api/estimates` + `/api/estimates/[id]`
- `/api/contracts` + `/api/contracts/[id]`
- `/api/workers`
- `/api/expenses`
- `/api/materials`
- `/api/tax/ai-advisor` (플랜 가드 적용: starter 이상, 사용량 카운트)

### DB 스키마 변경
- **`companies` 테이블 추가**: id, name, ceoName, businessNumber, phone, address, plan, planExpiresAt, deletedAt
- **`user` 테이블 확장**: `companyId` (companies FK), `role` (owner/manager/worker) 컬럼 추가
- **`deletedAt` 컬럼 추가**: customers, sites, estimates, contracts, workers, materials, expenses 테이블 — soft delete 준비

### workers API
- 데모 하드코딩 데이터 제거 → 실제 DB 쿼리로 전환
- 검색 (이름/전화), 직종 필터, 페이지네이션 지원

### 다음 단계 (P1)
- [ ] `drizzle-kit push` 또는 마이그레이션 실행하여 DB 스키마 반영
- [ ] 모든 쿼리에 `.where(isNull(table.deletedAt))` soft delete 필터 적용
- [ ] companies 기반 멀티테넌트 전환 (userId → companyId 격리)
- [ ] Toss Payments 구독 결제 연동
- [ ] 파일 업로드 API (Vercel Blob signed URL)
- [ ] 정산 리포트 API
