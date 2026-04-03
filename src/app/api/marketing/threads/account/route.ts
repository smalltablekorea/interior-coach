import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsAccount } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, err, serverError } from "@/lib/api/response";


export async function GET() {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const accounts = await db
      .select()
      .from(threadsAccount)
      .where(workspaceFilter(threadsAccount.workspaceId, threadsAccount.userId, wid, uid))
      .limit(1);

    return ok(accounts[0] || null);
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
    const { username } = body as { username: string };

    if (!username) {
      return err("username 필수");
    }

    // Check existing
    const existing = await db
      .select()
      .from(threadsAccount)
      .where(workspaceFilter(threadsAccount.workspaceId, threadsAccount.userId, wid, uid))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(threadsAccount)
        .set({ username, isConnected: true, connectedAt: new Date(), updatedAt: new Date() })
        .where(eq(threadsAccount.id, existing[0].id))
        .returning();
      return ok(updated);
    }

    const [created] = await db
      .insert(threadsAccount)
      .values({ userId: uid, workspaceId: wid, username, isConnected: true, connectedAt: new Date() })
      .returning();

    return ok(created);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE() {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const existing = await db
      .select()
      .from(threadsAccount)
      .where(workspaceFilter(threadsAccount.workspaceId, threadsAccount.userId, wid, uid))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(threadsAccount)
        .set({ isConnected: false, updatedAt: new Date() })
        .where(eq(threadsAccount.id, existing[0].id))
        .returning();
      return ok(updated);
    }

    return ok(null);
  } catch (error) {
    return serverError(error);
  }
}
