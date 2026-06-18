import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user as userTable, notifications } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * POST /api/admin/broadcast
 *   body: { title, message, link?, type?, dedupeKey? }
 *
 *   모든 가입자에게 in-app 알림 일괄 발송 (예: "7월 31일까지 전면 무료" 공지).
 *   dedupeKey가 주어지면 (type, title)이 같은 알림이 이미 있는 사용자는 건너뜀
 *   → 같은 공지를 두 번 눌러도 중복 발송 안 됨.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const title: string = (body.title || "").toString().trim();
    const message: string | null = body.message ? body.message.toString() : null;
    const link: string | null = body.link ? body.link.toString() : null;
    const type: string = (body.type || "system").toString();
    const dedupeKey: string | null = body.dedupeKey ? body.dedupeKey.toString() : null;

    if (!title) return err("title 필수", 400);
    if (title.length > 200) return err("title은 200자 이내", 400);

    const users = await db.select({ id: userTable.id }).from(userTable);
    if (users.length === 0) return ok({ sent: 0, skipped: 0, total: 0 });

    // 중복 방지: 같은 type + title 알림이 이미 있는 사용자는 제외.
    // 단순 휴리스틱이지만 (type='system', title='🎉 7월 31일까지...') 형태로
    // 키가 고유하면 충분히 동작.
    const skipUserIds = new Set<string>();
    if (dedupeKey) {
      const existing = await db
        .select({ userId: notifications.userId })
        .from(notifications)
        .where(and(eq(notifications.type, type), eq(notifications.title, title)));
      for (const e of existing) skipUserIds.add(e.userId);
    }

    const toInsert = users
      .filter((u) => !skipUserIds.has(u.id))
      .map((u) => ({
        userId: u.id,
        workspaceId: null,
        type,
        title,
        message,
        link,
        metadata: dedupeKey ? { dedupeKey } : null,
        isRead: false,
      }));

    if (toInsert.length > 0) {
      await db.insert(notifications).values(toInsert);
    }

    return ok({
      sent: toInsert.length,
      skipped: skipUserIds.size,
      total: users.length,
    });
  } catch (error) {
    return serverError(error);
  }
}
