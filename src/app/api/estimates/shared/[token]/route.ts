import { db } from "@/lib/db";
import { estimates, estimateItems, sites, customers } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { ok, notFound, err } from "@/lib/api/response";

// 공유 링크로 견적 조회 (인증 불요)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) return err("잘못된 공유 링크입니다.");

  const [row] = await db
    .select({
      id: estimates.id,
      version: estimates.version,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      profitRate: estimates.profitRate,
      overheadRate: estimates.overheadRate,
      vatEnabled: estimates.vatEnabled,
      memo: estimates.memo,
      metadata: estimates.metadata,
      shareExpiresAt: estimates.shareExpiresAt,
      createdAt: estimates.createdAt,
      siteName: sites.name,
      siteAddress: sites.address,
      areaPyeong: sites.areaPyeong,
      customerName: customers.name,
    })
    .from(estimates)
    .leftJoin(sites, eq(estimates.siteId, sites.id))
    .leftJoin(customers, eq(sites.customerId, customers.id))
    .where(
      and(
        eq(estimates.shareToken, token),
        isNull(estimates.deletedAt),
        gt(estimates.shareExpiresAt, new Date())
      )
    );

  if (!row) return notFound("견적을 찾을 수 없거나 공유 기간이 만료되었습니다.");

  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, row.id))
    .orderBy(estimateItems.sortOrder);

  const meta = (row.metadata as Record<string, unknown>) || {};

  return ok({
    id: row.id,
    version: row.version,
    totalAmount: row.totalAmount,
    status: row.status,
    profitRate: row.profitRate,
    overheadRate: row.overheadRate,
    vatEnabled: row.vatEnabled,
    siteName: row.siteName || (meta.title as string) || "",
    siteAddress: row.siteAddress || (meta.siteAddress as string) || "",
    areaPyeong: row.areaPyeong || (meta.areaPyeong as number) || 0,
    customerName: row.customerName || (meta.clientName as string) || "",
    createdAt: row.createdAt,
    expiresAt: row.shareExpiresAt,
    items: items.map((item) => ({
      category: item.category,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
    companyInfo: meta.companyInfo || null,
  });
}
