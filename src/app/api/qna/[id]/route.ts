import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { qnaPosts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ok, notFound, serverError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ id: string }> };

/** Public GET: Q&A 상세 + 조회수 증가 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) return notFound("유효하지 않은 ID입니다.");

    const [post] = await db
      .update(qnaPosts)
      .set({ viewCount: sql`${qnaPosts.viewCount} + 1` })
      .where(eq(qnaPosts.id, postId))
      .returning();

    if (!post) return notFound("Q&A 게시글을 찾을 수 없습니다.");

    return ok(post);
  } catch (error) {
    return serverError(error);
  }
}
