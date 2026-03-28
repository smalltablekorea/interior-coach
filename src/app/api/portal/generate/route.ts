import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customerPortalTokens, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("customers", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return err("customerId가 필요합니다");
    }

    // 해당 고객이 현재 사용자의 고객인지 확인 (소유권 체크)
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), workspaceFilter(customers.workspaceId, customers.userId, wid, uid)));

    if (!customer) {
      return notFound("고객을 찾을 수 없습니다");
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 유효

    const [row] = await db
      .insert(customerPortalTokens)
      .values({
        customerId,
        token,
        expiresAt,
      })
      .returning();

    return ok({
      token: row.token,
      expiresAt: row.expiresAt,
      url: `/portal/${row.token}`,
    });
  } catch (error) {
    return serverError(error);
  }
}
