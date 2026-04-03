import { db } from "@/lib/db";
import { estimates, estimateItems } from "@/lib/db/schema";
import { eq, and, max } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";

// 견적 복제 (새 버전 또는 독립 복사)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("estimates", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const asNewVersion = body.asNewVersion !== false; // 기본: 새 버전으로 복제

    // 원본 견적 조회
    const [original] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid)));

    if (!original) {
      return notFound("견적을 찾을 수 없습니다");
    }

    // 같은 현장의 최대 버전 번호 조회
    let newVersion = 1;
    if (asNewVersion && original.siteId) {
      const [result] = await db
        .select({ maxVersion: max(estimates.version) })
        .from(estimates)
        .where(
          and(workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid), eq(estimates.siteId, original.siteId))
        );
      newVersion = (result?.maxVersion ?? 0) + 1;
    }

    // 새 견적 생성
    const [newEstimate] = await db
      .insert(estimates)
      .values({
        userId: uid,
        workspaceId: wid,
        siteId: asNewVersion ? original.siteId : null,
        version: asNewVersion ? newVersion : 1,
        totalAmount: original.totalAmount,
        profitRate: original.profitRate,
        overheadRate: original.overheadRate,
        vatEnabled: original.vatEnabled,
        status: "작성중",
        memo: original.memo,
        metadata: original.metadata,
      })
      .returning();

    // 항목 복제
    const originalItems = await db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, id))
      .orderBy(estimateItems.sortOrder);

    if (originalItems.length > 0) {
      await db.insert(estimateItems).values(
        originalItems.map((item) => ({
          estimateId: newEstimate.id,
          category: item.category,
          itemName: item.itemName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: item.sortOrder,
          memo: item.memo,
        }))
      );
    }

    return ok({
      id: newEstimate.id,
      version: newEstimate.version,
      message: asNewVersion
        ? `v${newEstimate.version}으로 복제되었습니다`
        : "독립 복사되었습니다",
    });
  } catch (error) {
    return serverError(error);
  }
}
