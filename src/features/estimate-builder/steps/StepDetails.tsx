"use client";

import { useState } from "react";
import {
  CATS,
  GRADES,
  gradeMap,
  GRADE_SPECS,
  calcCatTotal,
  calcSub,
  fmtM,
} from "@/lib/estimate-engine";

export interface SubOverride {
  name?: string;
  qty?: number;
  unit?: string;
  amount?: number;
}

export interface CustomSub {
  name: string;
  qty: number;
  unit: string;
  amount: number;
}

interface Props {
  area: number;
  grade: string;
  enabled: Record<string, boolean>;
  catGrades: Record<string, string>;
  catAdj: Record<string, number>;
  subOverrides: Record<string, SubOverride>;
  customSubs: Record<string, CustomSub[]>;
  onCatGradeChange: (catId: string, grade: string) => void;
  onCatAdjChange: (catId: string, delta: number) => void;
  onSubOverrideChange: (key: string, override: SubOverride) => void;
  onCustomSubsChange: (catId: string, subs: CustomSub[]) => void;
}

export function StepDetails({
  area,
  grade,
  enabled,
  catGrades,
  catAdj,
  subOverrides,
  customSubs,
  onCatGradeChange,
  onCatAdjChange,
  onSubOverrideChange,
  onCustomSubsChange,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const activeCats = CATS.filter((c) => enabled[c.id] !== false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">상세 조정</h2>
        <p className="text-sm text-[var(--muted)]">
          공종별 등급을 개별 조정하고 금액을 미세 조정할 수 있습니다.
        </p>
      </div>
      <div className="space-y-2">
        {activeCats.map((cat) => {
          const cg = catGrades[cat.id] || grade;
          const cgD = gradeMap[cg];
          const adj = catAdj[cat.id] || 0;
          const baseAmt = calcCatTotal(cat, area, grade, cg);
          const finalAmt = Math.max(0, baseAmt + adj);
          const isExpanded = expanded === cat.id;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              {/* Accordion header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : cat.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{
                    background: `${cat.color}15`,
                    color: cat.color,
                  }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold">{cat.name}</span>
                  <span
                    className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${cgD.color}20`,
                      color: cgD.color,
                    }}
                  >
                    {cgD.label}
                  </span>
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: cgD.color }}
                >
                  {fmtM(finalAmt)}
                </div>
                <span className="text-[var(--muted)] text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Accordion body */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] p-3 space-y-3">
                  {/* Grade override */}
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider font-semibold">
                      공종 등급 변경
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {GRADES.map((g) => (
                        <button
                          key={g.key}
                          onClick={() => onCatGradeChange(cat.id, g.key)}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                            cg === g.key
                              ? "font-bold"
                              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
                          }`}
                          style={
                            cg === g.key
                              ? {
                                  color: g.color,
                                  borderColor: g.color,
                                  background: `${g.color}15`,
                                }
                              : undefined
                          }
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade spec */}
                  {GRADE_SPECS[cat.id]?.[cg] && (
                    <div
                      className="p-2.5 rounded-lg"
                      style={{
                        background: `${cgD.color}08`,
                        border: `1px solid ${cgD.color}20`,
                      }}
                    >
                      <div
                        className="text-[9px] font-bold mb-1 uppercase tracking-wider"
                        style={{ color: cgD.color }}
                      >
                        {cgD.label} 등급 포함 내역
                      </div>
                      <div className="text-[11px] text-[var(--muted)] leading-relaxed">
                        {GRADE_SPECS[cat.id][cg]}
                      </div>
                    </div>
                  )}

                  {/* Amount adjustment */}
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider font-semibold">
                      금액 미세 조정
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[-500000, -100000, 100000, 500000].map((d) => (
                        <button
                          key={d}
                          onClick={() =>
                            onCatAdjChange(
                              cat.id,
                              (catAdj[cat.id] || 0) + d
                            )
                          }
                          className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
                        >
                          {d > 0 ? "+" : ""}
                          {fmtM(d)}
                        </button>
                      ))}
                      {adj !== 0 && (
                        <button
                          onClick={() => onCatAdjChange(cat.id, 0)}
                          className="text-[10px] px-2 py-1 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                    {adj !== 0 && (
                      <div
                        className="text-[10px] mt-1"
                        style={{
                          color: adj > 0 ? "#ef4444" : "#22c55e",
                        }}
                      >
                        조정: {adj > 0 ? "+" : ""}
                        {fmtM(adj)}
                      </div>
                    )}
                  </div>

                  {/* Sub items */}
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider font-semibold">
                      세부 항목
                    </div>
                    <div className="grid grid-cols-[1fr_48px_36px_72px] gap-1 text-[9px] text-[var(--muted)]/60 px-2 mb-1">
                      <span>항목명</span>
                      <span className="text-center">수량</span>
                      <span className="text-center">단위</span>
                      <span className="text-right">금액(만)</span>
                    </div>
                    <div className="space-y-1">
                      {cat.subs.map((sub, i) => {
                        const ovKey = `${cat.id}-${i}`;
                        const ov = subOverrides[ovKey] || {};
                        const defaultAmt = Math.round(
                          calcSub(sub, area)
                        );
                        const isOverridden =
                          ov.amount != null || ov.name != null;

                        return (
                          <div
                            key={i}
                            className={`grid grid-cols-[1fr_48px_36px_72px] gap-1 text-[11px] py-1 px-1.5 rounded-md items-center ${
                              isOverridden
                                ? "bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20"
                                : "bg-white/[0.02]"
                            }`}
                          >
                            <input
                              type="text"
                              value={ov.name ?? sub.name}
                              onChange={(e) =>
                                onSubOverrideChange(ovKey, {
                                  ...ov,
                                  name: e.target.value,
                                })
                              }
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 outline-none min-w-0 text-[11px]"
                            />
                            <input
                              type="number"
                              value={ov.qty ?? 1}
                              onChange={(e) =>
                                onSubOverrideChange(ovKey, {
                                  ...ov,
                                  qty: Number(e.target.value) || 1,
                                })
                              }
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-0.5 py-0.5 text-center outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <input
                              type="text"
                              value={ov.unit ?? "식"}
                              onChange={(e) =>
                                onSubOverrideChange(ovKey, {
                                  ...ov,
                                  unit: e.target.value,
                                })
                              }
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-0.5 py-0.5 text-center outline-none text-[11px]"
                            />
                            <input
                              type="number"
                              value={Math.round(
                                (ov.amount != null
                                  ? ov.amount
                                  : defaultAmt) / 10000
                              )}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") {
                                  const n = { ...ov };
                                  delete n.amount;
                                  onSubOverrideChange(ovKey, n);
                                } else
                                  onSubOverrideChange(ovKey, {
                                    ...ov,
                                    amount: Number(v) * 10000,
                                  });
                              }}
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 text-right font-medium outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        );
                      })}
                      {/* Custom subs */}
                      {(customSubs[cat.id] || []).map((cs, ci) => (
                        <div
                          key={`c-${ci}`}
                          className="grid grid-cols-[1fr_48px_36px_72px_20px] gap-1 text-[11px] py-1 px-1.5 rounded-md items-center bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20"
                        >
                          <input
                            type="text"
                            value={cs.name}
                            onChange={(e) => {
                              const a = [
                                ...(customSubs[cat.id] || []),
                              ];
                              a[ci] = {
                                ...a[ci],
                                name: e.target.value,
                              };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 outline-none min-w-0 text-[11px]"
                          />
                          <input
                            type="number"
                            value={cs.qty}
                            onChange={(e) => {
                              const a = [
                                ...(customSubs[cat.id] || []),
                              ];
                              a[ci] = {
                                ...a[ci],
                                qty: Number(e.target.value) || 1,
                              };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-0.5 py-0.5 text-center outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <input
                            type="text"
                            value={cs.unit}
                            onChange={(e) => {
                              const a = [
                                ...(customSubs[cat.id] || []),
                              ];
                              a[ci] = {
                                ...a[ci],
                                unit: e.target.value,
                              };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-0.5 py-0.5 text-center outline-none text-[11px]"
                          />
                          <input
                            type="number"
                            value={Math.round(cs.amount / 10000)}
                            onChange={(e) => {
                              const a = [
                                ...(customSubs[cat.id] || []),
                              ];
                              a[ci] = {
                                ...a[ci],
                                amount:
                                  (Number(e.target.value) || 0) *
                                  10000,
                              };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-1 py-0.5 text-right font-medium outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => {
                              const a = (
                                customSubs[cat.id] || []
                              ).filter((_, idx) => idx !== ci);
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="text-red-500 hover:text-red-400 text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const a = [
                            ...(customSubs[cat.id] || []),
                            {
                              name: "새 항목",
                              qty: 1,
                              unit: "식",
                              amount: 0,
                            },
                          ];
                          onCustomSubsChange(cat.id, a);
                        }}
                        className="w-full text-[10px] py-1.5 rounded-md border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
                      >
                        + 항목 추가
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
