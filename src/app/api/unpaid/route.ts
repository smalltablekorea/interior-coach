import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contractPayments, contracts, sites, customers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  // Get all unpaid payments with contract/site info
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
    .where(eq(contractPayments.status, "미수"));

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

  return NextResponse.json({
    totalUnpaid,
    overdue30,
    overdue60,
    overdue90,
    count: items.length,
    items,
  });
}
