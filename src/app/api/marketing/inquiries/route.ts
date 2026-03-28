import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingInquiries } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const conditions = [workspaceFilter(marketingInquiries.workspaceId, marketingInquiries.userId, wid, uid)];
    if (status) {
      conditions.push(eq(marketingInquiries.status, status));
    }

    const rows = await db
      .select()
      .from(marketingInquiries)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(marketingInquiries.createdAt));

    return ok(rows);
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
