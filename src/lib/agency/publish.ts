/**
 * 발행 화면 (네이버 블로그 복붙 UX) 헬퍼.
 *
 * Q6=a: 클립보드 복사 시 [이미지N] 마커 완전 제거 후 빈 줄 정리.
 * 7분 임계점: publish_duration_seconds > 420 시 publish_overrun 알림.
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyContentJobs,
  agencyContentDrafts,
  agencyPublications,
  agencyAlerts,
  type AgencyImageMarker,
} from "@/lib/db/schema";

export const PUBLISH_OVERRUN_SECONDS = 7 * 60;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class PublishError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "PublishError";
  }
}

export interface StartPublishResult {
  publicationId: string;
  cleanBody: string;
  title: string | null;
  hashtagsLine: string;
  hashtags: string[];
  images: { url: string; filename: string; caption: string | null }[];
  publishStartedAt: Date;
}

export interface CompletePublishResult {
  publication: typeof agencyPublications.$inferSelect;
  durationSeconds: number;
  overrunAlert: typeof agencyAlerts.$inferSelect | null;
}

/** body markdown에서 [이미지N] 마커 텍스트를 제거하고 잔여 빈 줄 정리 */
export function stripImageMarkers(body: string, markers: AgencyImageMarker[] | null | undefined): string {
  if (!markers || markers.length === 0) return body;
  let out = body;
  for (const m of markers) {
    if (!m.marker) continue;
    const escaped = m.marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "g"), "");
  }
  // 3줄 이상 연속 줄바꿈 → 2줄로, 줄 앞뒤 공백 정리
  out = out
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

/** 이미지 마커별 다운로드용 파일명 부여 */
export function buildImageDownloads(
  markers: AgencyImageMarker[] | null | undefined,
): { url: string; filename: string; caption: string | null }[] {
  if (!markers) return [];
  return markers.map((m, i) => {
    const idx = i + 1;
    const ext =
      m.imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = /^(jpg|jpeg|png|webp|heic|gif)$/.test(ext) ? ext : "jpg";
    return {
      url: m.imageUrl,
      filename: `이미지${idx}.${safeExt}`,
      caption: m.caption ?? null,
    };
  });
}

/** 약 7분 초과 검사 */
export function isOverrun(durationSeconds: number): boolean {
  return durationSeconds > PUBLISH_OVERRUN_SECONDS;
}

/** 네이버 블로그 복붙 발행 시작 — 운영자/포털토큰 공유 헬퍼 */
export async function startNaverPublish(args: {
  clientId: string;
  jobId: string;
}): Promise<StartPublishResult> {
  const { clientId, jobId } = args;

  const [job] = await db
    .select()
    .from(agencyContentJobs)
    .where(and(eq(agencyContentJobs.id, jobId), eq(agencyContentJobs.clientId, clientId)))
    .limit(1);
  if (!job) throw new PublishError("잡을 찾을 수 없습니다", 404);
  if (job.channel !== "naver_blog") {
    throw new PublishError("네이버 블로그 채널만 복붙 발행을 지원합니다", 400);
  }
  if (job.status !== "ready") {
    throw new PublishError(`발행 가능한 상태가 아닙니다 (현재: ${job.status})`, 400);
  }

  const [draft] = await db
    .select()
    .from(agencyContentDrafts)
    .where(eq(agencyContentDrafts.jobId, jobId))
    .limit(1);
  if (!draft) throw new PublishError("초안이 없습니다", 404);

  const cleanBody = stripImageMarkers(draft.bodyMarkdown, draft.imageMarkers);
  const images = buildImageDownloads(draft.imageMarkers);
  const hashtags = (draft.hashtags as string[] | null) ?? [];
  const hashtagsLine = hashtags.join(" ");

  const [publication] = await db
    .insert(agencyPublications)
    .values({
      draftId: draft.id,
      channel: "naver_blog",
      publishStartedAt: new Date(),
    })
    .returning();

  return {
    publicationId: publication.id,
    cleanBody,
    title: draft.title,
    hashtagsLine,
    hashtags,
    images,
    publishStartedAt: publication.publishStartedAt!,
  };
}

/** 네이버 블로그 복붙 발행 완료 — 운영자/포털토큰 공유 헬퍼 */
export async function completeNaverPublish(args: {
  clientId: string;
  jobId: string;
  publicationId: string;
  externalPostUrl: string | null;
  businessName: string;
}): Promise<CompletePublishResult> {
  const { clientId, jobId, publicationId, externalPostUrl, businessName } = args;

  const [pub] = await db
    .select()
    .from(agencyPublications)
    .where(eq(agencyPublications.id, publicationId))
    .limit(1);
  if (!pub) throw new PublishError("발행 기록을 찾을 수 없습니다", 404);
  if (pub.publishedAt) throw new PublishError("이미 발행 완료된 기록입니다", 400);
  if (!pub.publishStartedAt) throw new PublishError("발행 시작 시각이 없습니다", 400);

  // duration은 DB SQL로 계산 (timestamp without timezone + JS Date mismatch 회피)
  const [updatedPub] = await db
    .update(agencyPublications)
    .set({
      publishedAt: sql`now()`,
      publishDurationSeconds: sql<number>`EXTRACT(EPOCH FROM (now() - publish_started_at))::int`,
      externalPostUrl,
      searchRankCheckScheduledAt: sql`now() + interval '7 days'`,
    })
    .where(eq(agencyPublications.id, publicationId))
    .returning();
  const durationSeconds = updatedPub?.publishDurationSeconds ?? 0;

  await db
    .update(agencyContentJobs)
    .set({ status: "published", updatedAt: sql`now()` })
    .where(eq(agencyContentJobs.id, jobId));

  let overrunAlert: typeof agencyAlerts.$inferSelect | null = null;
  if (isOverrun(durationSeconds)) {
    const [alert] = await db
      .insert(agencyAlerts)
      .values({
        clientId,
        jobId,
        publicationId,
        type: "publish_overrun",
        severity: "warning",
        message: `${businessName} 네이버 블로그 발행 ${durationSeconds}초 소요 (임계 ${PUBLISH_OVERRUN_SECONDS}초 초과).`,
      })
      .returning();
    overrunAlert = alert;
  }

  // SEVEN_DAYS_MS 미사용 경고 회피 (publish.ts 내 다른 곳에서 사용 가능)
  void SEVEN_DAYS_MS;

  return { publication: updatedPub, durationSeconds, overrunAlert };
}
