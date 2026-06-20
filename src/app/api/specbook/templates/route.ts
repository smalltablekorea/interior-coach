import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { specbookTemplates } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { emptyCatalog, validateCatalogShape } from "@/lib/specbook";

/** GET — 워크스페이스의 템플릿 목록 (이름·설명·요약만) */
export async function GET() {
  const auth = await requireWorkspaceAuth("specbook", "read");
  if (!auth.ok) return auth.response;
  try {
    const rows = await db
      .select({
        id: specbookTemplates.id,
        name: specbookTemplates.name,
        description: specbookTemplates.description,
        isDefault: specbookTemplates.isDefault,
        createdAt: specbookTemplates.createdAt,
      })
      .from(specbookTemplates)
      .where(workspaceFilter(specbookTemplates.workspaceId, specbookTemplates.userId, auth.workspaceId, auth.userId))
      .orderBy(desc(specbookTemplates.createdAt));
    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

/** POST — 템플릿 생성. body: { name, description?, data?, isDefault? } */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("specbook", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return err("요청 본문이 올바르지 않습니다");
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return err("name 필수", 400);

    const data = body.data ?? emptyCatalog();
    if (!validateCatalogShape(data)) {
      return err("템플릿 data 형식이 올바르지 않습니다", 400);
    }

    const [created] = await db
      .insert(specbookTemplates)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name,
        description: typeof body.description === "string" ? body.description : null,
        data,
        isDefault: !!body.isDefault,
      })
      .returning();

    return ok(created);
  } catch (e) {
    return serverError(e);
  }
}
