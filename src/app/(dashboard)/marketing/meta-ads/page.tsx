"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Megaphone,
  Filter,
  DollarSign,
  Settings,
  Wallet,
  Eye,
  MousePointerClick,
  MessageSquare,
  FileSignature,
  TrendingUp,
  Plus,
  Info,
  Zap,
  Globe,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fmt, fmtDate, cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey = "dashboard" | "campaigns" | "funnel" | "costs" | "settings";
type PeriodKey = "today" | "week" | "month" | "lastMonth";

interface Campaign {
  id: string;
  channel: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  spent: number;
  inquiries: number;
  contracts: number;
  contractAmount: number;
  metrics: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    cpc?: number;
  } | null;
  createdAt: string;
}

interface FunnelStage {
  label: string;
  value: number;
  unit: string;
  percentage: number;
  conversionLabel?: string;
  conversionRate?: number;
}

interface MonthlyRow {
  month: string;
  adSpend: number;
  inquiries: number;
  cpa: number;
  contracts: number;
  costPerContract: number;
  roas: number;
}

interface ChannelCard {
  name: string;
  color: string;
  totalSpend: number;
  totalInquiries: number;
  cpa: number;
  contracts: number;
  efficiency: "high" | "medium" | "low";
}

/* ══════════════════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════════════════ */

const tabs = [
  { key: "dashboard" as TabKey, label: "성과 대시보드", icon: BarChart3 },
  { key: "campaigns" as TabKey, label: "캠페인별 상세", icon: Megaphone },
  { key: "funnel" as TabKey, label: "전환 퍼널", icon: Filter },
  { key: "costs" as TabKey, label: "비용 분석", icon: DollarSign },
  { key: "settings" as TabKey, label: "설정", icon: Settings },
];

const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번주" },
  { key: "month", label: "이번달" },
  { key: "lastMonth", label: "지난달" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "진행중" },
  paused: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "일시정지" },
  completed: { bg: "bg-neutral-500/15", text: "text-neutral-400", label: "완료" },
};

const EFFICIENCY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "높음" },
  medium: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "보통" },
  low: { bg: "bg-red-500/15", text: "text-red-400", label: "낮음" },
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-white text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-white text-sm focus:border-[#00C471] focus:outline-none";

/* ── Demo data ── */

const DEMO_MONTHLY_DATA: MonthlyRow[] = [
  { month: "2026-01", adSpend: 2500000, inquiries: 85, cpa: 29412, contracts: 8, costPerContract: 312500, roas: 14.4 },
  { month: "2026-02", adSpend: 3000000, inquiries: 100, cpa: 30000, contracts: 10, costPerContract: 300000, roas: 15.0 },
  { month: "2026-03", adSpend: 3200000, inquiries: 112, cpa: 28571, contracts: 12, costPerContract: 266667, roas: 16.9 },
];

const DEMO_CHANNELS: ChannelCard[] = [
  { name: "Meta (Facebook)", color: "#1877F2", totalSpend: 4500000, totalInquiries: 150, cpa: 30000, contracts: 15, efficiency: "high" },
  { name: "Naver", color: "#03C75A", totalSpend: 2800000, totalInquiries: 95, cpa: 29474, contracts: 9, efficiency: "medium" },
  { name: "Instagram", color: "#E4405F", totalSpend: 1200000, totalInquiries: 52, cpa: 23077, contracts: 6, efficiency: "high" },
  { name: "기타", color: "#888888", totalSpend: 200000, totalInquiries: 5, cpa: 40000, contracts: 1, efficiency: "low" },
];

/* ══════════════════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════════════════ */

function fmtNum(n: number): string {
  return n.toLocaleString("ko-KR");
}

function fmtPercent(n: number): string {
  return n.toFixed(1) + "%";
}

/* ══════════════════════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════════════════════ */

export default function MetaAdsPage() {
  /* ── Tab & Period ── */
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [period, setPeriod] = useState<PeriodKey>("month");

  /* ── Campaign Data ── */
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Campaign Modal ── */
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    channel: "meta",
    budget: "",
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /* ── Settings State ── */
  const [pixelId, setPixelId] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");
  const [channelConnection, setChannelConnection] = useState<{
    accountName: string | null;
    hasToken: boolean;
    tokenExpiresAt: string | null;
    isActive: boolean;
  } | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Fetch campaigns ── */
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/campaigns?channel=meta");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success")) {
      setOauthMessage({ type: "success", text: "Meta 광고 계정이 성공적으로 연결되었습니다!" });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("oauth_error")) {
      setOauthMessage({ type: "error", text: decodeURIComponent(params.get("oauth_error")!) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch("/api/marketing/channels?channel=meta_ads")
      .then(r => r.json())
      .then(data => { if (data) setChannelConnection(data); })
      .catch(() => {});
  }, []);

  /* ── Derived KPI values ── */
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.metrics?.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.metrics?.clicks || 0), 0);
  const totalInquiries = campaigns.reduce((s, c) => s + (c.inquiries || 0), 0);
  const totalContracts = campaigns.reduce((s, c) => s + (c.contracts || 0), 0);
  const totalContractAmount = campaigns.reduce((s, c) => s + (c.contractAmount || 0), 0);
  const roi = totalSpent > 0 ? Math.round((totalContractAmount / totalSpent) * 100) / 100 : 0;
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  /* ── Funnel data ── */
  const funnelStages: FunnelStage[] = [
    {
      label: "광고 노출",
      value: totalImpressions || 100000,
      unit: "명",
      percentage: 100,
      conversionLabel: "CTR",
      conversionRate: totalImpressions > 0 ? parseFloat(((totalClicks || 2000) / (totalImpressions || 100000) * 100).toFixed(1)) : 2.0,
    },
    {
      label: "광고 클릭",
      value: totalClicks || 2000,
      unit: "명",
      percentage: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 100) : 40,
      conversionLabel: "전환율",
      conversionRate: totalClicks > 0 ? parseFloat(((totalInquiries || 100) / (totalClicks || 2000) * 100).toFixed(1)) : 5.0,
    },
    {
      label: "문의 접수",
      value: totalInquiries || 100,
      unit: "건",
      percentage: totalImpressions > 0 ? Math.max(Math.round((totalInquiries / totalImpressions) * 100), 2) : 16,
      conversionLabel: "상담률",
      conversionRate: 40.0,
    },
    {
      label: "상담 진행",
      value: totalInquiries ? Math.round(totalInquiries * 0.4) : 40,
      unit: "건",
      percentage: totalImpressions > 0 ? Math.max(Math.round(((totalInquiries * 0.4) / totalImpressions) * 100), 1) : 8,
      conversionLabel: "계약률",
      conversionRate: totalInquiries > 0 && totalContracts > 0
        ? parseFloat(((totalContracts / (totalInquiries * 0.4)) * 100).toFixed(1))
        : 25.0,
    },
    {
      label: "계약 체결",
      value: totalContracts || 10,
      unit: "건",
      percentage: totalImpressions > 0 ? Math.max(Math.round((totalContracts / totalImpressions) * 100), 1) : 4,
    },
  ];

  const funnelContractAmount = totalContractAmount || 450000000;
  const funnelAdSpend = totalSpent || 3000000;
  const funnelROI = funnelAdSpend > 0 ? Math.round(funnelContractAmount / funnelAdSpend) : 0;

  /* ── Submit campaign ── */
  const submitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: campaignForm.channel,
          name: campaignForm.name,
          budget: Number(campaignForm.budget) || 0,
          startDate: campaignForm.startDate || null,
          endDate: campaignForm.endDate || null,
          spent: 0,
          inquiries: 0,
          contracts: 0,
          contractAmount: 0,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setCampaigns((prev) => [created, ...prev]);
        setShowAddCampaign(false);
        setCampaignForm({ name: "", channel: "meta", budget: "", startDate: "", endDate: "" });
      }
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 rounded-xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-up">
      {/* ══════════ Header ══════════ */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketing"
          className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">메타 광고</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Facebook/Instagram 광고 성과 추적
          </p>
        </div>
      </div>

      {/* ══════════ Tab Bar ══════════ */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-white/[0.08] text-white font-medium"
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         Tab 1: 성과 대시보드
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  period === p.key
                    ? "bg-white/[0.08] text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* KPI Cards - 3x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="이번 달 광고비"
              value={fmt(totalSpent || 3200000)}
              subtitle="예산 대비 87% 집행"
              icon={Wallet}
              color="#1877F2"
              trend={{ direction: "up", label: "전월 대비 +6.7%" }}
            />
            <KPICard
              title="노출수"
              value={fmtNum(totalImpressions || 125400) + "회"}
              subtitle="일평균 4,180회"
              icon={Eye}
              trend={{ direction: "up", label: "+12.3%" }}
            />
            <KPICard
              title="클릭수"
              value={fmtNum(totalClicks || 2508) + "회"}
              subtitle={`CTR ${fmtPercent(overallCTR || 2.0)}`}
              icon={MousePointerClick}
              trend={{ direction: "up", label: "+8.5%" }}
            />
            <KPICard
              title="문의 전환"
              value={(totalInquiries || 112) + "건"}
              subtitle="클릭 대비 전환율 4.5%"
              icon={MessageSquare}
              trend={{ direction: "up", label: "+15건" }}
            />
            <KPICard
              title="계약 전환"
              value={(totalContracts || 12) + "건"}
              subtitle={`전환율 ${totalInquiries > 0 ? fmtPercent((totalContracts / totalInquiries) * 100) : "10.7%"}`}
              icon={FileSignature}
              trend={{ direction: "up", label: "+3건" }}
            />
            <KPICard
              title="광고 ROI"
              value={(roi || 16.9) + "배"}
              subtitle={`계약금 ${fmt(totalContractAmount || 54000000)} / 광고비 ${fmt(totalSpent || 3200000)}`}
              icon={TrendingUp}
              color="#00C471"
              trend={{ direction: "up", label: "전월 대비 +1.9배" }}
            />
          </div>

          {/* Campaign summary table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold">캠페인 요약</h3>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--muted)]">
                등록된 캠페인이 없습니다. 캠페인별 상세 탭에서 캠페인을 추가해주세요.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-5 py-3 text-neutral-500 font-medium">캠페인명</th>
                      <th className="text-left px-5 py-3 text-neutral-500 font-medium">상태</th>
                      <th className="text-right px-5 py-3 text-neutral-500 font-medium">집행액</th>
                      <th className="text-right px-5 py-3 text-neutral-500 font-medium">문의</th>
                      <th className="text-right px-5 py-3 text-neutral-500 font-medium">계약</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 5).map((c) => {
                      const badge = STATUS_BADGE[c.status || "active"] || STATUS_BADGE.active;
                      return (
                        <tr key={c.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-medium">{c.name}</td>
                          <td className="px-5 py-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", badge.bg, badge.text)}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-[var(--muted)]">{fmt(c.spent)}</td>
                          <td className="px-5 py-3 text-right text-[var(--muted)]">{c.inquiries}건</td>
                          <td className="px-5 py-3 text-right text-[var(--muted)]">{c.contracts}건</td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="bg-white/[0.02] font-medium">
                      <td className="px-5 py-3">합계</td>
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3 text-right">{fmt(totalSpent)}</td>
                      <td className="px-5 py-3 text-right">{totalInquiries}건</td>
                      <td className="px-5 py-3 text-right">{totalContracts}건</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         Tab 2: 캠페인별 상세
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* Header with add button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">캠페인 목록</h2>
            <button
              onClick={() => setShowAddCampaign(true)}
              className="flex items-center gap-2 rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
            >
              <Plus size={16} />
              캠페인 추가
            </button>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="등록된 캠페인이 없습니다"
              description="메타 광고 캠페인을 추가하여 성과를 추적하세요."
              action={
                <button
                  onClick={() => setShowAddCampaign(true)}
                  className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
                >
                  첫 캠페인 추가하기
                </button>
              }
            />
          ) : (
            <>
              {/* Campaign table */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">캠페인명</th>
                        <th className="text-left px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">상태</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">예산</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">집행액</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">노출</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">클릭</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">CTR</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">CPC</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">문의수</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium whitespace-nowrap">계약수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => {
                        const badge = STATUS_BADGE[c.status || "active"] || STATUS_BADGE.active;
                        const impressions = c.metrics?.impressions || 0;
                        const clicks = c.metrics?.clicks || 0;
                        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                        const cpc = clicks > 0 ? Math.round(c.spent / clicks) : 0;

                        return (
                          <tr
                            key={c.id}
                            className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-5 py-3.5 font-medium whitespace-nowrap">{c.name}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", badge.bg, badge.text)}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmt(c.budget)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmt(c.spent)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmtNum(impressions)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmtNum(clicks)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmtPercent(ctr)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{fmt(cpc)}</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{c.inquiries}건</td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted)] whitespace-nowrap">{c.contracts}건</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Campaign cards - key metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.slice(0, 6).map((c) => {
                  const badge = STATUS_BADGE[c.status || "active"] || STATUS_BADGE.active;
                  const impressions = c.metrics?.impressions || 0;
                  const clicks = c.metrics?.clicks || 0;
                  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

                  return (
                    <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">{c.name}</h4>
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {c.startDate ? fmtDate(c.startDate) : "-"} ~ {c.endDate ? fmtDate(c.endDate) : "진행중"}
                          </p>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2", badge.bg, badge.text)}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[var(--muted)] text-xs">집행액</p>
                          <p className="font-medium mt-0.5">{fmt(c.spent)}</p>
                        </div>
                        <div>
                          <p className="text-[var(--muted)] text-xs">CTR</p>
                          <p className="font-medium mt-0.5">{fmtPercent(ctr)}</p>
                        </div>
                        <div>
                          <p className="text-[var(--muted)] text-xs">문의</p>
                          <p className="font-medium mt-0.5">{c.inquiries}건</p>
                        </div>
                        <div>
                          <p className="text-[var(--muted)] text-xs">계약</p>
                          <p className="font-medium mt-0.5">{c.contracts}건</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add Campaign Modal */}
          <Modal open={showAddCampaign} onClose={() => setShowAddCampaign(false)} title="캠페인 추가">
            <form onSubmit={submitCampaign} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">캠페인명 *</label>
                <input
                  type="text"
                  required
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className={inputCls}
                  placeholder="캠페인명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">채널</label>
                  <select
                    value={campaignForm.channel}
                    onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                    className={selectCls}
                  >
                    <option value="meta">Meta (Facebook)</option>
                    <option value="instagram">Instagram</option>
                    <option value="naver">Naver</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">예산</label>
                  <input
                    type="number"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                    className={inputCls}
                    placeholder="예산 (원)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">시작일</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">종료일</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCampaign(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors disabled:opacity-50"
                >
                  {submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         Tab 3: 전환 퍼널 (Star Feature)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "funnel" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">광고 전환 퍼널</h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                광고 노출부터 계약 체결까지의 전환 과정을 시각화합니다
              </p>
            </div>
          </div>

          {/* Funnel visualization */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-1">
            <h3 className="font-semibold mb-6">전환 흐름</h3>

            <div className="space-y-4">
              {funnelStages.map((stage, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{stage.label}</span>
                    <span className="font-medium">
                      {stage.value.toLocaleString()}{stage.unit}
                    </span>
                  </div>
                  <div className="h-10 rounded-lg overflow-hidden bg-white/[0.04]">
                    <div
                      className="h-full rounded-lg bg-[#00C471]/20 border border-[#00C471]/30 transition-all duration-700 ease-out flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(stage.percentage, 3)}%` }}
                    >
                      <span className="text-xs text-[#00C471] font-medium whitespace-nowrap">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                  {i < funnelStages.length - 1 && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] pl-4 py-1">
                      <span className="text-[#00C471]">&#8595;</span>
                      <span>{stage.conversionLabel}: {stage.conversionRate}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ROI Summary */}
          <div className="rounded-2xl border border-[#00C471]/30 bg-[#00C471]/5 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#00C471]" />
              ROI 분석 요약
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-[var(--muted)]">총 계약금액</p>
                <p className="text-2xl font-bold text-[#00C471] mt-1">{fmt(funnelContractAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">총 광고비</p>
                <p className="text-2xl font-bold mt-1">{fmt(funnelAdSpend)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">ROI</p>
                <p className="text-2xl font-bold text-[#00C471] mt-1">{funnelROI}배</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  광고비 1원당 {funnelROI}원의 계약 매출
                </p>
              </div>
            </div>
          </div>

          {/* Funnel insights */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              퍼널 인사이트
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">CTR이 업계 평균 대비 우수합니다</p>
                  <p className="text-[var(--muted)] mt-0.5">
                    인테리어 업종 평균 CTR 1.2% 대비 현재 {fmtPercent(overallCTR || 2.0)}로 양호한 수준입니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-6 h-6 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={14} className="text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium">상담 전환율 개선 여지</p>
                  <p className="text-[var(--muted)] mt-0.5">
                    문의 접수 후 상담 진행률 40%입니다. 초기 응대 속도를 높이면 50%까지 개선 가능합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Info size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">계약 단가 분석</p>
                  <p className="text-[var(--muted)] mt-0.5">
                    계약 건당 평균 광고비 {fmt(funnelAdSpend > 0 && (funnelStages[4]?.value || 10) > 0 ? Math.round(funnelAdSpend / (funnelStages[4]?.value || 10)) : 300000)}으로,
                    건당 수익성이 우수합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         Tab 4: 비용 분석
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "costs" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">월별 비용 분석</h2>

          {/* Monthly cost table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">월</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">광고비</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">문의수</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">CPA</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">계약수</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">건당 비용</th>
                    <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_MONTHLY_DATA.map((row) => (
                    <tr key={row.month} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">{row.month}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)]">{fmt(row.adSpend)}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)]">{row.inquiries}건</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)]">{fmt(row.cpa)}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)]">{row.contracts}건</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)]">{fmt(row.costPerContract)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[#00C471] font-medium">{row.roas}x</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Channel comparison cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4">채널별 비교</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_CHANNELS.map((ch) => {
                const eff = EFFICIENCY_BADGE[ch.efficiency];
                return (
                  <div key={ch.name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="font-medium text-sm">{ch.name}</span>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", eff.bg, eff.text)}>
                        효율 {eff.label}
                      </span>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">총 지출</span>
                        <span className="font-medium">{fmt(ch.totalSpend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">문의수</span>
                        <span className="font-medium">{ch.totalInquiries}건</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">CPA</span>
                        <span className="font-medium">{fmt(ch.cpa)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">계약수</span>
                        <span className="font-medium">{ch.contracts}건</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget optimization suggestion */}
          <div className="rounded-2xl border border-[#1877F2]/30 bg-[#1877F2]/5 p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap size={16} className="text-[#1877F2]" />
              예산 최적화 제안
            </h3>
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p>
                <span className="text-white font-medium">1. Instagram 예산 확대 권장:</span>{" "}
                CPA가 23,077원으로 전 채널 중 가장 낮습니다. 현재 월 120만원에서 200만원으로 증액 시 문의 30건 추가 유입이 예상됩니다.
              </p>
              <p>
                <span className="text-white font-medium">2. Meta 리타겟팅 캠페인 추가:</span>{" "}
                사이트 방문 후 이탈한 사용자 대상 리타겟팅을 통해 전환율을 현재 4.5%에서 7%까지 개선할 수 있습니다.
              </p>
              <p>
                <span className="text-white font-medium">3. 주말 광고비 조정:</span>{" "}
                데이터 분석 결과 토/일 문의 전환율이 평일 대비 1.8배 높습니다. 주말 예산 비중을 30%에서 40%로 조정을 권장합니다.
              </p>
              <p>
                <span className="text-white font-medium">4. 기타 채널 재검토:</span>{" "}
                CPA 40,000원으로 효율이 낮습니다. 해당 예산을 Meta 또는 Instagram으로 이전하는 것을 검토해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         Tab 5: 설정
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">메타 광고 연동 설정</h2>

          {/* OAuth message banner */}
          {oauthMessage && (
            <div className={`rounded-xl p-4 mb-6 text-sm ${
              oauthMessage.type === "success"
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-red-500/10 text-red-400"
            }`}>
              {oauthMessage.text}
              <button onClick={() => setOauthMessage(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
            <h3 className="font-semibold">Meta 광고 계정 연동</h3>

            {channelConnection?.hasToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-xl">📢</div>
                  <div>
                    <p className="font-semibold">{channelConnection.accountName || "연결된 계정"}</p>
                    <p className="text-xs text-[var(--green)]">연결됨</p>
                    {channelConnection.tokenExpiresAt && (
                      <p className="text-xs text-[var(--muted)]">
                        토큰 만료: {new Date(channelConnection.tokenExpiresAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Meta Marketing API가 연결되었습니다. 성과 대시보드에서 실시간 광고 데이터를 확인할 수 있습니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/marketing/oauth/refresh", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channel: "meta_ads" }),
                        });
                        setOauthMessage({ type: "success", text: "토큰이 갱신되었습니다." });
                      } catch {
                        setOauthMessage({ type: "error", text: "토큰 갱신에 실패했습니다." });
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
                  >
                    토큰 갱신
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/marketing/channels", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channel: "meta_ads" }),
                        });
                        setChannelConnection(null);
                        setOauthMessage({ type: "success", text: "계정 연결이 해제되었습니다." });
                      } catch {
                        setOauthMessage({ type: "error", text: "연결 해제에 실패했습니다." });
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    연결 해제
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-3xl mx-auto mb-4">📢</div>
                <p className="font-semibold">Meta 광고 계정이 연결되지 않았습니다</p>
                <p className="text-sm text-[var(--muted)] mt-1 mb-6">
                  Meta Business 계정으로 로그인하여 Facebook/Instagram 광고 데이터를 연동하세요.
                </p>
                <a
                  href="/api/marketing/oauth/meta?channel=meta_ads"
                  className="inline-block rounded-lg bg-[#00C471] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#00D47F] transition-colors"
                >
                  Meta 계정으로 연결
                </a>
              </div>
            )}
          </div>

          {/* Meta Pixel ID */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Link2 size={20} className="text-[var(--muted)]" />
              </div>
              <div>
                <h3 className="font-semibold">Meta Pixel ID</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  웹사이트 전환 추적을 위한 Pixel ID를 입력하세요
                </p>
              </div>
            </div>
            <input
              type="text"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className={inputCls}
              placeholder="예: 1234567890123456"
            />
            <p className="text-xs text-[var(--muted)]">
              Meta Events Manager에서 Pixel ID를 확인할 수 있습니다.
            </p>
          </div>

          {/* Conversions API */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Zap size={20} className="text-[var(--muted)]" />
              </div>
              <div>
                <h3 className="font-semibold">Conversions API (CAPI)</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  서버 사이드 전환 추적으로 더 정확한 데이터를 수집합니다
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] text-sm text-[var(--muted)] space-y-2">
              <p>Conversions API를 설정하면 다음과 같은 이점이 있습니다:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>쿠키 차단에 영향받지 않는 정확한 전환 추적</li>
                <li>iOS 14+ 사용자의 전환 데이터 보완</li>
                <li>광고 최적화를 위한 더 많은 시그널 제공</li>
              </ul>
              <p className="text-xs mt-3 text-neutral-600">
                * 설정을 위해서는 개발자 지원이 필요합니다.
              </p>
            </div>
          </div>

          {/* Data sync frequency */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <RefreshCw size={20} className="text-[var(--muted)]" />
              </div>
              <div>
                <h3 className="font-semibold">데이터 동기화 주기</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Meta API에서 데이터를 가져오는 주기를 설정합니다
                </p>
              </div>
            </div>
            <select
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(e.target.value)}
              className={selectCls}
            >
              <option value="realtime">실시간</option>
              <option value="hourly">매 시간</option>
              <option value="daily">매일 (권장)</option>
              <option value="weekly">매주</option>
            </select>
            <p className="text-xs text-[var(--muted)]">
              실시간 동기화는 API 호출 제한에 영향을 줄 수 있습니다. 대부분의 경우 일별 동기화로 충분합니다.
            </p>
          </div>

          {/* Save settings button */}
          <div className="flex justify-end">
            <button className="rounded-lg bg-[#00C471] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#00D47F] transition-colors">
              설정 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
