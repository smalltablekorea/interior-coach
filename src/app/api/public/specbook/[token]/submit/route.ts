import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  specbookShareTokens,
  specbookSubmissions,
} from "@/lib/db/schema";
import { ok, err, serverError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

/**
 * POST /api/public/specbook/[token]/submit
 *   body: { customerName, customerSite?, customerPhone?, items: SubmissionSelection[], memo? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return err("token 필수", 400);

  // IP 기반 rate limit (악의적 폭주 방지)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate = enforceApiRateLimit(`ip:${ip}`, {
    bucket: "specbook-submit",
    max: 10,
    windowMs: 60_000,
  });
  if (!gate.ok) return gate.response;

  try {
    const body = (await req.json()) as {
      customerName?: string;
      customerSite?: string;
      customerPhone?: string;
      items?: unknown;
      memo?: string;
    };

    if (!body.customerName || !body.customerName.trim())
      return err("성함을 입력해주세요", 400);
    if (!Array.isArray(body.items) || body.items.length === 0)
      return err("선택한 항목이 없습니다", 400);
    if (body.items.length > 200) return err("선택 항목이 너무 많습니다", 400);

    const [share] = await db
      .select({
        id: specbookShareTokens.id,
        siteId: specbookShareTokens.siteId,
        workspaceId: specbookShareTokens.workspaceId,
        expiresAt: specbookShareTokens.expiresAt,
        revokedAt: specbookShareTokens.revokedAt,
      })
      .from(specbookShareTokens)
      .where(eq(specbookShareTokens.token, token));

    if (!share) return err("유효하지 않은 링크입니다", 404);
    if (share.revokedAt) return err("취소된 링크입니다", 410);
    if (share.expiresAt && share.expiresAt < new Date())
      return err("만료된 링크입니다", 410);

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, share.siteId), isNull(sites.deletedAt)));
    if (!site) return err("현장 정보를 찾을 수 없습니다", 404);

    await db.insert(specbookSubmissions).values({
      siteId: share.siteId,
      workspaceId: share.workspaceId,
      tokenId: share.id,
      customerName: body.customerName.trim().slice(0, 80),
      customerSite: body.customerSite?.trim().slice(0, 120) || null,
      customerPhone: body.customerPhone?.trim().slice(0, 30) || null,
      selections: body.items,
      memo: body.memo?.slice(0, 1000) || null,
      status: "new",
    });

    return ok({ submitted: true });
  } catch (e) {
    return serverError(e);
  }
}
