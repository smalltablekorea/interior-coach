"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Megaphone,
  X,
  TrendingUp,
  DollarSign,
  Target,
  MousePointer,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MKT_CAMPAIGN_STATUS_LABELS,
  MKT_CAMPAIGN_CHANNEL_LABELS,
} from "@/lib/types/marketing";
import type { MktCampaignStatus, MktCampaignChannel } from "@/lib/types/marketing";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  pending_approval: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  active: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  paused: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  completed: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
};

const CHANNEL_COLORS: Record<string, string> = {
  email: "text-blue-400",
  kakao: "text-yellow-400",
  search_ads: "text-[var(--green)]",
  retargeting: "text-purple-400",
  content: "text-[var(--orange)]",
};

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  channel: string;
  status: string;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  kpiMetric: string | null;
  kpiTarget: number | null;
  kpiCurrent: number;
  impressions: number;
  clicks: number;
  signups: number;
  payments: number;
  revenue: number;
  targetSegmentId: string | null;
  segmentName: string | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch("/api/admin/marketing/campaigns")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const updateStatus = (id: string, status: string) => {
    fetch("/api/admin/marketing/campaigns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).then(() => fetchCampaigns());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          총 {campaigns.length}개 캠페인
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> 캠페인 추가
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <Megaphone size={32} className="mx-auto mb-2" />
          <p className="text-sm">캠페인이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const sColor = STATUS_COLORS[campaign.status] || STATUS_COLORS.draft;
            const budgetPercent = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
            const kpiPercent = campaign.kpiTarget ? Math.round((campaign.kpiCurrent / campaign.kpiTarget) * 100) : 0;

            return (
              <div
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          sColor.bg,
                          sColor.text
                        )}
                      >
                        {MKT_CAMPAIGN_STATUS_LABELS[campaign.status as MktCampaignStatus] || campaign.status}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          CHANNEL_COLORS[campaign.channel] || "text-[var(--muted)]"
                        )}
                      >
                        {MKT_CAMPAIGN_CHANNEL_LABELS[campaign.channel as MktCampaignChannel] || campaign.channel}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-xs text-[var(--muted)]">
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-1">
                    {campaign.status === "draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(campaign.id, "active");
                        }}
                        className="px-2 py-1 rounded text-[10px] bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20"
                      >
                        집행
                      </button>
                    )}
                    {campaign.status === "active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(campaign.id, "paused");
                        }}
                        className="px-2 py-1 rounded text-[10px] bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                      >
                        중지
                      </button>
                    )}
                    {campaign.status === "paused" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(campaign.id, "active");
                        }}
                        className="px-2 py-1 rounded text-[10px] bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20"
                      >
                        재개
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-5 gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-xs font-medium tabular-nums">{campaign.impressions.toLocaleString()}</p>
                      <p className="text-[9px] text-[var(--muted)]">노출</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MousePointer size={12} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-xs font-medium tabular-nums">{campaign.clicks.toLocaleString()}</p>
                      <p className="text-[9px] text-[var(--muted)]">클릭</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserPlus size={12} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-xs font-medium tabular-nums">{campaign.signups.toLocaleString()}</p>
                      <p className="text-[9px] text-[var(--muted)]">가입</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-xs font-medium tabular-nums">{campaign.payments.toLocaleString()}</p>
                      <p className="text-[9px] text-[var(--muted)]">결제</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-xs font-medium tabular-nums">{(campaign.revenue / 10000).toFixed(0)}만</p>
                      <p className="text-[9px] text-[var(--muted)]">매출</p>
                    </div>
                  </div>
                </div>

                {/* Budget & KPI Bars */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {campaign.budget > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[var(--muted)]">예산 소진</span>
                        <span className="tabular-nums">{budgetPercent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            budgetPercent > 90 ? "bg-[var(--red)]" : budgetPercent > 70 ? "bg-[var(--orange)]" : "bg-[var(--green)]"
                          )}
                          style={{ width: `${Math.min(100, budgetPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {campaign.kpiTarget && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[var(--muted)]">KPI 달성</span>
                        <span className="tabular-nums">{kpiPercent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            kpiPercent >= 100 ? "bg-[var(--green)]" : kpiPercent >= 50 ? "bg-blue-400" : "bg-[var(--orange)]"
                          )}
                          style={{ width: `${Math.min(100, kpiPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted)]">
                  {campaign.segmentName && (
                    <span>세그먼트: {campaign.segmentName}</span>
                  )}
                  {campaign.startDate && (
                    <span>
                      {campaign.startDate}
                      {campaign.endDate ? ` ~ ${campaign.endDate}` : " ~"}
                    </span>
                  )}
                  {campaign.utmCampaign && (
                    <span>UTM: {campaign.utmCampaign}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchCampaigns();
          }}
        />
      )}

      {/* Detail Panel */}
      {selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("email");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    setSaving(true);
    fetch("/api/admin/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        channel,
        description: description || undefined,
        goal: goal || undefined,
        budget: budget ? Number(budget) : undefined,
      }),
    })
      .then(() => {
        setSaving(false);
        onSaved();
      })
      .catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">새 캠페인</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="캠페인 이름"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">채널 *</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
            >
              {Object.entries(MKT_CAMPAIGN_CHANNEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="캠페인 설명"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">목표</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="예: 신규 가입자 100명"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">예산 (원)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.06]"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignDetail({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const sColor = STATUS_COLORS[campaign.status] || STATUS_COLORS.draft;
  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1) : "0";
  const cvr = campaign.clicks > 0 ? ((campaign.signups / campaign.clicks) * 100).toFixed(1) : "0";
  const roas = campaign.spent > 0 ? ((campaign.revenue / campaign.spent) * 100).toFixed(0) : "-";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--card)] z-10 p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-medium">캠페인 상세</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-bold">{campaign.name}</p>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  sColor.bg, sColor.text
                )}
              >
                {MKT_CAMPAIGN_STATUS_LABELS[campaign.status as MktCampaignStatus] || campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-[var(--muted)]">{campaign.description}</p>
            )}
            {campaign.goal && (
              <p className="text-xs text-[var(--muted)] mt-1">목표: {campaign.goal}</p>
            )}
          </div>

          {/* Performance */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
              <p className="text-lg font-bold tabular-nums">{ctr}%</p>
              <p className="text-[10px] text-[var(--muted)]">CTR</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
              <p className="text-lg font-bold tabular-nums">{cvr}%</p>
              <p className="text-[10px] text-[var(--muted)]">CVR</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
              <p className="text-lg font-bold tabular-nums">{roas}%</p>
              <p className="text-[10px] text-[var(--muted)]">ROAS</p>
            </div>
          </div>

          {/* Detail Rows */}
          <div className="space-y-2 text-sm">
            <DetailRow label="채널" value={MKT_CAMPAIGN_CHANNEL_LABELS[campaign.channel as MktCampaignChannel] || campaign.channel} />
            <DetailRow label="노출" value={campaign.impressions.toLocaleString()} />
            <DetailRow label="클릭" value={campaign.clicks.toLocaleString()} />
            <DetailRow label="가입" value={campaign.signups.toLocaleString()} />
            <DetailRow label="결제" value={campaign.payments.toLocaleString()} />
            <DetailRow label="매출" value={`₩${campaign.revenue.toLocaleString()}`} />
            <DetailRow label="예산" value={`₩${campaign.budget.toLocaleString()}`} />
            <DetailRow label="집행액" value={`₩${campaign.spent.toLocaleString()}`} />
            {campaign.segmentName && <DetailRow label="세그먼트" value={campaign.segmentName} />}
            {campaign.startDate && <DetailRow label="기간" value={`${campaign.startDate} ~ ${campaign.endDate || "진행중"}`} />}
            {campaign.utmCampaign && <DetailRow label="UTM Campaign" value={campaign.utmCampaign} />}
            {campaign.utmSource && <DetailRow label="UTM Source" value={campaign.utmSource} />}
            {campaign.utmMedium && <DetailRow label="UTM Medium" value={campaign.utmMedium} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
