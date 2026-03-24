"use client";

import { GRADES, fmtShort } from "@/lib/estimate-engine";

interface Props {
  area: number;
  grade: string;
  onAreaChange: (area: number) => void;
  onGradeChange: (grade: string) => void;
}

export function StepAreaGrade({
  area,
  grade,
  onAreaChange,
  onGradeChange,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Area */}
      <div>
        <h2 className="text-xl font-bold mb-1">평수 선택</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          시공할 면적을 선택하세요. (전용면적 기준)
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[18, 24, 32, 42, 59].map((v) => (
            <button
              key={v}
              onClick={() => onAreaChange(v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                area === v
                  ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)] font-bold"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
              }`}
            >
              {v}평
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={10}
            max={100}
            value={area}
            onChange={(e) => onAreaChange(Number(e.target.value))}
            className="flex-1 accent-[var(--primary)] h-2"
          />
          <div className="min-w-[80px] text-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-1 py-1.5">
            <input
              type="number"
              min={10}
              max={100}
              value={area}
              onChange={(e) =>
                onAreaChange(
                  Math.max(10, Math.min(100, Number(e.target.value) || 10))
                )
              }
              className="w-12 text-center text-2xl font-bold text-[var(--primary)] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-[var(--muted)]">평</span>
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-[var(--muted)]/50 mt-1 px-1">
          <span>10평</span>
          <span>30평</span>
          <span>50평</span>
          <span>70평</span>
          <span>100평</span>
        </div>
      </div>

      {/* Grade */}
      <div>
        <h2 className="text-xl font-bold mb-1">등급 선택</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          인테리어 시공 등급을 선택하세요.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GRADES.map((gr) => {
            const isSelected = gr.key === grade;
            return (
              <button
                key={gr.key}
                onClick={() => onGradeChange(gr.key)}
                className={`relative rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "shadow-md"
                    : "border-[var(--border)] bg-white/[0.02] hover:border-[var(--primary)]/20 hover:bg-[var(--border)]"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: gr.color,
                        background: `${gr.color}15`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: gr.color }}
                  />
                  <span className="text-sm font-bold">{gr.label}</span>
                </div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded-full inline-block mb-1"
                  style={{
                    background: `${gr.color}20`,
                    color: gr.color,
                  }}
                >
                  {gr.tag}
                </div>
                <div className="text-[10px] text-[var(--muted)] leading-tight">
                  {gr.desc}
                </div>
                <div
                  className="text-xs font-semibold mt-1.5"
                  style={{ color: gr.color }}
                >
                  {fmtShort(Math.round(gr.target60 * (area / 60)))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
