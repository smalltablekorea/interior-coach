import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { sql, count, sum, avg } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

// 견적 통계
export async function GET() {
  const auth = await requireWorkspaceAuth("estimates", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    // 상태별 개수
    const statusCounts = await db
      .select({
        status: estimates.status,
        count: count(),
        totalAmount: sum(estimates.totalAmount),
      })
      .from(estimates)
      .where(workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid))
      .groupBy(estimates.status);

    // 전체 통계
    const [overall] = await db
      .select({
        totalCount: count(),
        totalAmount: sum(estimates.totalAmount),
        avgAmount: avg(estimates.totalAmount),
      })
      .from(estimates)
      .where(workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid));

    // 월별 추이 (최근 6개월)
    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(${estimates.createdAt}, 'YYYY-MM')`,
        count: count(),
        totalAmount: sum(estimates.totalAmount),
      })
      .from(estimates)
      .where(workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid))
      .groupBy(sql`to_char(${estimates.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${estimates.createdAt}, 'YYYY-MM') DESC`)
      .limit(6);

    // 승인율 계산
    const totalCount = overall?.totalCount ?? 0;
    const approvedCount =
      statusCounts.find((s) => s.status === "승인")?.count ?? 0;
    const approvalRate =
      totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : "0.0";

    return ok({
      overall: {
        totalCount: overall?.totalCount ?? 0,
        totalAmount: Number(overall?.totalAmount ?? 0),
        avgAmount: Math.round(Number(overall?.avgAmount ?? 0)),
      },
      byStatus: statusCounts.map((s) => ({
        status: s.status,
        count: s.count,
        totalAmount: Number(s.totalAmount ?? 0),
      })),
      approvalRate: parseFloat(approvalRate),
      monthlyTrend: monthlyTrend.reverse().map((m) => ({
        month: m.month,
        count: m.count,
        totalAmount: Number(m.totalAmount ?? 0),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
