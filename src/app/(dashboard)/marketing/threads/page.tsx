"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  BookTemplate,
  Zap,
  MessageCircle,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  Send,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";
import {
  THREADS_POST_STATUSES,
  THREADS_TEMPLATE_CATEGORIES,
  THREADS_AUTO_RULE_TYPES,
} from "@/lib/constants";

/* ── Types ── */
type TabKey = "calendar" | "templates" | "autoPost" | "autoComment" | "analytics" | "settings";

interface ThreadsPost {
  id: string;
  siteId: string | null;
  siteName: string | null;
  title: string | null;
  content: string;
  hashtags: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  likes: number;
  comments: number;
  views: number;
  templateId: string | null;
  createdAt: string;
}

interface ThreadsTemplate {
  id: string;
  name: string;
  category: string;
  contentTemplate: string;
  hashtagTemplate: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface AutoRule {
  id: string;
  name: string;
  type: string;
  templateId: string | null;
  templateName: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  config: Record<string, unknown> | null;
  createdAt: string;
}

interface ThreadsComment {
  id: string;
  postId: string;
  postContent: string | null;
  authorName: string;
  commentText: string;
  replyText: string | null;
  replyStatus: string;
  isAutoReply: boolean;
  createdAt: string;
}

interface AccountInfo {
  id: string;
  username: string;
  isConnected: boolean;
  connectedAt: string | null;
}

interface Site {
  id: string;
  name: string;
}

/* ── Helpers ── */
const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";
const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none";

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: "calendar", label: "콘텐츠 캘린더", icon: CalendarDays },
  { key: "templates", label: "콘텐츠 라이브러리", icon: BookTemplate },
  { key: "autoPost", label: "자동 포스팅", icon: Zap },
  { key: "autoComment", label: "자동 댓글", icon: MessageCircle },
  { key: "analytics", label: "성과 분석", icon: BarChart3 },
  { key: "settings", label: "설정", icon: Settings },
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const RULE_TYPE_LABELS: Record<string, string> = {
  시공완료자동: "시공 완료 시 자동 포스트",
  정기포스팅: "정기 포스팅",
  시공사진자동: "시공 사진 업로드 시 자동",
  프로모션자동: "프로모션 자동 포스트",
};

/* ────────────────────────────── Page ────────────────────────────── */
export default function ThreadsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");

  /* ── Data States ── */
  const [posts, setPosts] = useState<ThreadsPost[]>([]);
  const [templates, setTemplates] = useState<ThreadsTemplate[]>([]);
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [comments, setComments] = useState<ThreadsComment[]>([]);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  /* ── Calendar State ── */
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  /* ── Post Modal ── */
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ThreadsPost | null>(null);
  const [postForm, setPostForm] = useState({
    siteId: "",
    title: "",
    content: "",
    hashtags: "",
    status: "작성중",
    scheduledAt: "",
    templateId: "",
  });
  const [generating, setGenerating] = useState(false);

  /* ── Template Modal ── */
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ThreadsTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "시공완료",
    contentTemplate: "",
    hashtagTemplate: "",
  });

  /* ── Rule Modal ── */
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "시공완료자동",
    templateId: "",
  });

  /* ── Account Modal ── */
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountUsername, setAccountUsername] = useState("");

  /* ── OAuth Channel Connection ── */
  const [channelConnection, setChannelConnection] = useState<{
    accountName: string | null;
    hasToken: boolean;
    tokenExpiresAt: string | null;
    isActive: boolean;
  } | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, templatesRes, rulesRes, commentsRes, accountRes, sitesRes] =
        await Promise.all([
          fetch("/api/marketing/threads/posts"),
          fetch("/api/marketing/threads/templates"),
          fetch("/api/marketing/threads/auto-rules"),
          fetch("/api/marketing/threads/comments"),
          fetch("/api/marketing/threads/account"),
          fetch("/api/sites"),
        ]);

      setPosts(await postsRes.json());
      setTemplates(await templatesRes.json());
      setRules(await rulesRes.json());
      setComments(await commentsRes.json());
      const acc = await accountRes.json();
      setAccount(acc);
      const sitesData = await sitesRes.json();
      setSites(Array.isArray(sitesData) ? sitesData : sitesData.sites || []);
    } catch (e) {
      console.error("Fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // OAuth callback detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success")) {
      setOauthMessage({ type: "success", text: "스레드 계정이 성공적으로 연결되었습니다!" });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("oauth_error")) {
      setOauthMessage({ type: "error", text: decodeURIComponent(params.get("oauth_error")!) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Load channel connection
  useEffect(() => {
    fetch("/api/marketing/channels?channel=threads")
      .then(r => r.json())
      .then(data => { if (data) setChannelConnection(data); })
      .catch(() => {});
  }, []);

  /* ── KPI ── */
  const totalPosts = posts.length;
  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "발행완료" || !p.publishedAt) return false;
    const d = new Date(p.publishedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const scheduledCount = posts.filter((p) => p.status === "예약").length;
  const totalReactions = posts.reduce((s, p) => s + p.likes + p.comments, 0);

  /* ── Calendar Helpers ── */
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calMonth.year, calMonth.month, 1).getDay();
  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getPostsForDay = (day: number) => {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((p) => {
      const d = p.scheduledAt || p.publishedAt || p.createdAt;
      return d?.startsWith(dateStr);
    });
  };

  const prevMonth = () =>
    setCalMonth((prev) =>
      prev.month === 0
        ? { year: prev.year - 1, month: 11 }
        : { ...prev, month: prev.month - 1 }
    );
  const nextMonth = () =>
    setCalMonth((prev) =>
      prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { ...prev, month: prev.month + 1 }
    );

  /* ── Post CRUD ── */
  const openCreatePost = (dateStr?: string) => {
    setEditingPost(null);
    setPostForm({
      siteId: "",
      title: "",
      content: "",
      hashtags: "",
      status: "작성중",
      scheduledAt: dateStr
        ? `${dateStr}T10:00`
        : "",
      templateId: "",
    });
    setShowPostModal(true);
  };

  const openEditPost = (post: ThreadsPost) => {
    setEditingPost(post);
    setPostForm({
      siteId: post.siteId || "",
      title: post.title || "",
      content: post.content,
      hashtags: post.hashtags || "",
      status: post.status,
      scheduledAt: post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
        : "",
      templateId: post.templateId || "",
    });
    setShowPostModal(true);
  };

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...postForm,
      siteId: postForm.siteId || null,
      templateId: postForm.templateId || null,
      scheduledAt: postForm.scheduledAt || null,
    };

    if (editingPost) {
      await fetch("/api/marketing/threads/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPost.id, ...payload }),
      });
    } else {
      await fetch("/api/marketing/threads/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowPostModal(false);
    fetchAll();
  };

  const deletePost = async (id: string) => {
    await fetch(`/api/marketing/threads/posts?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  const generateContent = async () => {
    setGenerating(true);
    try {
      const category = templates.find((t) => t.id === postForm.templateId)?.category || "일상";
      const res = await fetch("/api/marketing/threads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: category,
          siteId: postForm.siteId || undefined,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setPostForm((prev) => ({
          ...prev,
          content: data.content,
          hashtags: data.hashtags || prev.hashtags,
        }));
      }
    } catch (e) {
      console.error("Generate error:", e);
    }
    setGenerating(false);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setPostForm((prev) => ({
        ...prev,
        templateId,
        content: tpl.contentTemplate,
        hashtags: tpl.hashtagTemplate || prev.hashtags,
      }));
    }
  };

  /* ── Template CRUD ── */
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", category: "시공완료", contentTemplate: "", hashtagTemplate: "" });
    setShowTemplateModal(true);
  };

  const openEditTemplate = (t: ThreadsTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      category: t.category,
      contentTemplate: t.contentTemplate,
      hashtagTemplate: t.hashtagTemplate || "",
    });
    setShowTemplateModal(true);
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      await fetch("/api/marketing/threads/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTemplate.id, ...templateForm }),
      });
    } else {
      await fetch("/api/marketing/threads/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
    }
    setShowTemplateModal(false);
    fetchAll();
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/marketing/threads/templates?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  /* ── Rule CRUD ── */
  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ name: "", type: "시공완료자동", templateId: "" });
    setShowRuleModal(true);
  };

  const saveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      await fetch("/api/marketing/threads/auto-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRule.id, ...ruleForm, templateId: ruleForm.templateId || null }),
      });
    } else {
      await fetch("/api/marketing/threads/auto-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ruleForm, templateId: ruleForm.templateId || null }),
      });
    }
    setShowRuleModal(false);
    fetchAll();
  };

  const toggleRule = async (rule: AutoRule) => {
    await fetch("/api/marketing/threads/auto-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
    });
    fetchAll();
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/marketing/threads/auto-rules?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  /* ── Comment Actions ── */
  const generateReply = async (commentId: string) => {
    await fetch("/api/marketing/threads/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    fetchAll();
  };

  const updateCommentStatus = async (id: string, replyStatus: string) => {
    await fetch("/api/marketing/threads/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, replyStatus }),
    });
    fetchAll();
  };

  /* ── Account ── */
  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/marketing/threads/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: accountUsername }),
    });
    setShowAccountModal(false);
    fetchAll();
  };

  const disconnectAccount = async () => {
    await fetch("/api/marketing/threads/account", { method: "DELETE" });
    fetchAll();
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-96 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  /* ── Post Status Color ── */
  const statusDotColor = (status: string) => {
    switch (status) {
      case "발행완료": return "bg-[var(--green)]";
      case "예약": return "bg-purple-400";
      case "작성중": return "bg-yellow-400";
      case "실패": return "bg-[var(--red)]";
      default: return "bg-white/20";
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/marketing"
          className="p-2 rounded-xl hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">쓰레드 자동화</h1>
        {account?.isConnected && (
          <span className="ml-2 px-2 py-0.5 rounded-md bg-[var(--green)]/10 text-[var(--green)] text-xs">
            @{account.username} 연결됨
          </span>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="총 게시물" value={`${totalPosts}건`} subtitle="전체" icon={Send} color="var(--blue)" />
        <KPICard
          title="이번달 발행"
          value={`${publishedThisMonth}건`}
          subtitle="발행완료"
          icon={Check}
          color="var(--green)"
        />
        <KPICard
          title="예약 대기"
          value={`${scheduledCount}건`}
          subtitle="예약됨"
          icon={Clock}
          color="var(--orange)"
        />
        <KPICard
          title="총 반응"
          value={`${totalReactions}`}
          subtitle="좋아요+댓글"
          icon={Heart}
          color="var(--red)"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[var(--green)] text-[var(--green)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ Tab: Calendar ═══════════════════ */}
      {activeTab === "calendar" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)]">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold">
                {calMonth.year}년 {calMonth.month + 1}월
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)]">
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => openCreatePost()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
            >
              <Plus size={18} />
              포스트 작성
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-7">
              {DAY_NAMES.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-xs font-medium text-[var(--muted)] border-b border-[var(--border)]">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                const dateStr = day
                  ? `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : "";
                return (
                  <div
                    key={i}
                    onClick={() => day && openCreatePost(dateStr)}
                    className={`min-h-[80px] p-1.5 border-b border-r border-[var(--border)] cursor-pointer hover:bg-white/[0.02] transition-colors ${
                      !day ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <span className="text-xs text-[var(--muted)]">{day}</span>
                        <div className="mt-1 space-y-0.5">
                          {dayPosts.slice(0, 2).map((p) => (
                            <div
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPost(p);
                              }}
                              className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors truncate"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotColor(p.status)}`} />
                              <span className="truncate">{p.content.slice(0, 15)}</span>
                            </div>
                          ))}
                          {dayPosts.length > 2 && (
                            <span className="text-[10px] text-[var(--muted)] px-1">+{dayPosts.length - 2}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Posts List */}
          <h3 className="text-sm font-semibold text-[var(--muted)]">최근 포스트</h3>
          <div className="space-y-2">
            {posts.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
              >
                <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${statusDotColor(p.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{p.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--muted)]">
                    <StatusBadge status={p.status} />
                    {p.siteName && <span>{p.siteName}</span>}
                    <span>{fmtDate(p.scheduledAt || p.createdAt)}</span>
                    {p.status === "발행완료" && (
                      <span className="flex items-center gap-2">
                        <Heart size={11} /> {p.likes}
                        <MessageSquare size={11} /> {p.comments}
                        <Eye size={11} /> {p.views}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditPost(p)}
                    className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <EmptyState icon={Send} title="포스트가 없습니다" description="첫 번째 쓰레드 포스트를 작성해보세요." />
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════ Tab: Templates ═══════════════════ */}
      {activeTab === "templates" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">콘텐츠 라이브러리</h2>
            <button
              onClick={openCreateTemplate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
            >
              <Plus size={18} />
              템플릿 추가
            </button>
          </div>

          {templates.length === 0 ? (
            <EmptyState icon={BookTemplate} title="템플릿이 없습니다" description="콘텐츠 템플릿을 추가해보세요." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)] mt-1">
                        {t.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditTemplate(t)}
                        className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-3 line-clamp-3">{t.contentTemplate}</p>
                  {t.hashtagTemplate && (
                    <p className="text-xs text-[var(--blue)] mt-2 truncate">{t.hashtagTemplate}</p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-2">사용 {t.usageCount}회</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════ Tab: Auto Post ═══════════════════ */}
      {activeTab === "autoPost" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">자동 포스팅 규칙</h2>
            <button
              onClick={openCreateRule}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
            >
              <Plus size={18} />
              규칙 추가
            </button>
          </div>

          {rules.length === 0 ? (
            <EmptyState icon={Zap} title="자동 포스팅 규칙이 없습니다" description="규칙을 추가하면 자동으로 포스트가 생성됩니다." />
          ) : (
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
                >
                  <button onClick={() => toggleRule(r)} className="flex-shrink-0">
                    {r.isActive ? (
                      <ToggleRight size={28} className="text-[var(--green)]" />
                    ) : (
                      <ToggleLeft size={28} className="text-[var(--muted)]" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {RULE_TYPE_LABELS[r.type] || r.type}
                      {r.templateName && ` · 템플릿: ${r.templateName}`}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      실행 {r.triggerCount}회
                      {r.lastTriggeredAt && ` · 최근: ${fmtDate(r.lastTriggeredAt)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRule(r.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--muted)] hover:text-[var(--red)] transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════ Tab: Auto Comment ═══════════════════ */}
      {activeTab === "autoComment" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">자동 댓글 관리</h2>
            <div className="flex gap-2 text-xs text-[var(--muted)]">
              <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400">
                대기 {comments.filter((c) => c.replyStatus === "대기").length}
              </span>
              <span className="px-2 py-1 rounded-lg bg-[var(--green)]/10 text-[var(--green)]">
                완료 {comments.filter((c) => c.replyStatus === "완료").length}
              </span>
            </div>
          </div>

          {comments.length === 0 ? (
            <EmptyState icon={MessageCircle} title="댓글이 없습니다" description="게시물에 댓글이 달리면 여기에 표시됩니다." />
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-sm">{c.authorName}</span>
                      <span className="text-xs text-[var(--muted)] ml-2">{fmtDate(c.createdAt)}</span>
                    </div>
                    <StatusBadge status={c.replyStatus} />
                  </div>
                  <p className="text-sm mt-2">{c.commentText}</p>
                  {c.postContent && (
                    <p className="text-xs text-[var(--muted)] mt-1 truncate">
                      원본: {c.postContent.slice(0, 50)}...
                    </p>
                  )}

                  {/* Reply Section */}
                  {c.replyText ? (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                      <p className="text-xs text-[var(--muted)] mb-1">
                        {c.isAutoReply ? "AI 자동 답변" : "수동 답변"}
                      </p>
                      <p className="text-sm">{c.replyText}</p>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 mt-3">
                    {!c.replyText && (
                      <button
                        onClick={() => generateReply(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-medium hover:bg-[var(--blue)]/20 transition-colors"
                      >
                        <Sparkles size={12} />
                        AI 답변 생성
                      </button>
                    )}
                    {c.replyStatus === "대기" && (
                      <>
                        <button
                          onClick={() => updateCommentStatus(c.id, "완료")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium hover:bg-[var(--green)]/20 transition-colors"
                        >
                          <Check size={12} />
                          승인
                        </button>
                        <button
                          onClick={() => updateCommentStatus(c.id, "건너뜀")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-[var(--muted)] text-xs font-medium hover:bg-white/[0.08] transition-colors"
                        >
                          <X size={12} />
                          건너뜀
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════ Tab: Analytics ═══════════════════ */}
      {activeTab === "analytics" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">성과 분석</h2>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "총 게시물", value: totalPosts },
              { label: "발행 완료", value: posts.filter((p) => p.status === "발행완료").length },
              { label: "총 좋아요", value: posts.reduce((s, p) => s + p.likes, 0) },
              { label: "총 댓글", value: posts.reduce((s, p) => s + p.comments, 0) },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                <p className="text-xs text-[var(--muted)]">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Top Posts */}
          <h3 className="text-sm font-semibold text-[var(--muted)]">인기 게시물 Top 3</h3>
          <div className="space-y-2">
            {posts
              .filter((p) => p.status === "발행완료")
              .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
              .slice(0, 3)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.content}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{fmtDate(p.publishedAt || p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-shrink-0">
                    <span className="flex items-center gap-1"><Heart size={12} /> {p.likes}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {p.comments}</span>
                    <span className="flex items-center gap-1"><Eye size={12} /> {p.views}</span>
                  </div>
                </div>
              ))}
            {posts.filter((p) => p.status === "발행완료").length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-8">발행된 게시물이 없습니다.</p>
            )}
          </div>

          {/* Monthly Bar Chart (simple) */}
          <h3 className="text-sm font-semibold text-[var(--muted)]">월별 발행 추이</h3>
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {(() => {
              const months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                return { label: `${d.getMonth() + 1}월`, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
              });
              const counts = months.map((m) => posts.filter((p) => p.status === "발행완료" && p.publishedAt?.startsWith(m.key)).length);
              const max = Math.max(...counts, 1);
              return (
                <div className="flex items-end gap-3 h-32">
                  {months.map((m, i) => (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{counts[i]}</span>
                      <div
                        className="w-full rounded-t-lg bg-[var(--green)]/30"
                        style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? "4px" : "0" }}
                      />
                      <span className="text-[10px] text-[var(--muted)]">{m.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ═══════════════════ Tab: Settings ═══════════════════ */}
      {activeTab === "settings" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Threads 계정 설정</h2>

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
            <h3 className="font-semibold">Threads 계정 연동</h3>

            {channelConnection?.hasToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--border)] flex items-center justify-center text-xl">🧵</div>
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
                          body: JSON.stringify({ channel: "threads" }),
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
                          body: JSON.stringify({ channel: "threads" }),
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
                <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center text-3xl mx-auto mb-4">🧵</div>
                <p className="font-semibold">Threads 계정이 연결되지 않았습니다</p>
                <p className="text-sm text-[var(--muted)] mt-1 mb-6">
                  Meta 계정으로 로그인하여 Threads 자동 발행 기능을 사용하세요.
                </p>
                <a
                  href="/api/marketing/oauth/meta?channel=threads"
                  className="inline-block rounded-lg bg-[#00C471] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#00D47F] transition-colors"
                >
                  Meta 계정으로 연결
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════ Post Modal ═══════════════════ */}
      <Modal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        title={editingPost ? "포스트 수정" : "포스트 작성"}
        maxWidth="lg"
      >
        <form onSubmit={savePost} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">현장 (선택)</label>
              <select
                value={postForm.siteId}
                onChange={(e) => setPostForm({ ...postForm, siteId: e.target.value })}
                className={selectCls}
              >
                <option value="">현장 선택</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">템플릿 (선택)</label>
              <select
                value={postForm.templateId}
                onChange={(e) => {
                  if (e.target.value) applyTemplate(e.target.value);
                  else setPostForm({ ...postForm, templateId: "" });
                }}
                className={selectCls}
              >
                <option value="">템플릿 선택</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-[var(--muted)]">내용 *</label>
              <button
                type="button"
                onClick={generateContent}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-medium hover:bg-[var(--blue)]/20 transition-colors disabled:opacity-50"
              >
                {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {generating ? "생성 중..." : "AI 생성"}
              </button>
            </div>
            <textarea
              required
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              className={`${inputCls} resize-none h-32`}
              placeholder="포스트 내용을 입력하세요 (500자 이내)"
              maxLength={500}
            />
            <p className="text-xs text-[var(--muted)] text-right mt-1">{postForm.content.length}/500</p>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">해시태그</label>
            <input
              type="text"
              value={postForm.hashtags}
              onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })}
              className={inputCls}
              placeholder="#인테리어 #리모델링 #시공사례"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
              <select
                value={postForm.status}
                onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                className={selectCls}
              >
                {THREADS_POST_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">예약 발행일시</label>
              <input
                type="datetime-local"
                value={postForm.scheduledAt}
                onChange={(e) => setPostForm({ ...postForm, scheduledAt: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPostModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingPost ? "수정" : "작성"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════ Template Modal ═══════════════════ */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={editingTemplate ? "템플릿 수정" : "템플릿 추가"}
      >
        <form onSubmit={saveTemplate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">이름 *</label>
              <input
                type="text"
                required
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                className={inputCls}
                placeholder="템플릿 이름"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">카테고리 *</label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                className={selectCls}
              >
                {THREADS_TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">콘텐츠 템플릿 *</label>
            <textarea
              required
              value={templateForm.contentTemplate}
              onChange={(e) => setTemplateForm({ ...templateForm, contentTemplate: e.target.value })}
              className={`${inputCls} resize-none h-28`}
              placeholder="포스트 본문 템플릿"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">해시태그 템플릿</label>
            <input
              type="text"
              value={templateForm.hashtagTemplate}
              onChange={(e) => setTemplateForm({ ...templateForm, hashtagTemplate: e.target.value })}
              className={inputCls}
              placeholder="#인테리어 #리모델링"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTemplateModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingTemplate ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════ Rule Modal ═══════════════════ */}
      <Modal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? "규칙 수정" : "규칙 추가"}
      >
        <form onSubmit={saveRule} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">규칙 이름 *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className={inputCls}
              placeholder="규칙 이름"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">유형 *</label>
            <select
              value={ruleForm.type}
              onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
              className={selectCls}
            >
              {THREADS_AUTO_RULE_TYPES.map((t) => (
                <option key={t} value={t}>{RULE_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">템플릿 (선택)</label>
            <select
              value={ruleForm.templateId}
              onChange={(e) => setRuleForm({ ...ruleForm, templateId: e.target.value })}
              className={selectCls}
            >
              <option value="">템플릿 선택</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRuleModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              {editingRule ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Account Modal removed - replaced by OAuth flow */}
    </div>
  );
}
