import { db } from "@/lib/db";
import { contractPayments, contracts, sites, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    // Get all unpaid payments with contract/site info — userId로 필터링
    const unpaidRows = await db
      .select({
        paymentId: contractPayments.id,
        type: contractPayments.type,
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
        contractId: contractPayments.contractId,
        contractAmount: contracts.contractAmount,
        siteId: contracts.siteId,
        siteName: sites.name,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(contractPayments)
      .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
      .leftJoin(sites, eq(contracts.siteId, sites.id))
      .leftJoin(customers, eq(sites.customerId, customers.id))
      .where(
        and(
          eq(contractPayments.status, "미수"),
          eq(contracts.userId, auth.userId)
        )
      );

    const today = new Date();
    let totalUnpaid = 0;
    let overdue30 = 0;
    let overdue60 = 0;
    let overdue90 = 0;

    const items = unpaidRows.map((r) => {
      totalUnpaid += r.amount;
      let overdueDays = 0;
      if (r.dueDate) {
        const due = new Date(r.dueDate);
        const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        overdueDays = diff > 0 ? diff : 0;
        if (diff >= 90) overdue90 += r.amount;
        else if (diff >= 60) overdue60 += r.amount;
        else if (diff >= 30) overdue30 += r.amount;
      }
      return { ...r, overdueDays };
    });

    // Sort by overdue days descending
    items.sort((a, b) => b.overdueDays - a.overdueDays);

    return ok({
      totalUnpaid,
      overdue30,
      overdue60,
      overdue90,
      count: items.length,
      items,
    });
  } catch (error) {
    return serverError(error);
  }
}
