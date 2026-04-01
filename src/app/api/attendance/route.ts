import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendance, sites } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, parseFilters, countSql } from "@/lib/api/query-helpers";
import { logActivity } from "@/lib/activity-log";
import { parseTime, calculateHours } from "@/lib/attendance-utils";

// ── 목록 조회 ──
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const filters = parseFilters(request, ["siteId", "workDate", "startDate", "endDate", "role", "status"]);

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

    if (checkIn && !parseTime(checkIn)) return err("checkIn 형식이 올바르지 않습니다. (HH:mm)");
    if (checkOut && !parseTime(checkOut)) return err("checkOut 형식이 올바르지 않습니다. (HH:mm)");

    const hours = calculateHours(checkIn, checkOut);

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
        hoursWorked: hours?.hoursWorked ?? null,
        overtimeHours: hours?.overtimeHours ?? 0,
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
