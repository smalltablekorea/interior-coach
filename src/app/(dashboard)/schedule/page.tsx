"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Building2, Hammer, Package,
  LayoutGrid, TableProperties, Check, Plus, Trash2,
} from "lucide-react";
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
}

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
  delivery: "입고",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sites, setSites] = useState<SiteEvent[]>([]);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({ siteId: "", category: "", plannedStart: "", plannedEnd: "", status: "예정", progress: 0, memo: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = (month: string) => {
    setLoading(true);
    fetch(`/api/schedule?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setSites(data.sites || []);
        setPhases(data.phases || []);
        setOrders(data.orders || []);
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
      if (s.startDate) list.push({ id: `site-s-${s.id}`, date: s.startDate, type: "site-start", title: s.name, sub: s.customerName || "", status: s.status });
      if (s.endDate) list.push({ id: `site-e-${s.id}`, date: s.endDate, type: "site-end", title: s.name, sub: s.customerName || "", status: s.status });
    });
    phases.forEach((p) => {
      const start = p.actualStart || p.plannedStart;
      if (start) list.push({ id: `phase-${p.id}`, date: start, type: "phase", title: p.category, sub: p.siteName || "", status: p.status });
    });
    orders.forEach((o) => {
      if (o.orderedDate) list.push({ id: `ord-${o.id}`, date: o.orderedDate, type: "order", title: o.materialName, sub: o.siteName || "현장 미지정", status: o.status });
      if (o.deliveryDate) list.push({ id: `del-${o.id}`, date: o.deliveryDate, type: "delivery", title: o.materialName, sub: o.siteName || "현장 미지정", status: o.status });
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

  const calendarDays = useMemo(() => {
    const firstDay = new Date(yr, mo - 1, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [yr, mo, daysInMonth]);

  /* ===== TABLE VIEW DATA ===== */
  const monthDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
      const d = new Date(yr, mo - 1, day);
      return { day, dateStr, dayOfWeek: d.getDay() };
    });
  }, [currentMonth, daysInMonth, yr, mo]);

  // Build table data: for each site+date, list of work items
  // Phases span their full date range (not just start date)
  const siteTableData = useMemo(() => {
    const map = new Map<string, TableItem[]>();

    const addItem = (siteId: string, dateStr: string, item: TableItem) => {
      const key = `${siteId}|${dateStr}`;
      if (!map.has(key)) map.set(key, []);
      const arr = map.get(key)!;
      if (item.phaseId ? !arr.some((x) => x.phaseId === item.phaseId) : !arr.some((x) => x.text === item.text)) arr.push(item);
    };

    const monthStart = new Date(yr, mo - 1, 1);
    const monthEnd = new Date(yr, mo, 0);

    // Phases: show on EACH day within the date range (clipped to month)
    phases.forEach((p) => {
      const start = p.actualStart || p.plannedStart;
      const end = p.actualEnd || p.plannedEnd;
      if (!start || !p.siteId) return;

      const startD = new Date(start + "T00:00:00");
      const endD = end ? new Date(end + "T00:00:00") : startD;
      const from = startD < monthStart ? monthStart : startD;
      const to = endD > monthEnd ? monthEnd : endD;

      const cursor = new Date(from);
      while (cursor <= to) {
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
  }, [phases, orders, yr, mo]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={24} className="text-[var(--green)]" />
          <h1 className="text-xl font-bold">일정 관리</h1>
        </div>
        <div className="flex items-center gap-2">
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
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <button onClick={goToday} className="px-2.5 py-1 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] hover:bg-white/[0.04] transition-colors">
            오늘
          </button>
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl animate-shimmer" />
      ) : view === "calendar" ? (
        <>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[type].dot}`} />
                <span className="text-xs text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`px-2 py-2.5 text-center text-xs font-medium ${i === 0 ? "text-[var(--red)]" : i === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dateStr = day ? `${currentMonth}-${String(day).padStart(2, "0")}` : "";
                const dayEvents = day ? eventsByDate.get(dateStr) || [] : [];
                const isToday = dateStr === today;
                const dayOfWeek = idx % 7;

                return (
                  <div key={idx} className={`min-h-[90px] border-b border-r border-[var(--border)] p-1.5 ${!day ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"} transition-colors`}>
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--green)] text-black" : dayOfWeek === 0 ? "text-[var(--red)]" : dayOfWeek === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const colors = TYPE_COLORS[ev.type];
                            const phaseId = ev.type === "phase" ? ev.id.replace("phase-", "") : null;
                            return (
                              <div
                                key={ev.id}
                                onClick={() => phaseId && openEditPhase(phaseId)}
                                className={`px-1.5 py-0.5 rounded text-[10px] truncate ${colors.bg} ${colors.text} ${phaseId ? "cursor-pointer hover:ring-1 hover:ring-current" : ""}`}
                                title={`${TYPE_LABELS[ev.type]}: ${ev.title} (${ev.sub})`}
                              >
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
                  {monthDays.map(({ day, dateStr, dayOfWeek }) => {
                    const isToday = dateStr === today;
                    const isSun = dayOfWeek === 0;
                    const isSat = dayOfWeek === 6;
                    const isWeekend = isSun || isSat;

                    // Check if any site has items on this day
                    const hasAnyItem = sites.some((s) => {
                      const items = siteTableData.get(`${s.id}|${dateStr}`);
                      return items && items.length > 0;
                    });

                    return (
                      <tr
                        key={dateStr}
                        className={`border-b border-[var(--border)] last:border-b-0 transition-colors ${
                          isToday ? "bg-[var(--green)]/[0.04]" :
                          isWeekend && !hasAnyItem ? "bg-white/[0.01]" :
                          "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Date cell (sticky left) */}
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

                        {/* Site columns */}
                        {sites.map((site) => {
                          const items = siteTableData.get(`${site.id}|${dateStr}`) || [];

                          return (
                            <td key={site.id} className="border-r last:border-r-0 border-[var(--border)] px-2 py-1.5 align-top">
                              {items.length > 0 && (
                                <div className="space-y-0.5">
                                  {items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-1.5 group/item">
                                      <button
                                        type="button"
                                        onClick={() => item.phaseId && handleTogglePhase(item.phaseId, item.done)}
                                        className={`mt-[2px] w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                          item.done ? "bg-[var(--green)]/20 border-[var(--green)]/50" : "border-[var(--border)] bg-transparent hover:border-[var(--green)]/30"
                                        } ${item.phaseId ? "cursor-pointer" : "cursor-default"}`}
                                      >
                                        {item.done && <Check size={8} className="text-[var(--green)]" />}
                                      </button>
                                      <span
                                        onClick={() => item.phaseId && openEditPhase(item.phaseId)}
                                        className={`text-[11px] leading-snug flex-1 ${item.phaseId ? "cursor-pointer hover:underline" : ""} ${
                                          item.done ? "text-[var(--muted)] line-through" :
                                          item.kind === "order" ? "text-purple-400" :
                                          item.kind === "delivery" ? "text-amber-400" :
                                          "text-[var(--foreground)]"
                                        }`}
                                      >
                                        {item.text}
                                      </span>
                                      {item.phaseId && (
                                        <button
                                          onClick={() => handleDeletePhase(item.phaseId!)}
                                          className="opacity-0 group-hover/item:opacity-100 mt-[1px] w-3.5 h-3.5 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--red)] transition-all shrink-0"
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors"
            >
              <option value="">현장 선택</option>
              {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">공종명 *</label>
            <input
              type="text"
              value={phaseForm.category}
              onChange={(e) => setPhaseForm({ ...phaseForm, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="예: 도배, 타일, 전기"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작일</label>
              <input type="date" value={phaseForm.plannedStart} onChange={(e) => setPhaseForm({ ...phaseForm, plannedStart: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료일</label>
              <input type="date" value={phaseForm.plannedEnd} onChange={(e) => setPhaseForm({ ...phaseForm, plannedEnd: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
              <select value={phaseForm.status} onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors">
                <option value="예정">예정</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">진행률 (%)</label>
              <input type="number" min={0} max={100} value={phaseForm.progress} onChange={(e) => setPhaseForm({ ...phaseForm, progress: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea value={phaseForm.memo} onChange={(e) => setPhaseForm({ ...phaseForm, memo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-20" placeholder="참고사항" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowPhaseModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors">취소</button>
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
