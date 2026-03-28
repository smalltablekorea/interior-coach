import { Metadata } from "next";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import QnAListClient from "./QnAListClient";

export const revalidate = 3600; // ISR 1시간

export const metadata: Metadata = {
  title: "인테리어 업체 운영 Q&A | 인테리어코치",
  description:
    "인테리어 업체 대표, 실장, 소장, 디자이너의 실전 운영 상담. 현장 관리, 인력, 매출, 고객 응대 등 업체 운영의 모든 고민을 전문가가 답변합니다.",
  openGraph: {
    title: "인테리어 업체 운영 Q&A | 인테리어코치",
    description:
      "인테리어 업체 종사자를 위한 운영 상담 커뮤니티. 현장 관리부터 매출 전략까지.",
  },
};

export default async function QnAPage() {
  const where = eq(qnaPosts.service, "interior");

  // 초기 데이터 + 통계를 서버에서 직접 조회 (self-fetch 방지)
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
  const totalCount = stats?.totalCount ?? 0;
  const answeredCount = stats?.answeredCount ?? 0;
  const avgMinutes = stats?.avgResponseMinutes ?? 0;

  const serializedItems = initialItems.map((item) => ({
    ...item,
    authorId: item.authorId.slice(0, 8) + "***",
    createdAt: item.createdAt.toISOString(),
  }));

  const initialData = {
    items: serializedItems,
    meta: { total, page: 1, limit: 10, totalPages: Math.ceil(total / 10) },
    stats: {
      totalCount,
      answeredCount,
      answerRate: totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0,
      avgResponseHours: +(avgMinutes / 60).toFixed(1),
    },
  };

  // JSON-LD 구조화 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: "인테리어 업체 운영 Q&A",
    description:
      "인테리어 업체 종사자를 위한 운영 상담 커뮤니티",
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
