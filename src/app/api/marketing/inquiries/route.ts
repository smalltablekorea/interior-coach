import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingInquiries } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const conditions = [workspaceFilter(marketingInquiries.workspaceId, marketingInquiries.userId, wid, uid)];
    if (status) {
      conditions.push(eq(marketingInquiries.status, status));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(marketingInquiries)
        .where(where)
        .orderBy(desc(marketingInquiries.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(marketingInquiries).where(where),
    ]);

    return ok({ items, meta: buildPaginationMeta(total, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const body = await request.json();
    const { customerName, phone, email, channel, content, status } = body;

    const [row] = await db
      .insert(marketingInquiries)
      .values({
        userId: uid,
        workspaceId: wid,
        customerName,
        phone: phone || null,
        email: email || null,
        channel,
        content: content || null,
        status: status || "신규",
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
