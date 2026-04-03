"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountConnectionBanner from "@/components/marketing/AccountConnectionBanner";
import {
  ArrowLeft,
  Video,
  Smartphone,
  Film,
  Search,
  BarChart3,
  Settings,
  Plus,
  Play,
  Eye,
  ThumbsUp,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Save,
  Youtube,
  Hash,
  Type,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Image,
  Layers,
  Timer,
  Package,
  Home,
  DollarSign,
  Clapperboard,
  Info,
  ChevronRight,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fmtDate, cn } from "@/lib/utils";

/* ── Types ── */
type TabKey = "videos" | "shorts" | "longform" | "seo" | "analytics" | "settings";

interface VideoEntry {
  id: string;
  title: string;
  status: "공개" | "비공개" | "예약" | "비공개목록";
  views: number;
  likes: number;
  publishedAt: string;
  thumbnailColor: string;
}

interface SiteOption {
  id: string;
  name: string;
}

interface SEOResult {
  title: string;
  body: string;
  hashtags: string[];
  keywords: string[];
}

interface AnalyticsRow {
  id: string;
  month: string;
  videos: number;
  views: number;
  subscribers: number;
  watchTime: number;
}

interface YoutubeSettings {
  channelUrl: string;
  apiKey: string;
  category: string;
  language: string;
  visibility: string;
}

/* ── Constants ── */
const tabs = [
  { key: "videos" as TabKey, label: "영상 관리", icon: Video },
  { key: "shorts" as TabKey, label: "Shorts 템플릿", icon: Smartphone },
  { key: "longform" as TabKey, label: "롱폼 템플릿", icon: Film },
  { key: "seo" as TabKey, label: "SEO & 키워드", icon: Search },
  { key: "analytics" as TabKey, label: "성과 분석", icon: BarChart3 },
  { key: "settings" as TabKey, label: "설정", icon: Settings },
];

const SHORTS_TEMPLATES = [
  {
    id: "before-after",
    name: "비포애프터 쇼츠",
    description: "시공 전/후 비교를 드라마틱하게 보여주는 짧은 영상. 슬라이드 전환 효과로 변화를 강조합니다.",
    icon: Image,
    layout: ["Before", "→", "After"],
    color: "#FF6B6B",
  },
  {
    id: "cost-guide",
    name: "비용 가이드 쇼츠",
    description: "평수별, 공간별 인테리어 비용을 한눈에 보여주는 정보형 쇼츠. 숫자 카운트업 효과 활용.",
    icon: DollarSign,
    layout: ["비용", "상세", "총합"],
    color: "#00C471",
  },
  {
    id: "timelapse",
    name: "타임랩스",
    description: "시공 과정을 빠르게 압축한 타임랩스 영상. 시작부터 완공까지의 과정을 보여줍니다.",
    icon: Timer,
    layout: ["Day 1", "...", "완공"],
    color: "#6C5CE7",
  },
  {
    id: "material-intro",
    name: "자재 소개",
    description: "사용한 자재의 특성, 가격대, 장단점을 소개하는 교육형 쇼츠. 클로즈업 샷 활용.",
    icon: Package,
    layout: ["자재", "특성", "적용"],
    color: "#FDCB6E",
  },
];

const LONGFORM_TEMPLATES = [
  {
    id: "construction-tour",
    name: "시공 사례 투어",
    description: "완공된 현장을 방문하여 공간별로 소개하는 투어 형식의 영상",
    icon: Home,
    chapters: [
      "00:00 인트로 & 현장 개요",
      "01:30 거실 & 주방 투어",
      "04:00 침실 & 드레스룸",
      "06:30 욕실 리모델링 포인트",
      "08:00 수납공간 & 디테일",
      "10:00 비용 총정리 & 마무리",
    ],
    duration: "10~15분",
    color: "#00B894",
  },
  {
    id: "cost-analysis",
    name: "비용 상세 분석",
    description: "실제 시공 비용을 항목별로 상세하게 분석하고 절약 팁을 제공하는 영상",
    icon: DollarSign,
    chapters: [
      "00:00 인트로 & 총 비용 공개",
      "02:00 철거 & 목공 비용",
      "04:30 타일 & 바닥재 비용",
      "07:00 도배 & 페인트 비용",
      "09:00 주방/욕실 설비 비용",
      "11:00 조명 & 가구 비용",
      "13:00 비용 절약 팁 & 마무리",
    ],
    duration: "13~18분",
    color: "#FDCB6E",
  },
  {
    id: "full-process",
    name: "공정 과정 전체",
    description: "철거부터 완공까지 전체 시공 과정을 기록한 다큐멘터리 스타일 영상",
    icon: Clapperboard,
    chapters: [
      "00:00 시공 전 상태 & 도면",
      "02:00 철거 작업",
      "05:00 배관 & 전기 공사",
      "08:00 목공 & 타일 작업",
      "11:00 도배 & 페인트",
      "14:00 설비 & 마감",
      "17:00 최종 클리닝 & 완공",
    ],
    duration: "18~25분",
    color: "#6C5CE7",
  },
];

const CONTENT_TYPES = [
  { value: "시공사례", label: "시공 사례" },
  { value: "비용안내", label: "비용 안내" },
  { value: "자재소개", label: "자재 소개" },
  { value: "팁&노하우", label: "팁 & 노하우" },
  { value: "브이로그", label: "브이로그" },
];

const VIDEO_STATUSES: Record<string, { bg: string; text: string }> = {
  공개: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  비공개: { bg: "bg-neutral-500/15", text: "text-neutral-400" },
  예약: { bg: "bg-blue-500/15", text: "text-blue-400" },
  비공개목록: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
};

const GRADIENT_COLORS = [
  "from-red-600/40 to-orange-600/40",
  "from-blue-600/40 to-purple-600/40",
  "from-green-600/40 to-teal-600/40",
  "from-pink-600/40 to-rose-600/40",
  "from-indigo-600/40 to-blue-600/40",
];

/* ── Helpers ── */
const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[#00C471] focus:outline-none";

const cardCls = "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6";

const btnPrimary =
  "rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors";

const btnSecondary =
  "px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors";

function fmtNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "만";
  if (n >= 1000) return (n / 1000).toFixed(1) + "천";
  return n.toLocaleString();
}

/* ══════════════════════════════════ Page ══════════════════════════════════ */
export default function YouTubePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [loading, setLoading] = useState(true);

  /* ── Video Management State ── */
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: "",
    status: "공개" as VideoEntry["status"],
    views: 0,
    likes: 0,
    publishedAt: new Date().toISOString().slice(0, 10),
  });

  /* ── SEO State ── */
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [seoSiteId, setSeoSiteId] = useState("");
  const [seoContentType, setSeoContentType] = useState("시공사례");
  const [seoAdditionalContext, setSeoAdditionalContext] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null);
  const [seoError, setSeoError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [seoSaved, setSeoSaved] = useState(false);

  /* ── Analytics State ── */
  const [analyticsData, setAnalyticsData] = useState<AnalyticsRow[]>([]);
  const [showAddAnalyticsModal, setShowAddAnalyticsModal] = useState(false);
  const [analyticsForm, setAnalyticsForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    videos: 0,
    views: 0,
    subscribers: 0,
    watchTime: 0,
  });

  /* ── Platform Stats (real data from YouTube API) ── */
  const [platformStats, setPlatformStats] = useState<{
    channel: { id: string; title: string; description?: string; thumbnail?: string; customUrl?: string; subscriberCount: number; viewCount: number; videoCount: number };
    recentVideos: Array<{ id: string; title: string; thumbnail: string; publishedAt: string; views: number; likes: number; comments: number; duration: string }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── Settings State ── */
  const [ytSettings, setYtSettings] = useState<YoutubeSettings>({
    channelUrl: "",
    apiKey: "",
    category: "인테리어",
    language: "ko",
    visibility: "공개",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [channelConnection, setChannelConnection] = useState<{
    accountName: string | null;
    hasToken: boolean;
    tokenExpiresAt: string | null;
    isActive: boolean;
  } | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Longform outline generation ── */
  const [outlineLoading, setOutlineLoading] = useState<string | null>(null);
  const [generatedOutline, setGeneratedOutline] = useState<{ templateId: string; outline: string } | null>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/sites");
        if (res.ok) {
          const data = await res.json();
          setSites(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
        }
      } catch {
        /* silent */
      }
    };

    const loadSavedData = () => {
      try {
        const savedVideos = localStorage.getItem("yt_videos");
        if (savedVideos) setVideos(JSON.parse(savedVideos));

        const savedAnalytics = localStorage.getItem("yt_analytics");
        if (savedAnalytics) setAnalyticsData(JSON.parse(savedAnalytics));

        const savedSettings = localStorage.getItem("yt_settings");
        if (savedSettings) setYtSettings(JSON.parse(savedSettings));
      } catch {
        /* silent */
      }
    };

    fetchSites();
    loadSavedData();
    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success")) {
      setOauthMessage({ type: "success", text: "YouTube 채널이 성공적으로 연결되었습니다!" });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("oauth_error")) {
      setOauthMessage({ type: "error", text: decodeURIComponent(params.get("oauth_error")!) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch("/api/marketing/channels?channel=youtube")
      .then(r => r.json())
      .then(data => { if (data) setChannelConnection(data); })
      .catch(() => {});
  }, []);

  // Fetch real platform stats when connected
  const fetchPlatformStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/marketing/youtube/stats");
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
        // Populate videos from real data
        if (data.recentVideos?.length) {
          setVideos(data.recentVideos.map((v: { id: string; title: string; publishedAt: string; views: number; likes: number }, i: number) => ({
            id: v.id,
            title: v.title,
            status: "공개" as const,
            views: v.views,
            likes: v.likes,
            publishedAt: v.publishedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            thumbnailColor: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
          })));
        }
        // Populate analytics
        if (data.channel) {
          const now = new Date();
          const totalViews = data.recentVideos?.reduce((s: number, v: { views: number }) => s + v.views, 0) ?? 0;
          setAnalyticsData([{
            id: "live",
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            videos: data.channel.videoCount ?? 0,
            views: totalViews,
            subscribers: data.channel.subscriberCount ?? 0,
            watchTime: 0,
          }]);
        }
      }
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (channelConnection?.hasToken) {
      fetchPlatformStats();
    }
  }, [channelConnection, fetchPlatformStats]);

  /* ── Persist to localStorage ── */
  const saveVideos = useCallback((data: VideoEntry[]) => {
    setVideos(data);
    localStorage.setItem("yt_videos", JSON.stringify(data));
  }, []);

  const saveAnalytics = useCallback((data: AnalyticsRow[]) => {
    setAnalyticsData(data);
    localStorage.setItem("yt_analytics", JSON.stringify(data));
  }, []);

  /* ── Video handlers ── */
  const handleAddVideo = () => {
    const newVideo: VideoEntry = {
      id: Date.now().toString(),
      title: videoForm.title,
      status: videoForm.status,
      views: videoForm.views,
      likes: videoForm.likes,
      publishedAt: videoForm.publishedAt,
      thumbnailColor: GRADIENT_COLORS[Math.floor(Math.random() * GRADIENT_COLORS.length)],
    };
    saveVideos([newVideo, ...videos]);
    setShowAddVideoModal(false);
    setVideoForm({
      title: "",
      status: "공개",
      views: 0,
      likes: 0,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDeleteVideo = (id: string) => {
    saveVideos(videos.filter((v) => v.id !== id));
  };

  /* ── SEO handlers ── */
  const handleGenerateSEO = async () => {
    setSeoLoading(true);
    setSeoError("");
    setSeoResult(null);
    setSeoSaved(false);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "youtube",
          siteId: seoSiteId || undefined,
          contentType: seoContentType,
          additionalContext: seoAdditionalContext || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "생성에 실패했습니다.");
      }

      const data = await res.json();
      setSeoResult({
        title: data.generated.title,
        body: data.generated.body,
        hashtags: data.generated.hashtags || [],
        keywords: data.generated.keywords || [],
      });
    } catch (err) {
      setSeoError(err instanceof Error ? err.message : "AI SEO 최적화에 실패했습니다.");
    } finally {
      setSeoLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* silent */
    }
  };

  const handleSaveSEO = () => {
    setSeoSaved(true);
    setTimeout(() => setSeoSaved(false), 2000);
  };

  /* ── Analytics handlers ── */
  const handleAddAnalytics = () => {
    const newRow: AnalyticsRow = {
      id: Date.now().toString(),
      ...analyticsForm,
    };
    saveAnalytics([newRow, ...analyticsData]);
    setShowAddAnalyticsModal(false);
    setAnalyticsForm({
      month: new Date().toISOString().slice(0, 7),
      videos: 0,
      views: 0,
      subscribers: 0,
      watchTime: 0,
    });
  };

  /* ── Settings handlers ── */
  const handleSaveSettings = () => {
    localStorage.setItem("yt_settings", JSON.stringify(ytSettings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  /* ── Longform outline generation ── */
  const handleGenerateOutline = async (templateId: string) => {
    setOutlineLoading(templateId);
    setGeneratedOutline(null);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "youtube",
          siteId: seoSiteId || undefined,
          contentType: "영상아웃라인",
          additionalContext: `${templateId} 템플릿에 맞는 유튜브 영상 아웃라인을 작성해주세요. 챕터별 세부 내용과 촬영 포인트를 포함해주세요.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedOutline({
          templateId,
          outline: data.generated.body,
        });
      }
    } catch {
      /* silent */
    } finally {
      setOutlineLoading(null);
    }
  };

  /* ── Derived analytics ── */
  const totalVideos = platformStats ? platformStats.channel.videoCount : (videos.length + analyticsData.reduce((sum, r) => sum + r.videos, 0));
  const totalViews = platformStats ? platformStats.channel.viewCount : (videos.reduce((sum, v) => sum + v.views, 0) + analyticsData.reduce((sum, r) => sum + r.views, 0));
  const totalSubscribers = platformStats ? platformStats.channel.subscriberCount : (analyticsData.length > 0 ? analyticsData[0].subscribers : 0);
  const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  /* ══════════════════════════════════ Render ══════════════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketing"
          className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">유튜브</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">유튜브 콘텐츠 & SEO 자동화</p>
        </div>
      </div>

      {/* ── Account Connection ── */}
      <AccountConnectionBanner
        channel="youtube"
        channelLabel="유튜브"
        channelIcon="🎬"
        connectionType="oauth_google"
      />

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-[var(--border)] text-[var(--foreground)] font-medium"
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ Tab: 영상 관리 ══════════════════ */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">영상 관리</h2>
              {platformStats && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-medium">
                  YouTube 실시간
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {channelConnection?.hasToken && (
                <button
                  onClick={fetchPlatformStats}
                  disabled={statsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} /> 새로고침
                </button>
              )}
              <button onClick={() => setShowAddVideoModal(true)} className={btnPrimary}>
                <span className="flex items-center gap-2">
                  <Plus size={16} />
                  영상 추가
                </span>
              </button>
            </div>
          </div>

          {videos.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                icon={Video}
                title="등록된 영상이 없습니다"
                description="영상 메타데이터를 수동으로 등록하여 관리할 수 있습니다."
                action={
                  <button onClick={() => setShowAddVideoModal(true)} className={btnPrimary}>
                    <span className="flex items-center gap-2">
                      <Plus size={16} />
                      첫 영상 추가하기
                    </span>
                  </button>
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">썸네일</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">제목</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">상태</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">조회수</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">좋아요</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">게시일</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video) => {
                      const sc = VIDEO_STATUSES[video.status] || VIDEO_STATUSES["공개"];
                      return (
                        <tr
                          key={video.id}
                          className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div
                              className={cn(
                                "w-24 h-14 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                video.thumbnailColor
                              )}
                            >
                              <Play size={18} className="text-white/60" />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium max-w-[280px]">
                            <p className="truncate">{video.title}</p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                              {video.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-neutral-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Eye size={14} />
                              {fmtNumber(video.views)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-neutral-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <ThumbsUp size={14} />
                              {fmtNumber(video.likes)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                            {fmtDate(video.publishedAt)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--border)] text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Video Modal */}
          <Modal open={showAddVideoModal} onClose={() => setShowAddVideoModal(false)} title="영상 추가">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">영상 제목 *</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className={inputCls}
                  placeholder="영상 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">상태</label>
                  <select
                    value={videoForm.status}
                    onChange={(e) => setVideoForm({ ...videoForm, status: e.target.value as VideoEntry["status"] })}
                    className={selectCls}
                  >
                    <option value="공개">공개</option>
                    <option value="비공개">비공개</option>
                    <option value="예약">예약</option>
                    <option value="비공개목록">비공개목록</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">게시일</label>
                  <input
                    type="date"
                    value={videoForm.publishedAt}
                    onChange={(e) => setVideoForm({ ...videoForm, publishedAt: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">조회수</label>
                  <input
                    type="number"
                    value={videoForm.views}
                    onChange={(e) => setVideoForm({ ...videoForm, views: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">좋아요</label>
                  <input
                    type="number"
                    value={videoForm.likes}
                    onChange={(e) => setVideoForm({ ...videoForm, likes: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddVideoModal(false)} className={btnSecondary}>
                  취소
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={!videoForm.title.trim()}
                  className={cn(btnPrimary, !videoForm.title.trim() && "opacity-50 cursor-not-allowed")}
                >
                  등록
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ══════════════════ Tab: Shorts 템플릿 ══════════════════ */}
      {activeTab === "shorts" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Shorts 템플릿</h2>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300/90">
              동영상 렌더링 기능은 준비 중입니다. 현재는 이미지 시퀀스 및 SEO 최적화 기능을 사용하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHORTS_TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className={cn(cardCls, "space-y-4")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      <tmpl.icon size={20} style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{tmpl.name}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-neutral-400 mt-1">
                        <Layers size={10} />
                        이미지 시퀀스
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-neutral-400 leading-relaxed">{tmpl.description}</p>

                {/* Layout Preview Mockup */}
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  {tmpl.layout.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {idx > 0 && <ChevronRight size={14} className="text-neutral-600" />}
                      <div
                        className="px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${tmpl.color}15`,
                          color: tmpl.color,
                        }}
                      >
                        {step}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className={cn(btnSecondary, "flex-1 text-center flex items-center justify-center gap-2")}>
                    <Image size={14} />
                    시퀀스 만들기
                  </button>
                  <span className="px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
                    <Clock size={12} />
                    렌더링 준비 중
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════ Tab: 롱폼 템플릿 ══════════════════ */}
      {activeTab === "longform" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">롱폼 영상 템플릿</h2>
            {sites.length > 0 && (
              <select
                value={seoSiteId}
                onChange={(e) => setSeoSiteId(e.target.value)}
                className={cn(selectCls, "w-auto min-w-[200px]")}
              >
                <option value="">현장 선택 (선택사항)</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-4">
            {LONGFORM_TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className={cn(cardCls, "space-y-4")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      <tmpl.icon size={20} style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tmpl.name}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">{tmpl.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 bg-white/[0.04] px-2.5 py-1 rounded-lg whitespace-nowrap">
                    {tmpl.duration}
                  </span>
                </div>

                {/* Chapter list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                  {tmpl.chapters.map((chapter, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-600 font-mono text-xs w-12 shrink-0">
                        {chapter.split(" ")[0]}
                      </span>
                      <span className="text-neutral-400">{chapter.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleGenerateOutline(tmpl.id)}
                    disabled={outlineLoading === tmpl.id}
                    className={cn(btnPrimary, "flex items-center gap-2")}
                  >
                    {outlineLoading === tmpl.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        아웃라인 생성
                      </>
                    )}
                  </button>
                  <span className="px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
                    <Clock size={12} />
                    렌더링 준비 중
                  </span>
                </div>

                {/* Generated Outline */}
                {generatedOutline?.templateId === tmpl.id && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#00C471]">AI 생성 아웃라인</h4>
                      <button
                        onClick={() => handleCopy(generatedOutline.outline, `outline-${tmpl.id}`)}
                        className="p-1.5 rounded-lg hover:bg-[var(--border)] text-neutral-500 transition-colors"
                      >
                        {copiedField === `outline-${tmpl.id}` ? <Check size={14} className="text-[#00C471]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {generatedOutline.outline}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════ Tab: SEO & 키워드 ══════════════════ */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">SEO & 키워드 최적화</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                AI가 유튜브 검색 최적화에 맞는 제목, 설명, 태그를 자동 생성합니다.
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className={cn(cardCls, "space-y-4")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF0000]/15 flex items-center justify-center">
                <Youtube size={16} className="text-[#FF0000]" />
              </div>
              <h3 className="font-semibold text-sm">AI SEO 최적화</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">현장 선택</label>
                <select
                  value={seoSiteId}
                  onChange={(e) => setSeoSiteId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">현장 없이 생성</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">콘텐츠 유형</label>
                <select
                  value={seoContentType}
                  onChange={(e) => setSeoContentType(e.target.value)}
                  className={selectCls}
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-500 mb-1">추가 요청사항 (선택)</label>
              <textarea
                value={seoAdditionalContext}
                onChange={(e) => setSeoAdditionalContext(e.target.value)}
                className={cn(inputCls, "resize-none h-20")}
                placeholder="특별히 강조할 키워드, 타겟 시청자, 영상 스타일 등을 입력하세요"
              />
            </div>

            <button
              onClick={handleGenerateSEO}
              disabled={seoLoading}
              className={cn(btnPrimary, "flex items-center gap-2", seoLoading && "opacity-70 cursor-not-allowed")}
            >
              {seoLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI 생성 중...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI SEO 최적화
                </>
              )}
            </button>
          </div>

          {/* Loading State */}
          {seoLoading && (
            <div className={cn(cardCls, "flex flex-col items-center justify-center py-16")}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-[#00C471]/20 border-t-[#00C471] animate-spin" />
                <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00C471]" />
              </div>
              <p className="text-sm text-neutral-400 mt-4">AI가 유튜브 SEO를 최적화하고 있습니다...</p>
              <p className="text-xs text-neutral-600 mt-1">제목, 설명, 태그, 키워드를 분석하는 중</p>
            </div>
          )}

          {/* Error State */}
          {seoError && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-medium">SEO 생성 실패</p>
                <p className="text-sm text-red-400/70 mt-0.5">{seoError}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {seoResult && !seoLoading && (
            <div className="space-y-4">
              {/* Title */}
              <div className={cn(cardCls, "space-y-3")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type size={16} className="text-[#FF0000]" />
                    <h3 className="font-semibold text-sm">제목</h3>
                    <span className="text-xs text-neutral-500">
                      ({seoResult.title.length}자)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(seoResult.title, "title")}
                    className={cn(btnSecondary, "flex items-center gap-1.5 py-1.5 px-3")}
                  >
                    {copiedField === "title" ? (
                      <>
                        <Check size={12} className="text-[#00C471]" />
                        <span className="text-[#00C471]">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        제목 복사
                      </>
                    )}
                  </button>
                </div>
                <p className="text-base font-medium">{seoResult.title}</p>
                {seoResult.title.length > 60 && (
                  <p className="text-xs text-yellow-400">60자를 초과합니다. 검색 결과에서 잘릴 수 있습니다.</p>
                )}
              </div>

              {/* Description */}
              <div className={cn(cardCls, "space-y-3")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#FF0000]" />
                    <h3 className="font-semibold text-sm">설명</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(seoResult.body, "description")}
                    className={cn(btnSecondary, "flex items-center gap-1.5 py-1.5 px-3")}
                  >
                    {copiedField === "description" ? (
                      <>
                        <Check size={12} className="text-[#00C471]" />
                        <span className="text-[#00C471]">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        설명 복사
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {seoResult.body}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {seoResult.hashtags.length > 0 && (
                <div className={cn(cardCls, "space-y-3")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-[#FF0000]" />
                      <h3 className="font-semibold text-sm">태그</h3>
                      <span className="text-xs text-neutral-500">({seoResult.hashtags.length}개)</span>
                    </div>
                    <button
                      onClick={() => handleCopy(seoResult.hashtags.join(", "), "tags")}
                      className={cn(btnSecondary, "flex items-center gap-1.5 py-1.5 px-3")}
                    >
                      {copiedField === "tags" ? (
                        <>
                          <Check size={12} className="text-[#00C471]" />
                          <span className="text-[#00C471]">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          태그 복사
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seoResult.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(tag, `tag-${idx}`)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF0000]/10 text-[#FF6B6B] text-xs font-medium hover:bg-[#FF0000]/20 transition-colors cursor-pointer"
                      >
                        {copiedField === `tag-${idx}` ? (
                          <span className="text-[#00C471]">copied!</span>
                        ) : (
                          tag
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {seoResult.keywords.length > 0 && (
                <div className={cn(cardCls, "space-y-3")}>
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-[#00C471]" />
                    <h3 className="font-semibold text-sm">SEO 키워드</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seoResult.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-[#00C471]/10 text-[#00C471] text-xs font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSEO}
                  className={cn(btnPrimary, "flex items-center gap-2")}
                >
                  {seoSaved ? (
                    <>
                      <Check size={16} />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      저장
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Initial Empty State */}
          {!seoResult && !seoLoading && !seoError && (
            <div className={cardCls}>
              <EmptyState
                icon={Search}
                title="SEO 최적화 결과가 여기에 표시됩니다"
                description="현장을 선택하고 콘텐츠 유형을 지정한 후 AI SEO 최적화 버튼을 클릭하세요."
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ Tab: 성과 분석 ══════════════════ */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="총 영상" value={totalVideos.toString()} icon={Video} color="#FF0000" subtitle={platformStats ? "실시간" : "등록된 전체 영상"} />
            <KPICard title="총 조회수" value={fmtNumber(totalViews)} icon={Eye} color="#FF0000" subtitle={platformStats ? "실시간" : "누적 조회수"} />
            <KPICard title="구독자" value={fmtNumber(totalSubscribers)} icon={Users} color="#FF0000" subtitle={platformStats ? "실시간" : "수동 입력"} />
            <KPICard title="평균 조회수" value={fmtNumber(avgViews)} icon={TrendingUp} color="#00C471" subtitle="영상 당" />
          </div>

          {/* Refresh real data */}
          {channelConnection?.hasToken && (
            <div className="flex justify-end">
              <button
                onClick={fetchPlatformStats}
                disabled={statsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} /> 실시간 데이터 새로고침
              </button>
            </div>
          )}

          {/* Real-time top videos */}
          {platformStats && platformStats.recentVideos.length > 0 && (
            <div className={cardCls + " space-y-4"}>
              <h3 className="text-base font-semibold">인기 영상 (실시간)</h3>
              <div className="space-y-2">
                {platformStats.recentVideos
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((v, idx) => (
                    <div key={v.id} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <span className="w-7 h-7 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.title}</p>
                        <p className="text-xs text-[var(--muted)]">{fmtDate(v.publishedAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1"><Eye size={12} /> {fmtNumber(v.views)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={12} /> {fmtNumber(v.likes)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Data Entry Section */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">월별 성과 데이터</h2>
            <button onClick={() => setShowAddAnalyticsModal(true)} className={btnPrimary}>
              <span className="flex items-center gap-2">
                <Plus size={16} />
                데이터 추가
              </span>
            </button>
          </div>

          {analyticsData.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                icon={BarChart3}
                title="성과 데이터가 없습니다"
                description="월별 유튜브 성과 데이터를 수동으로 입력하여 트래킹할 수 있습니다."
                action={
                  <button onClick={() => setShowAddAnalyticsModal(true)} className={btnPrimary}>
                    <span className="flex items-center gap-2">
                      <Plus size={16} />
                      데이터 추가
                    </span>
                  </button>
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">월</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">영상 수</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">조회수</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">구독자</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">시청 시간(h)</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium">{row.month}</td>
                        <td className="px-5 py-3.5 text-neutral-400">{row.videos}</td>
                        <td className="px-5 py-3.5 text-neutral-400">{fmtNumber(row.views)}</td>
                        <td className="px-5 py-3.5 text-neutral-400">{fmtNumber(row.subscribers)}</td>
                        <td className="px-5 py-3.5 text-neutral-400">{row.watchTime}h</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => saveAnalytics(analyticsData.filter((r) => r.id !== row.id))}
                            className="p-1.5 rounded-lg hover:bg-[var(--border)] text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Analytics Modal */}
          <Modal open={showAddAnalyticsModal} onClose={() => setShowAddAnalyticsModal(false)} title="성과 데이터 추가">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">월</label>
                <input
                  type="month"
                  value={analyticsForm.month}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, month: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">영상 수</label>
                  <input
                    type="number"
                    value={analyticsForm.videos}
                    onChange={(e) => setAnalyticsForm({ ...analyticsForm, videos: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">조회수</label>
                  <input
                    type="number"
                    value={analyticsForm.views}
                    onChange={(e) => setAnalyticsForm({ ...analyticsForm, views: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">구독자</label>
                  <input
                    type="number"
                    value={analyticsForm.subscribers}
                    onChange={(e) => setAnalyticsForm({ ...analyticsForm, subscribers: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">시청 시간 (시간)</label>
                  <input
                    type="number"
                    value={analyticsForm.watchTime}
                    onChange={(e) => setAnalyticsForm({ ...analyticsForm, watchTime: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddAnalyticsModal(false)} className={btnSecondary}>
                  취소
                </button>
                <button onClick={handleAddAnalytics} className={btnPrimary}>
                  등록
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ══════════════════ Tab: 설정 ══════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">유튜브 설정</h2>

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
            <h3 className="font-semibold">YouTube 채널 연동</h3>

            {channelConnection?.hasToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-xl">🎬</div>
                  <div>
                    <p className="font-semibold">{channelConnection.accountName || "연결된 채널"}</p>
                    <p className="text-xs text-[var(--green)]">연결됨</p>
                    {channelConnection.tokenExpiresAt && (
                      <p className="text-xs text-[var(--muted)]">
                        토큰 만료: {new Date(channelConnection.tokenExpiresAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/marketing/oauth/refresh", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channel: "youtube" }),
                        });
                        setOauthMessage({ type: "success", text: "토큰이 갱신되었습니다." });
                      } catch {
                        setOauthMessage({ type: "error", text: "토큰 갱신에 실패했습니다." });
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
                  >
                    토큰 갱신
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/marketing/channels", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channel: "youtube" }),
                        });
                        setChannelConnection(null);
                        setOauthMessage({ type: "success", text: "채널 연결이 해제되었습니다." });
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
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl mx-auto mb-4">🎬</div>
                <p className="font-semibold">YouTube 채널이 연결되지 않았습니다</p>
                <p className="text-sm text-[var(--muted)] mt-1 mb-6">
                  Google 계정으로 로그인하여 YouTube 채널을 연결하세요.
                </p>
                <a
                  href="/api/marketing/oauth/google?channel=youtube"
                  className="inline-block rounded-lg bg-[#00C471] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#00D47F] transition-colors"
                >
                  Google 계정으로 연결
                </a>
              </div>
            )}
          </div>

          {/* Default Video Settings */}
          <div className={cn(cardCls, "space-y-4")}>
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-neutral-400" />
              <h3 className="font-semibold text-sm">기본 영상 설정</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">카테고리</label>
                <select
                  value={ytSettings.category}
                  onChange={(e) => setYtSettings({ ...ytSettings, category: e.target.value })}
                  className={selectCls}
                >
                  <option value="인테리어">인테리어</option>
                  <option value="홈 & 가든">홈 & 가든</option>
                  <option value="하우투 & 스타일">하우투 & 스타일</option>
                  <option value="과학기술">과학기술</option>
                  <option value="엔터테인먼트">엔터테인먼트</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">언어</label>
                <select
                  value={ytSettings.language}
                  onChange={(e) => setYtSettings({ ...ytSettings, language: e.target.value })}
                  className={selectCls}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">기본 공개 설정</label>
                <select
                  value={ytSettings.visibility}
                  onChange={(e) => setYtSettings({ ...ytSettings, visibility: e.target.value })}
                  className={selectCls}
                >
                  <option value="공개">공개</option>
                  <option value="비공개">비공개</option>
                  <option value="비공개목록">비공개목록</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className={cn(btnPrimary, "flex items-center gap-2")}
            >
              {settingsSaved ? (
                <>
                  <Check size={16} />
                  저장됨
                </>
              ) : (
                <>
                  <Save size={16} />
                  설정 저장
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
