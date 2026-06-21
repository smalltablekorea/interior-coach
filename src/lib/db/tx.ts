import { Pool } from "@neondatabase/serverless";
import { drizzle, NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// neon-http(`@/lib/db`)는 HTTP 단발 호출이라 BEGIN/COMMIT 트랜잭션을 못 한다.
// 진짜 트랜잭션이 필요한 곳(예: 현장 1건 + 자식 N건 일괄 생성)에서는
// 이 모듈의 dbTx 를 통해 WebSocket Pool 기반 어댑터를 쓴다.
// 사용 예: await withTransaction(async (tx) => { ... tx.insert(...).values(...) ... })

let _pool: Pool | null = null;
let _db: NeonDatabase<typeof schema> | null = null;

function getDbTx() {
  if (!_db) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const dbTx = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDbTx() as any)[prop];
  },
});

export type TxClient = Parameters<Parameters<NeonDatabase<typeof schema>["transaction"]>[0]>[0];

/**
 * 단일 트랜잭션 안에서 콜백을 실행. 콜백이 throw 하면 자동 ROLLBACK.
 */
export function withTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
  return dbTx.transaction(fn);
}
