"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, User, Phone, Wallet,
  Calendar, Hammer, Receipt, ListChecks, ExternalLink,
  ChevronUp, ChevronDown, GripVertical, Sparkles, Loader2,
  Plus, Pencil, Trash2, Save, Printer,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import Modal from "@/components/ui/Modal";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { TRADES } from "@/lib/constants";

interface QuickDetail {
  site: {
    id: string;
    name: string;
    address: string | null;
    areaPyeong: number | null;
    scope: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    trades: string[] | null;
    progress: number | null;
    weekendWork?: boolean;
    customerName: string | null;
    customerPhone: string | null;
  };
  phases: Array<{
    id: string;
    category: string;
    taskName?: string | null;
    plannedStart: string | null;
    plannedEnd: string | null;
    actualStart: string | null;
    actualEnd: string | null;
    progress: number;
    status: string;
    sortOrder: number | null;
  }>;
  contracts: Array<{
    id: string;
    contractAmount: number;
    contractDate: string | null;
    memo: string | null;
  }>;
  payments: Array<{
    id: string;
    contractId: string;
    type: string;
    amount: number;
    dueDate: string | null;
    paidDate: string | null;
    status: string;
  }>;
  schedules?: Array<{
    id: string;
    trade: string;
    taskName: string | null;
    startDate: string;
    endDate: string;
    sortOrder: number;
  }>;
}

type Tab = "phases" | "contract" | "schedule";

function fmtKrw(n: number | null | undefined): string {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("ko-KR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return null;
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

export default function QuickSiteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<QuickDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("phases");

  // 공정 편집 상태
  const [weekendWork, setWeekendWork] = useState<boolean>(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);


  // 추가 / 수정 모달 — null 이면 닫힘. 객체면 모드+초기값.
  type PhaseFormMode = "create" | "edit";
  interface PhaseFormState {
    mode: PhaseFormMode;
    phaseId?: string;
    insertAt?: number; // create 시 새 행을 넣을 sortOrder 자리
    category: string;
    taskName: string;
    plannedStart: string;
    plannedEnd: string;
    progress: number;
    status: string;
    memo: string;
  }
  const [phaseForm, setPhaseForm] = useState<PhaseFormState | null>(null);
  const [phaseFormBusy, setPhaseFormBusy] = useState(false);
  const [phaseFormError, setPhaseFormError] = useState<string | null>(null);

  const loadData = async () => {
    const res = await apiFetch(`/api/sites/${id}/quick-detail`);
    const j = await res.json().catch(() => null);
    const d = j?.data ?? j;
    if (d?.site?.id) {
      setData(d as QuickDetail);
      setWeekendWork(!!d.site.weekendWork);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /** 단건 phase PATCH — date 인라인 편집·상태 변경 */
  const updatePhase = async (phaseId: string, patch: Record<string, unknown>) => {
    // optimistic UI
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map((p) => (p.id === phaseId ? { ...p, ...patch } : p)),
      };
    });
    const res = await apiFetch(`/api/construction/${phaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      // 실패 시 새로 로드
      await loadData();
    }
  };

  /** 순서 변경 — order 배열을 서버에 PATCH 후 재로딩 */
  const persistOrder = async (orderedIds: string[]) => {
    setData((prev) => {
      if (!prev) return prev;
      const map = new Map(prev.phases.map((p) => [p.id, p]));
      type Phase = QuickDetail["phases"][number];
      const next: Phase[] = [];
      orderedIds.forEach((pid, i) => {
        const p = map.get(pid);
        if (p) next.push({ ...p, sortOrder: i });
      });
      return { ...prev, phases: next };
    });
    const res = await apiFetch(`/api/sites/${id}/phases/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: orderedIds }),
    });
    if (!res.ok) await loadData();
  };

  const movePhase = (idx: number, delta: number) => {
    if (!data) return;
    const next = data.phases.slice();
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next.map((p) => p.id));
  };

  /** 자동 배분 */
  const autoSchedule = async (nextWeekend?: boolean) => {
    setAutoBusy(true);
    setAutoError(null);
    try {
      const res = await apiFetch(`/api/sites/${id}/auto-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekendWork: typeof nextWeekend === "boolean" ? nextWeekend : weekendWork,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof j?.error === "string" && j.error) ||
          j?.error?.message ||
          "자동 배분에 실패했습니다";
        setAutoError(msg);
        return;
      }
      await loadData();
    } finally {
      setAutoBusy(false);
    }
  };

  const toggleWeekend = async () => {
    const next = !weekendWork;
    setWeekendWork(next);
    // 토글만 저장 — 사용자가 "공기 자동 배분" 누르면 그때 재배분
    await apiFetch(`/api/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekendWork: next }),
    });
  };

  // 드래그 앤 드롭 핸들러 (마우스 / 데스크탑)
  const onDragStart = (idx: number) => () => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetIdx: number) => () => {
    if (dragIdx === null || dragIdx === targetIdx || !data) {
      setDragIdx(null);
      return;
    }
    const next = data.phases.slice();
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    persistOrder(next.map((p) => p.id));
    setDragIdx(null);
  };

  /** 추가 모달 열기 — afterIdx 뒤에 새 행을 넣는다. -1 이면 맨 위에. undefined 면 맨 아래. */
  const openCreate = (afterIdx?: number) => {
    setPhaseFormError(null);
    const phasesArr = data?.phases || [];
    const insertAt =
      typeof afterIdx === "number" ? afterIdx + 1 : phasesArr.length;
    setPhaseForm({
      mode: "create",
      insertAt,
      category: "",
      taskName: "",
      plannedStart: data?.site.startDate || "",
      plannedEnd: data?.site.endDate || "",
      progress: 0,
      status: "예정",
      memo: "",
    });
  };

  /** 수정 모달 열기 */
  const openEdit = (p: QuickDetail["phases"][number]) => {
    setPhaseFormError(null);
    setPhaseForm({
      mode: "edit",
      phaseId: p.id,
      category: p.category,
      taskName: p.taskName || "",
      plannedStart: p.plannedStart || "",
      plannedEnd: p.plannedEnd || "",
      progress: p.progress,
      status: p.status,
      memo: "",
    });
  };

  /** 모달 저장 — 추가 또는 수정 */
  const submitPhaseForm = async () => {
    if (!phaseForm) return;
    if (!phaseForm.category.trim()) {
      setPhaseFormError("공종을 선택하거나 입력해주세요");
      return;
    }
    setPhaseFormBusy(true);
    setPhaseFormError(null);
    try {
      if (phaseForm.mode === "create") {
        const res = await apiFetch("/api/construction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: id,
            category: phaseForm.category.trim(),
            taskName: phaseForm.taskName.trim() || null,
            plannedStart: phaseForm.plannedStart || null,
            plannedEnd: phaseForm.plannedEnd || null,
            status: phaseForm.status,
            memo: phaseForm.memo || null,
            sortOrder: phaseForm.insertAt,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setPhaseFormError(
            (typeof j?.error === "string" && j.error) ||
              j?.error?.message ||
              "추가에 실패했습니다",
          );
          return;
        }
      } else if (phaseForm.phaseId) {
        const res = await apiFetch(`/api/construction/${phaseForm.phaseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: phaseForm.category.trim(),
            taskName: phaseForm.taskName.trim() || null,
            plannedStart: phaseForm.plannedStart || null,
            plannedEnd: phaseForm.plannedEnd || null,
            progress: phaseForm.progress,
            status: phaseForm.status,
            memo: phaseForm.memo || null,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setPhaseFormError(
            (typeof j?.error === "string" && j.error) ||
              j?.error?.message ||
              "저장에 실패했습니다",
          );
          return;
        }
      }
      await loadData();
      setPhaseForm(null);
    } finally {
      setPhaseFormBusy(false);
    }
  };

  /** 삭제 */
  const deletePhase = async (p: QuickDetail["phases"][number]) => {
    const label = p.taskName ? `${p.category} · ${p.taskName}` : p.category;
    if (!confirm(`"${label}" 공정을 삭제할까요?`)) return;
    // optimistic UI
    setData((prev) =>
      prev ? { ...prev, phases: prev.phases.filter((x) => x.id !== p.id) } : prev,
    );
    const res = await apiFetch(`/api/construction/${p.id}`, { method: "DELETE" });
    if (!res.ok) await loadData();
  };

  const splitTotal = useMemo(
    () => (data?.payments || []).reduce((s, p) => s + p.amount, 0),
    [data],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-72 rounded-xl animate-shimmer" />
        <div className="h-40 rounded-2xl animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">현장을 찾을 수 없습니다.</p>;
  }

  const { site, phases, contracts, payments } = data;
  const schedules = data.schedules || [];
  const totalDays = daysBetween(site.startDate, site.endDate);

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl print-area">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/sites"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] shrink-0 no-print"
            aria-label="현장 목록"
          >
            <ArrowLeft size={18} />
          </Link>
          <Building2 size={22} className="text-[var(--green)] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{site.name}</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
              {site.status} · {site.scope || "—"}
              {site.areaPyeong ? ` · ${site.areaPyeong}평` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)]"
            title="이 화면을 인쇄"
          >
            <Printer size={12} />
            인쇄
          </button>
          <Link
            href={`/sites/${id}`}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)]"
            title="모든 탭(9개) 상세 보기"
          >
            <ExternalLink size={12} />
            상세 보기
          </Link>
        </div>
      </div>

      {/* 기본 정보 카드 — 한 번만 입력한 값을 여기서 읽어서 보여줌 */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-xs font-semibold text-[var(--muted)] mb-3">현장 기본 정보</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={User} label="고객">
            {site.customerName || "—"}
          </InfoRow>
          <InfoRow icon={Phone} label="연락처">
            {site.customerPhone ? (
              <a href={`tel:${site.customerPhone}`} className="hover:text-[var(--green)]">
                {site.customerPhone}
              </a>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow icon={MapPin} label="주소">
            {site.address || "—"}
          </InfoRow>
          <InfoRow icon={Wallet} label="총 예산">
            <span className="font-semibold">{fmtKrw(site.budget)}원</span>
          </InfoRow>
        </div>
      </section>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        <TabBtn icon={Hammer} label="공정" count={phases.length} active={tab === "phases"} onClick={() => setTab("phases")} />
        <TabBtn icon={Receipt} label="계약" count={contracts.length} active={tab === "contract"} onClick={() => setTab("contract")} />
        <TabBtn icon={Calendar} label="일정" active={tab === "schedule"} onClick={() => setTab("schedule")} />
      </div>

      {/* 탭 본문 */}
      {tab === "phases" && (
        <section className="space-y-3">
          {/* 컨트롤 바 — 주말 토글 + 자동 배분 버튼. 인쇄 시 숨김. */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-wrap items-center gap-3 justify-between no-print">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={weekendWork}
                onClick={toggleWeekend}
                className="inline-flex items-center gap-2 text-sm"
              >
                <span
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    weekendWork ? "bg-[var(--green)]" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white transform transition-transform ${
                      weekendWork ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className={`font-medium ${weekendWork ? "text-[var(--green)]" : ""}`}>
                  주말공사 {weekendWork ? "포함" : "미포함"}
                </span>
              </button>
              <span className="text-[10px] text-[var(--muted)]">
                토·일 {weekendWork ? "작업일에 포함" : "제외"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {autoError && (
                <span className="text-[11px] text-[var(--orange)]">{autoError}</span>
              )}
              <button
                type="button"
                onClick={() => autoSchedule()}
                disabled={autoBusy || phases.length === 0}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-xs font-bold disabled:opacity-50"
                title="공정 표준 소요일에 따라 일정을 자동 배분"
              >
                {autoBusy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                공기 자동 배분
              </button>
            </div>
          </div>

          {phases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center space-y-3">
              <Hammer size={28} className="mx-auto text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">등록된 공정이 없습니다</p>
              <button
                type="button"
                onClick={() => openCreate()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-xs font-bold"
              >
                <Plus size={14} />
                첫 공정 추가
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border)] text-[10px] text-[var(--muted)] hidden sm:grid grid-cols-[28px_minmax(120px,1fr)_130px_130px_60px_72px_60px_94px] gap-2 items-center">
                <span></span>
                <span className="font-semibold uppercase">공종</span>
                <span className="font-semibold uppercase">시작일</span>
                <span className="font-semibold uppercase">종료일</span>
                <span className="font-semibold uppercase text-center">진행률</span>
                <span className="font-semibold uppercase text-center">상태</span>
                <span className="font-semibold uppercase text-center no-print">순서</span>
                <span className="font-semibold uppercase text-center no-print">작업</span>
              </div>
              <ul>
                {phases.map((p, idx) => (
                  <li
                    key={p.id}
                    draggable
                    onDragStart={onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={onDrop(idx)}
                    onDragEnd={() => setDragIdx(null)}
                    className={`grid grid-cols-[28px_1fr_auto] sm:grid-cols-[28px_minmax(120px,1fr)_130px_130px_60px_72px_60px_94px] gap-2 items-center px-3 py-2.5 border-b border-[var(--border)]/60 last:border-0 ${
                      dragIdx === idx ? "opacity-40 bg-[var(--green)]/5" : ""
                    } hover:bg-white/[0.02]`}
                  >
                    <span
                      className="cursor-grab active:cursor-grabbing text-[var(--muted)] flex items-center justify-center no-print"
                      title="드래그해서 순서 변경"
                    >
                      <GripVertical size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.category}
                        {p.taskName && (
                          <span className="text-[var(--muted)] font-normal ml-1">
                            · {p.taskName}
                          </span>
                        )}
                      </p>
                      {/* 모바일에서는 날짜·진행률·상태를 두 번째 줄로 */}
                      <p className="sm:hidden text-[10px] text-[var(--muted)] mt-1">
                        {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)} · {p.progress}% · {p.status}
                      </p>
                    </div>
                    <input
                      type="date"
                      value={p.plannedStart || ""}
                      onChange={(e) => updatePhase(p.id, { plannedStart: e.target.value || null })}
                      className="hidden sm:block px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs focus:border-[var(--green)] outline-none [color-scheme:dark]"
                    />
                    <input
                      type="date"
                      value={p.plannedEnd || ""}
                      onChange={(e) => updatePhase(p.id, { plannedEnd: e.target.value || null })}
                      className="hidden sm:block px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs focus:border-[var(--green)] outline-none [color-scheme:dark]"
                    />
                    <div className="hidden sm:flex items-center justify-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-[var(--background)] overflow-hidden">
                        <div className="h-full bg-[var(--green)]" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--muted)] w-7 text-right">{p.progress}%</span>
                    </div>
                    <select
                      value={p.status}
                      onChange={(e) => updatePhase(p.id, { status: e.target.value })}
                      className="hidden sm:block px-1.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[10px] focus:border-[var(--green)] outline-none"
                    >
                      {["예정", "진행중", "완료", "보류"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="hidden sm:flex items-center justify-center gap-0.5 no-print">
                      <button
                        type="button"
                        onClick={() => movePhase(idx, -1)}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="위로"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhase(idx, 1)}
                        disabled={idx === phases.length - 1}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="아래로"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    {/* 작업 — 추가 / 수정 / 삭제 */}
                    <div className="flex items-center justify-end sm:justify-center gap-0.5 no-print">
                      <button
                        type="button"
                        onClick={() => openCreate(idx)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--green)]/15 text-[var(--green)]"
                        title="이 줄 아래에 추가"
                        aria-label="추가"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--foreground)]"
                        title="공종·메모 수정"
                        aria-label="수정"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePhase(p)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--red)]/15 text-[var(--muted)] hover:text-[var(--red)]"
                        title="공정 삭제"
                        aria-label="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {tab === "contract" && (
        <section className="space-y-3">
          {contracts.length === 0 ? (
            <EmptyTab icon={Receipt} text="등록된 계약이 없습니다" />
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <SummaryCard label="계약금액" value={`${fmtKrw(contracts[0].contractAmount)}원`} highlight />
                <SummaryCard label="계약일" value={fmtDate(contracts[0].contractDate)} />
                <SummaryCard label="분할 합계" value={`${fmtKrw(splitTotal)}원`} sub={splitTotal === contracts[0].contractAmount ? "일치 ✓" : "불일치"} />
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <ListChecks size={14} className="text-[var(--muted)]" />
                  <p className="text-xs font-semibold text-[var(--muted)]">대금 분할 ({payments.length}건)</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-[10px] text-[var(--muted)] uppercase">
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2.5 font-semibold">항목</th>
                      <th className="text-right px-4 py-2.5 font-semibold">금액</th>
                      <th className="text-center px-4 py-2.5 font-semibold">비율</th>
                      <th className="text-center px-4 py-2.5 font-semibold">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const ratio = contracts[0].contractAmount > 0
                        ? Math.round((p.amount / contracts[0].contractAmount) * 100)
                        : 0;
                      return (
                        <tr key={p.id} className="border-b border-[var(--border)]/60 last:border-0">
                          <td className="px-4 py-3 font-medium">{p.type}</td>
                          <td className="px-4 py-3 text-right font-mono">{fmtKrw(p.amount)}</td>
                          <td className="px-4 py-3 text-center text-xs text-[var(--muted)]">{ratio}%</td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={p.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "schedule" && (
        <section className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <SummaryCard label="착수일" value={fmtDate(site.startDate)} highlight />
            <SummaryCard label="준공일" value={fmtDate(site.endDate)} />
            <SummaryCard
              label="총 공사기간"
              value={totalDays !== null ? `${totalDays}일` : "—"}
              sub={
                totalDays !== null && totalDays > 0
                  ? `${Math.round(totalDays / 7 * 10) / 10}주`
                  : undefined
              }
            />
          </div>

          {/* 공정/작업별 일정 — site_schedules 가 있으면 우선, 없으면 phases 로 fallback */}
          {schedules.length > 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold text-[var(--muted)] mb-3">
                공정·작업 일정 ({schedules.length}개)
              </p>
              <div className="space-y-2">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border)]/60 last:border-0"
                  >
                    <span className="min-w-[80px] text-xs font-medium">{s.trade}</span>
                    <div className="flex-1 min-w-0">
                      {s.taskName && (
                        <p className="text-xs text-[var(--foreground)] truncate">
                          {s.taskName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-0.5">
                        <Calendar size={11} />
                        {fmtDate(s.startDate)} ~ {fmtDate(s.endDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : phases.length > 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold text-[var(--muted)] mb-3">
                공정별 일정 ({phases.length}개)
              </p>
              <div className="space-y-2">
                {phases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border)]/60 last:border-0"
                  >
                    <span className="min-w-[80px] text-xs font-medium">{p.category}</span>
                    <div className="flex-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Calendar size={11} />
                      {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyTab icon={Calendar} text="공정 일정이 없습니다" />
          )}
        </section>
      )}

      {/* 공정 추가/수정 모달 */}
      <Modal
        open={phaseForm !== null}
        onClose={() => setPhaseForm(null)}
        title={phaseForm?.mode === "edit" ? "공정 수정" : "공정 추가"}
        maxWidth="max-w-md"
      >
        {phaseForm && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                공종 *
              </label>
              <select
                value={phaseForm.category}
                onChange={(e) => setPhaseForm({ ...phaseForm, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
              >
                <option value="">선택...</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                세부 작업명
              </label>
              <KoreanInput
                value={phaseForm.taskName}
                onChange={(v) => setPhaseForm({ ...phaseForm, taskName: v })}
                placeholder=""
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                  시작일
                </label>
                <input
                  type="date"
                  value={phaseForm.plannedStart}
                  onChange={(e) => setPhaseForm({ ...phaseForm, plannedStart: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                  종료일
                </label>
                <input
                  type="date"
                  value={phaseForm.plannedEnd}
                  onChange={(e) => setPhaseForm({ ...phaseForm, plannedEnd: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                  진행률 (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={phaseForm.progress}
                  onChange={(e) => setPhaseForm({
                    ...phaseForm,
                    progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })}
                  disabled={phaseForm.mode === "create"}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                  상태
                </label>
                <select
                  value={phaseForm.status}
                  onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
                >
                  {["예정", "진행중", "완료", "보류"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                메모
              </label>
              <KoreanTextarea
                value={phaseForm.memo}
                onChange={(v) => setPhaseForm({ ...phaseForm, memo: v })}
                rows={2}
                placeholder=""
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
              />
            </div>

            {phaseFormError && (
              <p className="text-sm text-[var(--red)]">{phaseFormError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhaseForm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitPhaseForm}
                disabled={phaseFormBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-bold disabled:opacity-60"
              >
                {phaseFormBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {phaseForm.mode === "edit" ? "저장" : "추가"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TabBtn({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
        active
          ? "border-[var(--green)] text-[var(--foreground)] font-bold"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      <Icon size={14} />
      {label}
      {typeof count === "number" && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-[var(--green)]/15 text-[var(--green)]" : "bg-white/[0.05]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-[var(--muted)]" />
      </div>
      <div className="min-w-0 text-sm">
        <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
        <p className="mt-0.5 truncate">{children}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        highlight
          ? "border-[var(--green)]/40 bg-[var(--green)]/5"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
      <p className={`mt-1 text-base font-bold ${highlight ? "text-[var(--green)]" : ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    예정: "bg-white/[0.06] text-[var(--muted)]",
    대기: "bg-white/[0.06] text-[var(--muted)]",
    진행중: "bg-[var(--green)]/15 text-[var(--green)]",
    완료: "bg-white/[0.06] text-[var(--muted)]",
    보류: "bg-[var(--orange)]/15 text-[var(--orange)]",
    미수: "bg-[var(--red)]/15 text-[var(--red)]",
    완납: "bg-[var(--green)]/15 text-[var(--green)]",
  };
  const cls = map[status] || "bg-white/[0.06] text-[var(--muted)]";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function EmptyTab({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
      <Icon size={28} className="mx-auto text-[var(--muted)] mb-2" />
      <p className="text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
