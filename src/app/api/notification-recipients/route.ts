import { db } from "@/lib/db";
import { notificationRecipients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const VALID_ROLES = ["foreman", "supplier", "manager"];

export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select()
      .from(notificationRecipients)
      .where(eq(notificationRecipients.workspaceId, auth.workspaceId));
    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, phone, role } = body;

    if (!name?.trim()) return err("이름은 필수입니다.");
    if (!phone?.trim()) return err("전화번호는 필수입니다.");
    if (!VALID_ROLES.includes(role)) return err("유효하지 않은 역할입니다.");

    const phoneClean = phone.replace(/-/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phoneClean)) {
      return err("올바른 전화번호 형식이 아닙니다.");
    }

    const [row] = await db
      .insert(notificationRecipients)
      .values({
        workspaceId: auth.workspaceId,
        name: name.trim(),
        phone: phoneClean,
        role,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return err("id는 필수입니다.");

    await db
      .delete(notificationRecipients)
      .where(
        and(
          eq(notificationRecipients.id, id),
          eq(notificationRecipients.workspaceId, auth.workspaceId),
        ),
      );

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
