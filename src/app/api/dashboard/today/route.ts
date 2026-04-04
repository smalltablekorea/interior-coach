import { db } from "@/lib/db";
import {
  sites, constructionPhases, contracts, contractPayments,
  materialOrders,
} from "@/lib/db/schema";
import { eq, and, gte, lte, ne, isNull, lt } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireWorkspaceAuth("dashboard", "read");
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const wid = auth.workspaceId;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekEnd = sunday.toISOString().slice(0, 10);

    const contractBase = and(workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid), isNull(contracts.deletedAt));

    // ═══ 병렬 쿼리 ═══
    const [
      delayedPhases,
      todayStartPhases,
      todayDeliveries,
      todayPaymentsDue,
      weekPaymentsDue,
      overduePayments,
    ] = await Promise.all([
      // 1) 지연 공정 (plannedEnd < today AND status != 완료)
      db.select({
        id: constructionPhases.id,
        siteId: constructionPhases.siteId,
        siteName: sites.name,
        category: constructionPhases.category,
        plannedEnd: constructionPhases.plannedEnd,
        progress: constructionPhases.progress,
      })
        .from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          lt(constructionPhases.plannedEnd, today),
          ne(constructionPhases.status, "완료"),
          eq(sites.status, "시공중"),
          isNull(sites.deletedAt),
        ))
        .limit(10),

      // 2) 오늘 시작 예정 공정
      db.select({
        id: constructionPhases.id,
        siteId: constructionPhases.siteId,
        siteName: sites.name,
        category: constructionPhases.category,
      })
        .from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          eq(constructionPhases.plannedStart, today),
          eq(sites.status, "시공중"),
          isNull(sites.deletedAt),
        )),

      // 3) 오늘 자재 도착 예정
      db.select({
        id: materialOrders.id,
        siteId: materialOrders.siteId,
        siteName: sites.name,
        materialName: materialOrders.materialName,
      })
        .from(materialOrders)
        .innerJoin(sites, eq(materialOrders.siteId, sites.id))
        .where(and(
          workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
          eq(materialOrders.deliveryDate, today),
          ne(materialOrders.status, "취소"),
          ne(materialOrders.status, "입고완료"),
        ))
        .limit(10),

      // 4) 오늘 수금 기한
      db.select({
        siteId: contracts.siteId,
        siteName: sites.name,
        type: contractPayments.type,
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
      })
        .from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(
          contractBase,
          eq(contractPayments.status, "미수"),
          eq(contractPayments.dueDate, today),
        )),

      // 5) 이번주 수금 예정
      db.select({
        siteId: contracts.siteId,
        siteName: sites.name,
        type: contractPayments.type,
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
      })
        .from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(
          contractBase,
          eq(contractPayments.status, "미수"),
          gte(contractPayments.dueDate, today),
          lte(contractPayments.dueDate, weekEnd),
        ))
        .orderBy(contractPayments.dueDate),

      // 6) 연체 미수금
      db.select({
        siteId: contracts.siteId,
        siteName: sites.name,
        type: contractPayments.type,
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
      })
        .from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(
          contractBase,
          eq(contractPayments.status, "미수"),
          lt(contractPayments.dueDate, today),
        )),

    ]);

    // ═══ 알림 빌드 ═══
    const alerts: { type: string; severity: "critical" | "warning"; message: string; siteId: string | null; link: string }[] = [];

    for (const p of delayedPhases) {
      const days = Math.floor((now.getTime() - new Date(p.plannedEnd!).getTime()) / 86400000);
      alerts.push({
        type: "delayed_phase",
        severity: "critical",
        message: `${p.siteName} ${p.category} 공정 ${days}일 지연`,
        siteId: p.siteId,
        link: `/construction?siteId=${p.siteId}`,
      });
    }

    for (const p of todayPaymentsDue) {
      alerts.push({
        type: "payment_due",
        severity: "warning",
        message: `${p.siteName} ${p.type} ${Math.round((p.amount ?? 0) / 10000).toLocaleString()}만원 오늘 수금 기한`,
        siteId: p.siteId,
        link: `/settlement`,
      });
    }

    if (overduePayments.length > 0) {
      const total = overduePayments.reduce((s, p) => s + (p.amount ?? 0), 0);
      alerts.push({
        type: "overdue",
        severity: "critical",
        message: `미수금 ${overduePayments.length}건 연체 (총 ${Math.round(total / 10000).toLocaleString()}만원)`,
        siteId: null,
        link: `/settlement`,
      });
    }

    // ═══ 현장별 오늘 할일 빌드 ═══
    const tasksBySite = new Map<string, { siteId: string; siteName: string; items: { id: string; type: string; label: string; link: string }[] }>();

    const ensureSite = (siteId: string, siteName: string) => {
      if (!tasksBySite.has(siteId)) {
        tasksBySite.set(siteId, { siteId, siteName, items: [] });
      }
      return tasksBySite.get(siteId)!;
    };

    for (const p of todayStartPhases) {
      ensureSite(p.siteId, p.siteName!).items.push({
        id: `phase-${p.id}`,
        type: "phase_start",
        label: `${p.category} 공정 시작 예정`,
        link: `/construction?siteId=${p.siteId}`,
      });
    }

    for (const m of todayDeliveries) {
      ensureSite(m.siteId!, m.siteName!).items.push({
        id: `mat-${m.id}`,
        type: "material_arrival",
        label: `${m.materialName || "자재"} 도착 확인`,
        link: `/materials?siteId=${m.siteId}`,
      });
    }

    for (const p of todayPaymentsDue) {
      ensureSite(p.siteId!, p.siteName!).items.push({
        id: `pay-${p.dueDate}-${p.type}`,
        type: "payment_collect",
        label: `${p.type} ${Math.round((p.amount ?? 0) / 10000).toLocaleString()}만원 수금`,
        link: `/settlement`,
      });
    }

    for (const p of delayedPhases) {
      ensureSite(p.siteId, p.siteName!).items.push({
        id: `delay-${p.id}`,
        type: "delayed_phase",
        label: `${p.category} 공정 지연 — 진행률 ${p.progress ?? 0}%`,
        link: `/construction?siteId=${p.siteId}`,
      });
    }

    // ═══ 돈 요약 ═══
    const todayCollectionTotal = todayPaymentsDue.reduce((s, p) => s + (p.amount ?? 0), 0);
    const weekCollectionTotal = weekPaymentsDue.reduce((s, p) => s + (p.amount ?? 0), 0);
    const overdueTotal = overduePayments.reduce((s, p) => s + (p.amount ?? 0), 0);

    return ok({
      alerts,
      tasks: Array.from(tasksBySite.values()),
      todayCollections: todayPaymentsDue,
      weekCollections: weekPaymentsDue,
      moneySummary: {
        todayCollectionTotal,
        weekCollectionTotal,
        overdueTotal,
        overdueCount: overduePayments.length,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
