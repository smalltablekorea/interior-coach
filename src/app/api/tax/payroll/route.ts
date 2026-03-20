import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxPayroll, workers, sites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

const USER_ID = "demo";

// 원천징수 & 4대보험 계산
function calculateTaxes(workerType: string, grossAmount: number) {
  let incomeTax = 0;
  let localTax = 0;
  let nationalPension = 0;
  let healthInsurance = 0;
  let employmentInsurance = 0;

  if (workerType === "일용직") {
    // 일용직: 일급 15만원 초과분 × 6% × (1-55%) ≈ 2.7%
    // 간략화: 총액 기준 2.7% 적용
    incomeTax = Math.round(grossAmount * 0.027);
    localTax = Math.round(incomeTax * 0.1);
  } else if (workerType === "프리랜서") {
    // 프리랜서: 소득세 3% + 지방세 0.3%
    incomeTax = Math.round(grossAmount * 0.03);
    localTax = Math.round(grossAmount * 0.003);
  } else if (workerType === "정규직") {
    // 정규직: 간이세액표 간략화 (월급 기준 약 3~5%)
    incomeTax = Math.round(grossAmount * 0.035);
    localTax = Math.round(incomeTax * 0.1);
    // 4대보험 (근로자 부담분)
    nationalPension = Math.round(grossAmount * 0.045); // 국민연금 4.5%
    healthInsurance = Math.round(grossAmount * 0.03545); // 건강보험 3.545%
    employmentInsurance = Math.round(grossAmount * 0.009); // 고용보험 0.9%
  }

  const totalDeductions = incomeTax + localTax + nationalPension + healthInsurance + employmentInsurance;
  const netAmount = grossAmount - totalDeductions;

  return { incomeTax, localTax, nationalPension, healthInsurance, employmentInsurance, netAmount };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workerType = searchParams.get("workerType");
  const payPeriod = searchParams.get("payPeriod");

  const conditions = [eq(taxPayroll.userId, USER_ID)];
  if (workerType) conditions.push(eq(taxPayroll.workerType, workerType));
  if (payPeriod) conditions.push(eq(taxPayroll.payPeriod, payPeriod));

  const rows = await db
    .select({
      id: taxPayroll.id,
      siteId: taxPayroll.siteId,
      siteName: sites.name,
      workerId: taxPayroll.workerId,
      workerName: taxPayroll.workerName,
      workerType: taxPayroll.workerType,
      payPeriod: taxPayroll.payPeriod,
      workDays: taxPayroll.workDays,
      grossAmount: taxPayroll.grossAmount,
      incomeTax: taxPayroll.incomeTax,
      localTax: taxPayroll.localTax,
      nationalPension: taxPayroll.nationalPension,
      healthInsurance: taxPayroll.healthInsurance,
      employmentInsurance: taxPayroll.employmentInsurance,
      netAmount: taxPayroll.netAmount,
      isPaid: taxPayroll.isPaid,
      paidAt: taxPayroll.paidAt,
      paymentMethod: taxPayroll.paymentMethod,
      memo: taxPayroll.memo,
      createdAt: taxPayroll.createdAt,
    })
    .from(taxPayroll)
    .leftJoin(sites, eq(taxPayroll.siteId, sites.id))
    .leftJoin(workers, eq(taxPayroll.workerId, workers.id))
    .where(and(...conditions))
    .orderBy(desc(taxPayroll.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siteId, workerId, workerName, workerType, payPeriod, workDays, grossAmount, paymentMethod, memo } = body;

  if (!workerName || !workerType || !grossAmount) {
    return NextResponse.json({ error: "workerName, workerType, grossAmount 필수" }, { status: 400 });
  }

  const taxes = calculateTaxes(workerType, grossAmount);

  const [created] = await db
    .insert(taxPayroll)
    .values({
      userId: USER_ID,
      siteId: siteId || null,
      workerId: workerId || null,
      workerName,
      workerType,
      payPeriod,
      workDays,
      grossAmount,
      ...taxes,
      isPaid: false,
      paymentMethod,
      memo,
    })
    .returning();

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  // If grossAmount or workerType changed, recalculate taxes
  if (updates.grossAmount && updates.workerType) {
    const taxes = calculateTaxes(updates.workerType, updates.grossAmount);
    Object.assign(updates, taxes);
  }

  const [updated] = await db
    .update(taxPayroll)
    .set(updates)
    .where(and(eq(taxPayroll.id, id), eq(taxPayroll.userId, USER_ID)))
    .returning();

  return NextResponse.json(updated || null);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  await db
    .delete(taxPayroll)
    .where(and(eq(taxPayroll.id, id), eq(taxPayroll.userId, USER_ID)));

  return NextResponse.json({ success: true });
}
