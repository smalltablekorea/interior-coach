# Drizzle Migrations — 이 프로젝트의 규칙

## 왜 직접 SQL 인가

`drizzle-kit generate` 는 **사용하지 않는다.** 메타 스냅샷(`drizzle/meta/`)이
0000 시점에서 멈춰 있고, 0001 ~ 현재 사이의 11+ 마이그레이션이 손으로 작성된
직접 SQL 이라 메타와 실제 운영 스키마가 어긋난 상태다. 이 상황에서
`drizzle-kit generate` 를 돌리면 이미 운영에 존재하는 컬럼·테이블을 다시 만들려는
SQL 이 토해져 나오고, 적용 시 `relation already exists` / `column already exists`
로 실패하거나 운영을 깨뜨릴 수 있다.

메타를 한 번에 재동기화(`drizzle-kit introspect`) 하는 작업은 별도로 진행할
예정이다. **그때까지는 직접 SQL 패턴만 사용**한다.

`npm run db:generate` 는 우발 실행을 막기 위한 가드 — 호출 즉시 종료한다.

## 작성 규칙

### 1. 파일 명명 / 채번
- 형식: `NNNN_<설명_snake_case>.sql`
- 번호는 `drizzle/` 의 마지막 번호 + 1. 충돌 가능성이 있으면 PR 머지 직전에
  최신 번호를 다시 확인하고 rebase
- 동일 번호 두 개(0001 동시 충돌 등)는 머지 직전에 큰 번호로 밀어 정렬을 유지

### 2. `_down.sql` 짝맞춤 (필수)
- 모든 마이그레이션은 같은 폴더에 `NNNN_<설명>_down.sql` 동반 작성
- 다운 SQL 은 업 SQL 의 역연산. 순서는 역순 (마지막에 만든 것을 먼저 지움)
- 데이터 손실 가능성 있는 경우 다운 SQL 상단 주석으로 **사전 백업 명령**과
  **건수 확인 쿼리**를 명시. 예:
  ```sql
  -- Rollback for 0011_*
  -- 주의: name_en 등에 번역 데이터가 들어있다면 모두 소실.
  --   SELECT count(*) FROM materials WHERE name_en IS NOT NULL;
  ```

### 3. 멱등성
- 업 SQL: 가능하면 `IF NOT EXISTS` (CREATE), `ADD COLUMN IF NOT EXISTS` 사용
- 다운 SQL: `IF EXISTS` (DROP) 사용
- 같은 마이그레이션이 두 번 실행돼도 안전하도록 작성 — 운영 사고 시 재실행 가능

### 4. 스키마 코드 동기
- `src/lib/db/schema.ts` 의 Drizzle 정의도 **같은 PR 안에서** 갱신
- SQL 만 쓰고 schema.ts 를 안 고치면 타입 시스템과 런타임이 어긋남

### 5. 운영 적용 절차
1. **테스트 DB(또는 Neon 브랜치)에 먼저 적용** — 운영 적용 절대 금지
   ```bash
   psql "$TEST_DATABASE_URL" -f drizzle/NNNN_<설명>.sql
   ```
2. 다솜 승인 + PR 머지 후 운영 적용
   ```bash
   psql "$DATABASE_URL" -f drizzle/NNNN_<설명>.sql
   ```
3. 롤백이 필요하면 같은 절차로 `_down.sql` 적용

### 6. 금지
- `npx drizzle-kit generate` — `npm run db:generate` 로 차단됨
- `npx drizzle-kit push` — 메타와 어긋난 상태에서 위험
- 마이그레이션 파일 사후 수정 — 운영에 적용된 SQL 은 절대 고치지 않는다.
  잘못된 부분이 있으면 새 번호로 보정 마이그레이션 작성

## 메타 상태 (참고)

```
drizzle/meta/_journal.json    → 0000_plain_mongu 한 줄만 등록
drizzle/meta/0000_snapshot.json → 0000 시점 스키마만 반영
```

0001 ~ 0011 의 모든 변경(payment_splits, site_schedules, ai_usage,
customer_status_history, preferred_locale, *_en 등)은 메타에 없다.
**재동기화 전까지 `drizzle-kit` 의 generate / push / migrate 명령은 사용 금지.**
