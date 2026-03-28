"use client";

import { useEffect, useState, useCallback } from "react";
import { fmtDate } from "@/lib/utils";
import AccountConnectionBanner from "@/components/marketing/AccountConnectionBanner";
import FeatureGate from "@/components/subscription/FeatureGate";

/* ═══════════════ Types ═══════════════ */

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  sourceKeyword?: string;
  grade: string;
  score: number;
  status: string;
  area?: string;
  buildingType?: string;
  areaPyeong?: number;
  budget?: string;
  timeline?: string;
  memo?: string;
  lastContactedAt?: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  targetGrade?: string[];
  steps?: CampaignStep[];
  totalSent: number;
  totalDelivered: number;
  totalConverted: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface CampaignStep {
  day: number;
  channel: string;
  templateType: string;
  content: string;
}

interface OutreachLog {
  id: string;
  leadId?: string;
  campaignId?: string;
  channel: string;
  templateType?: string;
  content: string;
  recipientPhone: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  channel: string;
  templateType: string;
  subject?: string;
  body: string;
  variables?: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface LeadStats {
  total: number;
  byGrade: Record<string, number>;
  byStatus: Record<string, number>;
}

/* ═══════════════ Constants ═══════════════ */

const TABS = [
  "대시보드",
  "리드 관리",
  "발송 관리",
  "캠페인",
  "콘텐츠 템플릿",
  "분석",
  "설정",
] as const;

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  B: { bg: "bg-blue-500/15", text: "text-blue-400" },
  C: { bg: "bg-neutral-500/15", text: "text-neutral-400" },
};

const STATUS_LABELS: Record<string, string> = {
  new: "신규",
  contacted: "연락완료",
  responding: "응답중",
  qualified: "유망",
  converted: "전환",
  lost: "이탈",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-blue-500/15", text: "text-blue-400" },
  contacted: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  responding: { bg: "bg-purple-500/15", text: "text-purple-400" },
  qualified: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  converted: { bg: "bg-[#00C471]/15", text: "text-[#00C471]" },
  lost: { bg: "bg-red-500/15", text: "text-red-400" },
};

const SOURCE_LABELS: Record<string, string> = {
  naver_cafe: "네이버 카페",
  instagram: "인스타그램",
  referral: "소개",
  manual: "수동 등록",
  landing_page: "랜딩페이지",
};

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  first_contact: "첫 연락",
  follow_up: "팔로업",
  portfolio: "포트폴리오",
  promotion: "프로모션",
  maintenance: "유지보수",
  referral: "소개 요청",
};

const OUTREACH_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  sent: "발송됨",
  delivered: "전달됨",
  failed: "실패",
  opened: "열람",
  clicked: "클릭",
};

const OUTREACH_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-neutral-500/15", text: "text-neutral-400" },
  sent: { bg: "bg-blue-500/15", text: "text-blue-400" },
  delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  failed: { bg: "bg-red-500/15", text: "text-red-400" },
  opened: { bg: "bg-purple-500/15", text: "text-purple-400" },
  clicked: { bg: "bg-[#00C471]/15", text: "text-[#00C471]" },
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  active: "활성",
  paused: "일시중지",
  completed: "완료",
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[#00C471] focus:outline-none";

/* ═══════════════ Page ═══════════════ */

export default function SmsAutomationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("대시보드");
  const [loading, setLoading] = useState(true);

  /* ── Data ── */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats>({
    total: 0,
    byGrade: {},
    byStatus: {},
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [outreachStats, setOutreachStats] = useState<Record<string, number>>({});
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);

  /* ── Modals ── */
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTarget, setSendTarget] = useState<Lead | null>(null);

  /* ── Forms ── */
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    source: "manual",
    grade: "C",
    area: "",
    buildingType: "",
    areaPyeong: "",
    budget: "",
    timeline: "",
    memo: "",
  });

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "drip",
    targetGrade: ["A", "B"],
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    channel: "sms",
    templateType: "first_contact",
    body: "",
  });

  const [sendForm, setSendForm] = useState({
    content: "",
    channel: "sms",
  });

  /* ── Filters ── */
  const [leadGradeFilter, setLeadGradeFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");

  /* ── Solapi Platform Stats ── */
  const [smsConnected, setSmsConnected] = useState(false);
  const [solapiStats, setSolapiStats] = useState<{
    account: { senderPhone: string; balance: number };
    stats: { totalSent: number; delivered: number; failed: number; pending: number };
    recentMessages: Array<{ messageId: string; to: string; text: string; status: string; sentAt: string }>;
  } | null>(null);
  const [solapiLoading, setSolapiLoading] = useState(false);

  const fetchSolapiStats = useCallback(async () => {
    setSolapiLoading(true);
    try {
      const res = await fetch("/api/marketing/sms/stats");
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setSolapiStats(data);
      }
    } catch { /* */ }
    finally { setSolapiLoading(false); }
  }, []);

  useEffect(() => {
    if (smsConnected) fetchSolapiStats();
  }, [smsConnected, fetchSolapiStats]);

  /* ── Fetch ── */
  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (leadGradeFilter) params.set("grade", leadGradeFilter);
      if (leadStatusFilter) params.set("status", leadStatusFilter);
      const res = await fetch(`/api/marketing/sms/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setLeadStats(data.stats || { total: 0, byGrade: {}, byStatus: {} });
      }
    } catch { /* */ }
  }, [leadGradeFilter, leadStatusFilter]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/sms/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch { /* */ }
  }, []);

  const fetchOutreach = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/sms/outreach");
      if (res.ok) {
        const data = await res.json();
        setOutreachLogs(data.logs || []);
        setOutreachStats(data.stats || {});
      }
    } catch { /* */ }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/sms/content");
      if (res.ok) setTemplates(await res.json());
    } catch { /* */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchLeads(), fetchCampaigns(), fetchOutreach(), fetchTemplates()]).finally(() =>
      setLoading(false)
    );
  }, [fetchLeads, fetchCampaigns, fetchOutreach, fetchTemplates]);

  /* ── Actions ── */
  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/sms/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          areaPyeong: leadForm.areaPyeong ? parseFloat(leadForm.areaPyeong) : undefined,
        }),
      });
      if (res.ok) {
        fetchLeads();
        setShowLeadModal(false);
        setLeadForm({ name: "", phone: "", source: "manual", grade: "C", area: "", buildingType: "", areaPyeong: "", budget: "", timeline: "", memo: "" });
      }
    } catch { /* */ }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/marketing/sms/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchLeads();
    } catch { /* */ }
  };

  const updateLeadGrade = async (id: string, grade: string) => {
    try {
      await fetch("/api/marketing/sms/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, grade }),
      });
      fetchLeads();
    } catch { /* */ }
  };

  const deleteLead = async (id: string) => {
    try {
      await fetch("/api/marketing/sms/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchLeads();
    } catch { /* */ }
  };

  const submitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/sms/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });
      if (res.ok) {
        fetchCampaigns();
        setShowCampaignModal(false);
        setCampaignForm({ name: "", type: "drip", targetGrade: ["A", "B"] });
      }
    } catch { /* */ }
  };

  const submitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/sms/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      if (res.ok) {
        fetchTemplates();
        setShowTemplateModal(false);
        setTemplateForm({ name: "", channel: "sms", templateType: "first_contact", body: "" });
      }
    } catch { /* */ }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTarget) return;
    try {
      const res = await fetch("/api/marketing/sms/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: sendTarget.id,
          channel: sendForm.channel,
          content: sendForm.content,
          recipientPhone: sendTarget.phone,
        }),
      });
      if (res.ok) {
        fetchOutreach();
        fetchLeads();
        setShowSendModal(false);
        setSendTarget(null);
        setSendForm({ content: "", channel: "sms" });
      }
    } catch { /* */ }
  };

  const openSendModal = (lead: Lead) => {
    setSendTarget(lead);
    setSendForm({ content: "", channel: "sms" });
    setShowSendModal(true);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-96 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  /* ═══════════════ Render ═══════════════ */
  return (
    <FeatureGate feature="marketingAutomation" label="SMS 자동화">
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold">SMS 자동화</h1>
        <p className="text-sm text-neutral-500 mt-1">
          리드 수집 → AI 스코어링 → 자동 발송 → 전환 추적
        </p>
      </div>

      {/* ── Account Connection ── */}
      <AccountConnectionBanner
        channel="sms"
        channelLabel="SMS 자동화"
        channelIcon="💬"
        connectionType="api_key"
        onConnectionChange={(connected) => setSmsConnected(connected)}
      />

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "bg-[var(--border)] text-[var(--foreground)]"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === "대시보드" && (
        <DashboardTab
          leadStats={leadStats}
          campaigns={campaigns}
          outreachStats={outreachStats}
          leads={leads}
        />
      )}

      {tab === "리드 관리" && (
        <LeadManagementTab
          leads={leads}
          leadStats={leadStats}
          gradeFilter={leadGradeFilter}
          statusFilter={leadStatusFilter}
          setGradeFilter={setLeadGradeFilter}
          setStatusFilter={setLeadStatusFilter}
          onAdd={() => setShowLeadModal(true)}
          onSend={openSendModal}
          onUpdateStatus={updateLeadStatus}
          onUpdateGrade={updateLeadGrade}
          onDelete={deleteLead}
        />
      )}

      {tab === "발송 관리" && (
        <OutreachTab logs={outreachLogs} stats={outreachStats} />
      )}

      {tab === "캠페인" && (
        <CampaignTab
          campaigns={campaigns}
          onAdd={() => setShowCampaignModal(true)}
        />
      )}

      {tab === "콘텐츠 템플릿" && (
        <ContentTemplateTab
          templates={templates}
          onAdd={() => setShowTemplateModal(true)}
        />
      )}

      {tab === "분석" && (
        <AnalyticsTab
          leadStats={leadStats}
          outreachStats={outreachStats}
          campaigns={campaigns}
          leads={leads}
          solapiStats={solapiStats}
          solapiLoading={solapiLoading}
          onRefreshSolapi={fetchSolapiStats}
        />
      )}

      {tab === "설정" && <SettingsTab />}

      {/* ═══════════════ Modals ═══════════════ */}

      {/* ── Lead Modal ── */}
      {showLeadModal && (
        <ModalOverlay onClose={() => setShowLeadModal(false)}>
          <h3 className="text-lg font-semibold">리드 추가</h3>
          <form onSubmit={submitLead} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">이름 *</label>
                <input required value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className={inputCls} placeholder="고객명" />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">전화번호 *</label>
                <input required value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className={inputCls} placeholder="010-0000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">유입 경로</label>
                <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className={selectCls}>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">등급</label>
                <select value={leadForm.grade} onChange={(e) => setLeadForm({ ...leadForm, grade: e.target.value })} className={selectCls}>
                  <option value="A">A (유망)</option>
                  <option value="B">B (관심)</option>
                  <option value="C">C (잠재)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">지역</label>
                <input value={leadForm.area} onChange={(e) => setLeadForm({ ...leadForm, area: e.target.value })} className={inputCls} placeholder="서울 강남" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">건물유형</label>
                <select value={leadForm.buildingType} onChange={(e) => setLeadForm({ ...leadForm, buildingType: e.target.value })} className={selectCls}>
                  <option value="">선택</option>
                  <option value="아파트">아파트</option>
                  <option value="빌라">빌라</option>
                  <option value="오피스텔">오피스텔</option>
                  <option value="주택">주택</option>
                  <option value="상가">상가</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">평수</label>
                <input value={leadForm.areaPyeong} onChange={(e) => setLeadForm({ ...leadForm, areaPyeong: e.target.value })} className={inputCls} placeholder="32" />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">예산</label>
                <input value={leadForm.budget} onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })} className={inputCls} placeholder="3000만원" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">시공 희망 시기</label>
              <input value={leadForm.timeline} onChange={(e) => setLeadForm({ ...leadForm, timeline: e.target.value })} className={inputCls} placeholder="2026년 4월" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">메모</label>
              <textarea value={leadForm.memo} onChange={(e) => setLeadForm({ ...leadForm, memo: e.target.value })} className={`${inputCls} resize-none h-20`} placeholder="추가 정보" />
            </div>
            <ModalButtons onCancel={() => setShowLeadModal(false)} submitLabel="등록" />
          </form>
        </ModalOverlay>
      )}

      {/* ── Send Modal ── */}
      {showSendModal && sendTarget && (
        <ModalOverlay onClose={() => setShowSendModal(false)}>
          <h3 className="text-lg font-semibold">메시지 발송</h3>
          <p className="text-sm text-neutral-500 mt-1">
            {sendTarget.name} ({sendTarget.phone})
          </p>
          <form onSubmit={sendMessage} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">발송 채널</label>
              <select value={sendForm.channel} onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })} className={selectCls}>
                <option value="sms">SMS</option>
                <option value="alimtalk">알림톡</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">내용 *</label>
              <textarea required value={sendForm.content} onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })} className={`${inputCls} resize-none h-32`} placeholder="메시지 내용을 입력하세요" />
              <p className="text-xs text-neutral-600 mt-1">
                {sendForm.channel === "sms" ? "90바이트 초과 시 LMS로 자동 전환" : "알림톡은 카카오 승인 템플릿 필요"}
              </p>
            </div>
            <ModalButtons onCancel={() => setShowSendModal(false)} submitLabel="발송" />
          </form>
        </ModalOverlay>
      )}

      {/* ── Campaign Modal ── */}
      {showCampaignModal && (
        <ModalOverlay onClose={() => setShowCampaignModal(false)}>
          <h3 className="text-lg font-semibold">캠페인 생성</h3>
          <form onSubmit={submitCampaign} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">캠페인명 *</label>
              <input required value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className={inputCls} placeholder="신규 리드 드립 캠페인" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">유형</label>
              <select value={campaignForm.type} onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })} className={selectCls}>
                <option value="drip">드립 (단계별 자동발송)</option>
                <option value="blast">일괄 발송</option>
                <option value="trigger">트리거 (조건 발동)</option>
              </select>
            </div>
            <ModalButtons onCancel={() => setShowCampaignModal(false)} submitLabel="생성" />
          </form>
        </ModalOverlay>
      )}

      {/* ── Template Modal ── */}
      {showTemplateModal && (
        <ModalOverlay onClose={() => setShowTemplateModal(false)}>
          <h3 className="text-lg font-semibold">템플릿 추가</h3>
          <form onSubmit={submitTemplate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">이름 *</label>
              <input required value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} className={inputCls} placeholder="첫 인사 메시지" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">채널</label>
                <select value={templateForm.channel} onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })} className={selectCls}>
                  <option value="sms">SMS</option>
                  <option value="alimtalk">알림톡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">유형</label>
                <select value={templateForm.templateType} onChange={(e) => setTemplateForm({ ...templateForm, templateType: e.target.value })} className={selectCls}>
                  {Object.entries(TEMPLATE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">내용 *</label>
              <textarea required value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} className={`${inputCls} resize-none h-32`} placeholder={"안녕하세요 {{고객명}}님, 인테리어코치입니다.\n{{지역}} {{평수}}평 인테리어 관련 문의를 확인했습니다."} />
              <p className="text-xs text-neutral-600 mt-1">
                {"변수: {{고객명}}, {{지역}}, {{평수}}, {{예산}}, {{시공시기}}"}
              </p>
            </div>
            <ModalButtons onCancel={() => setShowTemplateModal(false)} submitLabel="저장" />
          </form>
        </ModalOverlay>
      )}
    </div>
    </FeatureGate>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════ */

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-2 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/[0.06] text-sm text-neutral-500 hover:bg-[var(--border)] transition-colors">
        취소
      </button>
      <button type="submit" className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors">
        {submitLabel}
      </button>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Dashboard Tab ── */

function DashboardTab({
  leadStats,
  campaigns,
  outreachStats,
  leads,
}: {
  leadStats: LeadStats;
  campaigns: Campaign[];
  outreachStats: Record<string, number>;
  leads: Lead[];
}) {
  const totalSent = Object.values(outreachStats).reduce((a, b) => a + b, 0);
  const delivered = outreachStats["delivered"] || 0;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const conversionRate =
    leadStats.total > 0
      ? Math.round(((leadStats.byStatus["converted"] || 0) / leadStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="총 리드" value={leadStats.total} sub={`A등급 ${leadStats.byGrade["A"] || 0}건`} />
        <KPI label="총 발송" value={totalSent} sub={`전달 ${delivered}건`} />
        <KPI label="전환율" value={`${conversionRate}%`} sub={`전환 ${leadStats.byStatus["converted"] || 0}건`} />
        <KPI label="활성 캠페인" value={activeCampaigns} />
      </div>

      {/* Lead Funnel */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h3 className="font-semibold mb-4">리드 퍼널</h3>
        <div className="space-y-3">
          {(["new", "contacted", "responding", "qualified", "converted"] as const).map((status) => {
            const count = leadStats.byStatus[status] || 0;
            const pct = leadStats.total > 0 ? (count / leadStats.total) * 100 : 0;
            const sc = STATUS_COLORS[status];
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm text-neutral-500 w-20">{STATUS_LABELS[status]}</span>
                <div className="flex-1 h-6 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sc.bg.replace("/15", "/40")} transition-all`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">{count}건 ({Math.round(pct)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h3 className="font-semibold mb-4">최근 리드</h3>
        {leads.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">등록된 리드가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">이름</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">등급</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">상태</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">유입</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">등록일</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map((l) => {
                  const gc = GRADE_COLORS[l.grade] || GRADE_COLORS.C;
                  const sc = STATUS_COLORS[l.status] || STATUS_COLORS.new;
                  return (
                    <tr key={l.id} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="px-4 py-3 font-medium">{l.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gc.bg} ${gc.text}`}>{l.grade}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.text}`}>{STATUS_LABELS[l.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{SOURCE_LABELS[l.source] || l.source}</td>
                      <td className="px-4 py-3 text-neutral-500">{fmtDate(l.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Lead Management Tab ── */

function LeadManagementTab({
  leads,
  leadStats,
  gradeFilter,
  statusFilter,
  setGradeFilter,
  setStatusFilter,
  onAdd,
  onSend,
  onUpdateStatus,
  onUpdateGrade,
  onDelete,
}: {
  leads: Lead[];
  leadStats: LeadStats;
  gradeFilter: string;
  statusFilter: string;
  setGradeFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  onAdd: () => void;
  onSend: (lead: Lead) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateGrade: (id: string, grade: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Grade Summary */}
      <div className="grid grid-cols-4 gap-3">
        <KPI label="전체 리드" value={leadStats.total} />
        {(["A", "B", "C"] as const).map((g) => (
          <KPI key={g} label={`${g}등급`} value={leadStats.byGrade[g] || 0} />
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--card)] border border-white/[0.06] text-sm text-white"
        >
          <option value="">모든 등급</option>
          <option value="A">A등급</option>
          <option value="B">B등급</option>
          <option value="C">C등급</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--card)] border border-white/[0.06] text-sm text-white"
        >
          <option value="">모든 상태</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={onAdd}
          className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
        >
          리드 추가
        </button>
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-12 text-center">
          <p className="text-neutral-500 text-sm">등록된 리드가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">이름</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">전화번호</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">등급</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">상태</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">유입</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">지역</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">평수</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">등록일</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const gc = GRADE_COLORS[l.grade] || GRADE_COLORS.C;
                  const sc = STATUS_COLORS[l.status] || STATUS_COLORS.new;
                  return (
                    <tr key={l.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium">{l.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{l.phone}</td>
                      <td className="px-4 py-3">
                        <select
                          value={l.grade}
                          onChange={(e) => onUpdateGrade(l.id, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold border-0 ${gc.bg} ${gc.text} bg-transparent cursor-pointer`}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => onUpdateStatus(l.id, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-xs border-0 ${sc.bg} ${sc.text} bg-transparent cursor-pointer`}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{SOURCE_LABELS[l.source] || l.source}</td>
                      <td className="px-4 py-3 text-neutral-500">{l.area || "-"}</td>
                      <td className="px-4 py-3 text-neutral-500">{l.areaPyeong ? `${l.areaPyeong}평` : "-"}</td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSend(l)}
                            className="px-2 py-1 rounded-md bg-[#00C471]/10 text-[#00C471] text-xs hover:bg-[#00C471]/20"
                          >
                            발송
                          </button>
                          <button
                            onClick={() => onDelete(l.id)}
                            className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Outreach Tab ── */

function OutreachTab({
  logs,
  stats,
}: {
  logs: OutreachLog[];
  stats: Record<string, number>;
}) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(OUTREACH_STATUS_LABELS).map(([k, v]) => (
          <KPI key={k} label={v} value={stats[k] || 0} />
        ))}
      </div>

      {/* Log */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-12 text-center">
          <p className="text-neutral-500 text-sm">발송 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">수신번호</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">채널</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">내용</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">상태</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">발송일시</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const sc = OUTREACH_STATUS_COLORS[log.status] || OUTREACH_STATUS_COLORS.pending;
                  return (
                    <tr key={log.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-neutral-400">{log.recipientPhone}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs">
                          {log.channel === "alimtalk" ? "알림톡" : "SMS"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 max-w-[300px] truncate">{log.content}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.text}`}>
                          {OUTREACH_STATUS_LABELS[log.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {log.sentAt ? fmtDate(log.sentAt) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Campaign Tab ── */

function CampaignTab({
  campaigns,
  onAdd,
}: {
  campaigns: Campaign[];
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">드립 캠페인</h3>
        <button
          onClick={onAdd}
          className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
        >
          캠페인 생성
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h4 className="font-semibold text-sm mb-3">드립 캠페인이란?</h4>
        <p className="text-sm text-neutral-500 leading-relaxed">
          리드가 등록되면 설정된 일정에 따라 자동으로 메시지를 발송하는 시퀀스입니다.
          D+0(첫 인사) → D+3(포트폴리오) → D+7(할인 혜택) → D+14(리마인드) 등
          단계적 접근으로 전환율을 높일 수 있습니다.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-12 text-center">
          <p className="text-neutral-500 text-sm">생성된 캠페인이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{c.name}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {c.type === "drip" ? "드립 캠페인" : c.type === "blast" ? "일괄 발송" : "트리거"}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === "active" ? "bg-emerald-500/15 text-emerald-400" :
                  c.status === "paused" ? "bg-yellow-500/15 text-yellow-400" :
                  c.status === "completed" ? "bg-neutral-500/15 text-neutral-400" :
                  "bg-blue-500/15 text-blue-400"
                }`}>
                  {CAMPAIGN_STATUS_LABELS[c.status]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">발송</p>
                  <p className="font-medium">{c.totalSent}</p>
                </div>
                <div>
                  <p className="text-neutral-500">전달</p>
                  <p className="font-medium">{c.totalDelivered}</p>
                </div>
                <div>
                  <p className="text-neutral-500">전환</p>
                  <p className="font-medium text-[#00C471]">{c.totalConverted}</p>
                </div>
                <div>
                  <p className="text-neutral-500">생성일</p>
                  <p className="font-medium">{fmtDate(c.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Content Template Tab ── */

function ContentTemplateTab({
  templates,
  onAdd,
}: {
  templates: SmsTemplate[];
  onAdd: () => void;
}) {
  const grouped = templates.reduce<Record<string, SmsTemplate[]>>((acc, t) => {
    const key = t.templateType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">메시지 템플릿</h3>
        <button
          onClick={onAdd}
          className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
        >
          템플릿 추가
        </button>
      </div>

      {/* Default Templates Info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h4 className="font-semibold text-sm mb-3">기본 메시지 시나리오</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(TEMPLATE_TYPE_LABELS).map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p className="text-sm font-medium">{v}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {k === "first_contact" && "D+0: 첫 연락 인사 메시지"}
                {k === "follow_up" && "D+3: 관심 확인 팔로업"}
                {k === "portfolio" && "D+7: 시공사례 포트폴리오"}
                {k === "promotion" && "D+14: 할인/이벤트 안내"}
                {k === "maintenance" && "시공 후 유지보수 안내"}
                {k === "referral" && "기존 고객 소개 요청"}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {grouped[k]?.length || 0}개 템플릿
              </p>
            </div>
          ))}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-12 text-center">
          <p className="text-neutral-500 text-sm">저장된 템플릿이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{t.name}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-neutral-400">
                    {t.channel === "alimtalk" ? "알림톡" : "SMS"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-neutral-400">
                    {TEMPLATE_TYPE_LABELS[t.templateType] || t.templateType}
                  </span>
                </div>
                <span className={`text-xs ${t.isActive ? "text-emerald-400" : "text-neutral-500"}`}>
                  {t.isActive ? "활성" : "비활성"}
                </span>
              </div>
              <p className="text-sm text-neutral-400 whitespace-pre-wrap line-clamp-3">{t.body}</p>
              <p className="text-xs text-neutral-600 mt-2">사용 {t.usageCount}회</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Analytics Tab ── */

function AnalyticsTab({
  leadStats,
  outreachStats,
  campaigns,
  leads,
  solapiStats,
  solapiLoading,
  onRefreshSolapi,
}: {
  leadStats: LeadStats;
  outreachStats: Record<string, number>;
  campaigns: Campaign[];
  leads: Lead[];
  solapiStats: {
    account: { senderPhone: string; balance: number };
    stats: { totalSent: number; delivered: number; failed: number; pending: number };
    recentMessages: Array<{ messageId: string; to: string; text: string; status: string; sentAt: string }>;
  } | null;
  solapiLoading: boolean;
  onRefreshSolapi: () => void;
}) {
  const totalSent = Object.values(outreachStats).reduce((a, b) => a + b, 0);
  const delivered = outreachStats["delivered"] || 0;
  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;
  const opened = outreachStats["opened"] || 0;
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
  const clicked = outreachStats["clicked"] || 0;
  const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

  // Source breakdown
  const sourceBreakdown = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Delivery Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="전달률" value={`${deliveryRate}%`} sub={`${delivered}/${totalSent}건`} />
        <KPI label="열람률" value={`${openRate}%`} sub={`${opened}/${delivered}건`} />
        <KPI label="클릭률" value={`${clickRate}%`} sub={`${clicked}/${opened}건`} />
        <KPI label="전환" value={leadStats.byStatus["converted"] || 0} />
      </div>

      {/* Solapi Real Stats */}
      {solapiStats && (
        <div className="rounded-2xl border border-[#00C471]/20 bg-[#00C471]/[0.04] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Solapi 실시간 데이터</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00C471]/15 text-[#00C471] text-[10px] font-medium">
                실시간
              </span>
            </div>
            <button
              onClick={onRefreshSolapi}
              disabled={solapiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-neutral-400 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
            >
              새로고침
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="발송 (30일)" value={solapiStats.stats.totalSent} sub="Solapi 실시간" />
            <KPI label="성공" value={solapiStats.stats.delivered} sub={`${solapiStats.stats.totalSent > 0 ? Math.round((solapiStats.stats.delivered / solapiStats.stats.totalSent) * 100) : 0}%`} />
            <KPI label="실패" value={solapiStats.stats.failed} sub={solapiStats.stats.failed > 0 ? "확인 필요" : "정상"} />
            <KPI label="잔액" value={`${solapiStats.account.balance.toLocaleString()}원`} sub={solapiStats.account.senderPhone} />
          </div>
          {solapiStats.recentMessages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2">최근 발송 내역</h4>
              <div className="space-y-1.5">
                {solapiStats.recentMessages.slice(0, 5).map((m) => (
                  <div key={m.messageId} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{m.to}</span>
                      <span className="text-neutral-400 truncate max-w-[200px]">{m.text}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={m.status === "4000" || m.status === "delivered" ? "text-emerald-400" : m.status === "failed" ? "text-red-400" : "text-neutral-500"}>
                        {m.status === "4000" || m.status === "delivered" ? "전달됨" : m.status === "failed" ? "실패" : m.status}
                      </span>
                      {m.sentAt && <span className="text-neutral-600">{fmtDate(m.sentAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Breakdown */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h3 className="font-semibold mb-4">유입 경로 분석</h3>
        <div className="space-y-3">
          {Object.entries(sourceBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => {
              const pct = leadStats.total > 0 ? (count / leadStats.total) * 100 : 0;
              return (
                <div key={source} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500 w-24">{SOURCE_LABELS[source] || source}</span>
                  <div className="flex-1 h-5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00C471]/30 transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">{count}건 ({Math.round(pct)}%)</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
        <h3 className="font-semibold mb-4">등급별 분포</h3>
        <div className="grid grid-cols-3 gap-4">
          {(["A", "B", "C"] as const).map((g) => {
            const count = leadStats.byGrade[g] || 0;
            const pct = leadStats.total > 0 ? Math.round((count / leadStats.total) * 100) : 0;
            const gc = GRADE_COLORS[g];
            return (
              <div key={g} className="text-center p-4 rounded-xl bg-white/[0.03]">
                <span className={`inline-block px-3 py-1 rounded-full text-lg font-bold ${gc.bg} ${gc.text}`}>{g}</span>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-neutral-500">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Performance */}
      {campaigns.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
          <h3 className="font-semibold mb-4">캠페인 성과</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">캠페인명</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">발송</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">전달</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">전환</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">전환율</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const rate = c.totalSent > 0 ? Math.round((c.totalConverted / c.totalSent) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.totalSent}</td>
                      <td className="px-4 py-3">{c.totalDelivered}</td>
                      <td className="px-4 py-3 text-[#00C471]">{c.totalConverted}</td>
                      <td className="px-4 py-3">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Settings Tab ── */

function SettingsTab() {
  const [solapiKey, setSolapiKey] = useState("");
  const [solapiSecret, setSolapiSecret] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [kakaoChannel, setKakaoChannel] = useState("");
  const [autoScoring, setAutoScoring] = useState(true);
  const [autoDrip, setAutoDrip] = useState(false);

  return (
    <div className="space-y-6">
      {/* Solapi 연동 */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
        <h3 className="font-semibold">Solapi 연동</h3>
        <p className="text-xs text-neutral-500">SMS/알림톡 발송을 위한 Solapi API 설정</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">API Key</label>
            <input
              type="password"
              value={solapiKey}
              onChange={(e) => setSolapiKey(e.target.value)}
              className={inputCls}
              placeholder="Solapi API Key"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">API Secret</label>
            <input
              type="password"
              value={solapiSecret}
              onChange={(e) => setSolapiSecret(e.target.value)}
              className={inputCls}
              placeholder="Solapi API Secret"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">발신 번호</label>
            <input
              type="tel"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className={inputCls}
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">카카오 채널 ID</label>
            <input
              value={kakaoChannel}
              onChange={(e) => setKakaoChannel(e.target.value)}
              className={inputCls}
              placeholder="@인테리어코치"
            />
          </div>
        </div>
        <button className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors">
          저장
        </button>
      </div>

      {/* AI 스코어링 */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
        <h3 className="font-semibold">AI 리드 스코어링</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">자동 스코어링 활성화</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              신규 리드 등록 시 Claude AI가 자동으로 A/B/C 등급을 분류합니다
            </p>
          </div>
          <button
            onClick={() => setAutoScoring(!autoScoring)}
            className={`w-12 h-6 rounded-full transition-colors ${
              autoScoring ? "bg-[#00C471]" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoScoring ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">자동 드립 캠페인 발동</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              A/B 등급 리드 등록 시 자동으로 드립 캠페인을 시작합니다
            </p>
          </div>
          <button
            onClick={() => setAutoDrip(!autoDrip)}
            className={`w-12 h-6 rounded-full transition-colors ${
              autoDrip ? "bg-[#00C471]" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoDrip ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 크롤링 설정 */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
        <h3 className="font-semibold">네이버 카페 크롤링</h3>
        <p className="text-xs text-neutral-500">
          인테리어 관련 네이버 카페에서 잠재 고객을 자동으로 수집합니다.
          크롤링 키워드와 대상 카페를 설정하세요.
        </p>
        <div>
          <label className="block text-sm text-neutral-500 mb-1">크롤링 키워드</label>
          <input
            className={inputCls}
            placeholder="인테리어 견적, 아파트 리모델링, 인테리어 추천"
            defaultValue="인테리어 견적, 아파트 리모델링, 인테리어 추천"
          />
          <p className="text-xs text-neutral-600 mt-1">쉼표로 구분</p>
        </div>
        <div>
          <label className="block text-sm text-neutral-500 mb-1">대상 카페 URL</label>
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="https://cafe.naver.com/..."
          />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
          <span className="text-yellow-400 text-sm">*</span>
          <p className="text-xs text-yellow-400/80">
            크롤링은 n8n 워크플로우와 연동하여 실행됩니다. 별도 서버 설정이 필요합니다.
          </p>
        </div>
      </div>

      {/* 알림톡 템플릿 */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-4">
        <h3 className="font-semibold">카카오 알림톡 템플릿</h3>
        <p className="text-xs text-neutral-500">
          카카오 비즈니스 채널을 통해 승인된 알림톡 템플릿을 관리합니다.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: "첫 인사", code: "INTERIOR_FIRST", status: "승인" },
            { name: "포트폴리오 안내", code: "INTERIOR_PORTFOLIO", status: "승인" },
            { name: "견적 안내", code: "INTERIOR_ESTIMATE", status: "검수중" },
            { name: "시공 완료 안내", code: "INTERIOR_COMPLETE", status: "승인" },
            { name: "유지보수 안내", code: "INTERIOR_MAINTAIN", status: "미등록" },
            { name: "소개 요청", code: "INTERIOR_REFERRAL", status: "미등록" },
          ].map((t) => (
            <div key={t.code} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-neutral-600 mt-0.5">{t.code}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                t.status === "승인" ? "bg-emerald-500/15 text-emerald-400" :
                t.status === "검수중" ? "bg-yellow-500/15 text-yellow-400" :
                "bg-neutral-500/15 text-neutral-500"
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
