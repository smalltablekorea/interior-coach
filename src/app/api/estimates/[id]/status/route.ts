import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, notFound, serverError } from "@/lib/api/response";

const VALID_STATUSES = ["작성중", "발송", "승인", "거절"];

// 견적 상태 변경
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return err(`유효하지 않은 상태입니다. 가능한 값: ${VALID_STATUSES.join(", ")}`);
    }

    const [existing] = await db
      .select({ id: estimates.id, status: estimates.status })
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.userId, auth.userId)));

    if (!existing) {
      return notFound("견적을 찾을 수 없습니다");
    }

    await db
      .update(estimates)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(estimates.id, id), eq(estimates.userId, auth.userId)));

    return ok({
      message: `상태가 '${status}'(으)로 변경되었습니다`,
      previousStatus: existing.status,
      newStatus: status,
    });
  } catch (error) {
    return serverError(error);
  }
}
