import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { ok, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, parseFilters, searchPattern, countSql } from "@/lib/api/query-helpers";

/** Public GET: Q&A 목록 (인증 불필요) */
export async function GET(request: NextRequest) {
  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["category", "status", "role", "authorRole", "search", "service"]);

    const conditions = [];

    // 기본: interior 서비스만
    conditions.push(eq(qnaPosts.service, filters.service || "interior"));

    if (filters.category) {
      conditions.push(eq(qnaPosts.category, filters.category));
    }
    if (filters.status) {
      conditions.push(eq(qnaPosts.status, filters.status));
    }
    // role (shorthand) or authorRole
    const roleFilter = filters.role || filters.authorRole;
    if (roleFilter) {
      conditions.push(eq(qnaPosts.authorRole, roleFilter));
    }
    if (filters.search) {
      conditions.push(
        sql`(${qnaPosts.title} ILIKE ${searchPattern(filters.search)} OR ${qnaPosts.content} ILIKE ${searchPattern(filters.search)})`,
      );
    }

    const where = and(...conditions);
    const baseWhere = eq(qnaPosts.service, filters.service || "interior");

    // 병렬: 필터 적용 목록 + 카운트 + 전체 통계
    const [rows, [{ count: total }], statsResult] = await Promise.all([
      db
        .select({
          id: qnaPosts.id,
          title: qnaPosts.title,
          authorId: qnaPosts.authorId,
          authorRole: qnaPosts.authorRole,
          category: qnaPosts.category,
          status: qnaPosts.status,
          createdAt: qnaPosts.createdAt,
          viewCount: qnaPosts.viewCount,
        })
        .from(qnaPosts)
        .where(where)
        .orderBy(desc(qnaPosts.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),

      db.select({ count: countSql() }).from(qnaPosts).where(where),

      db
        .select({
          totalCount: countSql(),
          answeredCount: sql<number>`cast(count(*) filter (where ${qnaPosts.status} = 'answered') as integer)`,
          avgResponseMinutes: sql<number>`coalesce(
            cast(avg(extract(epoch from (${qnaPosts.answeredAt} - ${qnaPosts.createdAt})) / 60)
            filter (where ${qnaPosts.answeredAt} is not null) as integer), 0)`,
        })
        .from(qnaPosts)
        .where(baseWhere),
    ]);

    const stats = statsResult[0];
    const totalCount = stats?.totalCount ?? 0;
    const answeredCount = stats?.answeredCount ?? 0;
    const avgMinutes = stats?.avgResponseMinutes ?? 0;

    return ok({
      items: rows.map((r) => ({
        ...r,
        authorId: r.authorId.slice(0, 8) + "***",
      })),
      meta: buildPaginationMeta(total, pagination),
      stats: {
        totalCount,
        answeredCount,
        answerRate: totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0,
        avgResponseHours: +(avgMinutes / 60).toFixed(1),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
