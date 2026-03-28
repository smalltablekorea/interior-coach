"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  Timer,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface QnAItem {
  id: number;
  title: string;
  authorId: string;
  authorRole: string;
  category: string;
  status: string;
  viewCount: number;
  createdAt: string;
}

interface Stats {
  totalCount: number;
  answeredCount: number;
  answerRate: number;
  avgResponseHours: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface InitialData {
  items: QnAItem[];
  meta: Meta;
  stats: Stats;
}

// ─── Constants ───

const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "estimate", label: "견적/비용" },
  { key: "contractor", label: "업체선택" },
  { key: "process", label: "시공과정" },
  { key: "quality", label: "품질/하자" },
  { key: "materials", label: "자재/마감재" },
  { key: "design", label: "디자인" },
  { key: "other", label: "기타" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  estimate: "견적/비용",
  contractor: "업체선택",
  process: "시공과정",
  quality: "품질/하자",
  materials: "자재/마감재",
  design: "디자인",
  other: "기타",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}.${day}`;
}

// ─── Component ───

export default function QnAListClient({ initialData }: { initialData: InitialData }) {
  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (p: number, c: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: "10" });
        if (c) params.set("category", c);

        const res = await fetch(`/api/qna?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleCategoryChange = (c: string) => {
    setCategory(c);
    setPage(1);
    fetchData(1, c);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p, category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { items, meta, stats } = data;

  const getNumber = (index: number) => meta.total - (meta.page - 1) * meta.limit - index;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-[var(--foreground)]">인테리어코치</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              요금제
            </Link>
            <Link
              href="/pricing"
              className="text-sm px-4 py-1.5 rounded-xl bg-[var(--green)] text-black font-medium hover:opacity-90 transition-opacity"
            >
              도입 문의
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">인테리어 Q&A</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            인테리어 준비 중인 고객들의 궁금증, 전문가가 답변합니다
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--green)]/10 flex items-center justify-center">
              <BarChart3 size={18} className="text-[var(--green)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">총 상담</p>
              <p className="text-lg font-bold">{stats.totalCount.toLocaleString()}건</p>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Timer size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">평균 답변시간</p>
              <p className="text-lg font-bold">{stats.avgResponseHours}시간</p>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Percent size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">답변완료율</p>
              <p className="text-lg font-bold">{stats.answerRate}%</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--muted)] w-10 shrink-0">분야</span>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => handleCategoryChange(c.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  category === c.key
                    ? "bg-[var(--green)] text-black"
                    : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table (Desktop) */}
        <div className={cn("transition-opacity", loading && "opacity-50")}>
          <div className="hidden md:block rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--card)] border-b border-[var(--border)] text-xs text-[var(--muted)]">
                  <th className="py-3 px-4 text-left w-14">번호</th>
                  <th className="py-3 px-3 text-left">제목</th>
                  <th className="py-3 px-3 text-left w-24">분야</th>
                  <th className="py-3 px-3 text-center w-16">작성일</th>
                  <th className="py-3 px-3 text-center w-14">조회</th>
                  <th className="py-3 px-3 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-[var(--muted)]">
                      {getNumber(i)}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/qna/${item.id}`}
                        className="text-sm hover:text-[var(--green)] transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-xs text-[var(--muted)]">
                      {item.category ? CATEGORY_LABELS[item.category] || item.category : ""}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-[var(--muted)]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-[var(--muted)]">
                      {item.viewCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === "answered" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)]">
                          <CheckCircle size={10} />
                          답변완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-[var(--muted)]">
                          <Clock size={10} />
                          대기중
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-[var(--muted)]">
                      <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                      등록된 상담이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/qna/${item.id}`}
                className="block bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--green)]/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)]">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  )}
                  {item.status === "answered" ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--green)]">
                      <CheckCircle size={10} />
                      답변완료
                    </span>
                  ) : (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                      <Clock size={10} />
                      대기중
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--muted)]">
                  <span>{formatDate(item.createdAt)}</span>
                  <span className="flex items-center gap-0.5">
                    <Eye size={10} />
                    {item.viewCount}
                  </span>
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="py-16 text-center text-sm text-[var(--muted)]">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                등록된 상담이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === meta.totalPages) return true;
                return Math.abs(p - page) <= 2;
              })
              .map((p, i, arr) => {
                const prev = arr[i - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsis && (
                      <span className="w-9 h-9 flex items-center justify-center text-[var(--muted)] text-xs">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors",
                        p === page
                          ? "bg-[var(--green)] text-black font-medium"
                          : "text-[var(--muted)] hover:bg-[var(--card)] border border-[var(--border)]"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[var(--green)]/10 to-[var(--green)]/[0.02] border border-[var(--green)]/20 text-center">
          <p className="text-lg font-bold mb-1">인테리어, 전문가와 함께 준비하세요</p>
          <p className="text-sm text-[var(--muted)] mb-4">
            인테리어코치로 견적 비교부터 시공 관리까지 한번에 해결하세요
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium hover:opacity-90 transition-opacity"
          >
            자세히 알아보기 →
          </Link>
        </div>
      </main>
    </div>
  );
}
