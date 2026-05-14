/**
 * 마케팅 대행 운영자 API 게이트.
 *
 * Phase 2 정책 (Q2 = a): requireAuth() + isAgencyOperator(email) 만 사용.
 * permissions.ts 카테고리는 추가하지 않음.
 *
 * agency_clients.operator_workspace_id 컬럼이 필요하므로 user.activeWorkspaceId 도 함께 반환.
 */

import type { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { err, forbidden } from "@/lib/api/response";
import { isAgencyOperator } from "@/lib/agency/operator";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";

interface OperatorAuthSuccess {
  ok: true;
  userId: string;
  email: string;
  workspaceId: string;
}
interface OperatorAuthFailure {
  ok: false;
  response: NextResponse;
}

export async function requireAgencyOperator(): Promise<
  OperatorAuthSuccess | OperatorAuthFailure
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  const email = auth.session.user.email;
  if (!isAgencyOperator(email)) {
    return { ok: false, response: forbidden("마케팅 대행 운영자 권한이 없습니다") };
  }

  const [u] = await db
    .select({ activeWorkspaceId: userTable.activeWorkspaceId })
    .from(userTable)
    .where(eq(userTable.id, auth.userId))
    .limit(1);

  if (!u?.activeWorkspaceId) {
    return { ok: false, response: err("활성 워크스페이스가 필요합니다", 400) };
  }

  return {
    ok: true,
    userId: auth.userId,
    email,
    workspaceId: u.activeWorkspaceId,
  };
}
