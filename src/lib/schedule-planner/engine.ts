import type { ScheduleResult, ScheduledTrade, ProcurementItem } from "@/types/schedule-planner";
import { TRADES, SIZES, SEASONS } from "./trades";

/**
 * buildSchedule — 선택된 공종 기반 공정표 생성 엔진
 * JSX 프론트엔드의 buildSchedule()과 동일한 로직의 서버사이드 구현
 */
export function buildSchedule(
  selectedTradeIds: string[],
  sizeId: string,
  season: string,
): ScheduleResult | null {
  const sizeObj = SIZES.find((s) => s.id === sizeId);
  if (!sizeObj) return null;

  const trades = TRADES.filter((t) => selectedTradeIds.includes(t.id));
  if (!trades.length) return null;

  const sm = sizeObj.mult;
  const ssm = SEASONS[season]?.mult || 1;
  const py = sizeObj.pyung;

  const scheduled: ScheduledTrade[] = [];
  const done = new Set<string>();
  let day = 1;

  const phases = [...new Set(trades.map((t) => t.phase))].sort((a, b) => a - b);

  phases.forEach((phase, phaseIdx) => {
    const pt = trades.filter((t) => t.phase === phase);
    const groups: typeof trades[] = [];
    const assigned = new Set<string>();

    // Group parallel trades together
    pt.forEach((t) => {
      if (assigned.has(t.id)) return;
      const dm = t.deps.every((d) => !selectedTradeIds.includes(d) || done.has(d));
      if (!dm) return;

      const g = [t];
      assigned.add(t.id);
      t.parallel.forEach((pid) => {
        const p2 = pt.find((x) => x.id === pid && !assigned.has(x.id));
        if (p2 && p2.deps.every((d) => !selectedTradeIds.includes(d) || done.has(d))) {
          g.push(p2);
          assigned.add(p2.id);
        }
      });
      groups.push(g);
    });

    // Remaining unassigned trades in this phase
    pt.filter((t) => !assigned.has(t.id)).forEach((t) => {
      if (t.deps.every((d) => !selectedTradeIds.includes(d) || done.has(d))) {
        groups.push([t]);
        assigned.add(t.id);
      }
    });

    groups.forEach((g, gi) => {
      const mx = Math.max(...g.map((t) => Math.max(1, Math.round(t.baseDays * sm))));
      g.forEach((t) => {
        const days = Math.max(1, Math.round(t.baseDays * sm));
        const isUnit = t.unit === "개소" || t.unit === "개";
        const units = isUnit ? Math.ceil(py / 8) : py;
        const cL = Math.round((t.costMin * units * ssm) / 10000) * 10000;
        const cH = Math.round((t.costMax * units * ssm) / 10000) * 10000;
        scheduled.push({
          id: t.id,
          name: t.name,
          icon: t.icon,
          group: t.group,
          phase: t.phase,
          startDay: day,
          endDay: day + days - 1,
          days,
          costLow: cL,
          costHigh: cH,
          costPct: 0, // calculated later
          isParallel: g.length > 1,
          parallelWith: g.filter((x) => x.id !== t.id).map((x) => x.name),
          desc: t.desc,
          notes: t.notes,
          savingTip: t.savingTip,
          qualityCheck: t.qualityCheck,
          prework: t.prework,
          materials: t.materials,
        });
        done.add(t.id);
      });
      day += mx;

      // Phase buffer: min 1 day (wet→finish gets 2 days for drying)
      if (gi === groups.length - 1 && phaseIdx < phases.length - 1) {
        const nextPhase = phases[phaseIdx + 1];
        const buffer = phase <= 3 && nextPhase >= 4 ? 2 : 1;
        day += buffer;
      }
    });
  });

  const totalDays = Math.max(...scheduled.map((s) => s.endDay));
  const totalCostLow = scheduled.reduce((s, t) => s + t.costLow, 0);
  const totalCostHigh = scheduled.reduce((s, t) => s + t.costHigh, 0);
  const totalCostMid = (totalCostLow + totalCostHigh) / 2;

  // Calculate cost percentage
  scheduled.forEach((t) => {
    t.costPct = (t.costLow + t.costHigh) / (2 * totalCostMid);
  });

  // Procurement items
  const procurement: ProcurementItem[] = [];
  scheduled.forEach((t) => {
    (t.prework || []).forEach((pw) => {
      const od = pw.trigger ? t.startDay : t.startDay - pw.leadDays;
      procurement.push({
        type: "prework",
        trade: t.name,
        icon: t.icon,
        task: pw.task,
        leadDays: pw.leadDays,
        dueByDay: t.startDay,
        orderDay: Math.max(od, -30),
        category: pw.category,
        critical: pw.critical,
        phase: t.phase,
      });
    });
    (t.materials || []).forEach((m) => {
      const od = t.startDay - m.leadDays;
      procurement.push({
        type: "material",
        trade: t.name,
        icon: t.icon,
        name: m.name,
        spec: m.spec,
        leadDays: m.leadDays,
        dueByDay: t.startDay,
        orderDay: Math.max(od, -30),
        costRange: m.costRange,
        category: m.category,
        critical: m.critical,
        phase: t.phase,
      });
    });
  });
  procurement.sort((a, b) => a.orderDay - b.orderDay);

  const pre = procurement.filter((p) => p.orderDay < 1 || p.leadDays >= 5);
  const during = procurement.filter((p) => p.orderDay >= 1 && p.leadDays < 5);

  // Risk calculation
  let risk = 0;
  if (selectedTradeIds.length >= 10) risk += 25;
  if (selectedTradeIds.length >= 6) risk += 10;
  if (selectedTradeIds.includes("plumbing")) risk += 10;
  const critMats = procurement.filter((p) => p.critical);
  if (critMats.length >= 5) risk += 10;
  risk = Math.min(100, risk);

  const totalChecks = scheduled.reduce((s, t) => (t.qualityCheck || []).length + s, 0);

  return {
    scheduled,
    totalDays,
    totalCostLow,
    totalCostHigh,
    totalCostMid,
    procurement,
    pre,
    during,
    risk,
    py,
    critMats,
    totalChecks,
  };
}
