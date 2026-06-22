"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Save, Loader2, Sparkles, CheckCircle2,
} from "lucide-react";
import { KoreanInput } from "@/components/ui/KoreanInput";
import PaymentSplitEditor, {
  DEFAULT_SPLITS,
  type PaymentSplit,
} from "@/components/sites/PaymentSplitEditor";
import { apiFetch } from "@/lib/api-client";
import { TRADES } from "@/lib/constants";

/** 공종 칩 — TRADES 상수 전체 (35개). 한 화면에서 다 클릭 가능하도록 flex-wrap. */
const TRADE_CHIPS = TRADES;

const SCOPE_OPTIONS = ["부분", "전체"] as const;
type Scope = (typeof SCOPE_OPTIONS)[number];

function fmtKrw(n: number): string {
  return n.toLocaleString("ko-KR");
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function QuickNewSitePage() {
  const router = useRouter();

  // 기본 정보
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaPyeong, setAreaPyeong] = useState<string>("");

  // 공사 정보
  const [scope, setScope] = useState<Scope>("전체");
  const [budget, setBudget] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");

  // 공종
  const [trades, setTrades] = useState<string[]>([]);

  // 대금 분할
  const [splits, setSplits] = useState<PaymentSplit[]>(DEFAULT_SPLITS);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitTotal = useMemo(
    () => splits.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [splits],
  );

  const toggleTrade = (t: string) => {
    setTrades((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return "현장명을 입력해주세요";
    if (!customerName.trim()) return "고객명을 입력해주세요";
    if (!customerPhone.trim()) return "연락처를 입력해주세요";
    if (!address.trim()) return "주소를 입력해주세요";
    if (!budget || budget <= 0) return "예산을 입력해주세요";
    if (!startDate) return "착수일을 선택해주세요";
    if (!endDate) return "준공일을 선택해주세요";
    if (startDate > endDate) return "준공일이 착수일보다 빠를 수 없습니다";
    if (trades.length === 0) return "공종을 1개 이상 선택해주세요";

    // 분할 검증
    if (splits.length < 2) return "대금 분할은 최소 2행이 필요합니다";
    if (splits.length > 6) return "대금 분할은 최대 6행입니다";
    if (splits.some((s) => !s.label.trim())) return "분할 항목명을 모두 입력해주세요";
    if (splitTotal !== budget) {
      return `대금 분할 합계(${fmtKrw(splitTotal)})가 예산(${fmtKrw(budget)})과 일치해야 합니다`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    try {
      // /api/sites/full 는 단일 트랜잭션으로 customer + site + contract + payment_splits +
      // construction_phases + site_schedules 를 모두 생성한다 (createSiteInputSchema 형태).
      const res = await apiFetch("/api/sites/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          areaPyeong: areaPyeong ? Number(areaPyeong) : null,
          scope,
          budget,
          startDate,
          endDate,
          trades,
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim() || null,
          },
          contractAmount: budget,
          contractDate: todayISO(),
          paymentSplits: splits.map((s) => ({
            itemName: s.label.trim(),
            amount: s.amount,
            status: "예정" as const,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data?.error === "string" && data.error) ||
          data?.error?.message ||
          "저장에 실패했습니다";
        setError(msg);
        setSaving(false);
        return;
      }
      const siteId = data?.siteId || data?.data?.siteId;
      router.push(siteId ? `/sites/${siteId}/quick` : "/sites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/sites"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]"
          aria-label="현장 목록"
        >
          <ArrowLeft size={18} />
        </Link>
        <Building2 size={22} className="text-[var(--green)]" />
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            새 현장 등록
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--green)]/15 text-[var(--green)] font-semibold">
              <Sparkles size={10} />
              한 화면
            </span>
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            고객·공정·계약·일정이 한 번에 만들어집니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1) 기본 정보 */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-sm font-bold">1. 기본 정보</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="현장명 *">
              <KoreanInput
                value={name}
                onChange={setName}
                placeholder=""
                className={inputCls}
              />
            </Field>
            <Field label="고객명 *">
              <KoreanInput
                value={customerName}
                onChange={setCustomerName}
                placeholder=""
                className={inputCls}
              />
            </Field>
            <Field label="연락처 *">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder=""
                className={inputCls}
                inputMode="tel"
              />
            </Field>
            <Field label="평수">
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={areaPyeong}
                  onChange={(e) => setAreaPyeong(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder=""
                  className={`${inputCls} pr-10`}
                  inputMode="numeric"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">평</span>
              </div>
            </Field>
          </div>
          <Field label="주소 *">
            <KoreanInput
              value={address}
              onChange={setAddress}
              placeholder=""
              className={inputCls}
            />
          </Field>
        </section>

        {/* 2) 공사 정보 */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-sm font-bold">2. 공사 정보</h2>
          <Field label="공사범위 *">
            <div className="flex gap-2">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`flex-1 sm:flex-initial sm:px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    scope === s
                      ? "bg-[var(--green)] text-black border-[var(--green)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)]/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="예산 *" hint="총 계약 금액">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={budget === 0 ? "" : fmtKrw(budget)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setBudget(raw ? parseInt(raw, 10) : 0);
                  }}
                  placeholder="0"
                  className={`${inputCls} pr-10 text-right`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">원</span>
              </div>
            </Field>
            <Field label="착수일 *">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputCls} [color-scheme:dark]`}
              />
            </Field>
            <Field label="준공일 *">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputCls} [color-scheme:dark]`}
              />
            </Field>
          </div>
        </section>

        {/* 3) 공종 선택 */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold">3. 공종 선택 *</h2>
            <p className="text-[11px] text-[var(--muted)]">
              체크한 만큼 공정이 자동 생성됩니다
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRADE_CHIPS.map((t) => {
              const active = trades.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTrade(t)}
                  className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm border transition-colors ${
                    active
                      ? "bg-[var(--green)] text-black border-[var(--green)] font-semibold"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)]/40"
                  }`}
                >
                  {active && <CheckCircle2 size={12} />}
                  {t}
                </button>
              );
            })}
          </div>
          {trades.length > 0 && (
            <p className="text-[11px] text-[var(--green)]">
              선택: {trades.join(", ")} ({trades.length}개 공정 생성 예정)
            </p>
          )}
        </section>

        {/* 4) 대금 분할 */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold">4. 대금 분할 *</h2>
            <p className="text-[11px] text-[var(--muted)]">
              항목명·금액 수정 가능 · 최소 2행, 최대 6행
            </p>
          </div>
          <PaymentSplitEditor
            splits={splits}
            budget={budget}
            onChange={setSplits}
          />
        </section>

        {/* 안내 배너 + 저장 */}
        <section className="rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/10 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--green)]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-[var(--green)]" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-[var(--green)]">
                저장하면 다음이 한 번에 만들어집니다
              </p>
              <ul className="mt-1 text-xs text-[var(--muted)] space-y-0.5">
                <li>· 고객 정보 (이미 있으면 같은 고객으로 연결)</li>
                <li>· 선택한 {trades.length || "n"}개 공정 (착수일~준공일 자동 배정)</li>
                <li>· 계약 1건 + 대금 분할 {splits.length}행</li>
                <li>· 현장 일정 (착수일 → 준공일)</li>
              </ul>
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm text-[var(--red)] px-1">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/sites"
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04]"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "저장 중..." : "현장 만들기"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-xs font-semibold text-[var(--muted)]">{label}</label>
        {hint && <span className="text-[10px] text-[var(--muted)]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
