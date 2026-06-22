import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, customerStatusHistory, user as userTable } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";

/**
 * GET /api/customers/[id]/history
 *   고객 상담 이력 (상태 변경 + 메모) 시간 역순.
 *   응답: Array<{ id, fromStatus, toStatus, note, changedAt, changedBy, changedByName }>
 *   changedByName 은 user 테이블 join 으로 조회.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("customers", "read");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    // 권한 확인: 이 고객이 워크스페이스 소속인지
    const [c] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1);
    if (!c) return notFound("고객을 찾을 수 없습니다");

    const rows = await db
      .select({
        id: customerStatusHistory.id,
        fromStatus: customerStatusHistory.fromStatus,
        toStatus: customerStatusHistory.toStatus,
        note: customerStatusHistory.note,
        changedAt: customerStatusHistory.changedAt,
        changedBy: customerStatusHistory.changedBy,
        changedByName: userTable.name,
      })
      .from(customerStatusHistory)
      .leftJoin(userTable, eq(customerStatusHistory.changedBy, userTable.id))
      .where(eq(customerStatusHistory.customerId, id))
      .orderBy(desc(customerStatusHistory.changedAt));

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/customers/[id]/history
 *   사용자가 직접 상담 메모를 남길 때 사용.
 *   - status 변경 없이 메모만 남기는 경우: toStatus = 현재 상태로 자동 채움, note 필수.
 *   - status 변경 동반: toStatus 명시 + customers.status 도 동시 업데이트.
 */
const bodySchema = z.object({
  toStatus: z.string().trim().min(1).max(20).optional(),
  note: z.string().trim().max(500).optional(),
}).refine((v) => !!v.toStatus || !!v.note, {
  message: "toStatus 또는 note 중 하나는 필수입니다",
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("customers", "write");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return err(first?.message || "입력값이 올바르지 않습니다");
    }

    const [cust] = await db
      .select({ id: customers.id, status: customers.status })
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1);
    if (!cust) return notFound("고객을 찾을 수 없습니다");

    const fromStatus = cust.status;
    const toStatus = parsed.data.toStatus ?? cust.status ?? "상담중";

    // status 가 바뀌면 customers.status 도 함께 갱신
    if (parsed.data.toStatus && parsed.data.toStatus !== cust.status) {
      await db
        .update(customers)
        .set({ status: parsed.data.toStatus, updatedAt: new Date() })
        .where(eq(customers.id, id));
    }

    const [row] = await db
      .insert(customerStatusHistory)
      .values({
        customerId: id,
        workspaceId: auth.workspaceId,
        fromStatus: fromStatus,
        toStatus,
        changedBy: auth.userId,
        note: parsed.data.note || null,
      })
      .returning();

    return ok(row);
  } catch (e) {
    return serverError(e);
  }
}
