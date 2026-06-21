import { NextRequest } from "next/server";
import { and, eq, isNull, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  customers,
  constructionPhases,
  contracts,
  paymentSplits,
  siteSchedules,
} from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * GET /api/sites/[id]/quick-detail
 *   현장 상세 — 3탭 (공정/계약/일정) 화면이 한 번에 필요한 데이터:
 *   site (with customer name/phone/address), phases, contracts + payments
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const [site] = await db
      .select({
        id: sites.id,
        name: sites.name,
        address: sites.address,
        areaPyeong: sites.areaPyeong,
        scope: sites.scope,
        status: sites.status,
        startDate: sites.startDate,
        endDate: sites.endDate,
        budget: sites.budget,
        trades: sites.trades,
        memo: sites.memo,
        progress: sites.progress,
        customerId: sites.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .leftJoin(customers, eq(sites.customerId, customers.id))
      .where(
        and(
          eq(sites.id, id),
          workspaceFilter(
            sites.workspaceId,
            sites.userId,
            auth.workspaceId,
            auth.userId,
          ),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (!site) return err("현장을 찾을 수 없습니다", 404);

    const phases = await db
      .select({
        id: constructionPhases.id,
        category: constructionPhases.category,
        plannedStart: constructionPhases.plannedStart,
        plannedEnd: constructionPhases.plannedEnd,
        actualStart: constructionPhases.actualStart,
        actualEnd: constructionPhases.actualEnd,
        progress: constructionPhases.progress,
        status: constructionPhases.status,
        sortOrder: constructionPhases.sortOrder,
      })
      .from(constructionPhases)
      .where(eq(constructionPhases.siteId, id))
      .orderBy(asc(constructionPhases.sortOrder), asc(constructionPhases.category));

    const contractRows = await db
      .select({
        id: contracts.id,
        contractAmount: contracts.contractAmount,
        contractDate: contracts.contractDate,
        memo: contracts.memo,
        createdAt: contracts.createdAt,
      })
      .from(contracts)
      .where(
        and(
          eq(contracts.siteId, id),
          workspaceFilter(
            contracts.workspaceId,
            contracts.userId,
            auth.workspaceId,
            auth.userId,
          ),
          isNull(contracts.deletedAt),
        ),
      )
      .orderBy(desc(contracts.createdAt));

    // 현장당 계약 1개 가정 — 첫 계약의 분할만 가져옴.
    // 새 구조: payment_splits 테이블 (item_name/amount/scheduled_date/paid_date/status)
    let payments: Array<{
      id: string;
      contractId: string;
      type: string;
      amount: number;
      dueDate: string | null;
      paidDate: string | null;
      status: string;
      sortOrder: number;
    }> = [];
    if (contractRows.length > 0) {
      const firstId = contractRows[0].id;
      const rows = await db
        .select({
          id: paymentSplits.id,
          contractId: paymentSplits.contractId,
          itemName: paymentSplits.itemName,
          amount: paymentSplits.amount,
          scheduledDate: paymentSplits.scheduledDate,
          paidDate: paymentSplits.paidDate,
          status: paymentSplits.status,
          sortOrder: paymentSplits.sortOrder,
        })
        .from(paymentSplits)
        .where(eq(paymentSplits.contractId, firstId))
        .orderBy(asc(paymentSplits.sortOrder));
      // 클라이언트 호환 형태로 매핑 (type=항목명, dueDate=scheduledDate)
      payments = rows.map((r) => ({
        id: r.id,
        contractId: r.contractId,
        type: r.itemName,
        amount: r.amount,
        dueDate: r.scheduledDate,
        paidDate: r.paidDate,
        status: r.status,
        sortOrder: r.sortOrder,
      }));
    }

    // 캘린더용 site_schedules (공정과 별개 — 일정 탭에서 보여줌)
    const schedules = await db
      .select({
        id: siteSchedules.id,
        trade: siteSchedules.trade,
        taskName: siteSchedules.taskName,
        startDate: siteSchedules.startDate,
        endDate: siteSchedules.endDate,
        sortOrder: siteSchedules.sortOrder,
      })
      .from(siteSchedules)
      .where(
        and(
          eq(siteSchedules.siteId, id),
          isNull(siteSchedules.deletedAt),
        ),
      )
      .orderBy(asc(siteSchedules.sortOrder), asc(siteSchedules.startDate));

    return ok({
      site,
      phases,
      contracts: contractRows,
      payments,
      schedules,
    });
  } catch (e) {
    return serverError(e);
  }
}
