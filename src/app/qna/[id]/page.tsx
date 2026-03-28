import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ArrowLeft, Lock, Eye, Calendar, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

const JOB_ROLE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  ceo: { label: "대표", bg: "bg-[#1a2744]", text: "text-[#6b8bbd]" },
  director: { label: "실장", bg: "bg-[#1a2e1a]", text: "text-[#6bb56b]" },
  manager: { label: "소장", bg: "bg-[#2e2214]", text: "text-[#c49a4a]" },
  designer: { label: "디자이너", bg: "bg-[#2a1a3a]", text: "text-[#a77bca]" },
};

const CATEGORY_LABELS: Record<string, string> = {
  site_mgmt: "현장관리",
  hr: "인력운영",
  revenue: "매출관리",
  customer: "고객응대",
  process: "공정관리",
  tool: "툴·시스템",
  other: "기타",
};

function formatDateTime(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return { title: "질문을 찾을 수 없습니다 | 인테리어코치" };

  const [post] = await db
    .select({ title: qnaPosts.title, authorRole: qnaPosts.authorRole })
    .from(qnaPosts)
    .where(and(eq(qnaPosts.id, numId), eq(qnaPosts.service, "interior")));

  if (!post) {
    return { title: "질문을 찾을 수 없습니다 | 인테리어코치" };
  }

  const roleLabel = JOB_ROLE_STYLES[post.authorRole]?.label || "";
  return {
    title: `${post.title} | 인테리어 업체 Q&A`,
    description: `인테리어 ${roleLabel}의 운영 상담: ${post.title}`,
    openGraph: {
      title: post.title,
      description: `인테리어 ${roleLabel}의 운영 상담 - 인테리어코치 Q&A`,
    },
  };
}

export default async function QnADetailPage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const [post] = await db
    .select()
    .from(qnaPosts)
    .where(and(eq(qnaPosts.id, numId), eq(qnaPosts.service, "interior")));

  if (!post) {
    notFound();
  }

  // viewCount 증가 (fire-and-forget)
  db.update(qnaPosts)
    .set({ viewCount: sql`${qnaPosts.viewCount} + 1` })
    .where(eq(qnaPosts.id, numId))
    .then(() => {})
    .catch(() => {});

  const roleStyle = JOB_ROLE_STYLES[post.authorRole] || null;
  const maskedAuthor = post.authorId.slice(0, 8) + "***";

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: post.title,
      dateCreated: post.createdAt.toISOString(),
      answerCount: post.answer ? 1 : 0,
      ...(post.answer
        ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: "답변 내용은 인테리어코치 서비스 내에서 확인하실 수 있습니다.",
              dateCreated: post.answeredAt?.toISOString(),
            },
          }
        : {}),
    },
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-[var(--foreground)]">인테리어코치</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/qna"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Q&A 목록
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/qna"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          목록으로
        </Link>

        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {roleStyle && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium",
                  roleStyle.bg,
                  roleStyle.text
                )}
              >
                {roleStyle.label}
              </span>
            )}
            {post.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-white/5 text-[var(--muted)] border border-[var(--border)]">
                <Tag size={10} />
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
            )}
            {post.status === "answered" ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--green)]/10 text-[var(--green)]">
                답변완료
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-[var(--muted)]">
                답변 대기중
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold mb-3">{post.title}</h1>

          <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <User size={12} />
              <span className="font-mono">{maskedAuthor}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDateTime(post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {post.viewCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Question Body — Blurred */}
        <div className="relative mb-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <p className="text-sm text-[var(--muted)] mb-3 font-medium">질문 내용</p>
            <div className="blur-[6px] select-none pointer-events-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] shadow-lg">
              <Lock size={24} className="text-[var(--muted)]" />
              <p className="text-sm font-medium text-center">
                업체 운영 상담 내용은<br />영업기밀 보호를 위해 비공개입니다
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                인테리어코치 도입 시 전체 내용 열람 가능
              </p>
            </div>
          </div>
        </div>

        {/* Answer — Blurred */}
        {post.answer && (
          <div className="relative mb-8">
            <div className="bg-[var(--card)] border border-[var(--green)]/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[var(--green)]/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--green)]">A</span>
                </div>
                <p className="text-sm font-medium text-[var(--green)]">인테리어코치 운영팀</p>
                {post.answeredAt && (
                  <span className="text-[11px] text-[var(--muted)] ml-auto">
                    {formatDateTime(post.answeredAt)}
                  </span>
                )}
              </div>
              <div className="blur-[6px] select-none pointer-events-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {post.answer}
                </p>
              </div>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] shadow-lg">
                <Lock size={24} className="text-[var(--muted)]" />
                <p className="text-sm font-medium text-center">
                  전문가 답변은 도입 업체에게만 공개됩니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--green)]/10 to-[var(--green)]/[0.02] border border-[var(--green)]/20 text-center">
          <p className="text-lg font-bold mb-1">이런 고민, 우리 업체도 하고 있다면?</p>
          <p className="text-sm text-[var(--muted)] mb-4">
            인테리어코치를 도입하면 운영 전문가의 1:1 상담과 업체 관리 시스템을 한번에 사용할 수 있습니다
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium hover:opacity-90 transition-opacity"
          >
            우리 업체도 도입하기 →
          </Link>
        </div>

        {/* Back to list */}
        <div className="mt-6 text-center">
          <Link
            href="/qna"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={14} />
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
