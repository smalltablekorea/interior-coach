"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate } from "@/lib/utils";
import FeatureGate from "@/components/subscription/FeatureGate";

/* ── Types ── */
interface Inquiry {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  email?: string;
  channel: string;
  content: string;
  status: string;
}

interface ChannelStat {
  slug: string;
  name: string;
  icon: string;
  connected: boolean;
  postCount: number;
}

interface MarketingData {
  totalContent: number;
  totalPosts: number;
  totalInquiries: number;
  recentInquiries: Inquiry[];
  channelStats: ChannelStat[];
  inquiryStats: { contractCount: number };
}

/* ── Constants ── */
const INQUIRY_CHANNELS = [
  "네이버",
  "인스타",
  "유튜브",
  "스레드",
  "애드로그",
  "지인소개",
  "현수막",
  "기타",
] as const;

const INQUIRY_STATUSES = [
  "신규",
  "상담중",
  "견적발송",
  "계약완료",
  "실패",
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  신규: { bg: "bg-blue-500/15", text: "text-blue-400" },
  상담중: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  견적발송: { bg: "bg-purple-500/15", text: "text-purple-400" },
  계약완료: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  실패: { bg: "bg-red-500/15", text: "text-red-400" },
};

const DEFAULT_CHANNELS: ChannelStat[] = [
  { slug: "threads", name: "스레드", icon: "🧵", connected: true, postCount: 0 },
  { slug: "instagram", name: "인스타그램", icon: "📸", connected: false, postCount: 0 },
  { slug: "naver-blog", name: "네이버 블로그", icon: "📝", connected: false, postCount: 0 },
  { slug: "youtube", name: "유튜브", icon: "🎬", connected: false, postCount: 0 },
  { slug: "meta-ads", name: "메타 광고", icon: "📢", connected: false, postCount: 0 },
  { slug: "sms", name: "SMS 자동화", icon: "💬", connected: false, postCount: 0 },
  { slug: "adlog", name: "애드로그", icon: "📊", connected: false, postCount: 0 },
];

/* ── Helpers ── */
const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-white text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-white text-sm focus:border-[#00C471] focus:outline-none";

/* ══════════════════════════════════ Page ══════════════════════════════════ */
export default function MarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  /* ── Data State ── */
  const [totalContent, setTotalContent] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [contractCount, setContractCount] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [channels, setChannels] = useState<ChannelStat[]>(DEFAULT_CHANNELS);

  /* ── Modal State ── */
  const [showModal, setShowModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    channel: "네이버" as string,
    content: "",
    status: "신규" as string,
  });

  /* ── Fetch Data ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/marketing");
        if (res.ok) {
          const data: MarketingData = await res.json();
          setTotalContent(data.totalContent ?? 0);
          setTotalPosts(data.totalPosts ?? 0);
          setTotalInquiries(data.totalInquiries ?? 0);
          setContractCount(data.inquiryStats?.contractCount ?? 0);
          setInquiries(data.recentInquiries ?? []);
          if (data.channelStats && data.channelStats.length > 0) {
            setChannels(data.channelStats);
          }
        }
      } catch {
        /* fallback to defaults */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── Derived ── */
  const conversionRate =
    totalInquiries > 0
      ? Math.round((contractCount / totalInquiries) * 100)
      : 0;

  /* ── Modal handlers ── */
  const openModal = () => {
    setInquiryForm({
      customerName: "",
      phone: "",
      email: "",
      channel: "네이버",
      content: "",
      status: "신규",
    });
    setShowModal(true);
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryForm),
      });
      if (res.ok) {
        const created = await res.json();
        setInquiries((prev) => [created, ...prev]);
        setTotalInquiries((prev) => prev + 1);
      }
    } catch {
      /* silent */
    }
    setShowModal(false);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
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
    <FeatureGate feature="marketingAutomation" label="마케팅 자동화">
    <div className="space-y-8 animate-fade-up">
      {/* ══════════════════ 1. Header ══════════════════ */}
      <div>
        <h1 className="text-2xl font-bold">마케팅</h1>
        <p className="text-sm text-neutral-500 mt-1">
          5채널 통합 마케팅 자동화
        </p>
      </div>

      {/* ══════════════════ 2. KPI Cards ══════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 콘텐츠 */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
          <p className="text-sm text-neutral-500">총 콘텐츠</p>
          <p className="text-2xl font-bold mt-2">{totalContent}</p>
        </div>

        {/* 발행 포스트 */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
          <p className="text-sm text-neutral-500">발행 포스트</p>
          <p className="text-2xl font-bold mt-2">{totalPosts}</p>
        </div>

        {/* 고객 문의 */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
          <p className="text-sm text-neutral-500">고객 문의</p>
          <p className="text-2xl font-bold mt-2">{totalInquiries}</p>
        </div>

        {/* 전환율 */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
          <p className="text-sm text-neutral-500">전환율</p>
          <p className="text-2xl font-bold mt-2">
            <span className="text-[#00C471]">{conversionRate}%</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            계약완료 {contractCount}건 / 전체 {totalInquiries}건
          </p>
        </div>
      </div>

      {/* ══════════════════ 3. 채널 카드 그리드 ══════════════════ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">채널 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div
              key={ch.slug}
              className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6 flex flex-col gap-4"
            >
              {/* Icon + Name + Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="font-semibold text-sm">{ch.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    ch.connected
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-neutral-700/50 text-neutral-500"
                  }`}
                >
                  {ch.connected ? "연동됨" : "미연동"}
                </span>
              </div>

              {/* Post count */}
              <div className="text-sm text-neutral-500">
                게시물 <span className="text-white font-medium">{ch.postCount}건</span>
              </div>

              {/* Manage button */}
              <button
                onClick={() => router.push(`/marketing/${ch.slug}`)}
                className="w-full rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
              >
                관리하기
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ 4. 최근 고객 문의 ══════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 고객 문의</h2>
          <button
            onClick={openModal}
            className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
          >
            문의 추가
          </button>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-12 text-center">
            <p className="text-neutral-500 text-sm">
              아직 등록된 문의가 없습니다.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      날짜
                    </th>
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      고객명
                    </th>
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      연락처
                    </th>
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      채널
                    </th>
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      내용
                    </th>
                    <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => {
                    const sc = STATUS_COLORS[inq.status] ?? {
                      bg: "bg-neutral-700/50",
                      text: "text-neutral-400",
                    };
                    return (
                      <tr
                        key={inq.id}
                        className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                          {fmtDate(inq.date)}
                        </td>
                        <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                          {inq.customerName}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                          {inq.phone}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-neutral-400">
                            {inq.channel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 max-w-[240px] truncate">
                          {inq.content}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}
                          >
                            {inq.status}
                          </span>
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

      {/* ══════════════════ 5. 문의 추가 Modal ══════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-2xl border border-white/[0.06] bg-[#111111] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">문의 추가</h3>

            <form onSubmit={submitInquiry} className="space-y-4">
              {/* Row: 고객명 + 연락처 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">
                    고객명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.customerName}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        customerName: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="고객명"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={inquiryForm.phone}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        phone: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={inquiryForm.email}
                  onChange={(e) =>
                    setInquiryForm({
                      ...inquiryForm,
                      email: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="example@email.com"
                />
              </div>

              {/* Row: 채널 + 상태 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">
                    채널
                  </label>
                  <select
                    value={inquiryForm.channel}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        channel: e.target.value,
                      })
                    }
                    className={selectCls}
                  >
                    {INQUIRY_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">
                    상태
                  </label>
                  <select
                    value={inquiryForm.status}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        status: e.target.value,
                      })
                    }
                    className={selectCls}
                  >
                    {INQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  내용
                </label>
                <textarea
                  value={inquiryForm.content}
                  onChange={(e) =>
                    setInquiryForm({
                      ...inquiryForm,
                      content: e.target.value,
                    })
                  }
                  className={`${inputCls} resize-none h-24`}
                  placeholder="문의 내용을 입력하세요"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.06] text-sm text-neutral-500 hover:bg-white/[0.04] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
