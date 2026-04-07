import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { defects, sites } from "@/lib/db/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import { logActivity } from "@/lib/activity-log";
import type { CreateDefectRequest, DefectSeverity } from "@/types/defect";

const VALID_SEVERITIES: DefectSeverity[] = ["minor", "major", "critical"];
const VALID_STATUSES = ["reported", "in_progress", "resolved", "closed"];

/** GET /api/defects — 하자 목록 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");

    const conditions = [
      workspaceFilter(defects.workspaceId, defects.userId, auth.workspaceId, auth.userId),
    ];
    if (siteId) conditions.push(eq(defects.siteId, siteId));
    if (status && VALID_STATUSES.includes(status)) conditions.push(eq(defects.status, status));
    if (severity && VALID_SEVERITIES.includes(severity as DefectSeverity)) {
      conditions.push(eq(defects.severity, severity));
    }
    if (search) conditions.push(ilike(defects.title, `%${search}%`));

    const where = and(...conditions);

    const [items, [countResult], statsResult] = await Promise.all([
      db
        .select({
          id: defects.id,
          siteId: defects.siteId,
          siteName: sites.name,
          tradeId: defects.tradeId,
          tradeName: defects.tradeName,
          title: defects.title,
          severity: defects.severity,
          status: defects.status,
          assignedToName: defects.assignedToName,
          reportedAt: defects.reportedAt,
          resolvedAt: defects.resolvedAt,
          createdAt: defects.createdAt,
        })
        .from(defects)
        .leftJoin(sites, eq(defects.siteId, sites.id))
        .where(where)
        .orderBy(desc(defects.reportedAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(defects).where(where),
      // Stats
      db
        .select({
          status: defects.status,
          severity: defects.severity,
          count: countSql(),
        })
        .from(defects)
        .where(
          workspaceFilter(defects.workspaceId, defects.userId, auth.workspaceId, auth.userId),
        )
        .groupBy(defects.status, defects.severity),
    ]);

    const total = countResult?.count || 0;

    // Build stats
    const stats = {
      total: 0,
      reported: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      bySeverity: { minor: 0, major: 0, critical: 0 },
    };
    for (const row of statsResult) {
      const cnt = row.count || 0;
      stats.total += cnt;
      if (row.status === "reported") stats.reported += cnt;
      if (row.status === "in_progress") stats.inProgress += cnt;
      if (row.status === "resolved") stats.resolved += cnt;
      if (row.status === "closed") stats.closed += cnt;
      if (row.severity === "minor") stats.bySeverity.minor += cnt;
      if (row.severity === "major") stats.bySeverity.major += cnt;
      if (row.severity === "critical") stats.bySeverity.critical += cnt;
    }

    return ok({ items, stats, meta: buildPaginationMeta(total, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

/** POST /api/defects — 하자 등록 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  try {
    const body: CreateDefectRequest = await request.json();

    if (!body.siteId) return err("현장을 선택해주세요.");
    if (!body.tradeId || !body.tradeName) return err("공종을 선택해주세요.");
    if (!body.title?.trim()) return err("하자 제목을 입력해주세요.");
    if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
      return err("심각도를 선택해주세요. (minor/major/critical)");
    }

    const [row] = await db
      .insert(defects)
      .values({
        siteId: body.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        tradeId: body.tradeId,
        tradeName: body.tradeName,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        photoUrls: body.photoUrls || null,
        severity: body.severity,
        status: "reported",
        reportedBy: auth.userId,
        assignedTo: body.assignedTo || null,
        assignedToName: body.assignedToName || null,
      })
      .returning();

    logActivity({
      siteId: body.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "defect_created",
      targetType: "defect",
      targetId: row.id,
      metadata: { title: body.title, severity: body.severity, tradeName: body.tradeName },
    });

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
