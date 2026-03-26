"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Ruler,
  Wrench,
  SlidersHorizontal,
  Star,
  FileText,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  CATS,
  gradeMap,
  calcCatTotal,
  calcSub,
  fmtShort,
  fmtM,
} from "@/lib/estimate-engine";
import { StepClientInfo } from "./steps/StepClientInfo";
import { StepAreaGrade } from "./steps/StepAreaGrade";
import { StepCategories } from "./steps/StepCategories";
import { StepDetails } from "./steps/StepDetails";
import {
  StepDocSettings,
  type CompanyInfo,
} from "./steps/StepDocSettings";
import { StepPreview } from "./steps/StepPreview";

const STEPS = [
  { label: "기본 정보", icon: User },
  { label: "평수·등급", icon: Ruler },
  { label: "공종 선택", icon: Wrench },
  { label: "상세 조정", icon: SlidersHorizontal },
  { label: "문서 설정", icon: Star },
  { label: "견적서", icon: FileText },
];

const DRAFT_KEY = "interior-coach-estimate-draft";

export function EstimateBuilder() {
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [shakeNext, setShakeNext] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(
    null
  );

  const [clientInfo, setClientInfo] = useState({
    name: "",
    projectName: "",
    address: "",
    phone: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [area, setArea] = useState(30);
  const [grade, setGrade] = useState("standard");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => {
      const m: Record<string, boolean> = {};
      CATS.forEach((c) => (m[c.id] = true));
      return m;
    }
  );
  const [catGrades, setCatGrades] = useState<
    Record<string, string>
  >({});
  const [catAdj, setCatAdj] = useState<Record<string, number>>({});
  const [subOverrides, setSubOverrides] = useState<
    Record<
      string,
      { name?: string; qty?: number; unit?: string; amount?: number }
    >
  >({});
  const [customSubs, setCustomSubs] = useState<
    Record<
      string,
      { name: string; qty: number; unit: string; amount: number }[]
    >
  >({});
  const [matOverrides, setMatOverrides] = useState<
    Record<
      string,
      { name: string; qty: number; unit: string; unitPrice: number }[]
    >
  >({});
  const [deletedSubs, setDeletedSubs] = useState<Record<string, boolean>>({});
  const [hiddenCats, setHiddenCats] = useState<Record<string, boolean>>({});
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    representative: "",
    companyAddress: "",
    companyPhone: "",
    businessNumber: "",
  });
  const [profitRate, setProfitRate] = useState(20);
  const [overheadRate, setOverheadRate] = useState(6);
  const [vatOn, setVatOn] = useState(false);
  const [notes, setNotes] = useState("");

  const amounts = useMemo(() => {
    const m: Record<string, number> = {};
    CATS.forEach((cat) => {
      if (enabled[cat.id] !== false && !hiddenCats[cat.id]) {
        const cg = catGrades[cat.id] || grade;
        const adj = catAdj[cat.id] || 0;
        const base = calcCatTotal(cat, area, grade, cg);
        let overrideDiff = 0;
        cat.subs.forEach((sub, i) => {
          const key = `${cat.id}-${i}`;
          if (deletedSubs[key]) {
            overrideDiff -= calcSub(sub, area);
            return;
          }
          const ov = subOverrides[key];
          if (ov?.amount != null)
            overrideDiff += ov.amount - calcSub(sub, area);
        });
        const customTotal = (customSubs[cat.id] || []).reduce(
          (s, cs) => s + cs.amount,
          0
        );
        const matTotal = (matOverrides[cat.id] || []).reduce(
          (s, mo) => s + mo.qty * mo.unitPrice,
          0
        );
        m[cat.id] = Math.max(
          0,
          base + overrideDiff + customTotal + matTotal + adj
        );
      }
    });
    return m;
  }, [
    area,
    grade,
    enabled,
    catGrades,
    catAdj,
    subOverrides,
    customSubs,
    deletedSubs,
    hiddenCats,
    matOverrides,
  ]);

  const subtotal = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + v, 0),
    [amounts]
  );
  const profit = Math.round((subtotal * profitRate) / 100);
  const overhead = Math.round((subtotal * overheadRate) / 100);
  const beforeVat = subtotal + profit + overhead;
  const vat = vatOn ? Math.round(beforeVat * 0.1) : 0;
  const grandTotal = beforeVat + vat;

  const goTo = (target: number) => {
    if (target === step) return;
    setPrevStep(step);
    setStep(target);
  };

  const canNext =
    step === 0 ? clientInfo.projectName.trim().length > 0 : true;
  const handleNext = () => {
    if (!canNext) {
      setShakeNext(true);
      setTimeout(() => setShakeNext(false), 500);
      return;
    }
    goTo(step + 1);
  };

  // Auto-save
  const saveTimerRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            clientInfo,
            area,
            grade,
            enabled,
            catGrades,
            catAdj,
            subOverrides,
            customSubs,
            deletedSubs,
            hiddenCats,
            matOverrides,
            companyInfo,
            profitRate,
            overheadRate,
            vatOn,
            notes,
            step,
            savedAt: new Date().toISOString(),
          })
        );
        setAutoSaveTime(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        /* quota exceeded */
      }
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    clientInfo,
    area,
    grade,
    enabled,
    catGrades,
    catAdj,
    subOverrides,
    customSubs,
    deletedSubs,
    hiddenCats,
    matOverrides,
    companyInfo,
    profitRate,
    overheadRate,
    vatOn,
    notes,
    step,
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw && JSON.parse(raw).savedAt) {
        setHasDraft(true);
        setShowDraftBanner(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadDraft = () => {
    try {
      const d = JSON.parse(
        localStorage.getItem(DRAFT_KEY) || "{}"
      );
      if (d.clientInfo) setClientInfo(d.clientInfo);
      if (d.area) setArea(d.area);
      if (d.grade) setGrade(d.grade);
      if (d.enabled) setEnabled(d.enabled);
      if (d.catGrades) setCatGrades(d.catGrades);
      if (d.catAdj) setCatAdj(d.catAdj);
      if (d.subOverrides) setSubOverrides(d.subOverrides);
      if (d.customSubs) setCustomSubs(d.customSubs);
      if (d.deletedSubs) setDeletedSubs(d.deletedSubs);
      if (d.hiddenCats) setHiddenCats(d.hiddenCats);
      if (d.matOverrides) setMatOverrides(d.matOverrides);
      if (d.companyInfo) setCompanyInfo(d.companyInfo);
      if (d.profitRate != null) setProfitRate(d.profitRate);
      if (d.overheadRate != null) setOverheadRate(d.overheadRate);
      if (d.vatOn != null) setVatOn(d.vatOn);
      if (d.notes) setNotes(d.notes);
      if (d.step != null) {
        setPrevStep(0);
        setStep(d.step);
      }
    } catch {
      /* ignore */
    }
    setShowDraftBanner(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
    setHasDraft(false);
  };

  return (
    <div className="min-h-screen">
      {/* Draft banner */}
      {showDraftBanner && hasDraft && (
        <div className="bg-[var(--primary)]/10 border-b border-[var(--primary)]/20 print:hidden">
          <div className="mx-auto max-w-5xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              저장된 견적서가 있습니다
            </span>
            <div className="flex gap-2">
              <button
                onClick={loadDraft}
                className="text-xs px-3 py-1 rounded-md bg-[var(--primary)] text-white font-medium hover:bg-[#1d4ed8] transition-colors"
              >
                이어서 작성
              </button>
              <button
                onClick={clearDraft}
                className="text-xs px-3 py-1 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                새로 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="border-b border-[var(--border)] print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-3">
          {/* Desktop */}
          <div className="hidden sm:flex items-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const current = i === step;
              const clickable = i <= step;
              return (
                <div key={i} className="flex items-center flex-1">
                  <button
                    onClick={() => clickable && goTo(i)}
                    disabled={!clickable}
                    className={`flex items-center gap-1.5 ${clickable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        done
                          ? "bg-[var(--primary)] text-white"
                          : current
                            ? "bg-[var(--primary)]/20 text-[var(--primary)] ring-2 ring-[var(--primary)]/40"
                            : "bg-white/[0.06] text-[var(--muted)]/40"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium ${current ? "text-[var(--foreground)]" : done ? "text-[var(--foreground)]/70" : "text-[var(--muted)]/30"}`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 ${i < step ? "bg-[var(--primary)]/50" : "bg-white/[0.06]"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Mobile */}
          <div className="sm:hidden flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => i <= step && goTo(i)}
                  className={`rounded-full transition-all ${i === step ? "w-6 h-2 bg-[var(--primary)]" : i < step ? "w-2 h-2 bg-[var(--primary)]/50" : "w-2 h-2 bg-white/[0.08]"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--muted)]">
                {STEPS[step].label}
              </span>
              <span className="font-bold text-[var(--primary)]">
                {fmtShort(grandTotal)}
              </span>
            </div>
          </div>
          {/* Desktop mini summary */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--muted)] mt-2">
            <span>{area}평</span>
            <span>·</span>
            <span style={{ color: gradeMap[grade]?.color }}>
              {gradeMap[grade]?.label}
            </span>
            <span>·</span>
            <span className="font-semibold text-[var(--primary)]">
              {fmtShort(grandTotal)}
            </span>
            {autoSaveTime && (
              <span className="text-[var(--muted)]/50 text-[10px] ml-1">
                {autoSaveTime} 저장됨
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {step === 0 && (
              <StepClientInfo
                info={clientInfo}
                onChange={setClientInfo}
              />
            )}
            {step === 1 && (
              <StepAreaGrade
                area={area}
                grade={grade}
                onAreaChange={setArea}
                onGradeChange={setGrade}
              />
            )}
            {step === 2 && (
              <StepCategories
                area={area}
                grade={grade}
                enabled={enabled}
                onToggle={(id) =>
                  setEnabled((p) => ({ ...p, [id]: !p[id] }))
                }
              />
            )}
            {step === 3 && (
              <StepDetails
                area={area}
                grade={grade}
                buildingType="apt"
                enabled={enabled}
                catGrades={catGrades}
                catAdj={catAdj}
                subOverrides={subOverrides}
                customSubs={customSubs}
                matOverrides={matOverrides}
                deletedSubs={deletedSubs}
                hiddenCats={hiddenCats}
                onCatGradeChange={(id, g) =>
                  setCatGrades((p) => ({ ...p, [id]: g }))
                }
                onCatAdjChange={(id, v) =>
                  setCatAdj((p) => ({ ...p, [id]: v }))
                }
                onSubOverrideChange={(key, ov) =>
                  setSubOverrides((p) => ({ ...p, [key]: ov }))
                }
                onCustomSubsChange={(catId, subs) =>
                  setCustomSubs((p) => ({
                    ...p,
                    [catId]: subs,
                  }))
                }
                onMatOverridesChange={(catId, mats) =>
                  setMatOverrides((p) => ({ ...p, [catId]: mats }))
                }
                onDeletedSubsChange={setDeletedSubs}
                onHiddenCatsChange={setHiddenCats}
              />
            )}
            {step === 4 && (
              <StepDocSettings
                company={companyInfo}
                profitRate={profitRate}
                overheadRate={overheadRate}
                vatOn={vatOn}
                notes={notes}
                onCompanyChange={setCompanyInfo}
                onProfitRateChange={setProfitRate}
                onOverheadRateChange={setOverheadRate}
                onVatToggle={() => setVatOn(!vatOn)}
                onNotesChange={setNotes}
              />
            )}
            {step === 5 && (
              <StepPreview
                clientInfo={clientInfo}
                companyInfo={companyInfo}
                area={area}
                grade={grade}
                enabled={enabled}
                catGrades={catGrades}
                catAdj={catAdj}
                subOverrides={subOverrides}
                customSubs={customSubs}
                profitRate={profitRate}
                overheadRate={overheadRate}
                vatOn={vatOn}
                notes={notes}
                amounts={amounts}
                subtotal={subtotal}
                profit={profit}
                overhead={overhead}
                vat={vat}
                grandTotal={grandTotal}
              />
            )}
          </div>

          {/* Sidebar summary */}
          {step >= 2 && step <= 4 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                  견적 요약
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-[var(--muted)]">
                      직접 공사비
                    </div>
                    <div className="text-lg font-bold">
                      {fmtShort(subtotal)}
                    </div>
                  </div>
                  {profitRate > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">
                        이윤 {profitRate}%
                      </span>
                      <span>{fmtM(profit)}</span>
                    </div>
                  )}
                  {overheadRate > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">
                        경비 {overheadRate}%
                      </span>
                      <span>{fmtM(overhead)}</span>
                    </div>
                  )}
                  {vatOn && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">
                        VAT
                      </span>
                      <span>{fmtM(vat)}</span>
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] pt-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold">
                        합계
                      </span>
                      <span className="text-base font-bold text-[var(--primary)]">
                        {fmtShort(grandTotal)}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">
                      평당 {fmtM(grandTotal / area)}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile summary */}
      {step >= 2 && step <= 4 && (
        <div
          className={`lg:hidden fixed bottom-[72px] left-0 right-0 z-40 print:hidden transition-transform duration-300 ${showMobileSummary ? "translate-y-0" : "translate-y-[calc(100%-36px)]"}`}
        >
          <div className="mx-4 rounded-t-xl border border-b-0 border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl overflow-hidden">
            <button
              onClick={() =>
                setShowMobileSummary(!showMobileSummary)
              }
              className="w-full flex items-center justify-between px-4 py-2 text-xs"
            >
              <span className="font-semibold text-[var(--muted)]">
                견적 요약
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--primary)]">
                  {fmtShort(grandTotal)}
                </span>
                {showMobileSummary ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
              </div>
            </button>
            {showMobileSummary && (
              <div className="px-4 pb-3 border-t border-[var(--border)]">
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted)]">
                      직접 공사비
                    </span>
                    <span>{fmtShort(subtotal)}</span>
                  </div>
                  {profitRate > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">
                        이윤 {profitRate}%
                      </span>
                      <span>{fmtM(profit)}</span>
                    </div>
                  )}
                  {overheadRate > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">
                        경비 {overheadRate}%
                      </span>
                      <span>{fmtM(overhead)}</span>
                    </div>
                  )}
                  {vatOn && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">
                        VAT
                      </span>
                      <span>{fmtM(vat)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-[var(--border)] pt-2">
                    <span>합계</span>
                    <span className="text-[var(--primary)]">
                      {fmtShort(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="sticky bottom-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={16} /> 이전
          </button>
          <div className="sm:hidden text-center">
            <div className="text-[10px] text-[var(--muted)]">
              {step + 1} / {STEPS.length}
            </div>
            <div className="text-sm font-bold text-[var(--primary)]">
              {fmtShort(grandTotal)}
            </div>
          </div>
          {step < 5 ? (
            <button
              onClick={handleNext}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--primary)] text-white hover:bg-[#1d4ed8] transition-colors ${shakeNext ? "animate-shake" : ""}`}
            >
              다음 <ArrowRight size={16} />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
