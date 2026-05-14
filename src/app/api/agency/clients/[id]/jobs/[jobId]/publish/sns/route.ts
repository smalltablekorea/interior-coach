import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyContentJobs,
  agencyContentDrafts,
  agencyPublications,
} from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, err, serverError } from "@/lib/api/response";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface PublishResult {
  channelPostId?: string;
  channelPostUrl?: string;
}

/**
 * Threads/Instagram 자동 발행.
 * Q1=a: 운영자 본인 marketingChannels 토큰 사용.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId, jobId } = await params;

  try {
    const [client] = await db
      .select({ id: agencyClients.id, businessName: agencyClients.businessName })
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, clientId),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .limit(1);
    if (!client) return notFound("클라이언트를 찾을 수 없습니다");

    const [job] = await db
      .select()
      .from(agencyContentJobs)
      .where(
        and(eq(agencyContentJobs.id, jobId), eq(agencyContentJobs.clientId, clientId)),
      )
      .limit(1);
    if (!job) return notFound("잡을 찾을 수 없습니다");

    if (job.channel !== "threads" && job.channel !== "instagram") {
      return err("SNS 자동 발행은 threads/instagram 채널만 지원합니다", 400);
    }
    if (job.status !== "ready") {
      return err(`발행 가능한 상태가 아닙니다 (현재: ${job.status})`, 400);
    }

    const [draft] = await db
      .select()
      .from(agencyContentDrafts)
      .where(eq(agencyContentDrafts.jobId, jobId))
      .limit(1);
    if (!draft) return notFound("초안이 없습니다");

    const token = await getValidToken(auth.userId, job.channel);
    if (!token) {
      return err(
        `Meta(${job.channel}) OAuth 연결이 필요합니다. /marketing/${job.channel}에서 계정을 연결해주세요.`,
        401,
      );
    }

    const captionWithHashtags = buildSnsCaption(draft.bodyMarkdown, (draft.hashtags as string[] | null) ?? []);
    const mediaUrls = ((draft.imageMarkers as { imageUrl: string }[] | null) ?? []).map(
      (m) => m.imageUrl,
    );

    const startedAt = new Date();
    let publishResult: PublishResult;
    try {
      if (job.channel === "threads") {
        publishResult = await publishToThreads(token, captionWithHashtags, mediaUrls);
      } else {
        publishResult = await publishToInstagram(token, captionWithHashtags, mediaUrls);
      }
    } catch (e) {
      return err(`발행 실패: ${e instanceof Error ? e.message : String(e)}`, 502);
    }

    const publishedAt = new Date();
    const durationSeconds = Math.round((publishedAt.getTime() - startedAt.getTime()) / 1000);

    const [publication] = await db
      .insert(agencyPublications)
      .values({
        draftId: draft.id,
        channel: job.channel,
        publishStartedAt: startedAt,
        publishedAt,
        publishDurationSeconds: durationSeconds,
        externalPostUrl: publishResult.channelPostUrl ?? null,
        searchRankCheckScheduledAt: new Date(publishedAt.getTime() + SEVEN_DAYS_MS),
      })
      .returning();

    await db
      .update(agencyContentJobs)
      .set({ status: "published", updatedAt: publishedAt })
      .where(eq(agencyContentJobs.id, jobId));

    return ok({
      publication,
      channelPostId: publishResult.channelPostId,
      channelPostUrl: publishResult.channelPostUrl,
    });
  } catch (error) {
    return serverError(error);
  }
}

function buildSnsCaption(body: string, hashtags: string[]): string {
  const tail = hashtags.length > 0 ? `\n\n${hashtags.join(" ")}` : "";
  return `${body}${tail}`;
}

/* ────── Threads ────── */

async function publishToThreads(token: string, text: string, mediaUrls: string[]): Promise<PublishResult> {
  const userResp = await fetch(`https://graph.threads.net/v1.0/me?access_token=${token}`);
  if (!userResp.ok) throw new Error("Threads 사용자 ID 조회 실패");
  const { id: userId } = await userResp.json();

  const createParams: Record<string, string> = {
    media_type: mediaUrls.length > 0 ? "IMAGE" : "TEXT",
    text,
    access_token: token,
  };
  if (mediaUrls[0]) createParams.image_url = mediaUrls[0];

  const createResp = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(createParams),
  });
  if (!createResp.ok) throw new Error(`Threads 컨테이너 생성 실패: ${await createResp.text()}`);
  const { id: containerId } = await createResp.json();

  const publishResp = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  });
  if (!publishResp.ok) throw new Error(`Threads 발행 실패: ${await publishResp.text()}`);
  const { id: postId } = await publishResp.json();
  return { channelPostId: postId, channelPostUrl: `https://www.threads.net/post/${postId}` };
}

/* ────── Instagram ────── */

async function publishToInstagram(
  token: string,
  caption: string,
  mediaUrls: string[],
): Promise<PublishResult> {
  const pagesResp = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`,
  );
  if (!pagesResp.ok) throw new Error("Instagram: Facebook 페이지 조회 실패");
  const pagesData = await pagesResp.json();
  const page = pagesData.data?.[0];
  if (!page) throw new Error("Instagram: 연결된 Facebook 페이지가 없습니다");

  const igResp = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${token}`,
  );
  if (!igResp.ok) throw new Error("Instagram: 비즈니스 계정 조회 실패");
  const igData = await igResp.json();
  const igAccountId = igData.instagram_business_account?.id;
  if (!igAccountId) throw new Error("Instagram: 비즈니스 계정이 연결되지 않았습니다");

  const createParams: Record<string, string> = { caption, access_token: token };
  if (mediaUrls[0]) createParams.image_url = mediaUrls[0];

  const createResp = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(createParams),
  });
  if (!createResp.ok) throw new Error(`Instagram 미디어 생성 실패: ${await createResp.text()}`);
  const { id: containerId } = await createResp.json();

  const publishResp = await fetch(
    `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: containerId, access_token: token }),
    },
  );
  if (!publishResp.ok) throw new Error(`Instagram 발행 실패: ${await publishResp.text()}`);
  const { id: postId } = await publishResp.json();
  return {
    channelPostId: postId,
    channelPostUrl: `https://www.instagram.com/p/${postId}`,
  };
}
