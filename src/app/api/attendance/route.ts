import { db } from "@/lib/db";
import { attendance, sites, workers } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, parseFilters, countSql } from "@/lib/api/query-helpers";
import { logActivity } from "@/lib/activity-log";

// ── 목록 조회 ──
export async function GET(request: Request) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const req = request as unknown as import("next/server").NextRequest;
    const pagination = parsePagination(req);
    const filters = parseFilters(req, ["siteId", "workDate", "startDate", "endDate", "role", "status"]);

    const conditions = [
      workspaceFilter(attendance.workspaceId, attendance.userId, auth.workspaceId, auth.userId),
    ];

    if (filters.siteId) conditions.push(eq(attendance.siteId, filters.siteId));
    if (filters.workDate) conditions.push(eq(attendance.workDate, filters.workDate));
    if (filters.startDate) conditions.push(gte(attendance.workDate, filters.startDate));
    if (filters.endDate) conditions.push(lte(attendance.workDate, filters.endDate));
    if (filters.role) conditions.push(eq(attendance.role, filters.role));
    if (filters.status) conditions.push(eq(attendance.status, filters.status));

    const where = and(...conditions);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: attendance.id,
          siteId: attendance.siteId,
          siteName: sites.name,
          memberId: attendance.memberId,
          memberName: attendance.memberName,
          role: attendance.role,
          workDate: attendance.workDate,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked,
          overtimeHours: attendance.overtimeHours,
          status: attendance.status,
          notes: attendance.notes,
          createdAt: attendance.createdAt,
        })
        .from(attendance)
        .leftJoin(sites, eq(attendance.siteId, sites.id))
        .where(where)
        .orderBy(desc(attendance.workDate), desc(attendance.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(attendance).where(where),
    ]);

    return ok({
      items,
      meta: buildPaginationMeta(total, pagination),
    });
  } catch (error) {
    return serverError(error);
  }
}

// ── 출역 등록 ──
export async function POST(request: Request) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { siteId, memberId, memberName, role, workDate, checkIn, checkOut, status, notes } = body;

    if (!siteId || !memberName || !role || !workDate) {
      return err("siteId, memberName, role, workDate는 필수입니다.");
    }

    // 출퇴근 시간으로 근무시간 자동 계산
    let hoursWorked: number | null = null;
    let overtimeHours = 0;
    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(":").map(Number);
      const [outH, outM] = checkOut.split(":").map(Number);
      hoursWorked = Math.max(0, (outH * 60 + outM - (inH * 60 + inM)) / 60);
      overtimeHours = Math.max(0, hoursWorked - 8);
    }

    const [row] = await db
      .insert(attendance)
      .values({
        siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        memberId: memberId || null,
        memberName,
        role,
        workDate,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        hoursWorked,
        overtimeHours,
        status: status || "present",
        notes: notes || null,
      })
      .returning();

    logActivity({
      siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "attendance_created",
      targetType: "attendance",
      targetId: row.id,
      metadata: { memberName, role, workDate },
    });

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
