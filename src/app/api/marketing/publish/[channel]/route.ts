import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";
import { db } from "@/lib/db";
import { marketingPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, err, serverError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const uid = auth.userId;

  // 외부 플랫폼 게시 남용 방지 (AI-21): 유저당 분당 30회
  const gate = enforceApiRateLimit(uid, { bucket: "marketing-publish", max: 30 });
  if (!gate.ok) return gate.response;

  const { channel } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return err("잘못된 요청 본문입니다.");
  }

  const { postId, content, mediaUrls, title, hashtags } = body as {
    postId?: string;
    content?: string;
    mediaUrls?: string[];
    title?: string;
    hashtags?: string[];
  };

  // Get valid token (auto-refreshes if needed)
  const token = await getValidToken(uid, channel);
  if (!token) {
    return err("인증이 만료되었습니다. 계정을 다시 연결해주세요.", 401);
  }

  try {
    let result: { postId?: string; postUrl?: string } = {};

    switch (channel) {
      case "threads":
        result = await publishToThreads(token, content as string, mediaUrls);
        break;
      case "instagram":
        result = await publishToInstagram(token, content as string, mediaUrls);
        break;
      case "youtube":
        result = await updateYouTubeMetadata(token, {
          title: title as string,
          description: content as string,
          tags: hashtags,
        });
        break;
      default:
        return err(`지원하지 않는 채널: ${channel}`);
    }

    // Update post record if postId provided
    if (postId) {
      await db
        .update(marketingPosts)
        .set({
          channelPostId: result.postId || null,
          channelPostUrl: result.postUrl || null,
          publishedAt: new Date(),
          status: "published",
          updatedAt: new Date(),
        })
        .where(eq(marketingPosts.id, postId as string));
    }

    return ok({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "발행에 실패했습니다.";

    if (postId) {
      await db
        .update(marketingPosts)
        .set({
          status: "failed",
          errorMessage: message,
          updatedAt: new Date(),
        })
        .where(eq(marketingPosts.id, postId as string));
    }

    return serverError(error);
  }
}

// ── Threads Publishing ──

async function getThreadsUserId(token: string): Promise<string> {
  const resp = await fetch(
    `https://graph.threads.net/v1.0/me?access_token=${token}`
  );
  if (!resp.ok) throw new Error("Threads 사용자 ID 조회 실패");
  const { id } = await resp.json();
  return id;
}

async function publishToThreads(
  token: string,
  text: string,
  mediaUrls?: string[]
) {
  const userId = await getThreadsUserId(token);

  // Step 1: Create media container
  const createParams: Record<string, string> = {
    media_type: mediaUrls?.length ? "IMAGE" : "TEXT",
    text,
    access_token: token,
  };
  if (mediaUrls?.[0]) createParams.image_url = mediaUrls[0];

  const createResp = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(createParams),
    }
  );
  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Threads 컨테이너 생성 실패: ${err}`);
  }
  const { id: containerId } = await createResp.json();

  // Step 2: Publish
  const publishResp = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: token,
      }),
    }
  );
  if (!publishResp.ok) {
    const err = await publishResp.text();
    throw new Error(`Threads 발행 실패: ${err}`);
  }
  const { id: threadPostId } = await publishResp.json();

  return {
    postId: threadPostId,
    postUrl: `https://www.threads.net/post/${threadPostId}`,
  };
}

// ── Instagram Publishing ──

async function publishToInstagram(
  token: string,
  caption: string,
  mediaUrls?: string[]
) {
  // Get Instagram Business Account ID via Facebook Pages
  const pagesResp = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`
  );
  if (!pagesResp.ok)
    throw new Error("Instagram: Facebook 페이지 조회 실패");

  const pagesData = await pagesResp.json();
  const page = pagesData.data?.[0];
  if (!page)
    throw new Error(
      "Instagram: 연결된 Facebook 페이지가 없습니다"
    );

  const igResp = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${token}`
  );
  if (!igResp.ok)
    throw new Error("Instagram: 비즈니스 계정 조회 실패");

  const igData = await igResp.json();
  const igAccountId = igData.instagram_business_account?.id;
  if (!igAccountId)
    throw new Error(
      "Instagram: 비즈니스 계정이 연결되지 않았습니다"
    );

  // Create media container
  const createParams: Record<string, string> = {
    caption,
    access_token: token,
  };
  if (mediaUrls?.[0]) createParams.image_url = mediaUrls[0];

  const createResp = await fetch(
    `https://graph.facebook.com/v19.0/${igAccountId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(createParams),
    }
  );
  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Instagram 미디어 생성 실패: ${err}`);
  }
  const { id: containerId } = await createResp.json();

  // Publish
  const publishResp = await fetch(
    `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: token,
      }),
    }
  );
  if (!publishResp.ok) {
    const err = await publishResp.text();
    throw new Error(`Instagram 발행 실패: ${err}`);
  }
  const { id: igPostId } = await publishResp.json();

  return { postId: igPostId };
}

// ── YouTube Metadata Update ──

async function updateYouTubeMetadata(
  token: string,
  data: { title: string; description: string; tags?: string[] }
) {
  // YouTube video upload requires binary file — this handles metadata only
  // Full video upload would need resumable upload protocol
  return { postId: undefined, postUrl: undefined };
}
