"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountConnectionBanner from "@/components/marketing/AccountConnectionBanner";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Search,
  BarChart3,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  MessageSquare,
  TrendingUp,
  Hash,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, fmtDate } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

type TabKey = "posts" | "generate" | "keywords" | "analytics" | "settings";

interface BlogPost {
  id: string;
  contentId: string | null;
  channel: string;
  title: string | null;
  body: string | null;
  hashtags: string[] | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  channelPostUrl: string | null;
  engagement: {
    views?: number;
    likes?: number;
    comments?: number;
    inquiries?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Keyword {
  id: string;
  keyword: string;
  channel: string;
  currentRank: number | null;
  previousRank: number | null;
  searchVolume: number | null;
  targetUrl: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  status: string;
}

interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
  keywords: string[];
}

interface MonthlyData {
  month: string;
  posts: number;
  views: number;
  inquiries: number;
}

interface BlogSettings {
  blogUrl: string;
  defaultCategory: string;
  defaultTags: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "posts", label: "포스트 관리", icon: FileText },
  { key: "generate", label: "AI 블로그 생성", icon: Sparkles },
  { key: "keywords", label: "SEO 키워드", icon: Search },
  { key: "analytics", label: "성과 분석", icon: BarChart3 },
  { key: "settings", label: "설정", icon: Settings },
];

const TEMPLATE_TYPES = [
  { value: "시공사례", label: "시공사례" },
  { value: "비포애프터", label: "비포애프터" },
  { value: "비용분석", label: "비용분석" },
  { value: "자재리뷰", label: "자재리뷰" },
];

const POST_STATUS_MAP: Record<string, string> = {
  draft: "초안",
  scheduled: "예약",
  publishing: "발행중",
  published: "발행완료",
  failed: "실패",
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-neutral-500 focus:border-[#00C471] focus:outline-none";

const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[#00C471] focus:outline-none appearance-none";

const btnPrimary =
  "rounded-lg bg-[#00C471] text-black px-4 py-2 text-sm font-medium hover:bg-[#00D47F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const btnSecondary =
  "px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors";

/* ═══════════════════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NaverBlogPage() {
  /* ── Tab State ── */
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  /* ── Loading ── */
  const [loading, setLoading] = useState(true);

  /* ── Posts State ── */
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    status: "draft",
    views: 0,
    inquiries: 0,
  });

  /* ── AI Generate State ── */
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("시공사례");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── Keywords State ── */
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywordForm, setKeywordForm] = useState({
    keyword: "",
    currentRank: "",
    searchVolume: "",
    targetUrl: "",
  });

  /* ── Analytics State ── */
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState({
    month: "",
    posts: "",
    views: "",
    inquiries: "",
  });

  /* ── Platform Stats (real data from Naver Blog RSS) ── */
  const [platformStats, setPlatformStats] = useState<{
    blogId: string;
    blogTitle: string;
    blogUrl: string;
    totalPosts: number;
    todayVisitors: number;
    weeklyVisitors: number;
    recentPosts: Array<{ title: string; link: string; description: string; pubDate: string }>;
    syncedAt: string;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── Settings State ── */
  const [blogSettings, setBlogSettings] = useState<BlogSettings>({
    blogUrl: "",
    defaultCategory: "",
    defaultTags: "",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [channelConnection, setChannelConnection] = useState<{
    accountName: string | null;
    accountId: string | null;
    hasToken: boolean;
    isActive: boolean;
  } | null>(null);
  const [blogIdInput, setBlogIdInput] = useState("");
  const [connectingBlog, setConnectingBlog] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ═══════════════════════════════════════════════════════════════════════
     Data Fetching
     ═══════════════════════════════════════════════════════════════════════ */

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/posts?channel=naver_blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data?.items ?? data ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/keywords?channel=naver");
      if (res.ok) {
        const data = await res.json();
        setKeywords(data?.items ?? data ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchChannelConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/channels?channel=naver_blog");
      if (res.ok) {
        const data = await res.json();
        if (data) setChannelConnection(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchKeywords(), fetchSites(), fetchChannelConnection()]);
      setLoading(false);
    };
    init();
  }, [fetchPosts, fetchKeywords, fetchSites, fetchChannelConnection]);

  // Fetch real blog stats when connected
  const fetchPlatformStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/marketing/naver-blog/stats");
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setPlatformStats(data);
      }
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (channelConnection?.isActive) {
      fetchPlatformStats();
    }
  }, [channelConnection, fetchPlatformStats]);

  /* ═══════════════════════════════════════════════════════════════════════
     Post Handlers
     ═══════════════════════════════════════════════════════════════════════ */

  const openPostModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setPostForm({
        title: post.title || "",
        body: post.body || "",
        status: post.status,
        views: post.engagement?.views ?? 0,
        inquiries: post.engagement?.inquiries ?? 0,
      });
    } else {
      setEditingPost(null);
      setPostForm({ title: "", body: "", status: "draft", views: 0, inquiries: 0 });
    }
    setShowPostModal(true);
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        const res = await fetch(`/api/marketing/posts/${editingPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: postForm.title,
            body: postForm.body,
            status: postForm.status,
            engagement: {
              views: Number(postForm.views) || 0,
              inquiries: Number(postForm.inquiries) || 0,
            },
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      } else {
        const res = await fetch("/api/marketing/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "naver_blog",
            title: postForm.title,
            body: postForm.body,
            status: postForm.status,
            engagement: {
              views: Number(postForm.views) || 0,
              inquiries: Number(postForm.inquiries) || 0,
            },
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setPosts((prev) => [created, ...prev]);
        }
      }
    } catch {
      /* silent */
    }
    setShowPostModal(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("이 포스트를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/marketing/posts/${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* silent */
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     AI Generation Handlers
     ═══════════════════════════════════════════════════════════════════════ */

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);
    setCopySuccess(false);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "naver_blog",
          siteId: selectedSiteId || undefined,
          contentType: selectedTemplate,
          additionalContext: additionalContext || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.generated);
      } else {
        const err = await res.json();
        alert(err.error || "AI 생성에 실패했습니다.");
      }
    } catch {
      alert("AI 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedContent) return;
    try {
      // Convert markdown-ish body to simple HTML for blog paste
      const htmlBody = generatedContent.body
        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");

      await navigator.clipboard.writeText(htmlBody);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const saveGeneratedContent = async () => {
    if (!generatedContent) return;
    try {
      const res = await fetch("/api/marketing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "naver_blog",
          title: generatedContent.title,
          body: generatedContent.body,
          hashtags: generatedContent.hashtags,
          status: "draft",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [created, ...prev]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      alert("저장에 실패했습니다.");
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Keyword Handlers
     ═══════════════════════════════════════════════════════════════════════ */

  const submitKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keywordForm.keyword,
          channel: "naver",
          currentRank: keywordForm.currentRank ? Number(keywordForm.currentRank) : null,
          searchVolume: keywordForm.searchVolume ? Number(keywordForm.searchVolume) : null,
          targetUrl: keywordForm.targetUrl || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setKeywords((prev) => [created, ...prev]);
      }
    } catch {
      /* silent */
    }
    setShowKeywordModal(false);
    setKeywordForm({ keyword: "", currentRank: "", searchVolume: "", targetUrl: "" });
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Analytics Helpers
     ═══════════════════════════════════════════════════════════════════════ */

  const totalPosts = platformStats ? platformStats.totalPosts : posts.length;
  const totalViews = posts.reduce((sum, p) => sum + (p.engagement?.views ?? 0), 0);
  const totalInquiries = posts.reduce((sum, p) => sum + (p.engagement?.inquiries ?? 0), 0);
  const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
  const todayVisitors = platformStats?.todayVisitors ?? 0;
  const weeklyVisitors = platformStats?.weeklyVisitors ?? 0;

  const submitMonthlyData = (e: React.FormEvent) => {
    e.preventDefault();
    setMonthlyData((prev) => [
      ...prev,
      {
        month: monthlyForm.month,
        posts: Number(monthlyForm.posts) || 0,
        views: Number(monthlyForm.views) || 0,
        inquiries: Number(monthlyForm.inquiries) || 0,
      },
    ]);
    setShowMonthlyModal(false);
    setMonthlyForm({ month: "", posts: "", views: "", inquiries: "" });
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Settings Handlers
     ═══════════════════════════════════════════════════════════════════════ */

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const connectBlog = async () => {
    if (!blogIdInput.trim()) return;
    setConnectingBlog(true);
    setConnectMessage(null);
    try {
      const blogId = blogIdInput.trim();
      const res = await fetch("/api/marketing/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "naver_blog",
          accountName: blogId,
          accountId: blogId,
          isActive: true,
        }),
      });
      if (res.ok) {
        setConnectMessage({ type: "success", text: "블로그가 연결되었습니다!" });
        setBlogIdInput("");
        await fetchChannelConnection();
      } else {
        setConnectMessage({ type: "error", text: "연결에 실패했습니다." });
      }
    } catch {
      setConnectMessage({ type: "error", text: "연결에 실패했습니다." });
    } finally {
      setConnectingBlog(false);
    }
  };

  const disconnectBlog = async () => {
    try {
      const res = await fetch("/api/marketing/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "naver_blog" }),
      });
      if (res.ok) {
        setChannelConnection(null);
        setConnectMessage({ type: "success", text: "블로그 연결이 해제되었습니다." });
      }
    } catch {
      setConnectMessage({ type: "error", text: "연결 해제에 실패했습니다." });
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Rank Change Helper
     ═══════════════════════════════════════════════════════════════════════ */

  const getRankChange = (current: number | null, previous: number | null) => {
    if (current == null || previous == null) return { icon: Minus, color: "text-neutral-500", label: "-" };
    const diff = previous - current; // positive = improved (lower rank number = better)
    if (diff > 0) return { icon: ArrowUp, color: "text-[#00C471]", label: `${diff}` };
    if (diff < 0) return { icon: ArrowDown, color: "text-red-400", label: `${Math.abs(diff)}` };
    return { icon: Minus, color: "text-neutral-500", label: "-" };
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Loading Skeleton
     ═══════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-xl animate-shimmer" />
        <div className="h-12 w-full max-w-2xl rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ══════════ Header ══════════ */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketing"
          className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">네이버 블로그</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">AI 기반 블로그 자동화</p>
        </div>
      </div>

      {/* ══════════ Account Connection ══════════ */}
      <AccountConnectionBanner
        channel="naver-blog"
        channelLabel="네이버 블로그"
        channelIcon="📝"
        connectionType="blog"
      />

      {/* ══════════ Tab Navigation ══════════ */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
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

      {/* ══════════════════════════════════════════════════════════════════
         Tab 1: 포스트 관리 (Post Management)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">포스트 목록</h2>
            <button onClick={() => openPostModal()} className={btnPrimary}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} />
                포스트 추가
              </span>
            </button>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="아직 포스트가 없습니다"
              description="AI 블로그 생성 탭에서 콘텐츠를 만들거나, 직접 포스트를 추가해보세요."
              action={
                <button onClick={() => openPostModal()} className={btnPrimary}>
                  첫 포스트 추가
                </button>
              }
            />
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">제목</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">상태</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">날짜</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">조회수</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">문의</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium max-w-[300px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{post.title || "(제목 없음)"}</span>
                            {post.channelPostUrl && (
                              <a
                                href={post.channelPostUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={POST_STATUS_MAP[post.status] || post.status} />
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                          {fmtDate(post.publishedAt || post.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          {(post.engagement?.views ?? 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          {post.engagement?.inquiries ?? 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openPostModal(post)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Post Add/Edit Modal */}
          <Modal
            open={showPostModal}
            onClose={() => setShowPostModal(false)}
            title={editingPost ? "포스트 수정" : "포스트 추가"}
            maxWidth="max-w-2xl"
          >
            <form onSubmit={submitPost} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">제목 *</label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className={inputCls}
                  placeholder="포스트 제목"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">본문</label>
                <textarea
                  value={postForm.body}
                  onChange={(e) => setPostForm({ ...postForm, body: e.target.value })}
                  className={cn(inputCls, "resize-none h-40")}
                  placeholder="포스트 본문 내용"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">상태</label>
                  <select
                    value={postForm.status}
                    onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                    className={selectCls}
                  >
                    <option value="draft">초안</option>
                    <option value="published">발행완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">조회수</label>
                  <input
                    type="number"
                    min="0"
                    value={postForm.views}
                    onChange={(e) => setPostForm({ ...postForm, views: Number(e.target.value) })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">문의 수</label>
                  <input
                    type="number"
                    min="0"
                    value={postForm.inquiries}
                    onChange={(e) => setPostForm({ ...postForm, inquiries: Number(e.target.value) })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPostModal(false)} className={btnSecondary}>
                  취소
                </button>
                <button type="submit" className={btnPrimary}>
                  {editingPost ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         Tab 2: AI 블로그 생성 (AI Blog Generator) - KEY FEATURE
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Generator Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00C471]/15 flex items-center justify-center">
                <Sparkles size={20} className="text-[#00C471]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI 블로그 생성</h2>
                <p className="text-sm text-[var(--muted)]">현장 데이터 기반으로 SEO 최적화된 블로그 포스트를 자동 생성합니다</p>
              </div>
            </div>

            {/* Step 1: Site Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-[#00C471]/15 text-[#00C471] text-xs flex items-center justify-center font-bold">1</span>
                현장 선택
              </label>
              <div className="relative">
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">현장 선택 (선택사항)</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}{site.address ? ` - ${site.address}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>
              <p className="text-xs text-neutral-600">현장을 선택하면 시공 데이터가 자동으로 반영됩니다</p>
            </div>

            {/* Step 2: Template Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-[#00C471]/15 text-[#00C471] text-xs flex items-center justify-center font-bold">2</span>
                템플릿 유형
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATE_TYPES.map((tmpl) => (
                  <button
                    key={tmpl.value}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.value)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-sm transition-all",
                      selectedTemplate === tmpl.value
                        ? "border-[#00C471] bg-[#00C471]/10 text-[#00C471] font-medium"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Additional Context */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-[#00C471]/15 text-[#00C471] text-xs flex items-center justify-center font-bold">3</span>
                추가 요청사항
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className={cn(inputCls, "resize-none h-24")}
                placeholder="강조하고 싶은 포인트, 특정 키워드, 톤앤매너 등을 입력하세요 (선택사항)"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={cn(btnPrimary, "w-full py-3 text-base flex items-center justify-center gap-2")}
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  AI가 블로그를 작성하고 있습니다...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  AI 생성
                </>
              )}
            </button>
          </div>

          {/* Generated Result */}
          {generatedContent && (
            <div className="rounded-2xl border border-[#00C471]/30 bg-[var(--card)] overflow-hidden">
              {/* Result Header */}
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#00C471]" />
                  <h3 className="font-semibold">생성 결과</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className={cn(
                      btnSecondary,
                      "flex items-center gap-1.5",
                      copySuccess && "border-[#00C471] text-[#00C471]"
                    )}
                  >
                    <Copy size={14} />
                    {copySuccess ? "복사됨!" : "HTML 복사"}
                  </button>
                  <button
                    onClick={saveGeneratedContent}
                    className={cn(
                      btnPrimary,
                      "flex items-center gap-1.5",
                      saveSuccess && "bg-emerald-600 hover:bg-emerald-600"
                    )}
                  >
                    <Save size={14} />
                    {saveSuccess ? "저장됨!" : "저장"}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <p className="text-xs text-[var(--muted)] mb-1">제목</p>
                <h2 className="text-xl font-bold">{generatedContent.title}</h2>
              </div>

              {/* Body Preview */}
              <div className="px-6 py-5">
                <p className="text-xs text-[var(--muted)] mb-3">본문</p>
                <div className="prose prose-invert prose-sm max-w-none">
                  {generatedContent.body.split("\n").map((line, idx) => {
                    if (!line.trim()) return <br key={idx} />;
                    if (line.startsWith("### "))
                      return (
                        <h3 key={idx} className="text-base font-bold mt-4 mb-2">
                          {line.replace("### ", "")}
                        </h3>
                      );
                    if (line.startsWith("## "))
                      return (
                        <h2 key={idx} className="text-lg font-bold mt-5 mb-2">
                          {line.replace("## ", "")}
                        </h2>
                      );
                    if (line.startsWith("# "))
                      return (
                        <h1 key={idx} className="text-xl font-bold mt-6 mb-3">
                          {line.replace("# ", "")}
                        </h1>
                      );
                    if (line.startsWith("- "))
                      return (
                        <li key={idx} className="ml-4 text-neutral-300 leading-relaxed">
                          {line.replace("- ", "")}
                        </li>
                      );
                    return (
                      <p key={idx} className="text-neutral-300 leading-relaxed mb-2">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Hashtags */}
              {generatedContent.hashtags.length > 0 && (
                <div className="px-6 py-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)] mb-2 flex items-center gap-1">
                    <Hash size={12} />
                    해시태그
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#00C471]/10 text-[#00C471] text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {generatedContent.keywords.length > 0 && (
                <div className="px-6 py-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)] mb-2 flex items-center gap-1">
                    <Search size={12} />
                    SEO 키워드
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-neutral-300 text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no content generated yet and not generating */}
          {!generatedContent && !generating && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12">
              <EmptyState
                icon={BookOpen}
                title="AI 블로그를 생성해보세요"
                description="위 설정을 완료하고 'AI 생성' 버튼을 누르면 SEO 최적화된 블로그 포스트가 자동으로 생성됩니다."
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         Tab 3: SEO 키워드 (SEO Keywords)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "keywords" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">SEO 키워드 추적</h2>
            <button
              onClick={() => setShowKeywordModal(true)}
              className={btnPrimary}
            >
              <span className="flex items-center gap-1.5">
                <Plus size={16} />
                키워드 추가
              </span>
            </button>
          </div>

          {keywords.length === 0 ? (
            <EmptyState
              icon={Search}
              title="추적 중인 키워드가 없습니다"
              description="블로그 SEO를 위한 핵심 키워드를 등록하고 순위 변동을 추적해보세요."
              action={
                <button onClick={() => setShowKeywordModal(true)} className={btnPrimary}>
                  첫 키워드 추가
                </button>
              }
            />
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">키워드</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">현재 순위</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">이전 순위</th>
                      <th className="text-center px-5 py-3.5 text-neutral-500 font-medium">변동</th>
                      <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">검색량</th>
                      <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw) => {
                      const change = getRankChange(kw.currentRank, kw.previousRank);
                      const ChangeIcon = change.icon;
                      return (
                        <tr
                          key={kw.id}
                          className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium">
                            <div className="flex items-center gap-2">
                              <Search size={14} className="text-[var(--muted)]" />
                              {kw.keyword}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums font-medium">
                            {kw.currentRank != null ? (
                              <span className={kw.currentRank <= 10 ? "text-[#00C471]" : ""}>
                                {kw.currentRank}위
                              </span>
                            ) : (
                              <span className="text-neutral-500">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-neutral-500">
                            {kw.previousRank != null ? `${kw.previousRank}위` : "-"}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className={cn("flex items-center justify-center gap-1", change.color)}>
                              <ChangeIcon size={14} />
                              <span className="text-xs font-medium">{change.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-neutral-400">
                            {kw.searchVolume != null ? kw.searchVolume.toLocaleString() : "-"}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                            {fmtDate(kw.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Keyword Add Modal */}
          <Modal
            open={showKeywordModal}
            onClose={() => setShowKeywordModal(false)}
            title="키워드 추가"
          >
            <form onSubmit={submitKeyword} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">키워드 *</label>
                <input
                  type="text"
                  required
                  value={keywordForm.keyword}
                  onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                  className={inputCls}
                  placeholder="예: 강남 인테리어"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">현재 순위</label>
                  <input
                    type="number"
                    min="1"
                    value={keywordForm.currentRank}
                    onChange={(e) => setKeywordForm({ ...keywordForm, currentRank: e.target.value })}
                    className={inputCls}
                    placeholder="예: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">검색량 (월간)</label>
                  <input
                    type="number"
                    min="0"
                    value={keywordForm.searchVolume}
                    onChange={(e) => setKeywordForm({ ...keywordForm, searchVolume: e.target.value })}
                    className={inputCls}
                    placeholder="예: 12000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">대상 URL</label>
                <input
                  type="url"
                  value={keywordForm.targetUrl}
                  onChange={(e) => setKeywordForm({ ...keywordForm, targetUrl: e.target.value })}
                  className={inputCls}
                  placeholder="https://blog.naver.com/..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowKeywordModal(false)} className={btnSecondary}>
                  취소
                </button>
                <button type="submit" className={btnPrimary}>
                  추가
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         Tab 4: 성과 분석 (Performance Analytics)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">성과 분석</h2>
            {channelConnection?.isActive && (
              <button
                onClick={fetchPlatformStats}
                disabled={statsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} /> 실시간 데이터 새로고침
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="총 포스트"
              value={totalPosts.toString()}
              icon={FileText}
              color="#00C471"
              subtitle={platformStats ? "실시간" : "블로그에 등록된 전체 포스트"}
            />
            <KPICard
              title={platformStats ? "오늘 방문자" : "총 조회수"}
              value={platformStats ? todayVisitors.toLocaleString() : totalViews.toLocaleString()}
              icon={Eye}
              color="#3B82F6"
              subtitle={platformStats ? "실시간" : "전체 포스트 누적 조회수"}
            />
            <KPICard
              title={platformStats ? "주간 방문자" : "블로그 문의"}
              value={platformStats ? weeklyVisitors.toLocaleString() : totalInquiries.toString()}
              icon={MessageSquare}
              color="#F59E0B"
              subtitle={platformStats ? "최근 7일" : "블로그를 통한 전체 문의"}
            />
            <KPICard
              title="평균 조회수"
              value={avgViews.toLocaleString()}
              icon={TrendingUp}
              color="#8B5CF6"
              subtitle="포스트당 평균 조회수"
            />
          </div>

          {/* Real-time recent posts from RSS */}
          {platformStats && platformStats.recentPosts.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
              <h3 className="text-base font-semibold">최근 블로그 글 (실시간)</h3>
              <div className="space-y-2">
                {platformStats.recentPosts.slice(0, 10).map((post, idx) => (
                  <a
                    key={idx}
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#03C75A]/10 text-[#03C75A] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{post.description}</p>
                      {post.pubDate && (
                        <p className="text-xs text-neutral-600 mt-1">{new Date(post.pubDate).toLocaleDateString("ko-KR")}</p>
                      )}
                    </div>
                    <ExternalLink size={14} className="text-[var(--muted)] flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Data Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">월별 데이터</h3>
              <button onClick={() => setShowMonthlyModal(true)} className={btnPrimary}>
                <span className="flex items-center gap-1.5">
                  <Plus size={16} />
                  월별 데이터 추가
                </span>
              </button>
            </div>

            {monthlyData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="아직 월별 데이터가 없습니다"
                description="매월 블로그 성과를 기록하면 추세를 파악할 수 있습니다."
                action={
                  <button onClick={() => setShowMonthlyModal(true)} className={btnPrimary}>
                    데이터 추가
                  </button>
                }
              />
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-5 py-3.5 text-neutral-500 font-medium">월</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">포스트</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">조회수</th>
                        <th className="text-right px-5 py-3.5 text-neutral-500 font-medium">문의</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium">{row.month}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{row.posts}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{row.views.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{row.inquiries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Data Modal */}
          <Modal
            open={showMonthlyModal}
            onClose={() => setShowMonthlyModal(false)}
            title="월별 데이터 추가"
          >
            <form onSubmit={submitMonthlyData} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">월 *</label>
                <input
                  type="month"
                  required
                  value={monthlyForm.month}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, month: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">포스트 수</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyForm.posts}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, posts: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">조회수</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyForm.views}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, views: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">문의 수</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyForm.inquiries}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, inquiries: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMonthlyModal(false)} className={btnSecondary}>
                  취소
                </button>
                <button type="submit" className={btnPrimary}>
                  추가
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         Tab 5: 설정 (Settings)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">블로그 설정</h2>

          {/* 연결 메시지 배너 */}
          {connectMessage && (
            <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between ${connectMessage.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {connectMessage.text}
              <button onClick={() => setConnectMessage(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          {/* 네이버 블로그 계정 연동 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <h3 className="font-semibold">네이버 블로그 계정 연동</h3>

            {channelConnection?.isActive ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00C471]/20 flex items-center justify-center text-lg">📝</div>
                  <div>
                    <p className="font-semibold">{channelConnection.accountName || "연결된 블로그"}</p>
                    <p className="text-xs text-[var(--green)]">연결됨</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  블로그 ID: <span className="text-[var(--foreground)]">{channelConnection.accountId}</span>
                </p>
                <button
                  onClick={disconnectBlog}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  연결 해제
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted)]">
                  네이버 블로그 ID를 입력하여 블로그를 연결하세요.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={blogIdInput}
                    onChange={(e) => setBlogIdInput(e.target.value)}
                    className={inputCls}
                    placeholder="네이버 블로그 ID (예: myblogid)"
                  />
                  <button
                    onClick={connectBlog}
                    disabled={connectingBlog || !blogIdInput.trim()}
                    className={`${btnPrimary} whitespace-nowrap`}
                  >
                    {connectingBlog ? "연결 중..." : "연결"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  blog.naver.com/<strong>myblogid</strong> 에서 굵은 부분이 블로그 ID입니다
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <form onSubmit={saveSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">블로그 URL</label>
                <input
                  type="url"
                  value={blogSettings.blogUrl}
                  onChange={(e) => setBlogSettings({ ...blogSettings, blogUrl: e.target.value })}
                  className={inputCls}
                  placeholder="https://blog.naver.com/myblog"
                />
                <p className="text-xs text-neutral-600 mt-1">네이버 블로그 주소를 입력하세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">기본 카테고리</label>
                <input
                  type="text"
                  value={blogSettings.defaultCategory}
                  onChange={(e) => setBlogSettings({ ...blogSettings, defaultCategory: e.target.value })}
                  className={inputCls}
                  placeholder="예: 인테리어 시공사례"
                />
                <p className="text-xs text-neutral-600 mt-1">포스트 작성 시 기본으로 설정될 카테고리</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">기본 태그</label>
                <input
                  type="text"
                  value={blogSettings.defaultTags}
                  onChange={(e) => setBlogSettings({ ...blogSettings, defaultTags: e.target.value })}
                  className={inputCls}
                  placeholder="인테리어, 리모델링, 시공사례 (쉼표로 구분)"
                />
                <p className="text-xs text-neutral-600 mt-1">모든 포스트에 기본 적용될 태그 (쉼표로 구분)</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                {settingsSaved && (
                  <p className="text-sm text-[#00C471] flex items-center gap-1.5">
                    <RefreshCw size={14} />
                    설정이 저장되었습니다
                  </p>
                )}
                <div className="flex-1" />
                <button type="submit" className={btnPrimary}>
                  설정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
