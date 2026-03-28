import { eq, or, and, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * 워크스페이스 기반 데이터 필터 조건을 생성합니다.
 * workspaceId가 설정된 데이터는 workspaceId로 필터하고,
 * 기존 데이터(workspaceId가 null)는 userId로 필터합니다.
 */
export function workspaceFilter(
  workspaceIdCol: PgColumn,
  userIdCol: PgColumn,
  workspaceId: string,
  userId: string,
): SQL {
  return or(
    eq(workspaceIdCol, workspaceId),
    and(isNull(workspaceIdCol), eq(userIdCol, userId)),
  )!;
}
