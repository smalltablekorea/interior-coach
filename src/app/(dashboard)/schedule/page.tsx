"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Building2, Hammer, Package, List, LayoutGrid } from "lucide-react";
import { fmtDate } from "@/lib/utils";

interface SiteEvent {
  id: string;
  name: string;
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

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sites, setSites] = useState<SiteEvent[]>([]);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");

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

  // Build calendar events
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

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    return map;
  }, [events]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(y, m, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const [y, m] = currentMonth.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={24} className="text-[var(--green)]" />
          <h1 className="text-xl font-bold">일정 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("calendar")} className={`p-2 rounded-lg transition-colors ${view === "calendar" ? "bg-[var(--green)]/15 text-[var(--green)]" : "text-[var(--muted)] hover:bg-white/[0.04]"}`} title="캘린더 보기">
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-[var(--green)]/15 text-[var(--green)]" : "text-[var(--muted)] hover:bg-white/[0.04]"}`} title="목록 보기">
            <List size={18} />
          </button>
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[type].dot}`} />
            <span className="text-xs text-[var(--muted)]">{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl animate-shimmer" />
      ) : view === "calendar" ? (
        /* Calendar View */
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={`px-2 py-2.5 text-center text-xs font-medium ${i === 0 ? "text-[var(--red)]" : i === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateStr = day ? `${currentMonth}-${String(day).padStart(2, "0")}` : "";
              const dayEvents = day ? eventsByDate.get(dateStr) || [] : [];
              const isToday = dateStr === today;
              const dayOfWeek = idx % 7;

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border-b border-r border-[var(--border)] p-1.5 ${!day ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"} transition-colors`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--green)] text-black" : dayOfWeek === 0 ? "text-[var(--red)]" : dayOfWeek === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const colors = TYPE_COLORS[ev.type];
                          return (
                            <div key={ev.id} className={`px-1.5 py-0.5 rounded text-[10px] truncate ${colors.bg} ${colors.text}`} title={`${TYPE_LABELS[ev.type]}: ${ev.title} (${ev.sub})`}>
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
      ) : (
        /* List View */
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
              <CalendarDays size={40} className="mb-3 opacity-40" />
              <p className="text-sm">이번 달 일정이 없습니다</p>
            </div>
          ) : (
            [...eventsByDate.entries()].map(([date, dayEvents]) => {
              const d = new Date(date + "T00:00:00");
              const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
              const isToday = date === today;

              return (
                <div key={date} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] ${isToday ? "bg-[var(--green)]/5" : "bg-white/[0.02]"}`}>
                    <span className={`text-sm font-semibold ${isToday ? "text-[var(--green)]" : ""}`}>
                      {fmtDate(date)}
                    </span>
                    <span className={`text-xs ${d.getDay() === 0 ? "text-[var(--red)]" : d.getDay() === 6 ? "text-[var(--blue)]" : "text-[var(--muted)]"}`}>
                      ({weekday})
                    </span>
                    {isToday && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--green)]/15 text-[var(--green)] font-medium">오늘</span>}
                    <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-[var(--muted)]">{dayEvents.length}건</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {dayEvents.map((ev) => {
                      const colors = TYPE_COLORS[ev.type];
                      const Icon = ev.type.startsWith("site") ? Building2 : ev.type === "phase" ? Hammer : Package;
                      return (
                        <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                          <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                            <Icon size={14} className={colors.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{ev.title}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                                {TYPE_LABELS[ev.type]}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted)] truncate">{ev.sub}</p>
                          </div>
                          <span className="text-xs text-[var(--muted)] whitespace-nowrap">{ev.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && events.length > 0 && (
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
    </div>
  );
}
