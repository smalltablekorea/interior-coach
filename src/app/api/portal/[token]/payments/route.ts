import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import { billings } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 토큰입니다." },
      { status: 401 }
    );
  }

  const payments = await db
    .select({
      id: billings.id,
      milestoneName: billings.milestoneName,
      milestoneOrder: billings.milestoneOrder,
      amount: billings.amount,
      taxAmount: billings.taxAmount,
      status: billings.status,
      dueDate: billings.dueDate,
      paidAt: billings.paidAt,
    })
    .from(billings)
    .where(eq(billings.siteId, result.site.id))
    .orderBy(asc(billings.milestoneOrder));

  return NextResponse.json({ payments });
}
