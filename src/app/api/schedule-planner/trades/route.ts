import { ok } from "@/lib/api/response";
import { TRADES, DEP_WARNINGS, SIZES, SEASONS, getCurrentSeason } from "@/lib/schedule-planner/trades";

/** GET /api/schedule-planner/trades — 공종·평형·시즌 기초 데이터 (Public) */
export async function GET() {
  return ok({
    trades: TRADES.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      group: t.group,
      phase: t.phase,
      baseDays: t.baseDays,
      costMin: t.costMin,
      costMax: t.costMax,
      unit: t.unit,
      deps: t.deps,
      parallel: t.parallel,
      requires: t.requires,
      skipRisk: t.skipRisk,
      desc: t.desc,
      notes: t.notes,
    })),
    depWarnings: DEP_WARNINGS,
    sizes: SIZES,
    seasons: SEASONS,
    currentSeason: getCurrentSeason(),
  });
}
