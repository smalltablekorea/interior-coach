import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { expenses, sites } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, expenseSchema } from "@/lib/api/validate";
import { parsePagination, buildPaginationMeta, parseFilters, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["siteId", "category"]);

    const conditions = [workspaceFilter(expenses.workspaceId, expenses.userId, auth.workspaceId, auth.userId), isNull(expenses.deletedAt)];

    if (filters.siteId) {
      conditions.push(eq(expenses.siteId, filters.siteId));
    }
    if (filters.category) {
      conditions.push(eq(expenses.category, filters.category));
    }

    const where = and(...conditions);

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(expenses)
      .where(where);

    const rows = await db
      .select({
        id: expenses.id,
        date: expenses.date,
        category: expenses.category,
        description: expenses.description,
        amount: expenses.amount,
        siteId: expenses.siteId,
        siteName: sites.name,
        paymentMethod: expenses.paymentMethod,
        vendor: expenses.vendor,
        receiptUrl: expenses.receiptUrl,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(sites, eq(expenses.siteId, sites.id))
      .where(where)
      .orderBy(desc(expenses.date))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return ok(rows, buildPaginationMeta(total, pagination));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, expenseSchema);
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .insert(expenses)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        siteId: validation.data.siteId ?? null,
        category: validation.data.category,
        description: validation.data.description ?? null,
        amount: validation.data.amount,
        date: validation.data.date ?? null,
        paymentMethod: validation.data.paymentMethod ?? null,
        vendor: validation.data.vendor ?? null,
        receiptUrl: validation.data.receiptUrl ?? null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
