import { db } from "@/lib/db";
import { customerPortalTokens, changeRequests, sites, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { enqueueNotification } from "@/lib/notifications/queue";

type RouteContext = { params: Promise<{ token: string }> };

const VALID_CATEGORIES = ["design_change", "material_change", "schedule_change", "defect_report", "other"];

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const body = await request.json();

    // 입력 검증
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return err("title은 필수입니다.");
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return err(`category는 다음 중 하나여야 합니다: ${VALID_CATEGORIES.join(", ")}`);
    }

    // 토큰 검증 (만료 체크)
    const [portalToken] = await db
      .select({
        id: customerPortalTokens.id,
        customerId: customerPortalTokens.customerId,
        expiresAt: customerPortalTokens.expiresAt,
      })
      .from(customerPortalTokens)
      .where(eq(customerPortalTokens.token, token));

    if (!portalToken) return notFound("유효하지 않은 토큰입니다.");
    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      return err("만료된 포털 토큰입니다.", 403);
    }

    // 고객 이름 조회
    const [customer] = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(eq(customers.id, portalToken.customerId));

    const customerName = customer?.name || "고객";

    // 고객의 현장 조회 (첫 번째 활성 현장)
    const [site] = await db
      .select({ id: sites.id, name: sites.name, workspaceId: sites.workspaceId })
      .from(sites)
      .where(eq(sites.customerId, portalToken.customerId));

    if (!site) return notFound("연결된 현장 정보를 찾을 수 없습니다.");

    // 변경요청 생성
    const [changeRequest] = await db
      .insert(changeRequests)
      .values({
        siteId: site.id,
        workspaceId: site.workspaceId,
        tokenId: portalToken.id,
        customerName,
        category: body.category,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        photoUrls: body.photoUrls || null,
      })
      .returning();

    // 매니저에게 알림 큐 추가
    if (site.workspaceId) {
      await enqueueNotification(site.workspaceId, "change_request", {
        siteId: site.id,
        siteName: site.name,
        customerName,
        title: body.title.trim(),
        category: body.category,
        changeRequestId: changeRequest.id,
      });
    }

    return ok({
      id: changeRequest.id,
      status: changeRequest.status,
      message: "변경 요청이 접수되었습니다.",
    });
  } catch (error) {
    return serverError(error);
  }
}
