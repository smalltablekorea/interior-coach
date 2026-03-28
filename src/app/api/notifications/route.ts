import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

    const conditions = [workspaceFilter(notifications.workspaceId, notifications.userId, auth.workspaceId, auth.userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const where = and(...conditions);

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(notifications)
      .where(where);

    const [{ count: unreadCount }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(notifications)
      .where(and(workspaceFilter(notifications.workspaceId, notifications.userId, auth.workspaceId, auth.userId), eq(notifications.isRead, false)));

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        link: notifications.link,
        metadata: notifications.metadata,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return ok({ notifications: rows, unreadCount }, buildPaginationMeta(total, pagination));
  } catch (error) {
    return serverError(error);
  }
}

// 읽음 처리
export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    if (body.markAllRead) {
      // 전체 읽음 처리
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, auth.userId), eq(notifications.workspaceId, auth.workspaceId), eq(notifications.isRead, false)));

      return ok({ message: "모두 읽음 처리되었습니다" });
    }

    if (body.id) {
      // 개별 읽음 처리
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, auth.userId), eq(notifications.workspaceId, auth.workspaceId)));

      return ok({ message: "읽음 처리되었습니다" });
    }

    return ok({ message: "처리할 항목이 없습니다" });
  } catch (error) {
    return serverError(error);
  }
}
