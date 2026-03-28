import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

const CHANNEL = "naver_blog";

export async function GET() {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
  try {
    const [channel] = await db
      .select({
        id: marketingChannels.id,
        accountName: marketingChannels.accountName,
        accountId: marketingChannels.accountId,
        isActive: marketingChannels.isActive,
        settings: marketingChannels.settings,
      })
      .from(marketingChannels)
      .where(and(eq(marketingChannels.channel, CHANNEL), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid)));

    if (!channel || !channel.isActive) {
      return ok({ connected: false });
    }

    const settings = channel.settings as { blogUrl?: string } | null;

    return ok({
      connected: true,
      accountName: channel.accountName,
      accountId: channel.accountId,
      blogUrl: settings?.blogUrl || null,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
  try {
    const body = await request.json();
    const { blogId, blogUrl } = body;

    if (!blogId) {
      return err("블로그 ID를 입력해주세요");
    }

    const [existing] = await db
      .select()
      .from(marketingChannels)
      .where(and(eq(marketingChannels.channel, CHANNEL), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid)));

    const payload = {
      accountName: blogId,
      accountId: blogId,
      isActive: true,
      settings: {
        blogId,
        blogUrl: blogUrl || `https://blog.naver.com/${blogId}`,
      },
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(marketingChannels)
        .set(payload)
        .where(and(eq(marketingChannels.id, existing.id), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid)));
    } else {
      await db.insert(marketingChannels).values({
        userId: uid,
        workspaceId: wid,
        channel: CHANNEL,
        ...payload,
      });
    }

    return ok({
      connected: true,
      accountName: blogId,
      message: "네이버 블로그가 연결되었습니다.",
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE() {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
  try {
    await db
      .update(marketingChannels)
      .set({ isActive: false, settings: null, updatedAt: new Date() })
      .where(and(eq(marketingChannels.channel, CHANNEL), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid)));

    return ok({ connected: false, message: "연결이 해제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
