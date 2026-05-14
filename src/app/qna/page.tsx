import { Metadata } from "next";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import QnAListClient from "./QnAListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "인테리어 Q&A | 인테리어코치",
  description:
    "인테리어 준비 중인 고객들의 궁금증을 전문가가 답변합니다. 견적, 업체 선택, 시공 과정, 자재, 하자 등 인테리어의 모든 고민을 해결하세요.",
  openGraph: {
    title: "인테리어 Q&A | 인테리어코치",
    description:
      "인테리어 준비부터 시공 완료까지, 전문가가 답변하는 Q&A 커뮤니티.",
    images: ["/landing/og-hero.png"],
  },
  alternates: {
    canonical: "/qna",
  },
};

export default async function QnAPage() {
  let initialData = {
    items: [] as { id: number; title: string; authorId: string; authorRole: string; category: string; status: string; viewCount: number; createdAt: string }[],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    stats: { totalCount: 0, answeredCount: 0, answerRate: 0, avgResponseHours: 0 },
  };
  let totalCount = 0;

  try {
    const where = eq(qnaPosts.service, "interior");

    const [initialItems, countResult, statsResult] = await Promise.all([
      db
        .select({
          id: qnaPosts.id,
          title: qnaPosts.title,
          authorId: qnaPosts.authorId,
          authorRole: qnaPosts.authorRole,
          category: qnaPosts.category,
          status: qnaPosts.status,
          viewCount: qnaPosts.viewCount,
          createdAt: qnaPosts.createdAt,
        })
        .from(qnaPosts)
        .where(where)
        .orderBy(desc(qnaPosts.createdAt))
        .limit(10),

      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(qnaPosts).where(where),

      db
        .select({
          totalCount: sql<number>`cast(count(*) as integer)`,
          answeredCount: sql<number>`cast(count(*) filter (where ${qnaPosts.status} = 'answered') as integer)`,
          avgResponseMinutes: sql<number>`coalesce(
            cast(avg(extract(epoch from (${qnaPosts.answeredAt} - ${qnaPosts.createdAt})) / 60)
            filter (where ${qnaPosts.answeredAt} is not null) as integer), 0)`,
        })
        .from(qnaPosts)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    const stats = statsResult[0];
    totalCount = stats?.totalCount ?? 0;
    const answeredCount = stats?.answeredCount ?? 0;
    const avgMinutes = stats?.avgResponseMinutes ?? 0;

    initialData = {
      items: initialItems.map((item) => ({
        ...item,
        authorId: item.authorId.slice(0, 8) + "***",
        createdAt: item.createdAt.toISOString(),
      })),
      meta: { total, page: 1, limit: 10, totalPages: Math.ceil(total / 10) },
      stats: {
        totalCount,
        answeredCount,
        answerRate: totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0,
        avgResponseHours: +(avgMinutes / 60).toFixed(1),
      },
    };
  } catch (error) {
    console.error("[QnA Page] DB query failed:", error);
  }

  // JSON-LD 구조화 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: "인테리어 Q&A",
    description:
      "인테리어 준비 중인 고객들의 궁금증을 전문가가 답변하는 Q&A",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QnAListClient initialData={initialData} />
    </>
  );
}
