"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  Trophy,
} from "lucide-react";

interface WeekDayUser {
  userId: string;
  email: string;
  name: string;
  firstLogin: string;
  lastLogin: string;
  sessionCount: number;
}

interface WeekDay {
  date: string;
  uniqueUsers: number;
  totalSessions: number;
  users: WeekDayUser[];
}

interface MonthTopUser {
  userId: string;
  email: string;
  name: string;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  activeDays: number;
  sessionCount: number;
  firstSession: string;
  lastSession: string;
}

interface ActivityData {
  weekLogins: WeekDay[];
  monthTopUsers: MonthTopUser[];
  meta: {
    weekStartKst: string;
    monthStartKst: string;
    sessionDurationCapHours: number;
    note: string;
  };
}

function fmtHm(s: string): string {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDuration(seconds: number): string {
  if (seconds <= 0) return "0분";
  // 누적 이용 시간을 분 단위로 표시 (운영자가 비교하기 쉽도록)
  const totalMinutes = Math.round(seconds / 60);
  return `${totalMinutes.toLocaleString()}분`;
}

function fmtWeekDayKo(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return `${md} (${days[d.getDay()]})`;
}

export default function AdminActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/activity", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        setErr(json?.error || "조회 실패");
        setData(null);
        return;
      }
      const payload = (json?.data ?? json) as ActivityData;
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const weekTotal = useMemo(() => {
    if (!data) return { uniqueUsers: 0, totalSessions: 0 };
    const seenUsers = new Set<string>();
    let sessions = 0;
    for (const day of data.weekLogins) {
      for (const u of day.users) seenUsers.add(u.userId);
      sessions += day.totalSessions;
    }
    return { uniqueUsers: seenUsers.size, totalSessions: sessions };
  }, [data]);

  const maxDayUsers = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.weekLogins.map((d) => d.uniqueUsers));
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="p-2 rounded-lg hover:bg-white/[0.04] text-[var(--muted)]"
              title="유저 관리로"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">활동 통계</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                최근 7일 로그인 + 이번달 가장 오래 이용한 사용자
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {err}
          </div>
        )}

        {loading && !data ? (
          <div className="py-20 text-center text-[var(--muted)]">로딩 중...</div>
        ) : data ? (
          <>
            {/* ─── 섹션 1: 최근 7일 로그인 ─── */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar size={18} className="text-[var(--green)]" />
                  최근 7일 로그인
                </h2>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>주간 unique 사용자 <strong className="text-[var(--foreground)]">{weekTotal.uniqueUsers}명</strong></span>
                  <span>총 세션 <strong className="text-[var(--foreground)]">{weekTotal.totalSessions}회</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-3">
                {data.weekLogins.map((day) => {
                  const heightPct = (day.uniqueUsers / maxDayUsers) * 100;
                  const isToday =
                    new Date(day.date + "T00:00:00+09:00").toDateString() ===
                    new Date().toDateString();
                  const isExpanded = expandedDate === day.date;
                  return (
                    <button
                      key={day.date}
                      onClick={() =>
                        setExpandedDate(isExpanded ? null : day.date)
                      }
                      className={`relative rounded-xl border p-3 text-left transition-colors ${
                        isExpanded
                          ? "border-[var(--green)] bg-[var(--green)]/10"
                          : isToday
                            ? "border-[var(--green)]/40 bg-[var(--green)]/5 hover:bg-[var(--green)]/10"
                            : "border-[var(--border)] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-xs text-[var(--muted)]">
                        {fmtWeekDayKo(day.date)}
                        {isToday && <span className="ml-1 text-[var(--green)]">·오늘</span>}
                      </div>
                      <div className="text-2xl font-bold mt-1">{day.uniqueUsers}</div>
                      <div className="text-[10px] text-[var(--muted)]">명 / {day.totalSessions} 세션</div>
                      {/* 시각화 바 */}
                      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[var(--green)]"
                          style={{ width: `${heightPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택한 일자의 사용자 리스트 */}
              {expandedDate && (
                <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-4">
                  {(() => {
                    const day = data.weekLogins.find((d) => d.date === expandedDate);
                    if (!day) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Users size={16} className="text-[var(--green)]" />
                            {fmtWeekDayKo(day.date)} — {day.uniqueUsers}명 로그인
                          </h3>
                          <button
                            onClick={() => setExpandedDate(null)}
                            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            접기
                          </button>
                        </div>
                        {day.users.length === 0 ? (
                          <p className="text-sm text-[var(--muted)]">로그인 없음</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-xs text-[var(--muted)]">
                                <tr>
                                  <th className="text-left py-1.5 pr-3">사용자</th>
                                  <th className="text-left py-1.5 pr-3">첫 로그인</th>
                                  <th className="text-left py-1.5 pr-3">마지막 로그인</th>
                                  <th className="text-right py-1.5 pr-3">세션</th>
                                  <th className="text-right py-1.5">상세</th>
                                </tr>
                              </thead>
                              <tbody>
                                {day.users.map((u) => (
                                  <tr key={u.userId} className="border-t border-[var(--green)]/15">
                                    <td className="py-1.5 pr-3">
                                      <div className="font-medium">{u.email}</div>
                                      <div className="text-xs text-[var(--muted)]">{u.name}</div>
                                    </td>
                                    <td className="py-1.5 pr-3 text-xs text-[var(--muted)]">
                                      {fmtHm(u.firstLogin)}
                                    </td>
                                    <td className="py-1.5 pr-3 text-xs">
                                      {fmtHm(u.lastLogin)}
                                    </td>
                                    <td className="py-1.5 pr-3 text-right text-xs">
                                      {u.sessionCount}
                                    </td>
                                    <td className="py-1.5 text-right">
                                      <Link
                                        href={`/admin/users/${u.userId}`}
                                        className="text-xs text-[var(--green)] hover:underline"
                                      >
                                        상세 →
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {!expandedDate && (
                <p className="text-xs text-[var(--muted)] mt-2">
                  ↑ 일자 카드를 클릭하면 그날 로그인한 사용자 목록이 펼쳐집니다.
                </p>
              )}
            </section>

            {/* ─── 섹션 2: 이번달 TOP ─── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy size={18} className="text-[var(--green)]" />
                  이번달 가장 오래 이용한 사용자 TOP 30
                </h2>
                <div className="text-xs text-[var(--muted)]">
                  기간: {new Date(data.meta.monthStartKst).toLocaleDateString("ko-KR")} ~ 오늘
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                      <tr>
                        <th className="text-center px-3 py-2.5 w-12">#</th>
                        <th className="text-left px-3 py-2.5">사용자</th>
                        <th className="text-right px-3 py-2.5">
                          <div className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            누적 이용 시간
                          </div>
                        </th>
                        <th className="text-right px-3 py-2.5">활동 일수</th>
                        <th className="text-right px-3 py-2.5">세션 수</th>
                        <th className="text-left px-3 py-2.5">최근 로그인</th>
                        <th className="text-right px-3 py-2.5">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthTopUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-12 text-center text-[var(--muted)]">
                            이번달 활동 데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        data.monthTopUsers.map((u, i) => {
                          const isTop3 = i < 3;
                          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
                          return (
                            <tr
                              key={u.userId}
                              className="border-t border-[var(--border)] hover:bg-white/[0.02]"
                            >
                              <td className="px-3 py-2.5 text-center">
                                {medal ? (
                                  <span className="text-base">{medal}</span>
                                ) : (
                                  <span className="text-xs text-[var(--muted)]">{i + 1}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <Link
                                  href={`/admin/users/${u.userId}`}
                                  className="hover:text-[var(--green)] hover:underline"
                                >
                                  <div className={isTop3 ? "font-semibold" : "font-medium"}>{u.email}</div>
                                  <div className="text-xs text-[var(--muted)]">{u.name}</div>
                                </Link>
                              </td>
                              <td className={`px-3 py-2.5 text-right ${isTop3 ? "text-[var(--green)] font-semibold" : ""}`}>
                                {fmtDuration(u.totalDurationSeconds)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs">
                                {u.activeDays}일
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-[var(--muted)]">
                                {u.sessionCount}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                                {new Date(u.lastSession).toLocaleString("ko-KR", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <Link
                                  href={`/admin/users/${u.userId}`}
                                  className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium hover:bg-[var(--green)]/20"
                                >
                                  상세 →
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)] mt-2">
                ⓘ {data.meta.note}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
