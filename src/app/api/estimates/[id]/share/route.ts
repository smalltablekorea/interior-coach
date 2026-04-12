import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";
import { randomBytes } from "crypto";

// 공유 토큰 생성/갱신
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const expiresInDays = (body as { expiresInDays?: number }).expiresInDays ?? 30;

    const shareToken = randomBytes(24).toString("base64url");
    const shareExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const [row] = await db
      .update(estimates)
      .set({ shareToken, shareExpiresAt: shareExpiresAt, updatedAt: new Date() })
      .where(
        and(
          eq(estimates.id, id),
          workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId),
          isNull(estimates.deletedAt)
        )
      )
      .returning({ id: estimates.id, shareToken: estimates.shareToken });

    if (!row) return notFound("견적을 찾을 수 없습니다");

    return ok({
      shareToken: row.shareToken,
      shareUrl: `/estimates/shared/${row.shareToken}`,
      expiresAt: shareExpiresAt.toISOString(),
    });
  } catch (error) {
    return serverError(error);
  }
}

// 공유 해제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .update(estimates)
    .set({ shareToken: null, shareExpiresAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(estimates.id, id),
        workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId),
        isNull(estimates.deletedAt)
      )
    )
    .returning({ id: estimates.id });

  if (!row) return notFound("견적을 찾을 수 없습니다");
  return ok({ message: "공유가 해제되었습니다" });
}
