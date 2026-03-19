"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Megaphone,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Image,
  Pencil,
  Trash2,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";

/* ── Types ── */
interface Inquiry {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  channel: string;
  content: string;
  status: string;
}

interface AdCampaign {
  id: string;
  channel: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  inquiries: number;
}

interface PortfolioItem {
  id: string;
  projectName: string;
  location: string;
  area: string;
  duration: string;
  photoUrl: string;
  tags: string[];
}

/* ── Constants ── */
const INQUIRY_CHANNELS = ["네이버", "인스타", "지인소개", "현수막", "기타"] as const;
const INQUIRY_STATUSES = ["신규", "상담중", "견적발송", "계약완료", "실패"] as const;
const AD_CHANNELS = ["네이버", "인스타", "페이스북", "유튜브", "기타"] as const;
const PORTFOLIO_TAGS = ["모던", "클래식", "미니멀", "북유럽", "내추럴", "럭셔리"] as const;

/* ── Demo Data ── */
const DEMO_INQUIRIES: Inquiry[] = [
  { id: "inq1", date: "2026-03-16", customerName: "김서연", phone: "010-1234-5678", channel: "네이버", content: "강남구 아파트 32평 전체 리모델링 문의", status: "신규" },
  { id: "inq2", date: "2026-03-15", customerName: "이준혁", phone: "010-2345-6789", channel: "인스타", content: "서초구 빌라 24평 부분 인테리어 (욕실+주방)", status: "상담중" },
  { id: "inq3", date: "2026-03-14", customerName: "박지민", phone: "010-3456-7890", channel: "지인소개", content: "송파구 아파트 42평 신혼집 인테리어", status: "견적발송" },
  { id: "inq4", date: "2026-03-12", customerName: "최영수", phone: "010-4567-8901", channel: "네이버", content: "마포구 오피스텔 16평 원룸 리모델링", status: "계약완료" },
  { id: "inq5", date: "2026-03-10", customerName: "정하은", phone: "010-5678-9012", channel: "현수막", content: "용산구 아파트 28평 욕실 리모델링", status: "상담중" },
  { id: "inq6", date: "2026-03-08", customerName: "한도윤", phone: "010-6789-0123", channel: "인스타", content: "성동구 빌라 20평 전체 인테리어", status: "계약완료" },
  { id: "inq7", date: "2026-03-05", customerName: "오수빈", phone: "010-7890-1234", channel: "네이버", content: "강동구 아파트 35평 주방 리모델링", status: "실패" },
  { id: "inq8", date: "2026-03-03", customerName: "윤태호", phone: "010-8901-2345", channel: "기타", content: "관악구 주택 40평 전체 리모델링", status: "견적발송" },
  { id: "inq9", date: "2026-03-01", customerName: "신미래", phone: "010-9012-3456", channel: "지인소개", content: "강서구 아파트 30평 거실+방 인테리어", status: "신규" },
];

const DEMO_CAMPAIGNS: AdCampaign[] = [
  { id: "ad1", channel: "네이버", name: "네이버 키워드광고 - 강남 인테리어", startDate: "2026-03-01", endDate: "2026-03-31", budget: 2000000, spent: 1350000, inquiries: 12 },
  { id: "ad2", channel: "인스타", name: "인스타 릴스 광고 - 시공사례", startDate: "2026-03-01", endDate: "2026-03-31", budget: 1500000, spent: 980000, inquiries: 8 },
  { id: "ad3", channel: "페이스북", name: "페이스북 리타겟팅 광고", startDate: "2026-03-01", endDate: "2026-03-31", budget: 800000, spent: 650000, inquiries: 3 },
  { id: "ad4", channel: "유튜브", name: "유튜브 시공과정 영상광고", startDate: "2026-03-10", endDate: "2026-03-31", budget: 1200000, spent: 420000, inquiries: 5 },
  { id: "ad5", channel: "네이버", name: "네이버 블로그 체험단", startDate: "2026-02-15", endDate: "2026-03-15", budget: 500000, spent: 500000, inquiries: 6 },
];

const DEMO_PORTFOLIO: PortfolioItem[] = [
  { id: "pf1", projectName: "강남 래미안 모던 리모델링", location: "서울 강남구 도곡동", area: "32평", duration: "6주", photoUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600", tags: ["모던", "미니멀"] },
  { id: "pf2", projectName: "서초 반포자이 클래식 인테리어", location: "서울 서초구 반포동", area: "45평", duration: "8주", photoUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600", tags: ["클래식", "럭셔리"] },
  { id: "pf3", projectName: "성수동 빌라 북유럽풍", location: "서울 성동구 성수동", area: "22평", duration: "4주", photoUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600", tags: ["북유럽", "내추럴"] },
  { id: "pf4", projectName: "잠실 엘스 미니멀 리모델링", location: "서울 송파구 잠실동", area: "42평", duration: "7주", photoUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600", tags: ["미니멀", "모던"] },
  { id: "pf5", projectName: "마포 래미안 내추럴 인테리어", location: "서울 마포구 공덕동", area: "28평", duration: "5주", photoUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600", tags: ["내추럴", "북유럽"] },
];

/* ── Helpers ── */
const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none";

/* ────────────────────────────────── Page ────────────────────────────────── */
export default function MarketingPage() {
  const [loading, setLoading] = useState(true);

  /* ── Inquiry State ── */
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<string>("전체");
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    phone: "",
    channel: "네이버" as string,
    content: "",
    status: "신규" as string,
  });

  /* ── Ad Campaign State ── */
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    channel: "네이버" as string,
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: "",
    spent: "",
    inquiries: "",
  });

  /* ── Portfolio State ── */
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [portfolioForm, setPortfolioForm] = useState({
    projectName: "",
    location: "",
    area: "",
    duration: "",
    photoUrl: "",
    tags: [] as string[],
  });

  /* ── Load demo data ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setInquiries(DEMO_INQUIRIES);
      setCampaigns(DEMO_CAMPAIGNS);
      setPortfolio(DEMO_PORTFOLIO);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  /* ── KPI calculations ── */
  const monthInquiries = inquiries.filter((i) => i.date.startsWith("2026-03")).length;
  const contractCount = inquiries.filter((i) => i.status === "계약완료").length;
  const conversionRate = monthInquiries > 0 ? Math.round((contractCount / monthInquiries) * 100) : 0;
  const totalAdSpent = campaigns.reduce((s, c) => s + c.spent, 0);

  /* ── Filtered inquiries ── */
  const filteredInquiries =
    inquiryFilter === "전체"
      ? inquiries
      : inquiries.filter((i) => i.status === inquiryFilter);

  /* ── Inquiry CRUD ── */
  const openCreateInquiry = () => {
    setEditingInquiry(null);
    setInquiryForm({
      date: new Date().toISOString().split("T")[0],
      customerName: "",
      phone: "",
      channel: "네이버",
      content: "",
      status: "신규",
    });
    setShowInquiryModal(true);
  };

  const openEditInquiry = (inq: Inquiry) => {
    setEditingInquiry(inq);
    setInquiryForm({
      date: inq.date,
      customerName: inq.customerName,
      phone: inq.phone,
      channel: inq.channel,
      content: inq.content,
      status: inq.status,
    });
    setShowInquiryModal(true);
  };

  const saveInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInquiry) {
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === editingInquiry.id ? { ...i, ...inquiryForm } : i
        )
      );
    } else {
      const newItem: Inquiry = {
        id: `inq_${Date.now()}`,
        ...inquiryForm,
      };
      setInquiries((prev) => [newItem, ...prev]);
    }
    setShowInquiryModal(false);
  };

  /* ── Campaign CRUD ── */
  const openCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      channel: "네이버",
      name: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      budget: "",
      spent: "",
      inquiries: "",
    });
    setShowCampaignModal(true);
  };

  const openEditCampaign = (c: AdCampaign) => {
    setEditingCampaign(c);
    setCampaignForm({
      channel: c.channel,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      budget: String(c.budget),
      spent: String(c.spent),
      inquiries: String(c.inquiries),
    });
    setShowCampaignModal(true);
  };

  const saveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      channel: campaignForm.channel,
      name: campaignForm.name,
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      budget: parseInt(campaignForm.budget) || 0,
      spent: parseInt(campaignForm.spent) || 0,
      inquiries: parseInt(campaignForm.inquiries) || 0,
    };
    if (editingCampaign) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id ? { ...c, ...parsed } : c
        )
      );
    } else {
      setCampaigns((prev) => [{ id: `ad_${Date.now()}`, ...parsed }, ...prev]);
    }
    setShowCampaignModal(false);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  /* ── Portfolio CRUD ── */
  const openCreatePortfolio = () => {
    setEditingPortfolio(null);
    setPortfolioForm({ projectName: "", location: "", area: "", duration: "", photoUrl: "", tags: [] });
    setShowPortfolioModal(true);
  };

  const openEditPortfolio = (p: PortfolioItem) => {
    setEditingPortfolio(p);
    setPortfolioForm({
      projectName: p.projectName,
      location: p.location,
      area: p.area,
      duration: p.duration,
      photoUrl: p.photoUrl,
      tags: [...p.tags],
    });
    setShowPortfolioModal(true);
  };

  const savePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPortfolio) {
      setPortfolio((prev) =>
        prev.map((p) =>
          p.id === editingPortfolio.id ? { ...p, ...portfolioForm } : p
        )
      );
    } else {
      setPortfolio((prev) => [{ id: `pf_${Date.now()}`, ...portfolioForm }, ...prev]);
    }
    setShowPortfolioModal(false);
  };

  const deletePortfolio = (id: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleTag = (tag: string) => {
    setPortfolioForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  /* ── Ad Spend Summary ── */
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalInquiriesFromAds = campaigns.reduce((s, c) => s + c.inquiries, 0);
  const averageCPA = totalInquiriesFromAds > 0 ? Math.round(totalAdSpent / totalInquiriesFromAds) : 0;

  /* ────────────────────────────── Render ────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">마케팅</h1>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="이번달 문의"
          value={`${monthInquiries}건`}
          subtitle={`신규 ${inquiries.filter((i) => i.status === "신규").length}건`}
          icon={MessageSquare}
          color="var(--blue)"
        />
        <KPICard
          title="계약 전환율"
          value={`${conversionRate}%`}
          subtitle={`${contractCount}건 계약`}
          icon={TrendingUp}
          color="var(--green)"
        />
        <KPICard
          title="이번달 광고비"
          value={fmt(totalAdSpent)}
          subtitle={`예산 대비 ${totalBudget > 0 ? Math.round((totalAdSpent / totalBudget) * 100) : 0}%`}
          icon={DollarSign}
          color="var(--orange)"
        />
        <KPICard
          title="포트폴리오"
          value={`${portfolio.length}건`}
          subtitle="완료 프로젝트"
          icon={Image}
          color="var(--green)"
        />
      </div>

      {/* ═══════════════════ Section A: 고객 문의 관리 ═══════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">고객 문의 관리</h2>
          <button
            onClick={openCreateInquiry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={18} />
            문의 등록
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {["전체", ...INQUIRY_STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setInquiryFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                inquiryFilter === status
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-white/[0.04] text-[var(--muted)]"
              }`}
            >
              {status}
              {status === "전체"
                ? ` (${inquiries.length})`
                : ` (${inquiries.filter((i) => i.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Inquiry Table */}
        {filteredInquiries.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="문의 내역이 없습니다"
            description="새로운 고객 문의를 등록해보세요."
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">날짜</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">고객명</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">연락처</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">문의경로</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">문의내용</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">상태</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">{fmtDate(inq.date)}</td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">{inq.customerName}</td>
                      <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">{inq.phone}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)]">
                          {inq.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted)] max-w-[240px] truncate">{inq.content}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={inq.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditInquiry(inq)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-white transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════ Section B: 광고비 관리 ═══════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">광고비 관리</h2>
          <button
            onClick={openCreateCampaign}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={18} />
            캠페인 등록
          </button>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)]">총 예산</p>
            <p className="text-xl font-bold mt-1">{fmt(totalBudget)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)]">총 지출</p>
            <p className="text-xl font-bold mt-1 text-[var(--orange)]">{fmt(totalAdSpent)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--orange)] transition-all"
                style={{ width: `${totalBudget > 0 ? Math.min((totalAdSpent / totalBudget) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)]">평균 CPA (문의당 비용)</p>
            <p className="text-xl font-bold mt-1">{fmt(averageCPA)}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">총 {totalInquiriesFromAds}건 문의</p>
          </div>
        </div>

        {/* Campaign Table */}
        {campaigns.length === 0 ? (
          <EmptyState icon={DollarSign} title="등록된 캠페인이 없습니다" description="광고 캠페인을 등록해보세요." />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">채널</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">캠페인명</th>
                    <th className="text-left px-5 py-3.5 text-[var(--muted)] font-medium">기간</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium">예산</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium">지출액</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium">문의수</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium">CPA</th>
                    <th className="text-right px-5 py-3.5 text-[var(--muted)] font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const cpa = c.inquiries > 0 ? Math.round(c.spent / c.inquiries) : 0;
                    const spentPct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)]">
                            {c.channel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium">{c.name}</td>
                        <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">
                          {fmtDate(c.startDate)} ~ {fmtDate(c.endDate)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">{fmt(c.budget)}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className={spentPct > 90 ? "text-[var(--red)]" : "text-[var(--orange)]"}>
                            {fmt(c.spent)}
                          </span>
                          <span className="text-xs text-[var(--muted)] ml-1">({spentPct}%)</span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">{c.inquiries}건</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">{fmt(cpa)}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditCampaign(c)}
                              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-white transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => deleteCampaign(c.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                            >
                              <Trash2 size={15} />
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
      </section>

      {/* ═══════════════════ Section C: 포트폴리오 관리 ═══════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">포트폴리오 관리</h2>
          <button
            onClick={openCreatePortfolio}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={18} />
            포트폴리오 등록
          </button>
        </div>

        {portfolio.length === 0 ? (
          <EmptyState icon={Image} title="등록된 포트폴리오가 없습니다" description="완료된 프로젝트를 등록해보세요." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-all group"
              >
                {/* Photo */}
                <div className="relative h-48 bg-white/[0.03] overflow-hidden">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.projectName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={32} className="text-[var(--muted)]" />
                    </div>
                  )}
                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditPortfolio(p)}
                      className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deletePortfolio(p.id)}
                      className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 hover:text-[var(--red)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm">{p.projectName}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {p.location} &middot; {p.area} &middot; {p.duration}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--green)]/10 text-[var(--green)] text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ Inquiry Modal ═══════════════════ */}
      <Modal
        open={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title={editingInquiry ? "문의 수정" : "문의 등록"}
      >
        <form onSubmit={saveInquiry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">고객명 *</label>
              <input
                type="text"
                required
                value={inquiryForm.customerName}
                onChange={(e) => setInquiryForm({ ...inquiryForm, customerName: e.target.value })}
                className={inputCls}
                placeholder="고객명"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">연락처 *</label>
              <input
                type="tel"
                required
                value={inquiryForm.phone}
                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                className={inputCls}
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜</label>
              <input
                type="date"
                value={inquiryForm.date}
                onChange={(e) => setInquiryForm({ ...inquiryForm, date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">문의경로</label>
              <select
                value={inquiryForm.channel}
                onChange={(e) => setInquiryForm({ ...inquiryForm, channel: e.target.value })}
                className={selectCls}
              >
                {INQUIRY_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">문의내용</label>
            <textarea
              value={inquiryForm.content}
              onChange={(e) => setInquiryForm({ ...inquiryForm, content: e.target.value })}
              className={`${inputCls} resize-none h-20`}
              placeholder="문의 내용을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
            <select
              value={inquiryForm.status}
              onChange={(e) => setInquiryForm({ ...inquiryForm, status: e.target.value })}
              className={selectCls}
            >
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInquiryModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingInquiry ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════ Campaign Modal ═══════════════════ */}
      <Modal
        open={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title={editingCampaign ? "캠페인 수정" : "캠페인 등록"}
      >
        <form onSubmit={saveCampaign} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">채널</label>
              <select
                value={campaignForm.channel}
                onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                className={selectCls}
              >
                {AD_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">캠페인명 *</label>
              <input
                type="text"
                required
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className={inputCls}
                placeholder="캠페인명"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작일</label>
              <input
                type="date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료일</label>
              <input
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">예산</label>
              <input
                type="number"
                value={campaignForm.budget}
                onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">지출액</label>
              <input
                type="number"
                value={campaignForm.spent}
                onChange={(e) => setCampaignForm({ ...campaignForm, spent: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">문의수</label>
              <input
                type="number"
                value={campaignForm.inquiries}
                onChange={(e) => setCampaignForm({ ...campaignForm, inquiries: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCampaignModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingCampaign ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════ Portfolio Modal ═══════════════════ */}
      <Modal
        open={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        title={editingPortfolio ? "포트폴리오 수정" : "포트폴리오 등록"}
      >
        <form onSubmit={savePortfolio} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">프로젝트명 *</label>
            <input
              type="text"
              required
              value={portfolioForm.projectName}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, projectName: e.target.value })}
              className={inputCls}
              placeholder="프로젝트명"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">위치</label>
              <input
                type="text"
                value={portfolioForm.location}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, location: e.target.value })}
                className={inputCls}
                placeholder="서울 강남구 도곡동"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">면적</label>
              <input
                type="text"
                value={portfolioForm.area}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, area: e.target.value })}
                className={inputCls}
                placeholder="32평"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">공사기간</label>
              <input
                type="text"
                value={portfolioForm.duration}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, duration: e.target.value })}
                className={inputCls}
                placeholder="6주"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">대표사진 URL</label>
              <input
                type="url"
                value={portfolioForm.photoUrl}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, photoUrl: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">태그</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PORTFOLIO_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    portfolioForm.tags.includes(tag)
                      ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                      : "bg-white/[0.04] text-[var(--muted)] border border-[var(--border)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPortfolioModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingPortfolio ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
