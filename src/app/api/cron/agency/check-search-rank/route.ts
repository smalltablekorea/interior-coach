import { sql, eq, isNotNull, isNull, lt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyPublications,
  agencyContentDrafts,
  agencyContentJobs,
  agencyClients,
} from "@/lib/db/schema";
import { searchRank, hashtagsToKeywords, NAVER_SEARCH_ENABLED } from "@/lib/agency/naver-search";
import { createCronRoute } from "@/lib/cron/monitor";

/**
 * Vercel Cron: 검색 순위 자동 체크 (매일 04:00 KST).
 *
 * 대상: search_rank_check_scheduled_at < now() AND search_rank_result IS NULL AND channel = 'naver_blog'.
 * NAVER_CLIENT_ID/SECRET 없으면 mock 결과로 저장.
 * createCronRoute가 CRON_SECRET 검증 + cron_execution_logs 적재 + 실패 알림 처리.
 */
export const POST = createCronRoute({
  name: "agency/check-search-rank",
  handler: async () => {
    // 처리 대상 조회
    const targets = await db
      .select({
        publicationId: agencyPublications.id,
        channel: agencyPublications.channel,
        draftHashtags: agencyContentDrafts.hashtags,
        clientId: agencyContentJobs.clientId,
        naverBlogUrl: agencyClients.naverBlogUrl,
      })
      .from(agencyPublications)
      .innerJoin(agencyContentDrafts, eq(agencyContentDrafts.id, agencyPublications.draftId))
      .innerJoin(agencyContentJobs, eq(agencyContentJobs.id, agencyContentDrafts.jobId))
      .innerJoin(agencyClients, eq(agencyClients.id, agencyContentJobs.clientId))
      .where(
        and(
          eq(agencyPublications.channel, "naver_blog"),
          isNotNull(agencyPublications.searchRankCheckScheduledAt),
          isNull(agencyPublications.searchRankResult),
          lt(agencyPublications.searchRankCheckScheduledAt, sql`now()`),
        ),
      )
      .limit(20); // 1회 cron당 최대 20건

    const results: Array<{
      publicationId: string;
      keywordCount: number;
      mock: boolean;
      error?: string;
    }> = [];

    let errorCount = 0;

    for (const t of targets) {
      const keywords = hashtagsToKeywords(t.draftHashtags as string[] | null).slice(0, 5);
      if (keywords.length === 0) {
        // 키워드 없으면 결과 없는 상태로 마킹 (재시도 방지)
        await db
          .update(agencyPublications)
          .set({
            searchRankResult: {
              checkedAt: new Date().toISOString(),
              channel: "naver_blog",
              queries: [],
              note: "no keywords",
            },
          })
          .where(eq(agencyPublications.id, t.publicationId));
        results.push({ publicationId: t.publicationId, keywordCount: 0, mock: !NAVER_SEARCH_ENABLED });
        continue;
      }

      try {
        const queries = [];
        for (const kw of keywords) {
          const r = await searchRank(kw, t.naverBlogUrl);
          queries.push({
            keyword: r.keyword,
            rank: r.rank,
            totalResults: r.totalResults,
            matchedUrl: r.matchedUrl ?? null,
          });
        }
        await db
          .update(agencyPublications)
          .set({
            searchRankResult: {
              checkedAt: new Date().toISOString(),
              channel: "naver_blog",
              queries,
              mock: !NAVER_SEARCH_ENABLED,
            },
          })
          .where(eq(agencyPublications.id, t.publicationId));
        results.push({
          publicationId: t.publicationId,
          keywordCount: queries.length,
          mock: !NAVER_SEARCH_ENABLED,
        });
      } catch (e) {
        errorCount++;
        results.push({
          publicationId: t.publicationId,
          keywordCount: 0,
          mock: !NAVER_SEARCH_ENABLED,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return {
      processed: targets.length,
      metadata: {
        targetCount: targets.length,
        errorCount,
        naverEnabled: NAVER_SEARCH_ENABLED,
      },
    };
  },
});

// dev 편의 + Vercel Cron 호환: GET도 동일 동작
export const GET = POST;
