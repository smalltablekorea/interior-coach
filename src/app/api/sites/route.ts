import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, customers } from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, siteSchema } from "@/lib/api/validate";
import { parsePagination, buildPaginationMeta, parseFilters, searchPattern, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["status", "search", "customerId"]);

    const conditions = [eq(sites.userId, auth.userId), isNull(sites.deletedAt)];

    if (filters.status) {
      conditions.push(eq(sites.status, filters.status));
    }
    if (filters.customerId) {
      conditions.push(eq(sites.customerId, filters.customerId));
    }
    if (filters.search) {
      conditions.push(
        sql`(${sites.name} ILIKE ${searchPattern(filters.search)} OR ${sites.address} ILIKE ${searchPattern(filters.search)})`
      );
    }

    const where = and(...conditions);

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(sites)
      .where(where);

    const rows = await db
      .select({
        id: sites.id,
        name: sites.name,
        address: sites.address,
        buildingType: sites.buildingType,
        areaPyeong: sites.areaPyeong,
        status: sites.status,
        startDate: sites.startDate,
        endDate: sites.endDate,
        customerName: customers.name,
        customerId: sites.customerId,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .leftJoin(customers, eq(sites.customerId, customers.id))
      .where(where)
      .orderBy(desc(sites.createdAt))
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

  const validation = await validateBody(request, siteSchema);
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .insert(sites)
      .values({
        userId: auth.userId,
        name: validation.data.name,
        customerId: validation.data.customerId ?? null,
        address: validation.data.address ?? null,
        buildingType: validation.data.buildingType ?? null,
        areaPyeong: validation.data.areaPyeong ?? null,
        status: validation.data.status,
        startDate: validation.data.startDate ?? null,
        endDate: validation.data.endDate ?? null,
        memo: validation.data.memo ?? null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
