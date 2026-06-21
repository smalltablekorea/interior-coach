import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, isNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, constructionPhases } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { daysForTask, daysForTrade, scaleDaysByArea } from "@/lib/site/trade-mapping";

/**
 * POST /api/sites/[id]/auto-schedule
 *   현장 착수일~준공일 사이에 공정들을 sort_order 순으로 가중 배분.
 *
 *   가중치: 각 phase 의 표준 소요일 = scaleDaysByArea(
 *     daysForTask(task_name) ?? daysForTrade(category),
 *     site.areaPyeong,
 *   )
 *   ─ 사용자가 알려준 30평 기준 공기를 실면적에 비례 보정.
 *
 *   알고리즘:
 *     1) 사이트 startDate~endDate 사이의 "작업 가능일" 목록 W 를 만듦
 *        (weekendWork=true → 모든 일자, false → 평일만)
 *     2) sortOrder 오름차순 정렬된 공정 N 개에 대해 각각의 standard days di 산출
 *        sum = Σ di
 *     3) W.length 가 sum 이상이면: 순차 배치 — phase k 의 시작 idx = Σ d0..d(k-1),
 *        끝 idx = 시작 idx + dk - 1
 *     4) W.length 가 sum 미만이면 (기간이 표준보다 짧음): di 를 비례 축소
 *        (di_scaled = max(1, round(di * W.len/sum))) 후 동일 배치
 *
 *   site.weekendWork 도 함께 업데이트.
 */
const bodySchema = z.object({
  weekendWork: z.boolean().optional(),
});

function dateRange(startISO: string, endISO: string, includeWeekend: boolean): string[] {
  const out: string[] = [];
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return out;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay(); // 0=일, 6=토
    if (includeWeekend || (dow !== 0 && dow !== 6)) {
      out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return err("입력값이 올바르지 않습니다");

    const [site] = await db
      .select({
        id: sites.id,
        startDate: sites.startDate,
        endDate: sites.endDate,
        weekendWork: sites.weekendWork,
        areaPyeong: sites.areaPyeong,
      })
      .from(sites)
      .where(
        and(
          eq(sites.id, id),
          workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (!site) return err("현장을 찾을 수 없습니다", 404);
    if (!site.startDate || !site.endDate) {
      return err("현장에 착수일·준공일이 설정되어 있어야 자동 배분이 가능합니다");
    }

    // weekendWork 가 body 에 오면 site 상태도 함께 업데이트
    const useWeekend =
      typeof parsed.data.weekendWork === "boolean"
        ? parsed.data.weekendWork
        : !!site.weekendWork;
    if (typeof parsed.data.weekendWork === "boolean" && parsed.data.weekendWork !== site.weekendWork) {
      await db.update(sites).set({ weekendWork: parsed.data.weekendWork }).where(eq(sites.id, id));
    }

    // 작업 가능일 목록
    const workdays = dateRange(site.startDate, site.endDate, useWeekend);
    if (workdays.length === 0) {
      return err(
        useWeekend
          ? "착수일이 준공일보다 앞서야 합니다"
          : "착수~준공 사이에 평일이 없습니다 (주말공사 포함을 켜보세요)",
      );
    }

    const phases = await db
      .select({
        id: constructionPhases.id,
        category: constructionPhases.category,
        taskName: constructionPhases.taskName,
        sortOrder: constructionPhases.sortOrder,
      })
      .from(constructionPhases)
      .where(eq(constructionPhases.siteId, id))
      .orderBy(asc(constructionPhases.sortOrder), asc(constructionPhases.category));

    if (phases.length === 0) {
      return err("배분할 공정이 없습니다");
    }

    const n = phases.length;
    const total = workdays.length;

    // 1) 각 phase 의 표준 소요일 (실면적 보정 적용)
    const standardDays = phases.map((p) => {
      const base = daysForTask(p.taskName) ?? daysForTrade(p.category);
      return scaleDaysByArea(base, site.areaPyeong);
    });
    const sumDays = standardDays.reduce((s, d) => s + d, 0);

    // 2) 작업 가능일이 부족하면 비례 축소 (최소 1일 유지)
    let allotDays: number[];
    if (sumDays <= total) {
      allotDays = standardDays.slice();
    } else {
      const ratio = total / sumDays;
      const provisional = standardDays.map((d) => Math.max(1, Math.round(d * ratio)));
      // 반올림으로 합이 total 을 초과할 수 있어 뒤에서부터 깎음
      let provSum = provisional.reduce((s, d) => s + d, 0);
      for (let i = provisional.length - 1; i >= 0 && provSum > total; i--) {
        const reducible = provisional[i] - 1;
        if (reducible <= 0) continue;
        const cut = Math.min(reducible, provSum - total);
        provisional[i] -= cut;
        provSum -= cut;
      }
      allotDays = provisional;
    }

    // 3) 순차 배치
    const updates: Array<{
      id: string;
      plannedStart: string;
      plannedEnd: string;
      days: number;
    }> = [];
    let cursor = 0;
    for (let k = 0; k < n; k++) {
      const d = allotDays[k];
      const startIdx = Math.min(cursor, total - 1);
      const endIdx = Math.min(cursor + d - 1, total - 1);
      updates.push({
        id: phases[k].id,
        plannedStart: workdays[startIdx],
        plannedEnd: workdays[endIdx],
        days: d,
      });
      cursor = endIdx + 1;
    }

    // 4) 순차 UPDATE — neon-http 트랜잭션 불가하므로 개별 처리
    for (const u of updates) {
      await db
        .update(constructionPhases)
        .set({ plannedStart: u.plannedStart, plannedEnd: u.plannedEnd })
        .where(eq(constructionPhases.id, u.id));
    }

    return ok({
      siteId: id,
      weekendWork: useWeekend,
      workdayCount: total,
      phaseCount: n,
      areaPyeong: site.areaPyeong,
      standardSum: sumDays,
      updates,
    });
  } catch (e) {
    return serverError(e);
  }
}
