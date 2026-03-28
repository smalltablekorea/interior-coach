import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { communicationLogs, customers } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("customers", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { id: customerId } = await params;

    // 고객 소유권 확인
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), workspaceFilter(customers.workspaceId, customers.userId, wid, uid), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) return err("고객을 찾을 수 없습니다", 404);

    const logs = await db
      .select({
        id: communicationLogs.id,
        date: communicationLogs.date,
        type: communicationLogs.type,
        content: communicationLogs.content,
        staffName: communicationLogs.staffName,
        createdAt: communicationLogs.createdAt,
      })
      .from(communicationLogs)
      .where(eq(communicationLogs.customerId, customerId))
      .orderBy(desc(communicationLogs.date));

    return ok(logs);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("customers", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { id: customerId } = await params;
    const body = await request.json();
    const { date, type, content, staffName } = body;

    if (!type || !date) return err("날짜와 유형은 필수입니다");

    // 고객 소유권 확인
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), workspaceFilter(customers.workspaceId, customers.userId, wid, uid), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) return err("고객을 찾을 수 없습니다", 404);

    const [row] = await db
      .insert(communicationLogs)
      .values({
        customerId,
        userId: uid,
        workspaceId: wid,
        date,
        type,
        content: content || null,
        staffName: staffName || null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
