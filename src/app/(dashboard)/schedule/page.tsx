"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Building2, Hammer, Package,
  LayoutGrid, TableProperties, Check, Plus, Trash2, Sparkles, GripVertical,
} from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

interface SiteEvent {
  id: string;
  name: string;
  address: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  customerName: string | null;
}

interface PhaseEvent {
  id: string;
  category: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progress: number;
  status: string;
  siteId: string;
  siteName: string | null;
  memo: string | null;
}

interface OrderEvent {
  id: string;
  materialName: string;
  quantity: number;
  orderedDate: string | null;
  deliveryDate: string | null;
  status: string;
  siteId: string | null;
  siteName: string | null;
}

interface CalendarEvent {
  id: string;
  date: string;
  type: "site-start" | "site-end" | "phase" | "order" | "delivery";
  title: string;
  sub: string;
  status: string;
  siteId?: string;
}

const SITE_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", dot: "bg-cyan-400" },
  { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  { bg: "bg-indigo-500/15", text: "text-indigo-400", dot: "bg-indigo-400" },
];

/* ===== Table view item ===== */
interface TableItem {
  text: string;
  done: boolean;
  kind: "phase" | "order" | "delivery";
  phaseId?: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "site-start": { bg: "bg-[var(--blue)]/10", text: "text-[var(--blue)]", dot: "bg-[var(--blue)]" },
  "site-end": { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]", dot: "bg-[var(--orange)]" },
  phase: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]", dot: "bg-[var(--green)]" },
  order: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  delivery: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
};

const TYPE_LABELS: Record<string, string> = {
  "site-start": "착공",
  "site-end": "준공",
  phase: "공정",
  order: "발주",
  delivery: "입주",
};

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "철거": { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-400" },
  "설비": { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400" },
  "배관": { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400" },
  "전기": { bg: "bg-yellow-500/15", border: "border-yellow-500/40", text: "text-yellow-400" },
  "조명": { bg: "bg-yellow-500/15", border: "border-yellow-500/40", text: "text-yellow-400" },
  "방수": { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400" },
  "타일": { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400" },
  "목공": { bg: "bg-amber-600/15", border: "border-amber-600/40", text: "text-amber-500" },
  "도배": { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400" },
  "바닥": { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-400" },
  "마루": { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-400" },
  "도장": { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400" },
  "페인트": { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400" },
  "싱크대": { bg: "bg-indigo-500/15", border: "border-indigo-500/40", text: "text-indigo-400" },
  "주방": { bg: "bg-indigo-500/15", border: "border-indigo-500/40", text: "text-indigo-400" },
  "가구": { bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-400" },
  "붙박이장": { bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-400" },
  "창호": { bg: "bg-sky-500/15", border: "border-sky-500/40", text: "text-sky-400" },
  "샷시": { bg: "bg-sky-500/15", border: "border-sky-500/40", text: "text-sky-400" },
  "욕실": { bg: "bg-lime-500/15", border: "border-lime-500/40", text: "text-lime-400" },
  "준비": { bg: "bg-slate-500/15", border: "border-slate-500/40", text: "text-slate-400" },
  "입주청소": { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400" },
  "청소": { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400" },
};

const FALLBACK_PHASE_COLORS = [
  { bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/40", text: "text-fuchsia-400" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400" },
  { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400" },
  { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400" },
  { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-400" },
  { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400" },
];

function getPhaseColor(category: string) {
  // Exact match
  if (PHASE_COLORS[category]) return PHASE_COLORS[category];
  // Partial match
  for (const [key, color] of Object.entries(PHASE_COLORS)) {
    if (category.includes(key) || key.includes(category)) return color;
  }
  // Deterministic fallback based on string hash
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = ((hash << 5) - hash + category.charCodeAt(i)) | 0;
  return FALLBACK_PHASE_COLORS[Math.abs(hash) % FALLBACK_PHASE_COLORS.length];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sites, setSites] = useState<SiteEvent[]>([]);
  const [allSites, setAllSites] = useState<{ id: string; name: string; status: string }[]>([]);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({ siteId: "", category: "", plannedStart: "", plannedEnd: "", status: "예정", progress: 0, memo: "" });
  const [saving, setSaving] = useState(false);

  // ─── Excel-like inline editing ───
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditVal, setInlineEditVal] = useState("");
  const [draggingPhase, setDraggingPhase] = useState<{ phaseId: string; siteId: string; origDate: string } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const handleInlineEdit = async (phaseId: string) => {
    if (!inlineEditVal.trim()) { setInlineEditId(null); return; }
    setInlineEditId(null);
    // optimistic update
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, category: inlineEditVal.trim() } : p));
    await fetch("/api/schedule", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: phaseId, category: inlineEditVal.trim() }) });
  };

  const handleQuickAdd = async (siteId: string, dateStr: string) => {
    const category = prompt("공정명을 입력하세요");
    if (!category?.trim()) return;
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, category: category.trim(), plannedStart: dateStr, plannedEnd: dateStr, status: "진행중", progress: 0 }),
    });
    fetchData(currentMonth);
  };

  const handleDrop = async (phaseId: string, newDate: string) => {
    setDraggingPhase(null);
    setDragOverCell(null);
    // 해당 phase 찾기
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    const oldStart = phase.actualStart || phase.plannedStart;
    const oldEnd = phase.actualEnd || phase.plannedEnd;
    // 날짜 차이 계산
    if (!oldStart) return;
    const diffMs = new Date(newDate).getTime() - new Date(oldStart).getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const newStart = newDate;
    let newEnd = newDate;
    if (oldEnd) {
      const endD = new Date(oldEnd);
      endD.setDate(endD.getDate() + diffDays);
      newEnd = endD.toISOString().slice(0, 10);
    }
    // optimistic
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, plannedStart: newStart, plannedEnd: newEnd, actualStart: null, actualEnd: null } : p));
    await fetch("/api/schedule", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: phaseId, plannedStart: newStart, plannedEnd: newEnd }) });
  };

  const fetchData = (centerMonth: string) => {
    setLoading(true);
    const [cy, cm] = centerMonth.split("-").map(Number);
    const months: string[] = [];
    for (let off = -3; off <= 9; off++) {
      const d = new Date(cy, cm - 1 + off, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    Promise.all(months.map(m => fetch(`/api/schedule?month=${m}`).then(r => r.json()).catch(() => null)))
      .then(results => {
        const sMap = new Map<string, SiteEvent>();
        const pMap = new Map<string, PhaseEvent>();
        const oMap = new Map<string, OrderEvent>();
        let asList: { id: string; name: string; status: string }[] = [];
        for (const d of results) {
          if (!d) continue;
          (d.sites || []).forEach((s: SiteEvent) => sMap.set(s.id, s));
          (d.phases || []).forEach((p: PhaseEvent) => pMap.set(p.id, p));
          (d.orders || []).forEach((o: OrderEvent) => oMap.set(o.id, o));
          if (!asList.length) asList = d.allSites || d.sites || [];
        }
        setSites(Array.from(sMap.values()));
        setAllSites(asList.length ? asList : Array.from(sMap.values()));
        setPhases(Array.from(pMap.values()));
        setOrders(Array.from(oMap.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(currentMonth); }, [currentMonth]);

  const prevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const goToday = () => {
    const now = new Date();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  const [yr, mo] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const monthLabel = `${yr}년 ${mo}월`;
  const today = new Date().toISOString().slice(0, 10);

  /* ===== Phase CRUD ===== */
  const openAddPhase = (siteId?: string) => {
    setEditingPhaseId(null);
    setPhaseForm({ siteId: siteId || (sites.length > 0 ? sites[0].id : ""), category: "", plannedStart: "", plannedEnd: "", status: "예정", progress: 0, memo: "" });
    setShowPhaseModal(true);
  };
  const openEditPhase = (phaseId: string) => {
    const p = phases.find((x) => x.id === phaseId);
    if (!p) return;
    setEditingPhaseId(phaseId);
    setPhaseForm({ siteId: p.siteId, category: p.category, plannedStart: p.plannedStart || "", plannedEnd: p.plannedEnd || "", status: p.status, progress: p.progress, memo: p.memo || "" });
    setShowPhaseModal(true);
  };
  const handleSavePhase = async () => {
    if (!phaseForm.siteId || !phaseForm.category) return;
    setSaving(true);
    try {
      const method = editingPhaseId ? "PUT" : "POST";
      const body = editingPhaseId ? { id: editingPhaseId, ...phaseForm } : phaseForm;
      await fetch("/api/schedule", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setShowPhaseModal(false);
      fetchData(currentMonth);
    } finally { setSaving(false); }
  };
  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("이 공정을 삭제하시겠습니까?")) return;
    await fetch(`/api/schedule?id=${phaseId}`, { method: "DELETE" });
    fetchData(currentMonth);
  };
  const handleTogglePhase = async (phaseId: string, currentlyDone: boolean) => {
    const newStatus = currentlyDone ? "진행중" : "완료";
    const newProgress = currentlyDone ? 50 : 100;
    setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus, progress: newProgress } : p)));
    await fetch("/api/schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: phaseId, status: newStatus, progress: newProgress }) });
  };

  /* ===== CALENDAR VIEW DATA ===== */
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    sites.forEach((s) => {
      if (s.startDate) list.push({ id: `site-s-${s.id}`, date: s.startDate, type: "site-start", title: s.name, sub: s.customerName || "", status: s.status, siteId: s.id });
      if (s.endDate) list.push({ id: `site-e-${s.id}`, date: s.endDate, type: "site-end", title: s.name, sub: s.customerName || "", status: s.status, siteId: s.id });
    });
    phases.forEach((p) => {
      const start = p.actualStart || p.plannedStart;
      if (start) list.push({ id: `phase-${p.id}`, date: start, type: "phase", title: p.category, sub: p.siteName || "", status: p.status, siteId: p.siteId });
    });
    orders.forEach((o) => {
      if (o.orderedDate) list.push({ id: `ord-${o.id}`, date: o.orderedDate, type: "order", title: o.materialName, sub: o.siteName || "현장 미지정", status: o.status, siteId: o.siteId || undefined });
      if (o.deliveryDate) list.push({ id: `del-${o.id}`, date: o.deliveryDate, type: "delivery", title: o.materialName, sub: o.siteName || "현장 미지정", status: o.status, siteId: o.siteId || undefined });
    });
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [sites, phases, orders]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    return map;
  }, [events]);

  // 여러 달 캘린더 데이터 (앞뒤 3개월씩 총 7개월)
  const multiMonthCalendar = useMemo(() => {
    const result: { label: string; yr: number; mo: number; days: (number | null)[] }[] = [];
    for (let off = -3; off <= 9; off++) {
      const d = new Date(yr, mo - 1 + off, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const dim = new Date(y, m, 0).getDate();
      const firstDay = new Date(y, m - 1, 1).getDay();
      const days: (number | null)[] = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= dim; i++) days.push(i);
      while (days.length % 7 !== 0) days.push(null);
      result.push({ label: `${y}년 ${m}월`, yr: y, mo: m, days });
    }
    return result;
  }, [yr, mo]);

  // Site color mapping for calendar
  const siteColorMap = useMemo(() => {
    const map = new Map<string, typeof SITE_COLORS[0]>();
    sites.forEach((s, i) => { map.set(s.id, SITE_COLORS[i % SITE_COLORS.length]); });
    return map;
  }, [sites]);

  /* ===== TABLE VIEW DATA — 캘린더용 (현재 달만) ===== */
  const monthDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
      const d = new Date(yr, mo - 1, day);
      return { day, dateStr, dayOfWeek: d.getDay() };
    });
  }, [currentMonth, daysInMonth, yr, mo]);

  /* ===== TABLE VIEW DATA — 현장별 연속 스크롤 (전체 기간) ===== */
  const allDays = useMemo(() => {
    // 전체 공정의 최소/최대 날짜 계산
    let minDate = new Date(yr, mo - 1, 1); // 기본: 현재 달 시작
    let maxDate = new Date(yr, mo, 0); // 기본: 현재 달 끝

    // 현장 startDate/endDate
    sites.forEach(s => {
      if (s.startDate) { const d = new Date(s.startDate + "T00:00:00"); if (d < minDate) minDate = d; }
      if (s.endDate) { const d = new Date(s.endDate + "T00:00:00"); if (d > maxDate) maxDate = d; }
    });
    // 공정 날짜
    phases.forEach(p => {
      const s = p.actualStart || p.plannedStart;
      const e = p.actualEnd || p.plannedEnd;
      if (s) { const d = new Date(s + "T00:00:00"); if (d < minDate) minDate = d; }
      if (e) { const d = new Date(e + "T00:00:00"); if (d > maxDate) maxDate = d; }
    });

    // 시작일 1주 전 ~ 종료일 1주 후
    const from = new Date(minDate);
    from.setDate(from.getDate() - 7);
    const to = new Date(maxDate);
    to.setDate(to.getDate() + 7);

    const days: { day: number; dateStr: string; dayOfWeek: number; monthLabel: string | null }[] = [];
    const cursor = new Date(from);
    let lastMonth = "";
    while (cursor <= to) {
      const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      const curMonth = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
      const isNewMonth = curMonth !== lastMonth;
      if (isNewMonth) lastMonth = curMonth;
      days.push({
        day: cursor.getDate(),
        dateStr,
        dayOfWeek: cursor.getDay(),
        monthLabel: isNewMonth ? curMonth : null,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [sites, phases, yr, mo]);

  // Build table data: for each site+date, list of work items (전체 기간)
  const siteTableData = useMemo(() => {
    const map = new Map<string, TableItem[]>();

    const addItem = (siteId: string, dateStr: string, item: TableItem) => {
      const key = `${siteId}|${dateStr}`;
      if (!map.has(key)) map.set(key, []);
      const arr = map.get(key)!;
      if (item.phaseId ? !arr.some((x) => x.phaseId === item.phaseId) : !arr.some((x) => x.text === item.text)) arr.push(item);
    };

    // Phases: 클리핑 없이 전체 기간 표시
    phases.forEach((p) => {
      const start = p.actualStart || p.plannedStart;
      const end = p.actualEnd || p.plannedEnd;
      if (!start || !p.siteId) return;

      const startD = new Date(start + "T00:00:00");
      const endD = end ? new Date(end + "T00:00:00") : startD;

      const cursor = new Date(startD);
      while (cursor <= endD) {
        const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        addItem(p.siteId, ds, { text: p.category, done: p.status === "완료", kind: "phase", phaseId: p.id });
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    // Orders
    orders.forEach((o) => {
      if (o.orderedDate && o.siteId) {
        addItem(o.siteId, o.orderedDate, { text: `발주: ${o.materialName}`, done: o.status === "입고완료", kind: "order" });
      }
      if (o.deliveryDate && o.siteId) {
        addItem(o.siteId, o.deliveryDate, { text: `입고: ${o.materialName}`, done: o.status === "입고완료", kind: "delivery" });
      }
    });

    return map;
  }, [phases, orders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={24} className="text-[var(--green)]" />
          <h1 className="text-xl font-bold">일정 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/schedule/generator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium hover:bg-[var(--green)]/20 transition-colors"
          >
            <Sparkles size={14} />
            <span>AI 공정매니저</span>
          </Link>
          <button
            onClick={() => openAddPhase()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--green)] text-black text-xs font-medium hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>공정 추가</span>
          </button>
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-[var(--border)]">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "calendar" ? "bg-[var(--green)]/15 text-[var(--green)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              <LayoutGrid size={14} />
              <span>캘린더</span>
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "table" ? "bg-[var(--green)]/15 text-[var(--green)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              <TableProperties size={14} />
              <span>현장별</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <button onClick={goToday} className="px-2.5 py-1 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--border)] transition-colors">
            오늘
          </button>
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl animate-shimmer" />
      ) : view === "calendar" ? (
        <>
          {/* Legend — site colors */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            {sites.map((s) => {
              const sc = siteColorMap.get(s.id);
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${sc?.dot || "bg-[var(--muted)]"}`} />
                  <span className="text-xs text-[var(--foreground)] font-medium">{s.name}</span>
                </div>
              );
            })}
            <span className="text-[var(--border)]">|</span>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[type].dot}`} />
                <span className="text-xs text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar View — 여러 달 연속 스크롤 */}
          <div className="space-y-6">
            {multiMonthCalendar.map((month) => {
              const monthStr = `${month.yr}-${String(month.mo).padStart(2, "0")}`;
              return (
                <div key={monthStr} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  {/* 월 헤더 */}
                  <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--green)]/[0.04]">
                    <h3 className="text-sm font-bold text-[var(--green)]">{month.label}</h3>
                  </div>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 border-b border-[var(--border)]">
                    {WEEKDAYS.map((d, i) => (
                      <div key={d} className={`px-2 py-2 text-center text-xs font-medium ${i === 0 ? "text-[var(--red)]" : i === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* 날짜 그리드 */}
                  <div className="grid grid-cols-7">
                    {month.days.map((day, idx) => {
                      const dateStr = day ? `${monthStr}-${String(day).padStart(2, "0")}` : "";
                      const dayEvents = day ? eventsByDate.get(dateStr) || [] : [];
                      const isToday = dateStr === today;
                      const dayOfWeek = idx % 7;
                      return (
                        <div key={idx} className={`min-h-[80px] border-b border-r border-[var(--border)] p-1.5 ${!day ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"} transition-colors`}>
                          {day && (
                            <>
                              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--green)] text-black" : dayOfWeek === 0 ? "text-[var(--red)]" : dayOfWeek === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                                {day}
                              </div>
                              <div className="space-y-0.5">
                                {dayEvents.slice(0, 3).map((ev) => {
                                  const siteColor = ev.siteId ? siteColorMap.get(ev.siteId) : null;
                                  const colors = (ev.type === "phase" || ev.type === "site-start" || ev.type === "site-end") && siteColor ? siteColor : TYPE_COLORS[ev.type];
                                  const phaseId = ev.type === "phase" ? ev.id.replace("phase-", "") : null;
                                  return (
                                    <div key={ev.id} onClick={() => phaseId && openEditPhase(phaseId)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] truncate ${colors.bg} ${colors.text} ${phaseId ? "cursor-pointer hover:ring-1 hover:ring-current" : ""}`}
                                      title={`${ev.sub ? ev.sub + " · " : ""}${TYPE_LABELS[ev.type]}: ${ev.title}`}>
                                      {ev.title}
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-[10px] text-[var(--muted)] pl-1">+{dayEvents.length - 3}건</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Summary */}
          {events.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)] text-sm text-[var(--muted)]">
              <span>이번 달 전체 {events.length}건</span>
              <div className="flex items-center gap-3">
                {Object.entries(TYPE_LABELS).map(([type, label]) => {
                  const count = events.filter((e) => e.type === type).length;
                  if (count === 0) return null;
                  return <span key={type}>{label} {count}</span>;
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ===== TABLE VIEW (현장별) ===== */
        sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
            <Building2 size={40} className="mb-3 opacity-40" />
            <p className="text-sm">이번 달 진행 중인 현장이 없습니다</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: `${120 + sites.length * 220}px` }}>
                <thead className="sticky top-0 z-20">
                  {/* Site name row */}
                  <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                    <th className="sticky left-0 z-30 bg-[var(--card)] border-r border-[var(--border)] px-3 py-3 text-left min-w-[120px] w-[120px]">
                      <span className="text-xs font-semibold text-[var(--muted)]">날짜</span>
                    </th>
                    {sites.map((site) => (
                      <th key={site.id} className="border-r last:border-r-0 border-[var(--border)] px-3 py-3 text-left min-w-[220px]">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Building2 size={14} className="text-[var(--green)] shrink-0" />
                          <span className="text-sm font-semibold truncate">{site.name}</span>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            site.status === "시공중" ? "bg-[var(--green)]/15 text-[var(--green)]" :
                            site.status === "시공완료" ? "bg-[var(--blue)]/15 text-[var(--blue)]" :
                            "bg-white/[0.06] text-[var(--muted)]"
                          }`}>{site.status}</span>
                          <button onClick={() => openAddPhase(site.id)} className="ml-auto shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--green)] transition-colors" title="공정 추가"><Plus size={12} /></button>
                        </div>
                        {site.address && (
                          <p className="text-[10px] text-[var(--muted)] font-normal truncate leading-relaxed" title={site.address}>
                            {site.address}
                          </p>
                        )}
                        {site.customerName && (
                          <p className="text-[10px] text-[var(--muted)] font-normal truncate">
                            {site.customerName}
                          </p>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allDays.map(({ day, dateStr, dayOfWeek, monthLabel }) => {
                    const isToday = dateStr === today;
                    const isSun = dayOfWeek === 0;
                    const isSat = dayOfWeek === 6;
                    const isWeekend = isSun || isSat;
                    const hasAnyItem = sites.some((s) => (siteTableData.get(`${s.id}|${dateStr}`) || []).length > 0);

                    return (
                      <React.Fragment key={dateStr}>
                        {/* 월 구분 헤더 — 스크롤 시 상단 고정 */}
                        {monthLabel && (
                          <tr className="sticky top-[48px] z-20">
                            <td
                              colSpan={1 + sites.length}
                              className="bg-[var(--green)]/[0.08] px-3 py-2 text-sm font-bold text-[var(--green)] border-b border-[var(--green)]/20 backdrop-blur-sm"
                            >
                              {monthLabel}
                            </td>
                          </tr>
                        )}
                        {/* 날짜 행 */}
                        <tr className={`border-b border-[var(--border)] last:border-b-0 transition-colors ${
                          isToday ? "bg-[var(--green)]/[0.04]" :
                          isWeekend && !hasAnyItem ? "bg-white/[0.01]" :
                          "hover:bg-white/[0.02]"
                        }`}>
                          <td className={`sticky left-0 z-10 border-r border-[var(--border)] px-3 py-2 whitespace-nowrap ${
                            isToday ? "bg-[var(--green)]/[0.07]" :
                            isWeekend ? "bg-[#090909]" :
                            "bg-[var(--card)]"
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold tabular-nums ${
                                isToday ? "text-[var(--green)]" :
                                isSun ? "text-[var(--red)]" :
                                isSat ? "text-[var(--blue)]" : ""
                              }`}>
                                {day}일
                              </span>
                              <span className={`text-[10px] ${
                                isSun ? "text-[var(--red)]" :
                                isSat ? "text-[var(--blue)]" :
                                "text-[var(--muted)]"
                              }`}>
                                {WEEKDAYS[dayOfWeek]}
                              </span>
                              {isToday && (
                                <span className="px-1 py-px rounded text-[8px] bg-[var(--green)] text-black font-bold leading-tight">
                                  오늘
                                </span>
                              )}
                            </div>
                          </td>
                          {sites.map((site) => {
                            const items = siteTableData.get(`${site.id}|${dateStr}`) || [];
                            const cellKey = `${site.id}|${dateStr}`;
                            const isDragOver = dragOverCell === cellKey;
                            return (
                              <td
                                key={site.id}
                                className={`border-r last:border-r-0 border-[var(--border)] px-1.5 py-1 align-top min-h-[32px] transition-colors ${
                                  isDragOver ? "bg-[var(--green)]/10 ring-1 ring-inset ring-[var(--green)]/30" : ""
                                }`}
                                onDoubleClick={() => items.length === 0 && handleQuickAdd(site.id, dateStr)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverCell(cellKey); }}
                                onDragLeave={() => setDragOverCell(null)}
                                onDrop={(e) => { e.preventDefault(); const pid = e.dataTransfer.getData("phaseId"); if (pid) handleDrop(pid, dateStr); }}
                              >
                                {items.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {items.map((item, i) => {
                                      const phaseColor = item.kind === "phase" ? getPhaseColor(item.text) : null;
                                      const isEditing = inlineEditId === item.phaseId;
                                      return (
                                        <div
                                          key={i}
                                          draggable={!!item.phaseId}
                                          onDragStart={(e) => { if (!item.phaseId) return; e.dataTransfer.setData("phaseId", item.phaseId); setDraggingPhase({ phaseId: item.phaseId, siteId: site.id, origDate: dateStr }); }}
                                          onDragEnd={() => { setDraggingPhase(null); setDragOverCell(null); }}
                                          className={`flex items-center gap-1 group/item rounded-md px-1.5 py-0.5 border transition-colors ${
                                            item.kind === "phase" && phaseColor ? `${phaseColor.bg} ${item.done ? "border-transparent opacity-50" : phaseColor.border}` : "border-transparent"
                                          } ${item.phaseId ? "cursor-grab active:cursor-grabbing" : ""}`}
                                        >
                                          {item.phaseId && <GripVertical size={10} className="shrink-0 text-[var(--muted)] opacity-0 group-hover/item:opacity-40" />}
                                          <button type="button" onClick={(e) => { e.stopPropagation(); item.phaseId && handleTogglePhase(item.phaseId, item.done); }}
                                            className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${item.done ? "bg-[var(--green)]/20 border-[var(--green)]/50" : "border-white/20 bg-transparent hover:border-[var(--green)]/30"} ${item.phaseId ? "cursor-pointer" : "cursor-default"}`}>
                                            {item.done && <Check size={8} className="text-[var(--green)]" />}
                                          </button>
                                          {isEditing ? (
                                            <input autoFocus value={inlineEditVal} onChange={(e) => setInlineEditVal(e.target.value)}
                                              onBlur={() => handleInlineEdit(item.phaseId!)} onKeyDown={(e) => { if (e.key === "Enter") handleInlineEdit(item.phaseId!); if (e.key === "Escape") setInlineEditId(null); }}
                                              onClick={(e) => e.stopPropagation()} className="text-[11px] font-medium bg-transparent border-b border-[var(--green)] outline-none flex-1 min-w-0 text-[var(--foreground)]" />
                                          ) : (
                                            <span onClick={(e) => { e.stopPropagation(); if (item.phaseId) { setInlineEditId(item.phaseId); setInlineEditVal(item.text); } }}
                                              className={`text-[11px] leading-snug flex-1 font-medium min-w-0 truncate ${item.phaseId ? "cursor-text" : ""} ${
                                                item.done ? "text-[var(--muted)] line-through" : item.kind === "order" ? "text-purple-400" : item.kind === "delivery" ? "text-amber-400" : phaseColor ? phaseColor.text : "text-[var(--foreground)]"
                                              }`} title="클릭하여 수정">{item.text}</span>
                                          )}
                                          {item.phaseId && !isEditing && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeletePhase(item.phaseId!); }}
                                              className="opacity-0 group-hover/item:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--red)] transition-all shrink-0">
                                              <Trash2 size={9} />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[24px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => handleQuickAdd(site.id, dateStr)}>
                                    <Plus size={12} className="text-[var(--muted)]" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table summary footer */}
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-white/[0.02]">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>현장 {sites.length}개</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Hammer size={12} className="text-[var(--green)]" />
                    공정 {phases.length}건
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package size={12} className="text-purple-400" />
                    발주/입고 {orders.length}건
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Phase CRUD Modal */}
      <Modal open={showPhaseModal} onClose={() => setShowPhaseModal(false)} title={editingPhaseId ? "공정 수정" : "공정 추가"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">현장 *</label>
            <select
              value={phaseForm.siteId}
              onChange={(e) => setPhaseForm({ ...phaseForm, siteId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
            >
              <option value="">현장 선택</option>
              {allSites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">공종명 *</label>
            <input
              type="text"
              value={phaseForm.category}
              onChange={(e) => setPhaseForm({ ...phaseForm, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="예: 도배, 타일, 전기"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작일</label>
              <input type="date" value={phaseForm.plannedStart} onChange={(e) => setPhaseForm({ ...phaseForm, plannedStart: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료일</label>
              <input type="date" value={phaseForm.plannedEnd} onChange={(e) => setPhaseForm({ ...phaseForm, plannedEnd: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
              <select value={phaseForm.status} onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors">
                <option value="예정">예정</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">진행률 (%)</label>
              <input type="number" min={0} max={100} value={phaseForm.progress} onChange={(e) => setPhaseForm({ ...phaseForm, progress: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea value={phaseForm.memo} onChange={(e) => setPhaseForm({ ...phaseForm, memo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-20" placeholder="참고사항" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowPhaseModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors">취소</button>
            {editingPhaseId && (
              <button type="button" onClick={() => { setShowPhaseModal(false); handleDeletePhase(editingPhaseId); }} className="px-4 py-2.5 rounded-xl border border-[var(--red)]/30 text-sm text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">삭제</button>
            )}
            <button type="button" onClick={handleSavePhase} disabled={saving || !phaseForm.siteId || !phaseForm.category} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50">{saving ? "저장 중..." : editingPhaseId ? "수정" : "추가"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
