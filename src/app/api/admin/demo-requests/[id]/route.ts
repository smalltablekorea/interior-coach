import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { demoRequests } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { validateBody } from "@/lib/api/validate";
import { ok, err, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "done"]).optional(),
  memo: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

/**
 * PATCH /api/admin/demo-requests/:id — 상태/메모/스케줄 변경
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return err("id가 필요합니다");

  const parsed = await validateBody(request, updateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const patch: Partial<typeof demoRequests.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.status) {
    patch.status = body.status;
    if (body.status === "contacted") patch.contactedAt = new Date();
    if (body.status === "done") patch.completedAt = new Date();
  }
  if (body.memo !== undefined) patch.memo = body.memo;
  if (body.scheduledAt !== undefined) {
    patch.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  try {
    const [updated] = await db
      .update(demoRequests)
      .set(patch)
      .where(eq(demoRequests.id, id))
      .returning();

    if (!updated) return notFound("데모 신청을 찾을 수 없습니다");
    return ok({ item: updated });
  } catch (e) {
    console.error("[admin/demo-requests PATCH]", e);
    return err(e instanceof Error ? e.message : "업데이트 실패", 500);
  }
}

export const dynamic = "force-dynamic";
