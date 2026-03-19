"use client";

import { CATS, gradeMap, calcCatTotal, fmtM } from "@/lib/estimate-engine";

interface Props {
  area: number;
  grade: string;
  enabled: Record<string, boolean>;
  onToggle: (catId: string) => void;
}

export function StepCategories({ area, grade, enabled, onToggle }: Props) {
  const gd = gradeMap[grade];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">공종 선택</h2>
        <p className="text-sm text-[var(--muted)]">
          시공할 공종을 선택하세요. 자유롭게 선택/해제할 수 있습니다.
        </p>
      </div>
      <div className="grid gap-2">
        {CATS.map((cat) => {
          const isOn = enabled[cat.id] !== false;
          const amt = calcCatTotal(cat, area, grade);
          return (
            <button
              key={cat.id}
              onClick={() => onToggle(cat.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                isOn
                  ? "border-[var(--border)] bg-[var(--card)]"
                  : "border-white/[0.04] bg-white/[0.01] opacity-50"
              } hover:border-[var(--primary)]/20`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  isOn
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border)] bg-transparent"
                }`}
              >
                {isOn && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </div>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{ background: `${cat.color}15`, color: cat.color }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold">{cat.name}</span>
                <div className="text-[11px] text-[var(--muted)] truncate">
                  {cat.desc}
                </div>
              </div>
              <div
                className="text-sm font-bold shrink-0"
                style={{ color: isOn ? gd?.color : undefined }}
              >
                {fmtM(amt)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
