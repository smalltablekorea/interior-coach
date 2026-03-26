"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Trash2,
  RotateCcw,
  PlusCircle,
} from "lucide-react";
import {
  CATS,
  GRADES,
  gradeMap,
  GRADE_SPECS,
  calcSub,
  fmtM,
} from "@/lib/estimate-engine";
import { fmtShort } from "@/lib/utils";

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

export interface MatOverride {
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

const BUILDING_TYPES = [
  { key: "apt", label: "아파트" },
  { key: "villa", label: "빌라" },
  { key: "officetel", label: "오피스텔" },
  { key: "house", label: "주택" },
  { key: "store", label: "상가" },
];

interface Props {
  area: number;
  grade: string;
  buildingType?: string;
  enabled: Record<string, boolean>;
  catGrades: Record<string, string>;
  catAdj: Record<string, number>;
  subOverrides: Record<string, SubOverride>;
  customSubs: Record<string, CustomSub[]>;
  matOverrides: Record<string, MatOverride[]>;
  deletedSubs: Record<string, boolean>;
  hiddenCats: Record<string, boolean>;
  onCatGradeChange: (catId: string, grade: string) => void;
  onCatAdjChange: (catId: string, delta: number) => void;
  onSubOverrideChange: (key: string, override: SubOverride) => void;
  onCustomSubsChange: (catId: string, subs: CustomSub[]) => void;
  onMatOverridesChange: (catId: string, mats: MatOverride[]) => void;
  onDeletedSubsChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onHiddenCatsChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function StepDetails({
  area,
  grade,
  buildingType = "apt",
  enabled,
  catGrades,
  catAdj,
  subOverrides,
  customSubs,
  matOverrides,
  deletedSubs,
  hiddenCats,
  onCatGradeChange,
  onCatAdjChange,
  onSubOverrideChange,
  onCustomSubsChange,
  onMatOverridesChange,
  onDeletedSubsChange,
  onHiddenCatsChange,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const activeCats = CATS.filter((c) => enabled[c.id] !== false);

  // AI 세부내역 자동생성
  const handleAiGenerate = useCallback(async (catId: string) => {
    if (aiGenerating) return;
    setAiGenerating(catId);
    try {
      const cat = CATS.find((c) => c.id === catId);
      if (!cat) return;
      const cg = catGrades[catId] || grade;
      const gradeLabel = GRADES.find((g) => g.key === cg)?.label || cg;
      const bt = BUILDING_TYPES.find((b) => b.key === buildingType)?.label || buildingType;

      const res = await fetch("/api/estimate-coach/generate-subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catId, catName: cat.name, area, grade: cg, gradeLabel, buildingType: bt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subs && Array.isArray(data.subs)) {
          const namePatches: Record<string, SubOverride> = {};
          data.subs.forEach((s: { index?: number; name?: string; amount?: number }) => {
            if (s.index != null && s.index < cat.subs.length) {
              const key = `${catId}-${s.index}`;
              namePatches[key] = {};
              if (s.name) namePatches[key].name = s.name;
              if (s.amount != null) namePatches[key].amount = s.amount;
            }
          });
          if (Object.keys(namePatches).length > 0) {
            Object.entries(namePatches).forEach(([key, ov]) => {
              onSubOverrideChange(key, { ...subOverrides[key], ...ov });
            });
          }
          if (data.customSubs && Array.isArray(data.customSubs)) {
            onCustomSubsChange(catId, data.customSubs.map((cs: { name: string; qty: number; unit: string; unitPrice: number }) => ({
              name: cs.name, qty: cs.qty || 1, unit: cs.unit || "식", amount: (cs.unitPrice || 0) * (cs.qty || 1),
            })));
          }
          if (data.matOverrides && Array.isArray(data.matOverrides)) {
            onMatOverridesChange(catId, data.matOverrides.map((mo: { name: string; qty: number; unit: string; unitPrice: number }) => ({
              name: mo.name, qty: mo.qty || 1, unit: mo.unit || "개", unitPrice: mo.unitPrice || 0,
            })));
          }
        }
      }
    } catch {
      // silent
    }
    setAiGenerating(null);
  }, [aiGenerating, catGrades, grade, buildingType, area, subOverrides, onSubOverrideChange, onCustomSubsChange, onMatOverridesChange]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">상세 조정</h2>
        <p className="text-sm text-[var(--muted)]">
          공종별 등급·세부항목·자재·금액을 상세하게 조정할 수 있습니다.
        </p>
      </div>
      <div className="space-y-2">
        {activeCats.map((cat) => {
          const isHidden = !!hiddenCats[cat.id];
          const cg = catGrades[cat.id] || grade;
          const cgD = gradeMap[cg];
          const adj = catAdj[cat.id] || 0;

          // 세부항목 실제 합계 (화면에 보이는 값 그대로)
          let subsTotal = 0;
          cat.subs.forEach((sub, i) => {
            const key = `${cat.id}-${i}`;
            if (deletedSubs[key]) return;
            const ov = subOverrides[key];
            subsTotal += ov?.amount != null ? ov.amount : Math.round(calcSub(sub, area));
          });
          const customTotal = (customSubs[cat.id] || []).reduce((s, cs) => s + cs.amount, 0);
          const matTotal = (matOverrides[cat.id] || []).reduce((s, mo) => s + Math.round(mo.qty * mo.unitPrice / 100) * 100, 0);
          const displayTotal = subsTotal + customTotal + matTotal + adj;
          const finalAmt = isHidden ? 0 : Math.max(0, displayTotal);
          const isExpanded = expanded === cat.id;

          // 숨긴 공종
          if (isHidden) {
            return (
              <div key={cat.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden opacity-40">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                      style={{ background: `${cat.color}15`, color: cat.color }}>
                      {cat.icon}
                    </div>
                    <span className="text-sm font-semibold line-through text-[var(--muted)]">{cat.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400">제외됨</span>
                  </div>
                  <button
                    onClick={() => onHiddenCatsChange((p) => { const n = { ...p }; delete n[cat.id]; return n; })}
                    className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:text-[var(--primary)]/80"
                  >
                    <RotateCcw size={11} /> 복원
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              {/* Accordion header */}
              <div className="flex items-center">
                <button
                  onClick={() => setExpanded(isExpanded ? null : cat.id)}
                  className="flex-1 flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ background: `${cat.color}15`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold">{cat.name}</span>
                    <span
                      className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full"
                      style={{ background: `${cgD.color}20`, color: cgD.color }}
                    >
                      {cgD.label}
                    </span>
                    {(adj !== 0 || customTotal !== 0 || matTotal !== 0 || displayTotal !== subsTotal) && (() => {
                      const diff = displayTotal - subsTotal;
                      return (
                        <span className={`text-[9px] ml-1.5 px-1.5 py-0.5 rounded-full font-medium ${diff > 0 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                          {diff > 0 ? "+" : ""}{fmtShort(diff)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-sm font-bold" style={{ color: cgD.color }}>
                    {fmtM(finalAmt)}
                  </div>
                  <span className="text-[var(--muted)] text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>
                <button
                  onClick={() => { onHiddenCatsChange((p) => ({ ...p, [cat.id]: true })); if (isExpanded) setExpanded(null); }}
                  className="p-2 mr-1 text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
                  title="공종 제외"
                >
                  <Trash2 size={14} />
                </button>
              </div>

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
                              ? { color: g.color, borderColor: g.color, background: `${g.color}15` }
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
                    <div className="p-2.5 rounded-lg" style={{ background: `${cgD.color}08`, border: `1px solid ${cgD.color}20` }}>
                      <div className="text-[9px] font-bold mb-1 uppercase tracking-wider" style={{ color: cgD.color }}>
                        {cgD.label} 등급 포함 내역
                      </div>
                      <div className="text-[11px] text-[var(--muted)] leading-relaxed">
                        {GRADE_SPECS[cat.id][cg]}
                      </div>
                    </div>
                  )}

                  {/* Sub items */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">
                        세부 항목
                      </div>
                      <button
                        onClick={() => handleAiGenerate(cat.id)}
                        disabled={aiGenerating !== null}
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                          aiGenerating === cat.id
                            ? "bg-[var(--primary)]/20 text-[var(--primary)] animate-pulse"
                            : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                        }`}
                      >
                        <Sparkles size={10} />
                        {aiGenerating === cat.id ? "생성중..." : "AI 자동기입"}
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_48px_36px_72px_20px] gap-1 text-[9px] text-[var(--muted)]/60 px-2 mb-1">
                      <span>항목명</span>
                      <span className="text-center">수량</span>
                      <span className="text-center">단위</span>
                      <span className="text-right">금액(만)</span>
                      <span />
                    </div>
                    <div className="space-y-1">
                      {cat.subs.map((sub, i) => {
                        const ovKey = `${cat.id}-${i}`;
                        const ov = subOverrides[ovKey] || {};
                        const defaultAmt = Math.round(calcSub(sub, area));
                        const isDeleted = !!deletedSubs[ovKey];

                        if (isDeleted) {
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 text-[11px] py-1 px-1.5 rounded-md opacity-40">
                              <span className="line-through text-[var(--muted)] truncate flex-1">{ov.name ?? sub.name}</span>
                              <button
                                onClick={() => onDeletedSubsChange((prev) => { const n = { ...prev }; delete n[ovKey]; return n; })}
                                className="p-0.5 text-[var(--muted)] hover:text-[var(--primary)]"
                              >
                                <RotateCcw size={12} />
                              </button>
                            </div>
                          );
                        }

                        const isOverridden = ov.amount != null || ov.name != null;
                        return (
                          <div
                            key={i}
                            className={`grid grid-cols-[1fr_48px_36px_72px_20px] gap-1 text-[11px] py-1 px-1.5 rounded-md items-center ${
                              isOverridden
                                ? "bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20"
                                : "bg-white/[0.02]"
                            }`}
                          >
                            <input
                              type="text"
                              value={ov.name ?? sub.name}
                              onChange={(e) => onSubOverrideChange(ovKey, { ...ov, name: e.target.value })}
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 outline-none min-w-0 text-[11px]"
                            />
                            <input
                              type="number"
                              value={ov.qty ?? 1}
                              onChange={(e) => onSubOverrideChange(ovKey, { ...ov, qty: Number(e.target.value) || 1 })}
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-0.5 py-0.5 text-center outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <input
                              type="text"
                              value={ov.unit ?? "식"}
                              onChange={(e) => onSubOverrideChange(ovKey, { ...ov, unit: e.target.value })}
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-0.5 py-0.5 text-center outline-none text-[11px]"
                            />
                            <input
                              type="number"
                              value={Math.round((ov.amount != null ? ov.amount : defaultAmt) / 10000)}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") {
                                  const n = { ...ov };
                                  delete n.amount;
                                  onSubOverrideChange(ovKey, n);
                                } else onSubOverrideChange(ovKey, { ...ov, amount: Number(v) * 10000 });
                              }}
                              className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 text-right font-medium outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => onDeletedSubsChange((prev) => ({ ...prev, [ovKey]: true }))}
                              className="text-[var(--muted)] hover:text-red-400 text-xs leading-none"
                            >
                              <Trash2 size={11} />
                            </button>
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
                              const a = [...(customSubs[cat.id] || [])];
                              a[ci] = { ...a[ci], name: e.target.value };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/50 rounded px-1 py-0.5 outline-none min-w-0 text-[11px]"
                          />
                          <input
                            type="number"
                            value={cs.qty}
                            onChange={(e) => {
                              const a = [...(customSubs[cat.id] || [])];
                              a[ci] = { ...a[ci], qty: Number(e.target.value) || 1 };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-0.5 py-0.5 text-center outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <input
                            type="text"
                            value={cs.unit}
                            onChange={(e) => {
                              const a = [...(customSubs[cat.id] || [])];
                              a[ci] = { ...a[ci], unit: e.target.value };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-0.5 py-0.5 text-center outline-none text-[11px]"
                          />
                          <input
                            type="number"
                            value={Math.round(cs.amount / 10000)}
                            onChange={(e) => {
                              const a = [...(customSubs[cat.id] || [])];
                              a[ci] = { ...a[ci], amount: (Number(e.target.value) || 0) * 10000 };
                              onCustomSubsChange(cat.id, a);
                            }}
                            className="bg-transparent border border-transparent hover:border-[var(--border)] rounded px-1 py-0.5 text-right font-medium outline-none text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => {
                              const a = (customSubs[cat.id] || []).filter((_, idx) => idx !== ci);
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
                          const a = [...(customSubs[cat.id] || []), { name: "새 항목", qty: 1, unit: "식", amount: 0 }];
                          onCustomSubsChange(cat.id, a);
                        }}
                        className="w-full text-[10px] py-1.5 rounded-md border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
                      >
                        + 항목 추가
                      </button>
                    </div>
                  </div>

                  {/* Material overrides */}
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider font-semibold">
                      자재 옵션
                    </div>
                    {/* 기본 자재 옵션 표시 */}
                    {cat.matOptions && (
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        {cat.matOptions.map((m) => (
                          <div
                            key={m.grade}
                            className={`px-2 py-1.5 rounded text-xs ${
                              m.grade === cg
                                ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                                : "bg-white/[0.02]"
                            }`}
                          >
                            <span className="text-[var(--muted)]">
                              {GRADES.find((g) => g.key === m.grade)?.label}:{" "}
                            </span>
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[var(--muted)] ml-1">({fmtShort(m.price)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 추가 자재 */}
                    {(matOverrides[cat.id] || []).length > 0 && (
                      <>
                        <div className="text-[10px] text-[var(--muted)] mb-1 mt-2 font-semibold">추가 자재</div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--muted)] uppercase tracking-wider px-0.5 mb-0.5">
                          <span className="flex-1">자재명</span>
                          <span className="w-14 text-right">갯수</span>
                          <span className="w-12 text-center">단위</span>
                          <span className="w-20 text-right">단가</span>
                          <span className="w-16 text-right">소계</span>
                          <span className="w-5" />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      {(matOverrides[cat.id] || []).map((mo, mi) => (
                        <div key={`mat-${mi}`} className="flex items-center gap-1.5 text-xs">
                          <input type="text" value={mo.name} placeholder="자재명"
                            onChange={(e) => {
                              const arr = [...(matOverrides[cat.id] || [])];
                              arr[mi] = { ...arr[mi], name: e.target.value };
                              onMatOverridesChange(cat.id, arr);
                            }}
                            className="flex-1 min-w-0 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]" />
                          <input type="number" value={mo.qty} placeholder="수량"
                            onChange={(e) => {
                              const arr = [...(matOverrides[cat.id] || [])];
                              arr[mi] = { ...arr[mi], qty: Number(e.target.value) || 0 };
                              onMatOverridesChange(cat.id, arr);
                            }}
                            className="w-14 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--primary)]" />
                          <input type="text" value={mo.unit} placeholder="단위"
                            onChange={(e) => {
                              const arr = [...(matOverrides[cat.id] || [])];
                              arr[mi] = { ...arr[mi], unit: e.target.value };
                              onMatOverridesChange(cat.id, arr);
                            }}
                            className="w-12 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-center focus:outline-none focus:border-[var(--primary)]" />
                          <input type="number" value={mo.unitPrice} placeholder="단가"
                            onChange={(e) => {
                              const arr = [...(matOverrides[cat.id] || [])];
                              arr[mi] = { ...arr[mi], unitPrice: Number(e.target.value) || 0 };
                              onMatOverridesChange(cat.id, arr);
                            }}
                            className="w-20 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--primary)]" />
                          <span className="text-[10px] text-[var(--muted)] w-16 text-right tabular-nums shrink-0">
                            {fmtShort(Math.round(mo.qty * mo.unitPrice / 100) * 100)}
                          </span>
                          <button
                            onClick={() => {
                              const arr = [...(matOverrides[cat.id] || [])];
                              arr.splice(mi, 1);
                              onMatOverridesChange(cat.id, arr);
                            }}
                            className="p-0.5 text-[var(--muted)] hover:text-red-400 shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {(matOverrides[cat.id]?.length ?? 0) > 0 && (
                        <div className="flex justify-end text-xs font-medium pt-1 border-t border-[var(--border)]">
                          <span className="text-[var(--muted)] mr-2">자재 소계:</span>
                          <span className="text-[var(--primary)] tabular-nums">
                            {fmtShort((matOverrides[cat.id] || []).reduce((s, mo) => s + Math.round(mo.qty * mo.unitPrice / 100) * 100, 0))}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => onMatOverridesChange(cat.id, [...(matOverrides[cat.id] || []), { name: "", qty: 1, unit: "개", unitPrice: 0 }])}
                        className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:text-[var(--primary)]/80 mt-1"
                      >
                        <PlusCircle size={12} /> 자재 추가
                      </button>
                    </div>
                  </div>

                  {/* Amount adjustment */}
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider font-semibold">
                      금액 미세 조정
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[-500000, -100000, 100000, 500000].map((d) => (
                        <button
                          key={d}
                          onClick={() => onCatAdjChange(cat.id, (catAdj[cat.id] || 0) + d)}
                          className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
                        >
                          {d > 0 ? "+" : ""}{fmtM(d)}
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
                      <div className="text-[10px] mt-1" style={{ color: adj > 0 ? "#ef4444" : "#22c55e" }}>
                        조정: {adj > 0 ? "+" : ""}{fmtM(adj)}
                      </div>
                    )}
                  </div>

                  {/* 공종 초기화 & 제거 */}
                  <div className="flex items-center gap-3 pt-1 border-t border-[var(--border)]">
                    {(catGrades[cat.id] || catAdj[cat.id] || Object.keys(subOverrides).some(k => k.startsWith(cat.id)) || Object.keys(deletedSubs).some(k => k.startsWith(cat.id)) || (customSubs[cat.id]?.length ?? 0) > 0 || (matOverrides[cat.id]?.length ?? 0) > 0) && (
                      <button
                        onClick={() => {
                          onCatGradeChange(cat.id, grade);
                          onCatAdjChange(cat.id, 0);
                          // 세부항목 초기화
                          cat.subs.forEach((_, i) => {
                            const key = `${cat.id}-${i}`;
                            if (subOverrides[key]) onSubOverrideChange(key, {});
                          });
                          onDeletedSubsChange((p) => { const n = { ...p }; Object.keys(n).filter(k => k.startsWith(cat.id)).forEach(k => delete n[k]); return n; });
                          onCustomSubsChange(cat.id, []);
                          onMatOverridesChange(cat.id, []);
                        }}
                        className="flex items-center gap-1 text-[10px] text-orange-500 hover:text-orange-400"
                      >
                        <RotateCcw size={11} /> 이 공종 초기화
                      </button>
                    )}
                    <button
                      onClick={() => { onHiddenCatsChange((p) => ({ ...p, [cat.id]: true })); setExpanded(null); }}
                      className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={11} /> 이 공종 제거
                    </button>
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
