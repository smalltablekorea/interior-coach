import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taxPayroll, workers, sites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

function calculateTaxes(workerType: string, grossAmount: number) {
  let incomeTax = 0;
  let localTax = 0;
  let nationalPension = 0;
  let healthInsurance = 0;
  let employmentInsurance = 0;

  if (workerType === "일용직") {
    incomeTax = Math.round(grossAmount * 0.027);
    localTax = Math.round(incomeTax * 0.1);
  } else if (workerType === "프리랜서") {
    incomeTax = Math.round(grossAmount * 0.03);
    localTax = Math.round(grossAmount * 0.003);
  } else if (workerType === "정규직") {
    incomeTax = Math.round(grossAmount * 0.035);
    localTax = Math.round(incomeTax * 0.1);
    nationalPension = Math.round(grossAmount * 0.045);
    healthInsurance = Math.round(grossAmount * 0.03545);
    employmentInsurance = Math.round(grossAmount * 0.009);
  }

  const totalDeductions = incomeTax + localTax + nationalPension + healthInsurance + employmentInsurance;
  const netAmount = grossAmount - totalDeductions;

  return { incomeTax, localTax, nationalPension, healthInsurance, employmentInsurance, netAmount };
}

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "read");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const { searchParams } = new URL(request.url);
    const workerType = searchParams.get("workerType");
    const payPeriod = searchParams.get("payPeriod");

    const conditions = [workspaceFilter(taxPayroll.workspaceId, taxPayroll.userId, wid, uid)];
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

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "write");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const body = await request.json();
    const { siteId, workerId, workerName, workerType, payPeriod, workDays, grossAmount, paymentMethod, memo } = body;

    if (!workerName || !workerType || !grossAmount) {
      return err("workerName, workerType, grossAmount 필수");
    }

    const taxes = calculateTaxes(workerType, grossAmount);

    const [created] = await db
      .insert(taxPayroll)
      .values({
        userId: uid,
        workspaceId: wid,
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

    return ok(created);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "write");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return err("id 필수");

    if (updates.grossAmount && updates.workerType) {
      const taxes = calculateTaxes(updates.workerType, updates.grossAmount);
      Object.assign(updates, taxes);
    }

    const [updated] = await db
      .update(taxPayroll)
      .set(updates)
      .where(and(eq(taxPayroll.id, id), workspaceFilter(taxPayroll.workspaceId, taxPayroll.userId, wid, uid)))
      .returning();

    if (!updated) return err("데이터를 찾을 수 없습니다", 404);
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "delete");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return err("id 필수");

    await db
      .delete(taxPayroll)
      .where(and(eq(taxPayroll.id, id), workspaceFilter(taxPayroll.workspaceId, taxPayroll.userId, wid, uid)));

    return ok({ message: "삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}
