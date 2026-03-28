import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  taxRevenue,
  taxExpenses,
  taxVendors,
  taxInvoices,
  taxPayroll,
  taxCalendar,
  sites,
  customers,
} from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const type = request.nextUrl.searchParams.get("type") || "dashboard";
    const year = request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString();

    if (type === "dashboard") {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const revenueByMonth = await db
        .select({
          month: sql<string>`TO_CHAR(${taxRevenue.date}::date, 'YYYY-MM')`,
          total: sql<number>`COALESCE(SUM(${taxRevenue.totalAmount}), 0)`,
          supply: sql<number>`COALESCE(SUM(${taxRevenue.supplyAmount}), 0)`,
          vat: sql<number>`COALESCE(SUM(${taxRevenue.vatAmount}), 0)`,
        })
        .from(taxRevenue)
        .where(and(eq(taxRevenue.userId, uid), gte(taxRevenue.date, yearStart), lte(taxRevenue.date, yearEnd)))
        .groupBy(sql`TO_CHAR(${taxRevenue.date}::date, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${taxRevenue.date}::date, 'YYYY-MM')`);

      const expensesByMonth = await db
        .select({
          month: sql<string>`TO_CHAR(${taxExpenses.date}::date, 'YYYY-MM')`,
          total: sql<number>`COALESCE(SUM(${taxExpenses.totalAmount}), 0)`,
          supply: sql<number>`COALESCE(SUM(${taxExpenses.supplyAmount}), 0)`,
          vat: sql<number>`COALESCE(SUM(${taxExpenses.vatAmount}), 0)`,
        })
        .from(taxExpenses)
        .where(and(eq(taxExpenses.userId, uid), gte(taxExpenses.date, yearStart), lte(taxExpenses.date, yearEnd)))
        .groupBy(sql`TO_CHAR(${taxExpenses.date}::date, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${taxExpenses.date}::date, 'YYYY-MM')`);

      const expensesByCategory = await db
        .select({
          category: taxExpenses.category,
          total: sql<number>`COALESCE(SUM(${taxExpenses.totalAmount}), 0)`,
        })
        .from(taxExpenses)
        .where(and(eq(taxExpenses.userId, uid), gte(taxExpenses.date, yearStart), lte(taxExpenses.date, yearEnd)))
        .groupBy(taxExpenses.category);

      const uncollected = await db
        .select({
          total: sql<number>`COALESCE(SUM(${taxRevenue.totalAmount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(taxRevenue)
        .where(and(eq(taxRevenue.userId, uid), eq(taxRevenue.isCollected, false)));

      const upcoming = await db
        .select()
        .from(taxCalendar)
        .where(and(eq(taxCalendar.userId, uid), gte(taxCalendar.dueDate, new Date().toISOString().slice(0, 10))))
        .orderBy(taxCalendar.dueDate)
        .limit(10);

      const yearRevenue = revenueByMonth.reduce((s, r) => s + Number(r.total), 0);
      const yearExpense = expensesByMonth.reduce((s, r) => s + Number(r.total), 0);
      const yearRevenueVat = revenueByMonth.reduce((s, r) => s + Number(r.vat), 0);
      const yearExpenseVat = expensesByMonth.reduce((s, r) => s + Number(r.vat), 0);

      return ok({
        revenueByMonth,
        expensesByMonth,
        expensesByCategory,
        uncollected: uncollected[0],
        upcoming,
        summary: {
          yearRevenue,
          yearExpense,
          yearProfit: yearRevenue - yearExpense,
          estimatedVat: yearRevenueVat - yearExpenseVat,
        },
      });
    }

    if (type === "revenue") {
      const rows = await db
        .select({
          id: taxRevenue.id,
          date: taxRevenue.date,
          type: taxRevenue.type,
          description: taxRevenue.description,
          supplyAmount: taxRevenue.supplyAmount,
          vatAmount: taxRevenue.vatAmount,
          totalAmount: taxRevenue.totalAmount,
          paymentMethod: taxRevenue.paymentMethod,
          isCollected: taxRevenue.isCollected,
          collectedAt: taxRevenue.collectedAt,
          memo: taxRevenue.memo,
          siteId: taxRevenue.siteId,
          siteName: sites.name,
          customerName: customers.name,
          createdAt: taxRevenue.createdAt,
        })
        .from(taxRevenue)
        .leftJoin(sites, eq(taxRevenue.siteId, sites.id))
        .leftJoin(customers, eq(taxRevenue.customerId, customers.id))
        .where(eq(taxRevenue.userId, uid))
        .orderBy(desc(taxRevenue.date));
      return ok(rows);
    }

    if (type === "expenses") {
      const rows = await db
        .select({
          id: taxExpenses.id,
          date: taxExpenses.date,
          category: taxExpenses.category,
          subcategory: taxExpenses.subcategory,
          description: taxExpenses.description,
          supplyAmount: taxExpenses.supplyAmount,
          vatAmount: taxExpenses.vatAmount,
          totalAmount: taxExpenses.totalAmount,
          paymentMethod: taxExpenses.paymentMethod,
          isDeductible: taxExpenses.isDeductible,
          isVerified: taxExpenses.isVerified,
          receiptUrl: taxExpenses.receiptUrl,
          siteId: taxExpenses.siteId,
          siteName: sites.name,
          vendorId: taxExpenses.vendorId,
          vendorName: taxVendors.name,
          createdAt: taxExpenses.createdAt,
        })
        .from(taxExpenses)
        .leftJoin(sites, eq(taxExpenses.siteId, sites.id))
        .leftJoin(taxVendors, eq(taxExpenses.vendorId, taxVendors.id))
        .where(eq(taxExpenses.userId, uid))
        .orderBy(desc(taxExpenses.date));
      return ok(rows);
    }

    if (type === "vendors") {
      const rows = await db
        .select()
        .from(taxVendors)
        .where(eq(taxVendors.userId, uid))
        .orderBy(taxVendors.name);
      return ok(rows);
    }

    if (type === "payroll") {
      const rows = await db
        .select({
          id: taxPayroll.id,
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
          siteId: taxPayroll.siteId,
          siteName: sites.name,
          createdAt: taxPayroll.createdAt,
        })
        .from(taxPayroll)
        .leftJoin(sites, eq(taxPayroll.siteId, sites.id))
        .where(eq(taxPayroll.userId, uid))
        .orderBy(desc(taxPayroll.createdAt));
      return ok(rows);
    }

    if (type === "calendar") {
      const rows = await db
        .select()
        .from(taxCalendar)
        .where(eq(taxCalendar.userId, uid))
        .orderBy(taxCalendar.dueDate);
      return ok(rows);
    }

    return err("Invalid type");
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const type = request.nextUrl.searchParams.get("type");
    const body = await request.json();

    if (type === "revenue") {
      const [row] = await db
        .insert(taxRevenue)
        .values({
          userId: uid,
          siteId: body.siteId || null,
          customerId: body.customerId || null,
          date: body.date,
          type: body.type || "construction",
          description: body.description || null,
          supplyAmount: body.supplyAmount,
          vatAmount: body.vatAmount || 0,
          totalAmount: body.totalAmount,
          paymentMethod: body.paymentMethod || null,
          isCollected: body.isCollected || false,
          collectedAt: body.collectedAt || null,
          memo: body.memo || null,
        })
        .returning();
      return ok(row);
    }

    if (type === "expenses") {
      const [row] = await db
        .insert(taxExpenses)
        .values({
          userId: uid,
          siteId: body.siteId || null,
          vendorId: body.vendorId || null,
          date: body.date,
          category: body.category,
          subcategory: body.subcategory || null,
          description: body.description || null,
          supplyAmount: body.supplyAmount,
          vatAmount: body.vatAmount || 0,
          totalAmount: body.totalAmount,
          paymentMethod: body.paymentMethod || null,
          receiptUrl: body.receiptUrl || null,
          isDeductible: body.isDeductible ?? true,
          deductionNote: body.deductionNote || null,
        })
        .returning();
      return ok(row);
    }

    if (type === "vendors") {
      const [row] = await db
        .insert(taxVendors)
        .values({
          userId: uid,
          name: body.name,
          businessNumber: body.businessNumber || null,
          representative: body.representative || null,
          businessType: body.businessType || null,
          businessItem: body.businessItem || null,
          address: body.address || null,
          contactName: body.contactName || null,
          contactPhone: body.contactPhone || null,
          contactEmail: body.contactEmail || null,
          bankName: body.bankName || null,
          bankAccount: body.bankAccount || null,
        })
        .returning();
      return ok(row);
    }

    if (type === "payroll") {
      const [row] = await db
        .insert(taxPayroll)
        .values({
          userId: uid,
          siteId: body.siteId || null,
          workerName: body.workerName,
          workerType: body.workerType,
          payPeriod: body.payPeriod || null,
          workDays: body.workDays || null,
          grossAmount: body.grossAmount,
          incomeTax: body.incomeTax || 0,
          localTax: body.localTax || 0,
          nationalPension: body.nationalPension || 0,
          healthInsurance: body.healthInsurance || 0,
          employmentInsurance: body.employmentInsurance || 0,
          netAmount: body.netAmount,
          isPaid: body.isPaid || false,
          paymentMethod: body.paymentMethod || null,
          memo: body.memo || null,
        })
        .returning();
      return ok(row);
    }

    if (type === "calendar") {
      const [row] = await db
        .insert(taxCalendar)
        .values({
          userId: uid,
          title: body.title,
          type: body.type || null,
          dueDate: body.dueDate,
          status: body.status || "upcoming",
          description: body.description || null,
          amount: body.amount || null,
          autoGenerated: body.autoGenerated ?? false,
        })
        .returning();
      return ok(row);
    }

    return err("Invalid type");
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const type = request.nextUrl.searchParams.get("type");
    const body = await request.json();
    if (!body.id) return err("id 필수");

    if (type === "revenue") {
      const [row] = await db
        .update(taxRevenue)
        .set({
          siteId: body.siteId || null,
          customerId: body.customerId || null,
          date: body.date,
          type: body.type,
          description: body.description || null,
          supplyAmount: body.supplyAmount,
          vatAmount: body.vatAmount || 0,
          totalAmount: body.totalAmount,
          paymentMethod: body.paymentMethod || null,
          isCollected: body.isCollected || false,
          collectedAt: body.collectedAt || null,
          memo: body.memo || null,
        })
        .where(and(eq(taxRevenue.id, body.id), eq(taxRevenue.userId, uid)))
        .returning();
      if (!row) return err("데이터를 찾을 수 없습니다", 404);
      return ok(row);
    }

    if (type === "expenses") {
      const [row] = await db
        .update(taxExpenses)
        .set({
          siteId: body.siteId || null,
          vendorId: body.vendorId || null,
          date: body.date,
          category: body.category,
          subcategory: body.subcategory || null,
          description: body.description || null,
          supplyAmount: body.supplyAmount,
          vatAmount: body.vatAmount || 0,
          totalAmount: body.totalAmount,
          paymentMethod: body.paymentMethod || null,
          isDeductible: body.isDeductible ?? true,
          deductionNote: body.deductionNote || null,
        })
        .where(and(eq(taxExpenses.id, body.id), eq(taxExpenses.userId, uid)))
        .returning();
      if (!row) return err("데이터를 찾을 수 없습니다", 404);
      return ok(row);
    }

    if (type === "payroll") {
      const [row] = await db
        .update(taxPayroll)
        .set({
          siteId: body.siteId || null,
          workerName: body.workerName,
          workerType: body.workerType,
          payPeriod: body.payPeriod || null,
          workDays: body.workDays || null,
          grossAmount: body.grossAmount,
          incomeTax: body.incomeTax || 0,
          localTax: body.localTax || 0,
          nationalPension: body.nationalPension || 0,
          healthInsurance: body.healthInsurance || 0,
          employmentInsurance: body.employmentInsurance || 0,
          netAmount: body.netAmount,
          isPaid: body.isPaid || false,
          paymentMethod: body.paymentMethod || null,
          memo: body.memo || null,
        })
        .where(and(eq(taxPayroll.id, body.id), eq(taxPayroll.userId, uid)))
        .returning();
      if (!row) return err("데이터를 찾을 수 없습니다", 404);
      return ok(row);
    }

    if (type === "calendar") {
      const [row] = await db
        .update(taxCalendar)
        .set({
          status: body.status,
          completedAt: body.status === "completed" ? new Date() : null,
        })
        .where(and(eq(taxCalendar.id, body.id), eq(taxCalendar.userId, uid)))
        .returning();
      if (!row) return err("데이터를 찾을 수 없습니다", 404);
      return ok(row);
    }

    return err("Invalid type");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const type = request.nextUrl.searchParams.get("type");
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return err("id 필수");

    if (type === "revenue") {
      await db.delete(taxRevenue).where(and(eq(taxRevenue.id, id), eq(taxRevenue.userId, uid)));
    } else if (type === "expenses") {
      await db.delete(taxExpenses).where(and(eq(taxExpenses.id, id), eq(taxExpenses.userId, uid)));
    } else if (type === "vendors") {
      await db.delete(taxVendors).where(and(eq(taxVendors.id, id), eq(taxVendors.userId, uid)));
    } else if (type === "payroll") {
      await db.delete(taxPayroll).where(and(eq(taxPayroll.id, id), eq(taxPayroll.userId, uid)));
    } else if (type === "calendar") {
      await db.delete(taxCalendar).where(and(eq(taxCalendar.id, id), eq(taxCalendar.userId, uid)));
    } else {
      return err("Invalid type");
    }

    return ok({ message: "삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}
