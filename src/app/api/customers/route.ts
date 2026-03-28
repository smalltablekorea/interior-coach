import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, customerSchema } from "@/lib/api/validate";
import { parsePagination, buildPaginationMeta, parseFilters, searchPattern, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("customers", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["status", "search"]);

    // 기본 조건: workspace 격리 + soft delete 제외
    const conditions = [workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId), isNull(customers.deletedAt)];

    if (filters.status) {
      conditions.push(eq(customers.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${searchPattern(filters.search)} OR ${customers.phone} ILIKE ${searchPattern(filters.search)})`
      );
    }

    const where = and(...conditions);

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(customers)
      .where(where);

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        memo: customers.memo,
        status: customers.status,
        referredBy: customers.referredBy,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return ok(rows, buildPaginationMeta(total, pagination));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("customers", "write");
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, customerSchema);
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .insert(customers)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name: validation.data.name,
        phone: validation.data.phone ?? null,
        email: validation.data.email ?? null,
        address: validation.data.address ?? null,
        memo: validation.data.memo ?? null,
        status: validation.data.status,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
