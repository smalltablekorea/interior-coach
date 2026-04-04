"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Hammer,
  Camera,
  ShieldAlert,
  Banknote,
  CalendarDays,
  Smartphone,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";

// ── Types ──

interface EventSetting {
  inAppEnabled: boolean;
  smsEnabled: boolean;
  smsRecipientPhone: string | null;
}

type EventType = "stage_change" | "photo_upload" | "defect_report" | "payment_due" | "schedule_change";

interface LogEntry {
  id: string;
  channel: string;
  recipient: string;
  eventType: string;
  title: string;
  message: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

const EVENT_CONFIG: { key: EventType; label: string; desc: string; icon: typeof Bell }[] = [
  { key: "stage_change", label: "공정 단계 변경", desc: "공종 상태가 변경될 때", icon: Hammer },
  { key: "photo_upload", label: "현장 사진 업로드", desc: "새 현장 사진이 등록될 때", icon: Camera },
  { key: "defect_report", label: "하자 보고", desc: "하자가 보고되거나 상태 변경 시", icon: ShieldAlert },
  { key: "payment_due", label: "수금 기한 도래", desc: "수금 기한이 임박하거나 연체 시", icon: Banknote },
  { key: "schedule_change", label: "일정 변경", desc: "공정 일정이 변경될 때", icon: CalendarDays },
];

const EVENT_LABEL: Record<string, string> = {
  stage_change: "공정 변경",
  photo_upload: "사진 업로드",
  defect_report: "하자 보고",
  payment_due: "수금 기한",
  schedule_change: "일정 변경",
  change_request: "변경 요청",
  phase_delayed: "공정 지연",
  billing_overdue: "수금 연체",
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<EventType, EventSetting> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch Settings ──
  useEffect(() => {
    fetch("/api/notification-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setSettings(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch Logs (+ 30초 폴링) ──
  const fetchLogs = useCallback(() => {
    fetch("/api/notification-logs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // ── Toggle Handler (낙관적 업데이트) ──
  const handleToggle = async (eventType: EventType, field: "inAppEnabled" | "smsEnabled") => {
    if (!settings) return;
    const prev = settings[eventType][field];

    // 즉시 반영
    setSettings((s) => s ? { ...s, [eventType]: { ...s[eventType], [field]: !prev } } : s);
    setSavingKey(`${eventType}-${field}`);
    setError(null);

    try {
      const res = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, [field]: !prev }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // 롤백
      setSettings((s) => s ? { ...s, [eventType]: { ...s[eventType], [field]: prev } } : s);
      setError("설정 저장에 실패했습니다.");
    } finally {
      setSavingKey(null);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft size={18} className="text-[var(--muted)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">알림 설정</h1>
          <p className="text-xs text-[var(--muted)]">이벤트별 알림 수신 방법을 설정합니다</p>
        </div>
      </div>

      {/* ── Error Toast ── */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--red)]/10 text-[var(--red)] text-sm flex items-center gap-2">
          <XCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">닫기</button>
        </div>
      )}

      {/* ══════════════════════════
          1. 이벤트 트리거 설정
          ══════════════════════════ */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bell size={16} style={{ color: "var(--green)" }} />
            알림 트리거
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">어떤 이벤트에 알림을 받을지 선택하세요</p>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {EVENT_CONFIG.map((evt) => {
            const setting = settings?.[evt.key];
            const inApp = setting?.inAppEnabled ?? true;
            const sms = setting?.smsEnabled ?? false;
            const isSavingInApp = savingKey === `${evt.key}-inAppEnabled`;
            const isSavingSms = savingKey === `${evt.key}-smsEnabled`;

            return (
              <div key={evt.key} className="px-5 py-4 flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: inApp ? "var(--green)" + "15" : "var(--border)" }}
                >
                  <evt.icon size={18} style={{ color: inApp ? "var(--green)" : "var(--muted)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{evt.label}</p>
                  <p className="text-xs text-[var(--muted)]">{evt.desc}</p>
                </div>

                {/* 인앱 토글 */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer" aria-label={`${evt.label} 인앱 알림`}>
                    <span className="text-[10px] text-[var(--muted)]">앱</span>
                    <button
                      onClick={() => handleToggle(evt.key, "inAppEnabled")}
                      disabled={isSavingInApp}
                      className={cn(
                        "w-10 h-5.5 rounded-full relative transition-colors",
                        inApp ? "bg-[var(--green)]" : "bg-[var(--border)]",
                      )}
                      role="switch"
                      aria-checked={inApp}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm",
                        inApp ? "translate-x-5" : "translate-x-0.5",
                      )} />
                      {isSavingInApp && (
                        <Loader2 size={10} className="absolute top-1 left-1/2 -translate-x-1/2 animate-spin text-white" />
                      )}
                    </button>
                  </label>

                  {/* SMS 토글 */}
                  <label className="flex items-center gap-1.5 cursor-pointer" aria-label={`${evt.label} SMS 알림`}>
                    <span className="text-[10px] text-[var(--muted)]">SMS</span>
                    <button
                      onClick={() => handleToggle(evt.key, "smsEnabled")}
                      disabled={isSavingSms}
                      className={cn(
                        "w-10 h-5.5 rounded-full relative transition-colors",
                        sms ? "bg-[var(--blue)]" : "bg-[var(--border)]",
                      )}
                      role="switch"
                      aria-checked={sms}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm",
                        sms ? "translate-x-5" : "translate-x-0.5",
                      )} />
                      {isSavingSms && (
                        <Loader2 size={10} className="absolute top-1 left-1/2 -translate-x-1/2 animate-spin text-white" />
                      )}
                    </button>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════
          2. 발송 채널
          ══════════════════════════ */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Send size={16} style={{ color: "var(--blue)" }} />
          발송 채널
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5">
            <Smartphone size={20} style={{ color: "var(--green)" }} />
            <div>
              <p className="text-sm font-medium">SMS</p>
              <p className="text-xs text-[var(--green)]">활성</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] opacity-50">
            <MessageSquare size={20} className="text-[var(--muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">카카오톡</p>
              <p className="text-xs text-[var(--muted)]">Phase 2 예정</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          3. 발송 로그
          ══════════════════════════ */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock size={16} style={{ color: "var(--orange)" }} />
            발송 로그
            {logs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--orange)]/10 text-[var(--orange)]">
                {logs.length}
              </span>
            )}
          </h2>
          <button
            onClick={fetchLogs}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1"
            aria-label="로그 새로고침"
          >
            <RefreshCw size={12} /> 새로고침
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10">
            <BellOff size={28} className="mx-auto text-[var(--muted)] opacity-30 mb-2" />
            <p className="text-sm text-[var(--muted)]">아직 발송된 알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "px-5 py-3 flex items-start gap-3",
                  log.status === "failed" && "bg-[var(--red)]/5",
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {log.status === "sent" ? (
                    <CheckCircle size={16} style={{ color: "var(--green)" }} />
                  ) : (
                    <XCircle size={16} style={{ color: "var(--red)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{log.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--muted)]">
                      {log.channel === "sms" ? "SMS" : "앱"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--muted)]">
                      {EVENT_LABEL[log.eventType] || log.eventType}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {log.recipient}
                    {log.message && ` · ${log.message.slice(0, 40)}${log.message.length > 40 ? "..." : ""}`}
                  </p>
                  {log.errorMessage && (
                    <p className="text-xs text-[var(--red)] mt-0.5">{log.errorMessage}</p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--muted)] shrink-0 whitespace-nowrap">
                  {fmtDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
