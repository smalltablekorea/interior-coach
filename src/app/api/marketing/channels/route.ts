import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { disconnectChannel, getChannelConnection } from "@/lib/marketing-oauth/token-manager";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    // Single channel query: GET /api/marketing/channels?channel=threads
    const channelFilter = request.nextUrl.searchParams.get("channel");
    if (channelFilter) {
      const conn = await getChannelConnection(uid, channelFilter);
      return ok(conn);
    }

    const rows = await db
      .select()
      .from(marketingChannels)
      .where(workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid))
      .orderBy(desc(marketingChannels.createdAt));

    return ok(rows);
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
    const { channel, accountName, accountId, accessToken, isActive } = body;

    // Check if a channel connection already exists for this user and channel
    const [existing] = await db
      .select()
      .from(marketingChannels)
      .where(
        and(
          workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid),
          eq(marketingChannels.channel, channel)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing channel connection
      const [row] = await db
        .update(marketingChannels)
        .set({
          accountName: accountName || existing.accountName,
          accountId: accountId || existing.accountId,
          accessToken: accessToken !== undefined ? accessToken : existing.accessToken,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(marketingChannels.id, existing.id),
            workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid)
          )
        )
        .returning();

      return ok(row);
    }

    // Create new channel connection
    const [row] = await db
      .insert(marketingChannels)
      .values({
        userId: uid,
        workspaceId: wid,
        channel,
        accountName: accountName || null,
        accountId: accountId || null,
        accessToken: accessToken || null,
        isActive: isActive !== undefined ? isActive : false,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  const uid = auth.userId;

  try {
    const { channel } = await request.json();
    if (!channel) {
      return err("channel required");
    }

    await disconnectChannel(uid, channel);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
