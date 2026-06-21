"use client";

import { useMemo } from "react";
import { Plus, X as XIcon, AlertCircle, CheckCircle2 } from "lucide-react";

export interface PaymentSplit {
  label: string;
  amount: number;
}

interface Props {
  splits: PaymentSplit[];
  budget: number;
  onChange: (next: PaymentSplit[]) => void;
  /** 최소 행 수 (기본 2) — 행 삭제 버튼을 조건부 비활성화. */
  minRows?: number;
  /** 최대 행 수 (기본 6) — 항목 추가 버튼을 조건부 비활성화. */
  maxRows?: number;
}

const DEFAULT_LABELS = ["계약금", "착수금", "중도금", "잔금"];

export const DEFAULT_SPLITS: PaymentSplit[] = DEFAULT_LABELS.map((l) => ({
  label: l,
  amount: 0,
}));

function fmtKrw(n: number): string {
  return n.toLocaleString("ko-KR");
}

/**
 * 대금 분할 동적 입력 컴포넌트.
 * - 항목명/금액 인라인 편집, 행 추가/삭제
 * - 각 행 옆 예산 대비 비율 자동 표시
 * - 하단 합계 vs 예산 비교 — 일치하면 정상색, 불일치하면 경고색
 * - 요율 입력 영역은 의도적으로 없음
 */
export default function PaymentSplitEditor({
  splits,
  budget,
  onChange,
  minRows = 2,
  maxRows = 6,
}: Props) {
  const total = useMemo(
    () => splits.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [splits],
  );
  const diff = total - budget;
  const matches = budget > 0 && diff === 0;

  const updateRow = (idx: number, patch: Partial<PaymentSplit>) => {
    const next = splits.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const removeRow = (idx: number) => {
    if (splits.length <= minRows) return;
    onChange(splits.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    if (splits.length >= maxRows) return;
    const extraIdx = Math.max(1, splits.length - DEFAULT_LABELS.length + 1);
    onChange([...splits, { label: `추가 ${extraIdx}`, amount: 0 }]);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {splits.map((row, idx) => {
          const ratio = budget > 0 ? Math.round((row.amount / budget) * 100) : 0;
          return (
            <div
              key={idx}
              className="grid grid-cols-[1fr_140px_60px_32px] sm:grid-cols-[160px_1fr_72px_36px] gap-2 items-center"
            >
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(idx, { label: e.target.value })}
                placeholder="항목명"
                maxLength={20}
                className="px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm font-medium focus:border-[var(--green)] outline-none"
              />
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={row.amount === 0 ? "" : fmtKrw(row.amount)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    const n = raw ? parseInt(raw, 10) : 0;
                    updateRow(idx, { amount: n });
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-right focus:border-[var(--green)] outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] pointer-events-none">
                  원
                </span>
              </div>
              <span
                className={`text-xs text-center font-medium ${
                  ratio > 0 ? "text-[var(--green)]" : "text-[var(--muted)]"
                }`}
                title={`${ratio}% of 예산`}
              >
                {ratio}%
              </span>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={splits.length <= minRows}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[var(--muted)] disabled:hover:bg-transparent"
                title={splits.length <= minRows ? `최소 ${minRows}행 유지` : "행 삭제"}
                aria-label="행 삭제"
              >
                <XIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={splits.length >= maxRows}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus size={14} />
        항목 추가 {splits.length}/{maxRows}
      </button>

      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
          matches
            ? "border-[var(--green)]/40 bg-[var(--green)]/10"
            : "border-[var(--orange)]/40 bg-[var(--orange)]/10"
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          {matches ? (
            <CheckCircle2 size={14} className="text-[var(--green)]" />
          ) : (
            <AlertCircle size={14} className="text-[var(--orange)]" />
          )}
          <span className={matches ? "text-[var(--green)] font-semibold" : "text-[var(--orange)] font-semibold"}>
            {matches ? "분할 합계가 예산과 일치합니다" : "분할 합계가 예산과 다릅니다"}
          </span>
        </div>
        <div className="text-xs text-right">
          <p className={matches ? "text-[var(--green)]" : "text-[var(--orange)]"}>
            <span className="text-[var(--muted)]">분할 합계 </span>
            <span className="font-bold">{fmtKrw(total)}원</span>
          </p>
          <p className="text-[var(--muted)] mt-0.5">
            예산 <span className="font-bold text-[var(--foreground)]">{fmtKrw(budget)}원</span>
            {diff !== 0 && (
              <span className={`ml-1 ${diff > 0 ? "text-[var(--orange)]" : "text-[var(--red)]"}`}>
                ({diff > 0 ? "+" : ""}
                {fmtKrw(diff)})
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
