"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  MapPin,
  DollarSign,
  Settings,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Loader2,
  Link2,
  Unlink,
  Hash,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import EmptyState from "@/components/ui/EmptyState";
import { fmtNum, fmtDate, cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey = "dashboard" | "ranks" | "bids" | "settings";

interface RankEntry {
  date: string;
  rank: number | null;
  saves: string;
  blogReviews: string;
  visitorReviews: string;
  n1: number | null;
  n2: number | null;
  n3: number | null;
}

interface PlaceRankItem {
  keyword: string;
  placeUrl: string;
  placeName: string;
  placeId: string;
  monthlySearch: number;
  businessCount: number;
  representativeKeywords: string[];
  registeredDate: string;
  ranks: RankEntry[];
  lastCheckedAt: string;
}

interface BidItem {
  keyword: string;
  pcSearch: number;
  moSearch: number;
  totalSearch: number;
  pcClicks: number;
  moClicks: number;
  pcCtr: string;
  moCtr: string;
  competition: string;
  avgAds: string;
  pcBids: string[];
  moBids: string[];
  checkedDate: string;
}

interface AccountInfo {
  expirationDate: string;
  totalSlots: number;
  usedSlots: number;
  paidSlots: number;
  freeSlots: number;
}

interface SyncData {
  account: AccountInfo;
  placeRanks: PlaceRankItem[];
  bidAnalysis: BidItem[];
  syncedAt: string;
}

interface ConnectionStatus {
  connected: boolean;
  accountName?: string;
  lastSyncAt?: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════════════════ */

const ADLOG_URL = "https://adlog.kr/adlog/";

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "dashboard", label: "대시보드", icon: BarChart3 },
  { key: "ranks", label: "플레이스 순위", icon: MapPin },
  { key: "bids", label: "입찰가 분석", icon: DollarSign },
  { key: "settings", label: "설정", icon: Settings },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";

/* ══════════════════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════════════════ */

export default function AdlogPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  /* ── Connection State ── */
  const [connection, setConnection] = useState<ConnectionStatus>({ connected: false });
  const [connecting, setConnecting] = useState(false);
  const [adlogId, setAdlogId] = useState("");
  const [adlogPassword, setAdlogPassword] = useState("");
  const [connectError, setConnectError] = useState("");

  /* ── Sync Data ── */
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [syncError, setSyncError] = useState("");

  /* ── Selected Rank Item ── */
  const [selectedRankIdx, setSelectedRankIdx] = useState<number>(0);

  /* ── Fetch connection status ── */
  const fetchConnectionStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/marketing/adlog/connect");
      if (r.ok) {
        const data = await r.json();
        setConnection(data);
        return data.connected;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  /* ── Sync data from Adlog ── */
  const syncFromAdlog = useCallback(async () => {
    setSyncing(true);
    setSyncError("");
    try {
      const r = await fetch("/api/marketing/adlog/sync");
      if (!r.ok) {
        const err = await r.json();
        setSyncError(err.error || "동기화 실패");
        return;
      }
      const data: SyncData = await r.json();
      setSyncData(data);
    } catch {
      setSyncError("동기화 중 오류가 발생했습니다");
    } finally {
      setSyncing(false);
    }
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    (async () => {
      const connected = await fetchConnectionStatus();
      if (connected) await syncFromAdlog();
      setLoading(false);
    })();
  }, [fetchConnectionStatus, syncFromAdlog]);

  /* ── Connect account ── */
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnectError("");
    try {
      const r = await fetch("/api/marketing/adlog/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adlogId, adlogPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setConnectError(data.error || "연결 실패"); return; }
      setConnection({ connected: true, accountName: adlogId });
      setAdlogPassword("");
      await syncFromAdlog();
      setActiveTab("dashboard");
    } catch {
      setConnectError("연결 중 오류가 발생했습니다");
    } finally {
      setConnecting(false);
    }
  };

  /* ── Disconnect ── */
  const handleDisconnect = async () => {
    try {
      await fetch("/api/marketing/adlog/connect", { method: "DELETE" });
      setConnection({ connected: false });
      setSyncData(null);
      setAdlogId("");
    } catch { /* ignore */ }
  };

  /* ── Derived data ── */
  const placeRanks = syncData?.placeRanks || [];
  const bidItems = syncData?.bidAnalysis || [];
  const account = syncData?.account;

  const totalKeywords = placeRanks.length;
  const top10Count = placeRanks.filter((p) => {
    const latest = p.ranks.find((r) => r.rank !== null);
    return latest && latest.rank !== null && latest.rank <= 10;
  }).length;
  const rankedItems = placeRanks.filter((p) => p.ranks.some((r) => r.rank !== null));
  const avgRank = rankedItems.length > 0
    ? Math.round(rankedItems.reduce((sum, p) => {
        const latest = p.ranks.find((r) => r.rank !== null);
        return sum + (latest?.rank || 0);
      }, 0) / rankedItems.length)
    : 0;
  const totalMonthlySearch = placeRanks.reduce((s, p) => s + p.monthlySearch, 0);
  const selectedRank = placeRanks[selectedRankIdx] || null;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ══════ Header ══════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/marketing" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] text-neutral-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">📊</span> 애드로그
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">네이버 플레이스 순위 · 파워링크 분석</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={ADLOG_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-sm text-neutral-400 hover:bg-white/[0.04] transition-colors">
            애드로그 열기 <ExternalLink size={14} />
          </a>
          {connection.connected && (
            <button onClick={syncFromAdlog} disabled={syncing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-sm text-neutral-400 hover:bg-white/[0.04] transition-colors disabled:opacity-50">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              동기화
            </button>
          )}
        </div>
      </div>

      {/* ══════ Tabs ══════ */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.key ? "bg-[var(--green)]/10 text-[var(--green)]" : "text-neutral-500 hover:text-white hover:bg-white/[0.04]",
            )}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════ Not Connected ══════ */}
      {!connection.connected && activeTab !== "settings" && (
        <EmptyState icon={Link2} title="애드로그 계정을 연결해주세요" description="설정 탭에서 애드로그 아이디와 비밀번호를 입력하면 데이터를 가져올 수 있습니다." action={<button onClick={() => setActiveTab("settings")} className="px-4 py-2 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:brightness-110 transition">설정으로 이동</button>} />
      )}

      {/* ══════════════ TAB: Dashboard ══════════════ */}
      {activeTab === "dashboard" && connection.connected && (
        <div className="space-y-6">
          {syncError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} /> {syncError}
            </div>
          )}

          {account && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm flex-wrap">
              <span className="text-neutral-500">계정:</span>
              <span className="font-medium">{connection.accountName}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-500">만료:</span>
              <span className="font-medium">{account.expirationDate}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-500">슬롯:</span>
              <span className="font-medium">{account.usedSlots}/{account.totalSlots}</span>
              {syncData?.syncedAt && (
                <>
                  <span className="text-neutral-600">|</span>
                  <span className="text-neutral-500">동기화: {fmtDate(syncData.syncedAt)}</span>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="추적 키워드" value={`${totalKeywords}개`} icon={Search} color="blue" />
            <KPICard title="TOP 10 키워드" value={`${top10Count}개`} subtitle={`전체 ${totalKeywords}개 중`} icon={TrendingUp} color="green" />
            <KPICard title="평균 순위" value={`${avgRank}위`} icon={MapPin} color="default" />
            <KPICard title="월 총 검색량" value={fmtNum(totalMonthlySearch)} icon={Eye} color="default" />
          </div>

          {/* Place Rank Overview */}
          {placeRanks.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">플레이스 순위 현황</h3>
                <button onClick={() => setActiveTab("ranks")} className="text-xs text-[var(--green)] hover:underline">상세 보기 →</button>
              </div>
              <div className="space-y-3">
                {placeRanks.map((item, idx) => {
                  const latest = item.ranks.find((r) => r.rank !== null);
                  const prev = item.ranks.filter((r) => r.rank !== null)[1];
                  const rankDiff = latest && prev && latest.rank !== null && prev.rank !== null ? prev.rank - latest.rank : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-emerald-400">{latest?.rank ?? "-"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.keyword}</p>
                          <p className="text-xs text-neutral-500 truncate">{item.placeName} · 월 {fmtNum(item.monthlySearch)}건</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {(() => {
                          const latestN = item.ranks.find((r) => r.n1 != null || r.n2 != null || r.n3 != null);
                          if (!latestN) return null;
                          return (
                            <div className="flex items-center gap-2 text-[10px] font-medium">
                              {latestN.n1 != null && <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">N1 {latestN.n1.toFixed(6)}</span>}
                              {latestN.n2 != null && <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">N2 {latestN.n2.toFixed(6)}</span>}
                              {latestN.n3 != null && <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">N3 {latestN.n3.toFixed(6)}</span>}
                            </div>
                          );
                        })()}
                        {rankDiff !== 0 && (
                          <span className={cn("flex items-center gap-0.5 text-xs font-medium", rankDiff > 0 ? "text-emerald-400" : "text-red-400")}>
                            {rankDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(rankDiff)}
                          </span>
                        )}
                        <span className="text-xs text-neutral-600">업체 {fmtNum(item.businessCount)}개</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bid Overview */}
          {bidItems.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">파워링크 입찰가 요약</h3>
                <button onClick={() => setActiveTab("bids")} className="text-xs text-[var(--green)] hover:underline">상세 보기 →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-neutral-500 font-medium">키워드</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">총 검색수</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">경쟁률</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC 1위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO 1위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3 font-medium">{item.keyword}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{fmtNum(item.totalSearch)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", item.competition === "높음" ? "bg-red-500/15 text-red-400" : item.competition === "중간" ? "bg-yellow-500/15 text-yellow-400" : "bg-emerald-500/15 text-emerald-400")}>{item.competition}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-400">{item.pcBids[0]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{item.moBids[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB: Ranks ══════════════ */}
      {activeTab === "ranks" && connection.connected && (
        <div className="space-y-6">
          {placeRanks.length === 0 ? (
            <EmptyState icon={MapPin} title="등록된 키워드가 없습니다" description="애드로그에서 플레이스 순위 체크 키워드를 등록해주세요." />
          ) : (
            <>
              {/* Keyword selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {placeRanks.map((item, idx) => {
                  const latest = item.ranks.find((r) => r.rank !== null);
                  return (
                    <button key={idx} onClick={() => setSelectedRankIdx(idx)} className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                      selectedRankIdx === idx ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white hover:bg-white/[0.04]",
                    )}>
                      <span className="text-xs font-bold text-emerald-400">{latest?.rank ?? "-"}위</span>
                      {item.keyword}
                    </button>
                  );
                })}
              </div>

              {selectedRank && (
                <>
                  {/* Keyword Info Card */}
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{selectedRank.keyword}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{selectedRank.placeName} ({selectedRank.placeId})</p>
                      </div>
                      {selectedRank.placeUrl && (
                        <a href={selectedRank.placeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--green)] hover:underline flex items-center gap-1">
                          네이버 지도 <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {(() => {
                      const latestWithN = selectedRank.ranks.find((r) => r.n1 != null || r.n2 != null || r.n3 != null);
                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                              <p className="text-xs text-neutral-500">월 검색량</p>
                              <p className="text-lg font-bold mt-1">{fmtNum(selectedRank.monthlySearch)}</p>
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                              <p className="text-xs text-neutral-500">경쟁 업체수</p>
                              <p className="text-lg font-bold mt-1">{fmtNum(selectedRank.businessCount)}</p>
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                              <p className="text-xs text-neutral-500">등록일</p>
                              <p className="text-lg font-bold mt-1">{selectedRank.registeredDate}</p>
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                              <p className="text-xs text-neutral-500">마지막 체크</p>
                              <p className="text-lg font-bold mt-1">{selectedRank.lastCheckedAt.split(" ")[0] || "-"}</p>
                            </div>
                          </div>
                          {latestWithN && (
                            <div className="grid grid-cols-3 gap-4">
                              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-cyan-500/20">
                                <p className="text-xs text-neutral-500">N1 유사도</p>
                                <p className="text-lg font-bold mt-1 text-cyan-400">{latestWithN.n1?.toFixed(6) ?? "-"}</p>
                              </div>
                              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-violet-500/20">
                                <p className="text-xs text-neutral-500">N2 관련성</p>
                                <p className="text-lg font-bold mt-1 text-violet-400">{latestWithN.n2?.toFixed(6) ?? "-"}</p>
                              </div>
                              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-amber-500/20">
                                <p className="text-xs text-neutral-500">N3 랭킹</p>
                                <p className="text-lg font-bold mt-1 text-amber-400">{latestWithN.n3?.toFixed(6) ?? "-"}</p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {selectedRank.representativeKeywords.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Hash size={14} className="text-neutral-500" />
                        {selectedRank.representativeKeywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-neutral-400">{k}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rank Chart */}
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
                    <h3 className="text-sm font-medium">순위 추이</h3>
                    {(() => {
                      const validRanks = selectedRank.ranks.filter((r) => r.rank !== null).slice(0, 30).reverse();
                      if (validRanks.length === 0) return <p className="text-sm text-neutral-500">순위 데이터가 없습니다</p>;
                      const maxRank = Math.max(...validRanks.map((r) => r.rank!), 1);
                      const chartMax = Math.max(maxRank + 5, 20);
                      return (
                        <div className="h-48 flex items-end gap-1">
                          {validRanks.map((r, i) => {
                            const height = ((chartMax - r.rank!) / chartMax) * 100;
                            const isGood = r.rank! <= 10;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[9px] text-neutral-500 font-medium">{r.rank}</span>
                                <div className="w-full relative" style={{ height: "120px" }}>
                                  <div className={cn("absolute bottom-0 w-full rounded-t transition-all", isGood ? "bg-[var(--green)]/40" : r.rank! <= 30 ? "bg-yellow-500/40" : "bg-red-500/30")} style={{ height: `${Math.max(height, 3)}%` }} title={`${r.date}: ${r.rank}위`} />
                                </div>
                                <span className="text-[9px] text-neutral-600">{r.date.slice(3)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--green)]/40" /> 1~10위</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/40" /> 11~30위</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30" /> 31위+</span>
                    </div>
                  </div>

                  {/* Rank Detail Table */}
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
                    <h3 className="text-sm font-medium">일별 순위 기록</h3>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#111111]">
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left px-4 py-2 text-neutral-500 font-medium">날짜</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">순위</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">변동</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">저장수</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">블로그 리뷰</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">방문자 리뷰</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">N1 지수</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">N2 지수</th>
                            <th className="text-right px-4 py-2 text-neutral-500 font-medium">N3 지수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRank.ranks.filter((r) => r.rank !== null).map((r, i, arr) => {
                            const prev = arr[i + 1];
                            const diff = prev?.rank != null && r.rank != null ? prev.rank - r.rank : 0;
                            return (
                              <tr key={i} className="border-b border-white/[0.06] last:border-0">
                                <td className="px-4 py-2 text-neutral-400">{r.date}</td>
                                <td className="px-4 py-2 text-right">
                                  <span className={cn("font-bold", r.rank! <= 5 ? "text-emerald-400" : r.rank! <= 10 ? "text-emerald-300" : r.rank! <= 30 ? "text-yellow-400" : "text-red-400")}>{r.rank}위</span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {diff !== 0 && (
                                    <span className={cn("text-xs font-medium flex items-center justify-end gap-0.5", diff > 0 ? "text-emerald-400" : "text-red-400")}>
                                      {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(diff)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right text-neutral-400">{r.saves || "-"}</td>
                                <td className="px-4 py-2 text-right text-neutral-400">{r.blogReviews || "-"}</td>
                                <td className="px-4 py-2 text-right text-neutral-400">{r.visitorReviews ? fmtNum(parseInt(r.visitorReviews)) : "-"}</td>
                                <td className="px-4 py-2 text-right">
                                  {r.n1 != null ? <span className="font-medium text-cyan-400">{r.n1.toFixed(6)}</span> : "-"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {r.n2 != null ? <span className="font-medium text-violet-400">{r.n2.toFixed(6)}</span> : "-"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {r.n3 != null ? <span className="font-medium text-amber-400">{r.n3.toFixed(6)}</span> : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════ TAB: Bids ══════════════ */}
      {activeTab === "bids" && connection.connected && (
        <div className="space-y-6">
          {bidItems.length === 0 ? (
            <EmptyState icon={DollarSign} title="등록된 키워드가 없습니다" description="애드로그에서 파워링크 입찰가 분석 키워드를 등록해주세요." />
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-neutral-500 font-medium">키워드</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC 검색</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO 검색</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">총 검색</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC CTR</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO CTR</th>
                      <th className="text-center px-4 py-3 text-neutral-500 font-medium">경쟁률</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC 1위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC 2위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">PC 3위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO 1위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO 2위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">MO 3위</th>
                      <th className="text-right px-4 py-3 text-neutral-500 font-medium">조회일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{item.keyword}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{fmtNum(item.pcSearch)}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{fmtNum(item.moSearch)}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmtNum(item.totalSearch)}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{item.pcCtr}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">{item.moCtr}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", item.competition === "높음" ? "bg-red-500/15 text-red-400" : item.competition === "중간" ? "bg-yellow-500/15 text-yellow-400" : "bg-emerald-500/15 text-emerald-400")}>{item.competition}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.pcBids[0]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.pcBids[1]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.pcBids[2]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.moBids[0]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.moBids[1]}</td>
                        <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">{item.moBids[2]}</td>
                        <td className="px-4 py-3 text-right text-neutral-500 whitespace-nowrap">{item.checkedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB: Settings ══════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">애드로그 계정 연결</h3>
              {connection.connected && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 size={14} /> 연결됨</span>
              )}
            </div>

            {connection.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium">{connection.accountName}</p>
                    {connection.lastSyncAt && <p className="text-xs text-neutral-500 mt-0.5">마지막 동기화: {fmtDate(connection.lastSyncAt)}</p>}
                  </div>
                  <button onClick={handleDisconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                    <Unlink size={12} /> 연결 해제
                  </button>
                </div>

                {account && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-neutral-500">만료일</p>
                      <p className="text-sm font-medium mt-1">{account.expirationDate || "-"}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-neutral-500">총 슬롯</p>
                      <p className="text-sm font-medium mt-1">{account.totalSlots}개</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-neutral-500">사용 슬롯</p>
                      <p className="text-sm font-medium mt-1">{account.usedSlots}개 (유료 {account.paidSlots} / 무료 {account.freeSlots})</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-neutral-500">추적 키워드</p>
                      <p className="text-sm font-medium mt-1">{placeRanks.length + bidItems.length}개</p>
                    </div>
                  </div>
                )}

                <button onClick={syncFromAdlog} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:brightness-110 transition disabled:opacity-50">
                  {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  지금 동기화
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1.5">애드로그 아이디</label>
                  <input type="text" value={adlogId} onChange={(e) => setAdlogId(e.target.value)} className={inputCls} placeholder="애드로그 로그인 ID" required />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1.5">비밀번호</label>
                  <input type="password" value={adlogPassword} onChange={(e) => setAdlogPassword(e.target.value)} className={inputCls} placeholder="애드로그 비밀번호" required />
                </div>
                {connectError && (
                  <div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle size={14} /> {connectError}</div>
                )}
                <button type="submit" disabled={connecting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:brightness-110 transition disabled:opacity-50 w-full justify-center">
                  {connecting ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                  계정 연결
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">애드로그 관리 페이지</p>
                <p className="text-xs text-neutral-500 mt-0.5">키워드 추가/삭제는 애드로그 사이트에서 진행하세요</p>
              </div>
              <a href={ADLOG_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-[var(--green)] text-black px-4 py-2 text-sm font-medium hover:brightness-110 transition">
                애드로그 열기 <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
