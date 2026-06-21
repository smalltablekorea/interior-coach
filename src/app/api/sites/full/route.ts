import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { createSiteWithChildren } from "@/lib/site/create-site";

/**
 * POST /api/sites/full
 *   현장 + 자식(고객/계약/대금분할/공정/일정) 일괄 생성.
 *   모든 INSERT 가 단일 트랜잭션으로 묶이며, 중간 실패 시 전체 ROLLBACK.
 *   body: createSiteInputSchema 참조 ( /lib/site/create-site.ts )
 */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body) return err("요청 본문을 읽지 못했습니다");

    const result = await createSiteWithChildren(body, {
      userId: auth.userId,
      workspaceId: auth.workspaceId,
    });
    if (!result.ok) return err(result.error);

    return ok(result.data);
  } catch (e) {
    return serverError(e);
  }
}
