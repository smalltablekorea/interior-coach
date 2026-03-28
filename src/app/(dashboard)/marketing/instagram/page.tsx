"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountConnectionBanner from "@/components/marketing/AccountConnectionBanner";
import {
  ArrowLeft,
  Grid3X3,
  Sparkles,
  Film,
  Circle,
  BarChart3,
  Settings,
  Plus,
  Copy,
  Check,
  Save,
  Loader2,
  Instagram,
  Heart,
  MessageCircle,
  Eye,
  Hash,
  Image,
  Images,
  Play,
  Clock,
  Info,
  Trash2,
  Users,
  Target,
  TrendingUp,
  FileText,
  ToggleLeft,
  ToggleRight,
  Paintbrush,
  Wrench,
  Lightbulb,
  Camera,
  Clapperboard,
  Bookmark,
  Zap,
  RefreshCw,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate, cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey = "feed" | "generate" | "reels" | "stories" | "analytics" | "settings";

interface Site {
  id: string;
  name: string;
  address?: string;
  status?: string;
}

interface FeedPost {
  id: string;
  caption: string;
  status: "draft" | "scheduled" | "published";
  likes: number;
  comments: number;
  reach: number;
  gradient: string;
  createdAt: string;
}

interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
  keywords: string[];
}

interface AnalyticsRow {
  id: string;
  month: string;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
}

interface HashtagGroup {
  id: string;
  name: string;
  tags: string[];
}

/* ══════════════════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════════════════ */

const tabs = [
  { key: "feed" as TabKey, label: "피드 관리", icon: Grid3X3 },
  { key: "generate" as TabKey, label: "콘텐츠 생성기", icon: Sparkles },
  { key: "reels" as TabKey, label: "릴스", icon: Film },
  { key: "stories" as TabKey, label: "스토리", icon: Circle },
  { key: "analytics" as TabKey, label: "성과 분석", icon: BarChart3 },
  { key: "settings" as TabKey, label: "설정", icon: Settings },
];

const CONTENT_TYPES = [
  { value: "시공사례", label: "시공사례", icon: Camera },
  { value: "비포애프터", label: "비포애프터", icon: Images },
  { value: "자재소개", label: "자재소개", icon: Paintbrush },
  { value: "인테리어팁", label: "인테리어팁", icon: Lightbulb },
];

const FORMAT_OPTIONS = [
  { value: "single", label: "단일 이미지", icon: Image },
  { value: "carousel", label: "캐러셀 (2-10장)", icon: Images },
];

const FEED_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff6f61 100%)",
];

const REEL_TEMPLATES = [
  {
    id: "before-after",
    name: "Before / After",
    description: "시공 전후 비교 릴스. 드라마틱한 변화를 보여주는 슬라이드 전환 효과.",
    icon: Images,
    duration: "15-30초",
  },
  {
    id: "cost-guide",
    name: "비용 가이드",
    description: "평수별/공간별 인테리어 비용을 쉽게 알려주는 정보형 릴스.",
    icon: FileText,
    duration: "30-60초",
  },
  {
    id: "timelapse",
    name: "타임랩스",
    description: "시공 과정을 빠르게 보여주는 타임랩스 영상. 사진 시퀀스 기반.",
    icon: Clock,
    duration: "15-30초",
  },
  {
    id: "material-intro",
    name: "자재 소개",
    description: "자재 클로즈업과 시공 후 모습을 비교하는 소개 릴스.",
    icon: Paintbrush,
    duration: "15-30초",
  },
];

const STORY_TEMPLATES = [
  {
    id: "daily-progress",
    name: "오늘의 시공",
    description: "현장 시공 진행 상황을 매일 업데이트하는 스토리.",
    icon: Wrench,
  },
  {
    id: "poll",
    name: "투표/설문",
    description: "인테리어 스타일, 자재 선택 등에 대한 팔로워 의견 조사.",
    icon: Users,
  },
  {
    id: "qa",
    name: "Q&A",
    description: "팔로워 질문에 답변하는 Q&A 스토리 템플릿.",
    icon: MessageCircle,
  },
  {
    id: "countdown",
    name: "카운트다운",
    description: "시공 완료일, 이벤트 등을 위한 카운트다운 스토리.",
    icon: Clock,
  },
];

const DUMMY_POSTS: FeedPost[] = Array.from({ length: 9 }, (_, i) => ({
  id: `post-${i + 1}`,
  caption: [
    "30평 아파트 전체 리모델링 완료! 모던 화이트 톤으로...",
    "주방 싱크대 교체 시공 과정을 공유합니다...",
    "욕실 리모델링 비포 & 애프터. 이 변화 실화?!",
    "20평대 원룸 인테리어 팁 5가지를 알려드립니다...",
    "거실 포인트 조명으로 분위기 완전 변신!",
    "시공 현장 타일 작업 중. 장인의 손길...",
    "고객님 맞춤 수납장 제작 완료!",
    "트렌디한 아치형 출입구 시공 과정",
    "올해 인테리어 트렌드 컬러 소개합니다.",
  ][i],
  status: (["published", "published", "published", "scheduled", "published", "draft", "published", "published", "draft"] as const)[i],
  likes: Math.floor(Math.random() * 200) + 20,
  comments: Math.floor(Math.random() * 30) + 2,
  reach: Math.floor(Math.random() * 2000) + 200,
  gradient: FEED_GRADIENTS[i % FEED_GRADIENTS.length],
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

/* ── Styling Helpers ── */

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[#00C471] focus:outline-none";

const btnPrimary =
  "rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors";

const btnSecondary =
  "px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors";

const cardCls = "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6";

/* ══════════════════════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════════════════════ */

export default function InstagramPage() {
  /* ── Tab State ── */
  const [activeTab, setActiveTab] = useState<TabKey>("feed");

  /* ── Feed State ── */
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  /* ── Content Generator State ── */
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [contentType, setContentType] = useState("시공사례");
  const [format, setFormat] = useState("single");
  const [carouselCount, setCarouselCount] = useState(5);
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ── Analytics State ── */
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState({ month: "", followers: "", reach: "", engagement: "", posts: "" });

  /* ── Platform Stats (real data from Instagram API) ── */
  const [platformStats, setPlatformStats] = useState<{
    profile: { id: string; username: string; name?: string; profilePicture?: string; followersCount: number; followsCount: number; mediaCount: number; biography?: string };
    insights: { reach: number; impressions: number; profileViews: number };
    recentPosts: Array<{ id: string; caption?: string; timestamp?: string; likes: number; comments: number; mediaType?: string; permalink?: string; mediaUrl?: string }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── Settings State ── */
  const [igUsername, setIgUsername] = useState("");
  const [igConnected, setIgConnected] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [channelConnection, setChannelConnection] = useState<{
    accountName: string | null;
    hasToken: boolean;
    tokenExpiresAt: string | null;
    isActive: boolean;
  } | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([
    {
      id: "1",
      name: "기본 인테리어",
      tags: ["인테리어", "리모델링", "인테리어디자인", "홈스타일링", "공간디자인", "아파트인테리어", "인테리어시공"],
    },
    {
      id: "2",
      name: "지역 태그",
      tags: ["서울인테리어", "강남인테리어", "송파인테리어", "분당인테리어", "판교인테리어"],
    },
  ]);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTags, setNewGroupTags] = useState("");

  /* ── Loading ── */
  const [loading, setLoading] = useState(true);

  /* ══════════════════ Fetch Sites ══════════════════ */
  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(Array.isArray(data) ? data : data.sites || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchSites().finally(() => setLoading(false));
  }, [fetchSites]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success")) {
      setOauthMessage({ type: "success", text: "인스타그램 계정이 성공적으로 연결되었습니다!" });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("oauth_error")) {
      setOauthMessage({ type: "error", text: decodeURIComponent(params.get("oauth_error")!) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch("/api/marketing/channels?channel=instagram")
      .then(r => r.json())
      .then(data => { if (data) setChannelConnection(data); })
      .catch(() => {});
  }, []);

  // Fetch real platform stats when connected
  const fetchPlatformStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/marketing/instagram/stats");
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
        // Populate feed posts from real data
        if (data.recentPosts?.length) {
          setPosts(data.recentPosts.map((m: { id: string; caption?: string; timestamp?: string; likes: number; comments: number }, i: number) => ({
            id: m.id,
            caption: m.caption || "(미디어)",
            status: "published" as const,
            likes: m.likes,
            comments: m.comments,
            reach: 0,
            gradient: FEED_GRADIENTS[i % FEED_GRADIENTS.length],
            createdAt: m.timestamp || new Date().toISOString(),
          })));
        }
        // Populate analytics summary
        if (data.profile) {
          const totalLikes = data.recentPosts?.reduce((s: number, p: { likes: number }) => s + p.likes, 0) ?? 0;
          const avgLikes = data.recentPosts?.length ? Math.round(totalLikes / data.recentPosts.length) : 0;
          const now = new Date();
          setAnalyticsRows([{
            id: "live",
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            followers: data.profile.followersCount ?? 0,
            reach: data.insights?.reach ?? 0,
            engagement: avgLikes ? Math.round(avgLikes / Math.max(data.profile.followersCount, 1) * 100 * 10) / 10 : 0,
            posts: data.profile.mediaCount ?? 0,
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

  /* ══════════════════ Content Generation ══════════════════ */
  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(null);
    setSaved(false);
    setCaptionCopied(false);
    setHashtagsCopied(false);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "instagram",
          siteId: selectedSiteId || undefined,
          contentType,
          additionalContext: [
            `포맷: ${format === "single" ? "단일 이미지" : `캐러셀 ${carouselCount}장`}`,
            additionalContext,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGenerated(data.generated);
      } else {
        const err = await res.json();
        alert(err.error || "생성에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: "caption" | "hashtags") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "caption") {
        setCaptionCopied(true);
        setTimeout(() => setCaptionCopied(false), 2000);
      } else {
        setHashtagsCopied(true);
        setTimeout(() => setHashtagsCopied(false), 2000);
      }
    } catch {
      /* fallback */
    }
  };

  const handleSaveContent = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ══════════════════ Analytics ══════════════════ */
  const addAnalyticsRow = () => {
    if (!newRow.month) return;
    setAnalyticsRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        month: newRow.month,
        followers: Number(newRow.followers) || 0,
        reach: Number(newRow.reach) || 0,
        engagement: Number(newRow.engagement) || 0,
        posts: Number(newRow.posts) || 0,
      },
    ]);
    setNewRow({ month: "", followers: "", reach: "", engagement: "", posts: "" });
    setShowAddRow(false);
  };

  const deleteAnalyticsRow = (id: string) => {
    setAnalyticsRows((prev) => prev.filter((r) => r.id !== id));
  };

  /* ══════════════════ Hashtag Groups ══════════════════ */
  const addHashtagGroup = () => {
    if (!newGroupName || !newGroupTags) return;
    setHashtagGroups((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newGroupName,
        tags: newGroupTags.split(",").map((t) => t.trim()).filter(Boolean),
      },
    ]);
    setNewGroupName("");
    setNewGroupTags("");
    setShowHashtagModal(false);
  };

  const deleteHashtagGroup = (id: string) => {
    setHashtagGroups((prev) => prev.filter((g) => g.id !== id));
  };

  /* ══════════════════ Derived values ══════════════════ */
  const latestRow = analyticsRows[analyticsRows.length - 1];

  /* ══════════════════ Loading Skeleton ══════════════════ */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Tab Renderers
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── 1. Feed Management ── */
  const renderFeed = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--muted)]">최근 게시물 미리보기</p>
          {platformStats && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--green)]/15 text-[var(--green)] text-[10px] font-medium">
              실시간 연동
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
          <button onClick={() => setShowNewPostModal(true)} className={btnPrimary}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              새 게시물
            </span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {statsLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
          <span className="ml-2 text-sm text-[var(--muted)]">인스타그램 데이터를 불러오는 중...</span>
        </div>
      )}

      {/* Empty state when not connected */}
      {!statsLoading && posts.length === 0 && !channelConnection?.hasToken && (
        <EmptyState
          icon={Instagram}
          title="인스타그램 계정을 연결해주세요"
          description="계정을 연결하면 실제 게시물과 통계를 확인할 수 있습니다."
        />
      )}

      {/* Empty state when connected but no posts */}
      {!statsLoading && posts.length === 0 && channelConnection?.hasToken && (
        <EmptyState
          icon={Instagram}
          title="게시물이 없습니다"
          description="인스타그램에 게시물을 올려보세요."
        />
      )}

      {/* 3x3 Grid */}
      {posts.length > 0 && <div className="grid grid-cols-3 gap-3">
        {posts.slice(0, 9).map((post) => (
          <div
            key={post.id}
            className="group relative rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
          >
            {/* Image Placeholder */}
            <div
              className="aspect-square"
              style={{ background: post.gradient }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-4 text-white text-sm">
                  <span className="flex items-center gap-1">
                    <Heart size={14} /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} /> {post.comments}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-[var(--card)]">
              <p className="text-xs text-white truncate">{post.caption}</p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    post.status === "published"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : post.status === "scheduled"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-white/[0.06] text-neutral-500"
                  )}
                >
                  {post.status === "published" ? "발행됨" : post.status === "scheduled" ? "예약" : "초안"}
                </span>
                <span className="text-[10px] text-neutral-600">{fmtDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {/* Post Stats Summary */}
      <div className={cardCls}>
        <h3 className="text-sm font-medium mb-4">게시물 통계 요약</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{posts.filter((p) => p.status === "published").length}</p>
            <p className="text-xs text-[var(--muted)] mt-1">발행됨</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{posts.filter((p) => p.status === "scheduled").length}</p>
            <p className="text-xs text-[var(--muted)] mt-1">예약</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{posts.filter((p) => p.status === "draft").length}</p>
            <p className="text-xs text-[var(--muted)] mt-1">초안</p>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      <Modal open={showNewPostModal} onClose={() => setShowNewPostModal(false)} title="새 게시물" maxWidth="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            콘텐츠 생성기 탭에서 AI로 캡션과 해시태그를 생성한 뒤, 여기서 게시물을 구성하세요.
          </p>
          <button onClick={() => { setShowNewPostModal(false); setActiveTab("generate"); }} className={btnPrimary}>
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              콘텐츠 생성기로 이동
            </span>
          </button>
        </div>
      </Modal>
    </div>
  );

  /* ── 2. Content Generator ── */
  const renderGenerator = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className={cardCls + " space-y-5"}>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-[#00C471]" />
            AI 콘텐츠 생성
          </h3>

          {/* Site Selector */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">시공 현장 선택</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className={selectCls}
            >
              <option value="">현장을 선택하세요 (선택사항)</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} {site.address ? `- ${site.address}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">콘텐츠 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                    contentType === ct.value
                      ? "border-[#00C471] bg-[#00C471]/10 text-[#00C471]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--border)]"
                  )}
                >
                  <ct.icon size={16} />
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">포맷</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((fo) => (
                <button
                  key={fo.value}
                  onClick={() => setFormat(fo.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                    format === fo.value
                      ? "border-[#00C471] bg-[#00C471]/10 text-[#00C471]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--border)]"
                  )}
                >
                  <fo.icon size={16} />
                  {fo.label}
                </button>
              ))}
            </div>
            {format === "carousel" && (
              <div className="mt-3">
                <label className="block text-xs text-[var(--muted)] mb-1">이미지 수: {carouselCount}장</label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={carouselCount}
                  onChange={(e) => setCarouselCount(Number(e.target.value))}
                  className="w-full accent-[#00C471]"
                />
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>2장</span>
                  <span>10장</span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Context */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">추가 요청사항</label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className={inputCls + " resize-none h-24"}
              placeholder="원하는 톤, 강조할 내용, 특정 키워드 등을 입력하세요..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              "w-full rounded-xl bg-[#00C471] text-black px-4 py-3 text-sm font-semibold hover:bg-[#00D47F] transition-colors flex items-center justify-center gap-2",
              generating && "opacity-70 cursor-not-allowed"
            )}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI 생성 중...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                AI 생성
              </>
            )}
          </button>
        </div>

        {/* Right: Result */}
        <div className={cardCls + " space-y-5"}>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileText size={18} className="text-[#E4405F]" />
            생성 결과
          </h3>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#E4405F]/10 flex items-center justify-center">
                  <Loader2 size={28} className="text-[#E4405F] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">AI가 콘텐츠를 생성하고 있습니다</p>
                <p className="text-xs text-[var(--muted)] mt-1">30초~1분 정도 소요됩니다</p>
              </div>
            </div>
          ) : generated ? (
            <>
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-[var(--muted)]">캡션</label>
                  <button
                    onClick={() => copyToClipboard(generated.body, "caption")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors",
                      captionCopied
                        ? "bg-[#00C471]/15 text-[#00C471]"
                        : "bg-white/[0.06] text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {captionCopied ? <Check size={12} /> : <Copy size={12} />}
                    {captionCopied ? "복사됨" : "캡션 복사"}
                  </button>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-[var(--border)] p-4 max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{generated.body}</p>
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-[var(--muted)]">
                    해시태그 <span className="text-neutral-600">({generated.hashtags.length}개)</span>
                  </label>
                  <button
                    onClick={() =>
                      copyToClipboard(generated.hashtags.map((t) => `#${t}`).join(" "), "hashtags")
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors",
                      hashtagsCopied
                        ? "bg-[#00C471]/15 text-[#00C471]"
                        : "bg-white/[0.06] text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {hashtagsCopied ? <Check size={12} /> : <Copy size={12} />}
                    {hashtagsCopied ? "복사됨" : "해시태그 복사"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {generated.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E4405F]/10 text-[#E4405F] text-xs cursor-pointer hover:bg-[#E4405F]/20 transition-colors"
                    >
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Image Order (for carousel) */}
              {format === "carousel" && (
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">추천 이미지 구성</label>
                  <div className="space-y-2">
                    {Array.from({ length: carouselCount }, (_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-[var(--border)]"
                      >
                        <span className="w-6 h-6 rounded-md bg-[#E4405F]/15 text-[#E4405F] text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {i === 0
                            ? "커버 이미지 - 가장 임팩트 있는 시공 완료 사진"
                            : i === carouselCount - 1
                            ? "마지막 - CTA (연락처/프로필 안내)"
                            : i < carouselCount / 2
                            ? `시공 전(Before) 사진 ${i}`
                            : `시공 후(After) 사진 ${i - Math.floor(carouselCount / 2) + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveContent} className={cn(btnPrimary, "flex-1 flex items-center justify-center gap-2")}>
                  {saved ? <Check size={16} /> : <Save size={16} />}
                  {saved ? "저장됨" : "저장"}
                </button>
                <button
                  onClick={() => {
                    setGenerated(null);
                    setSaved(false);
                  }}
                  className={btnSecondary}
                >
                  다시 생성
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="AI 콘텐츠를 생성해보세요"
              description="현장 정보와 콘텐츠 유형을 선택한 후 AI 생성 버튼을 눌러주세요. 인스타그램에 최적화된 캡션과 해시태그가 자동 생성됩니다."
            />
          )}
        </div>
      </div>
    </div>
  );

  /* ── 3. Reels ── */
  const renderReels = () => (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300 font-medium">릴스 자동 생성 기능은 준비 중입니다</p>
          <p className="text-xs text-blue-400/70 mt-1">
            현재는 이미지 시퀀스 구성만 가능합니다. 영상 자동 생성 기능(FFmpeg 기반)은 향후 업데이트에서 제공될 예정입니다.
          </p>
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REEL_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className={cardCls + " space-y-4"}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E4405F]/10 flex items-center justify-center">
                  <tpl.icon size={20} className="text-[#E4405F]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{tpl.name}</h4>
                  <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {tpl.duration}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400">
                준비 중
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{tpl.description}</p>
            <button disabled className="w-full rounded-lg border border-[var(--border)] text-sm text-neutral-600 px-4 py-2 cursor-not-allowed">
              곧 사용 가능
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── 4. Stories ── */
  const renderStories = () => (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300 font-medium">스토리 자동화 기능은 준비 중입니다</p>
          <p className="text-xs text-blue-400/70 mt-1">
            스토리 템플릿 및 자동 생성 기능은 향후 업데이트에서 제공될 예정입니다. 현재는 템플릿 미리보기만 가능합니다.
          </p>
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STORY_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className={cardCls + " space-y-4"}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <tpl.icon size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{tpl.name}</h4>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400">
                준비 중
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{tpl.description}</p>
            <button disabled className="w-full rounded-lg border border-[var(--border)] text-sm text-neutral-600 px-4 py-2 cursor-not-allowed">
              곧 사용 가능
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── 5. Analytics ── */
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Refresh button */}
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

      {/* KPI Cards — real data if available */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="팔로워"
          value={platformStats ? platformStats.profile.followersCount.toLocaleString() : (latestRow ? latestRow.followers.toLocaleString() : "0")}
          subtitle={platformStats ? "실시간" : (analyticsRows.length >= 2 ? `전월 대비 +${latestRow.followers - analyticsRows[analyticsRows.length - 2].followers}` : undefined)}
          icon={Users}
          color="#E4405F"
        />
        <KPICard
          title="도달"
          value={platformStats ? platformStats.insights.reach.toLocaleString() : (latestRow ? latestRow.reach.toLocaleString() : "0")}
          subtitle={platformStats ? "최근 30일" : "이번 달"}
          icon={Target}
          color="#4facfe"
        />
        <KPICard
          title={platformStats ? "노출수" : "인게이지먼트율"}
          value={platformStats ? platformStats.insights.impressions.toLocaleString() : (latestRow ? `${latestRow.engagement}%` : "0%")}
          subtitle={platformStats ? "최근 30일" : "좋아요 + 댓글 + 저장"}
          icon={TrendingUp}
          color="#00C471"
        />
        <KPICard
          title="게시물 수"
          value={platformStats ? platformStats.profile.mediaCount.toLocaleString() : (latestRow ? latestRow.posts.toString() : "0")}
          subtitle={platformStats ? "전체" : "이번 달"}
          icon={Grid3X3}
          color="#a18cd1"
        />
      </div>

      {/* Real-time top posts */}
      {platformStats && platformStats.recentPosts.length > 0 && (
        <div className={cardCls + " space-y-4"}>
          <h3 className="text-base font-semibold">인기 게시물 (실시간)</h3>
          <div className="space-y-2">
            {platformStats.recentPosts
              .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
              .slice(0, 5)
              .map((m, idx) => (
                <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <span className="w-7 h-7 rounded-full bg-[#E4405F]/10 text-[#E4405F] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{m.caption || "(미디어)"}</p>
                    {m.timestamp && <p className="text-xs text-[var(--muted)] mt-0.5">{fmtDate(m.timestamp)}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-shrink-0">
                    <span className="flex items-center gap-1"><Heart size={12} /> {m.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {m.comments}</span>
                    {m.permalink && (
                      <a href={m.permalink as string} target="_blank" rel="noopener noreferrer" className="text-[#E4405F] hover:underline">
                        <Instagram size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Manual Data Entry Table */}
      <div className={cardCls + " space-y-4"}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">월별 성과 데이터</h3>
          <button onClick={() => setShowAddRow(true)} className={btnPrimary}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              행 추가
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">월</th>
                <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">팔로워</th>
                <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">도달</th>
                <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">인게이지먼트율</th>
                <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">게시물</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {analyticsRows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{row.month}</td>
                  <td className="px-4 py-3 text-right">{row.followers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{row.reach.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{row.engagement}%</td>
                  <td className="px-4 py-3 text-right">{row.posts}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteAnalyticsRow(row.id)}
                      className="p-1 rounded-md hover:bg-[var(--border)] text-neutral-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {analyticsRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)] text-sm">
                    데이터가 없습니다. 행을 추가해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Row Modal */}
      <Modal open={showAddRow} onClose={() => setShowAddRow(false)} title="성과 데이터 추가">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">월 (YYYY-MM)</label>
            <input
              type="month"
              value={newRow.month}
              onChange={(e) => setNewRow({ ...newRow, month: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">팔로워</label>
              <input
                type="number"
                value={newRow.followers}
                onChange={(e) => setNewRow({ ...newRow, followers: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">도달</label>
              <input
                type="number"
                value={newRow.reach}
                onChange={(e) => setNewRow({ ...newRow, reach: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">인게이지먼트율 (%)</label>
              <input
                type="number"
                step="0.1"
                value={newRow.engagement}
                onChange={(e) => setNewRow({ ...newRow, engagement: e.target.value })}
                className={inputCls}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">게시물 수</label>
              <input
                type="number"
                value={newRow.posts}
                onChange={(e) => setNewRow({ ...newRow, posts: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddRow(false)} className={btnSecondary}>
              취소
            </button>
            <button onClick={addAnalyticsRow} className={btnPrimary}>
              추가
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  /* ── 6. Settings ── */
  const renderSettings = () => (
    <div className="space-y-6">
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
        <h3 className="font-semibold">Instagram 계정 연동</h3>

        {channelConnection?.hasToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-xl">📸</div>
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
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/marketing/oauth/refresh", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ channel: "instagram" }),
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
                      body: JSON.stringify({ channel: "instagram" }),
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-3xl mx-auto mb-4">📸</div>
            <p className="font-semibold">Instagram 계정이 연결되지 않았습니다</p>
            <p className="text-sm text-[var(--muted)] mt-1 mb-6">
              Meta 계정으로 로그인하여 Instagram 자동 발행 기능을 사용하세요.<br/>
              비즈니스/크리에이터 계정만 지원됩니다.
            </p>
            <a
              href="/api/marketing/oauth/meta?channel=instagram"
              className="inline-block rounded-lg bg-[#00C471] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#00D47F] transition-colors"
            >
              Meta 계정으로 연결
            </a>
          </div>
        )}
      </div>

      {/* Default Hashtag Groups */}
      <div className={cardCls + " space-y-5"}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Hash size={18} className="text-[#E4405F]" />
            기본 해시태그 그룹
          </h3>
          <button onClick={() => setShowHashtagModal(true)} className={btnPrimary}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              그룹 추가
            </span>
          </button>
        </div>

        {hashtagGroups.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-6">등록된 해시태그 그룹이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {hashtagGroups.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-[var(--border)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{group.name}</h4>
                  <button
                    onClick={() => deleteHashtagGroup(group.id)}
                    className="p-1 rounded-md hover:bg-[var(--border)] text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-posting Toggle */}
      <div className={cardCls + " space-y-4"}>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Zap size={18} className="text-[#E4405F]" />
          자동 게시
        </h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-[var(--border)]">
          <div>
            <p className="text-sm font-medium">자동 게시 활성화</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">예약된 게시물을 자동으로 인스타그램에 발행합니다</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400">
              준비 중
            </span>
            <button
              disabled
              className="text-neutral-600 cursor-not-allowed"
            >
              <ToggleLeft size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Hashtag Group Modal */}
      <Modal open={showHashtagModal} onClose={() => setShowHashtagModal(false)} title="해시태그 그룹 추가">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">그룹 이름</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={inputCls}
              placeholder="예: 강남 인테리어"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">해시태그 (쉼표로 구분)</label>
            <textarea
              value={newGroupTags}
              onChange={(e) => setNewGroupTags(e.target.value)}
              className={inputCls + " resize-none h-24"}
              placeholder="인테리어, 리모델링, 홈스타일링, ..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowHashtagModal(false)} className={btnSecondary}>
              취소
            </button>
            <button onClick={addHashtagGroup} className={btnPrimary}>
              추가
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     Main Render
     ══════════════════════════════════════════════════════════════════════════ */

  const renderContent = () => {
    switch (activeTab) {
      case "feed":
        return renderFeed();
      case "generate":
        return renderGenerator();
      case "reels":
        return renderReels();
      case "stories":
        return renderStories();
      case "analytics":
        return renderAnalytics();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ══════════════════ Header ══════════════════ */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketing"
          className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">인스타그램</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">인스타그램 콘텐츠 자동화</p>
        </div>
      </div>

      {/* ══════════════════ Account Connection ══════════════════ */}
      <AccountConnectionBanner
        channel="instagram"
        channelLabel="인스타그램"
        channelIcon="📸"
        connectionType="oauth_meta"
      />

      {/* ══════════════════ Tab Navigation ══════════════════ */}
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

      {/* ══════════════════ Tab Content ══════════════════ */}
      {renderContent()}
    </div>
  );
}
