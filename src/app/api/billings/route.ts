import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { billings, sites } from "@/lib/db/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import { logActivity } from "@/lib/activity-log";
import type { CreateBillingRequest, BillingStatus } from "@/types/billing";

const VALID_STATUSES: BillingStatus[] = ["pending", "invoiced", "paid", "overdue", "cancelled"];

/** GET /api/billings — 수금 목록 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");

    const conditions = [
      workspaceFilter(billings.workspaceId, billings.userId, auth.workspaceId, auth.userId),
    ];
    if (siteId) conditions.push(eq(billings.siteId, siteId));
    if (status && VALID_STATUSES.includes(status as BillingStatus)) {
      conditions.push(eq(billings.status, status));
    }

    const where = and(...conditions);
    const wsFilter = workspaceFilter(billings.workspaceId, billings.userId, auth.workspaceId, auth.userId);

    const [items, [countResult], statsResult] = await Promise.all([
      db
        .select({
          id: billings.id,
          siteId: billings.siteId,
          siteName: sites.name,
          milestoneName: billings.milestoneName,
          tradeId: billings.tradeId,
          milestoneOrder: billings.milestoneOrder,
          amount: billings.amount,
          taxAmount: billings.taxAmount,
          status: billings.status,
          dueDate: billings.dueDate,
          invoicedAt: billings.invoicedAt,
          paidAt: billings.paidAt,
          invoiceNumber: billings.invoiceNumber,
          paymentMethod: billings.paymentMethod,
          createdAt: billings.createdAt,
        })
        .from(billings)
        .leftJoin(sites, eq(billings.siteId, sites.id))
        .where(where)
        .orderBy(asc(billings.milestoneOrder), desc(billings.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(billings).where(where),
      // Stats
      db
        .select({
          status: billings.status,
          count: countSql(),
          totalAmount: sql<number>`cast(COALESCE(SUM(${billings.amount}), 0) as integer)`,
          totalTax: sql<number>`cast(COALESCE(SUM(${billings.taxAmount}), 0) as integer)`,
        })
        .from(billings)
        .where(wsFilter)
        .groupBy(billings.status),
    ]);

    // Build stats
    const stats = {
      totalAmount: 0,
      totalTaxAmount: 0,
      totalWithTax: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      overdueAmount: 0,
      byStatus: {} as Record<string, { count: number; amount: number }>,
    };
    for (const row of statsResult) {
      const amt = row.totalAmount || 0;
      const tax = row.totalTax || 0;
      stats.totalAmount += amt;
      stats.totalTaxAmount += tax;
      stats.byStatus[row.status] = { count: row.count || 0, amount: amt + tax };
      if (row.status === "paid") stats.paidAmount += amt + tax;
      if (row.status === "pending" || row.status === "invoiced") stats.unpaidAmount += amt + tax;
      if (row.status === "overdue") stats.overdueAmount += amt + tax;
    }
    stats.totalWithTax = stats.totalAmount + stats.totalTaxAmount;

    // Compute totalAmount for each item
    const itemsWithTotal = items.map((item) => ({
      ...item,
      totalAmount: (item.amount || 0) + (item.taxAmount || 0),
    }));

    return ok({ items: itemsWithTotal, stats, meta: buildPaginationMeta(countResult?.count || 0, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

/** POST /api/billings — 수금 항목 생성 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  try {
    const body: CreateBillingRequest = await request.json();

    if (!body.siteId) return err("현장을 선택해주세요.");
    if (!body.milestoneName?.trim()) return err("마일스톤명을 입력해주세요.");
    if (!body.amount || body.amount <= 0) return err("금액을 입력해주세요.");

    const [row] = await db
      .insert(billings)
      .values({
        siteId: body.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        milestoneName: body.milestoneName.trim(),
        tradeId: body.tradeId || null,
        milestoneOrder: body.milestoneOrder ?? 0,
        amount: body.amount,
        taxAmount: body.taxAmount ?? 0,
        status: body.status || "pending",
        dueDate: body.dueDate || null,
        invoiceNumber: body.invoiceNumber || null,
        paymentMethod: body.paymentMethod || null,
        notes: body.notes?.trim() || null,
      })
      .returning();

    logActivity({
      siteId: body.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "billing_created",
      targetType: "billing",
      targetId: row.id,
      metadata: {
        milestoneName: body.milestoneName,
        amount: body.amount,
        taxAmount: body.taxAmount ?? 0,
      },
    });

    return ok({ ...row, totalAmount: (row.amount || 0) + (row.taxAmount || 0) });
  } catch (error) {
    return serverError(error);
  }
}
