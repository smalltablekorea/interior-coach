/**
 * 콘텐츠 생성 파이프라인 — 3채널 병렬 + 채널별 최대 3회 재시도.
 *
 * 운영자 수동 트리거 (POST /jobs/generate) + 자동 트리거 (주간 업로드 직후 fire-and-forget) 공유.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyWeeklyUploads,
  agencyBrandAssets,
  agencyContentJobs,
  agencyContentDrafts,
  agencyAlerts,
} from "@/lib/db/schema";
import { generateContent, type Channel } from "@/lib/agency/ai";
import { runQc } from "@/lib/agency/qc";
import { getRelevantMaterials, citeMaterials } from "@/lib/agency/materials-cite";

export const CHANNELS: Channel[] = ["naver_blog", "threads", "instagram"];
export const MAX_ATTEMPTS = 3;

export interface ChannelJobResult {
  jobId: string;
  channel: Channel;
  status: "ready" | "qc_failed";
  attempts: number;
  qcScore: number | null;
  qcFeedback?: string | null;
  tokensIn: number;
  tokensOut: number;
}

export async function runChannelJob(args: {
  channel: Channel;
  client: typeof agencyClients.$inferSelect;
  weeklyUpload: typeof agencyWeeklyUploads.$inferSelect | null;
  brandAssets: (typeof agencyBrandAssets.$inferSelect)[];
  relevantMaterials: Awaited<ReturnType<typeof getRelevantMaterials>>;
}): Promise<ChannelJobResult> {
  const { channel, client, weeklyUpload, brandAssets, relevantMaterials } = args;

  const [job] = await db
    .insert(agencyContentJobs)
    .values({
      clientId: client.id,
      weeklyUploadId: weeklyUpload?.id ?? null,
      channel,
      status: "generating",
      aiInputSnapshot: {
        weeklyUploadId: weeklyUpload?.id ?? null,
        brandAssetIds: brandAssets.map((b) => b.id),
        materialIds: relevantMaterials.map((m) => m.id),
        timestamp: new Date().toISOString(),
      },
    })
    .returning();

  let attempt = 0;
  let previousFeedback: string | null = null;
  let lastDraftId: string | null = null;
  let lastScore: number | null = null;
  let lastFeedback: string | null = null;
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt += 1;

    const gen = await generateContent({
      channel, client, weeklyUpload, brandAssets, relevantMaterials,
      attemptNumber: attempt, previousFeedback,
    });
    totalTokensIn += gen.tokensIn;
    totalTokensOut += gen.tokensOut;

    const citations = citeMaterials(gen.body, relevantMaterials);

    const qc = await runQc({
      channel, client,
      draft: { title: gen.title, body: gen.body, hashtags: gen.hashtags },
    });
    totalTokensIn += qc.tokensIn;
    totalTokensOut += qc.tokensOut;

    const draftValues = {
      jobId: job.id,
      title: gen.title,
      bodyMarkdown: gen.body,
      hashtags: gen.hashtags,
      imageMarkers: gen.imageMarkers,
      materialCitations: citations,
      qcScore: qc.score,
      qcFeedback: qc.feedback,
      qcPassedAt: qc.passed ? new Date() : null,
      updatedAt: new Date(),
    };

    if (lastDraftId) {
      await db.update(agencyContentDrafts).set(draftValues).where(eq(agencyContentDrafts.id, lastDraftId));
    } else {
      const [draft] = await db.insert(agencyContentDrafts).values(draftValues).returning();
      lastDraftId = draft.id;
    }
    lastScore = qc.score;
    lastFeedback = qc.feedback;

    if (qc.passed) {
      await db
        .update(agencyContentJobs)
        .set({
          status: "ready",
          generationAttempts: attempt,
          generatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agencyContentJobs.id, job.id));
      return {
        jobId: job.id, channel, status: "ready", attempts: attempt,
        qcScore: lastScore, tokensIn: totalTokensIn, tokensOut: totalTokensOut,
      };
    }
    previousFeedback = qc.feedback;
  }

  await db
    .update(agencyContentJobs)
    .set({
      status: "qc_failed",
      generationAttempts: attempt,
      generatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agencyContentJobs.id, job.id));

  await db.insert(agencyAlerts).values({
    clientId: client.id,
    jobId: job.id,
    type: "qc_3_fail",
    severity: "warning",
    message: `${client.businessName} ${channel} 채널 ${MAX_ATTEMPTS}회 연속 QC 미달 (최종 ${lastScore}점). 운영자 검토 필요.`,
  });

  return {
    jobId: job.id, channel, status: "qc_failed", attempts: attempt,
    qcScore: lastScore, qcFeedback: lastFeedback,
    tokensIn: totalTokensIn, tokensOut: totalTokensOut,
  };
}

/** 클라이언트 한 명의 3채널 파이프라인 — 데이터 조회 + 병렬 실행 */
export async function runGenerationPipeline(clientId: string): Promise<ChannelJobResult[]> {
  const [client] = await db
    .select()
    .from(agencyClients)
    .where(eq(agencyClients.id, clientId))
    .limit(1);
  if (!client) throw new Error("Client not found");

  const [weeklyUpload] = await db
    .select()
    .from(agencyWeeklyUploads)
    .where(eq(agencyWeeklyUploads.clientId, clientId))
    .orderBy(desc(agencyWeeklyUploads.weekOfDate), desc(agencyWeeklyUploads.uploadedAt))
    .limit(1);

  const brandAssets = await db
    .select()
    .from(agencyBrandAssets)
    .where(eq(agencyBrandAssets.clientId, clientId))
    .orderBy(desc(agencyBrandAssets.uploadedAt))
    .limit(10);

  const relevantMaterials = await getRelevantMaterials(client.categories as string[] | null);

  return Promise.all(
    CHANNELS.map((channel) =>
      runChannelJob({
        channel,
        client,
        weeklyUpload: weeklyUpload ?? null,
        brandAssets,
        relevantMaterials,
      }),
    ),
  );
}

// and 미사용 경고 회피
void and;
