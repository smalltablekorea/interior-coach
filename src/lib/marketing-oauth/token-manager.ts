// =============================================================================
// Token Manager — DB persistence, retrieval, auto-refresh (per-user)
// =============================================================================

import { db } from "@/lib/db";
import { marketingChannels, threadsAccount } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { refreshAccessToken } from "./oauth-utils";

// ── Store Tokens ──

export async function storeTokens(
  userId: string,
  channel: string,
  data: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    accountName?: string;
    accountId?: string;
  }
) {
  const tokenExpiresAt = new Date(Date.now() + data.expiresIn * 1000);

  const [existing] = await db
    .select()
    .from(marketingChannels)
    .where(
      and(
        eq(marketingChannels.userId, userId),
        eq(marketingChannels.channel, channel)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(marketingChannels)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || existing.refreshToken,
        tokenExpiresAt,
        accountName: data.accountName || existing.accountName,
        accountId: data.accountId || existing.accountId,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(marketingChannels.id, existing.id));
  } else {
    await db.insert(marketingChannels).values({
      userId,
      channel,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      tokenExpiresAt,
      accountName: data.accountName || null,
      accountId: data.accountId || null,
      isActive: true,
    });
  }

  // Backward compatibility: also update threadsAccount table
  if (channel === "threads" && data.accountName) {
    const [existingThread] = await db
      .select()
      .from(threadsAccount)
      .where(eq(threadsAccount.userId, userId))
      .limit(1);

    if (existingThread) {
      await db
        .update(threadsAccount)
        .set({
          username: data.accountName,
          accessToken: data.accessToken,
          isConnected: true,
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(threadsAccount.id, existingThread.id));
    } else {
      await db.insert(threadsAccount).values({
        userId,
        username: data.accountName,
        accessToken: data.accessToken,
        isConnected: true,
        connectedAt: new Date(),
      });
    }
  }
}

// ── Get Valid Token (auto-refresh if expired) ──

export async function getValidToken(
  userId: string,
  channel: string
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(marketingChannels)
    .where(
      and(
        eq(marketingChannels.userId, userId),
        eq(marketingChannels.channel, channel)
      )
    )
    .limit(1);

  if (!row?.accessToken) return null;

  // Check if token expires within 5 minutes
  const isExpired =
    row.tokenExpiresAt &&
    row.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && row.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(
        channel,
        row.refreshToken
      );
      await storeTokens(userId, channel, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
      });
      return refreshed.accessToken;
    } catch (error) {
      console.error(`Token refresh failed for ${channel}:`, error);
      return null;
    }
  }

  if (isExpired) return null;

  return row.accessToken;
}

// ── Get Channel Connection Info ──

export async function getChannelConnection(userId: string, channel: string) {
  const [row] = await db
    .select()
    .from(marketingChannels)
    .where(
      and(
        eq(marketingChannels.userId, userId),
        eq(marketingChannels.channel, channel)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    channel: row.channel,
    accountName: row.accountName,
    accountId: row.accountId,
    isActive: row.isActive,
    hasToken: !!row.accessToken,
    tokenExpiresAt: row.tokenExpiresAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || null,
    updatedAt: row.updatedAt?.toISOString() || null,
  };
}

// ── Disconnect Channel ──

export async function disconnectChannel(userId: string, channel: string) {
  const [row] = await db
    .select()
    .from(marketingChannels)
    .where(
      and(
        eq(marketingChannels.userId, userId),
        eq(marketingChannels.channel, channel)
      )
    )
    .limit(1);

  if (row) {
    await db
      .update(marketingChannels)
      .set({
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(marketingChannels.id, row.id));
  }

  // Also disconnect threadsAccount if applicable
  if (channel === "threads") {
    const [threadRow] = await db
      .select()
      .from(threadsAccount)
      .where(eq(threadsAccount.userId, userId))
      .limit(1);
    if (threadRow) {
      await db
        .update(threadsAccount)
        .set({
          accessToken: null,
          isConnected: false,
          updatedAt: new Date(),
        })
        .where(eq(threadsAccount.id, threadRow.id));
    }
  }
}
