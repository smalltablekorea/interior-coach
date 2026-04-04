import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const logs = await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.workspaceId, auth.workspaceId))
      .orderBy(desc(notificationLogs.createdAt))
      .limit(50);

    return ok(logs);
  } catch (error) {
    return serverError(error);
  }
}
