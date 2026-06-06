import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsComments, threadsPosts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { enforceAiRateLimit } from "@/lib/api/ai-rate-limit";
import { MODELS, callAnthropicWithRetry, logAiUsage, cachedSystem } from "@/lib/api/ai-helpers";

const COMMENT_REPLY_SYSTEM_PROMPT = `당신은 한국 인테리어 업체의 SNS 담당자입니다.
Threads 게시물에 달린 댓글에 친절하고 전문적으로 답변합니다.

답변 규칙:
- 한국어, 존댓말
- 친근하면서 전문적인 톤
- 200자 이내
- 이모지 1-2개 적절히
- 문의 성격이면 DM이나 전화 상담 유도
- 칭찬이면 감사 표현 + 추가 정보 제공

순수 텍스트만 반환 (JSON 아님).`;


export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const replyStatus = searchParams.get("replyStatus");

    const conditions = [workspaceFilter(threadsComments.workspaceId, threadsComments.userId, auth.workspaceId, auth.userId)];
    if (postId) conditions.push(eq(threadsComments.postId, postId));
    if (replyStatus) conditions.push(eq(threadsComments.replyStatus, replyStatus));

    const comments = await db
      .select({
        id: threadsComments.id,
        postId: threadsComments.postId,
        postContent: threadsPosts.content,
        authorName: threadsComments.authorName,
        commentText: threadsComments.commentText,
        replyText: threadsComments.replyText,
        replyStatus: threadsComments.replyStatus,
        isAutoReply: threadsComments.isAutoReply,
        createdAt: threadsComments.createdAt,
      })
      .from(threadsComments)
      .leftJoin(threadsPosts, eq(threadsComments.postId, threadsPosts.id))
      .where(and(...conditions))
      .orderBy(desc(threadsComments.createdAt));

    return ok(comments);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  // Plan-aware rate limiting (AI 과금 폭탄 방어 - AI-21)
  const gate = await enforceAiRateLimit(auth.userId);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const { commentId } = body as { commentId: string };

    if (!commentId) {
      return err("commentId 필수");
    }

    // Get comment with post content
    const [comment] = await db
      .select({
        id: threadsComments.id,
        commentText: threadsComments.commentText,
        authorName: threadsComments.authorName,
        postContent: threadsPosts.content,
      })
      .from(threadsComments)
      .leftJoin(threadsPosts, eq(threadsComments.postId, threadsPosts.id))
      .where(eq(threadsComments.id, commentId))
      .limit(1);

    if (!comment) {
      return notFound("댓글을 찾을 수 없습니다.");
    }

    const response = await callAnthropicWithRetry((client) =>
      client.messages.create({
        model: MODELS.HAIKU,
        max_tokens: 300,
        system: cachedSystem(COMMENT_REPLY_SYSTEM_PROMPT),
        messages: [
          {
            role: "user",
            content: `원본 게시물: ${comment.postContent || ""}
댓글 작성자: ${comment.authorName}
댓글 내용: ${comment.commentText}

위 댓글에 대한 답변을 작성해주세요.`,
          },
        ],
      }),
    );

    await logAiUsage({
      endpoint: "marketing/threads/comments",
      model: MODELS.HAIKU,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      usage: response.usage,
    });

    const replyText = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    const [updated] = await db
      .update(threadsComments)
      .set({ replyText, isAutoReply: true, replyStatus: "대기" })
      .where(eq(threadsComments.id, commentId))
      .returning();

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, replyText, replyStatus } = body;

    if (!id) {
      return err("id 필수");
    }

    const updates: Record<string, unknown> = {};
    if (replyText !== undefined) updates.replyText = replyText;
    if (replyStatus !== undefined) updates.replyStatus = replyStatus;

    const [updated] = await db
      .update(threadsComments)
      .set(updates)
      .where(and(eq(threadsComments.id, id), workspaceFilter(threadsComments.workspaceId, threadsComments.userId, auth.workspaceId, auth.userId)))
      .returning();

    if (!updated) return notFound("댓글을 찾을 수 없습니다.");
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}
