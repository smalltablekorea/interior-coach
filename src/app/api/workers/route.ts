import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workers } from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, workerSchema } from "@/lib/api/validate";
import { parsePagination, buildPaginationMeta, parseFilters, searchPattern, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["trade", "search"]);

    const conditions = [eq(workers.userId, auth.userId), isNull(workers.deletedAt)];

    if (filters.trade) {
      conditions.push(eq(workers.trade, filters.trade));
    }
    if (filters.search) {
      conditions.push(
        sql`(${workers.name} ILIKE ${searchPattern(filters.search)} OR ${workers.phone} ILIKE ${searchPattern(filters.search)})`
      );
    }

    const where = and(...conditions);

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(workers)
      .where(where);

    const rows = await db
      .select({
        id: workers.id,
        name: workers.name,
        phone: workers.phone,
        trade: workers.trade,
        dailyWage: workers.dailyWage,
        memo: workers.memo,
        createdAt: workers.createdAt,
      })
      .from(workers)
      .where(where)
      .orderBy(desc(workers.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return ok(rows, buildPaginationMeta(total, pagination));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, workerSchema);
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .insert(workers)
      .values({
        userId: auth.userId,
        name: validation.data.name,
        phone: validation.data.phone ?? null,
        trade: validation.data.trade,
        dailyWage: validation.data.dailyWage ?? null,
        memo: validation.data.memo ?? null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
