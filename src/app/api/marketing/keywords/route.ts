import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingKeywords } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    const conditions = [workspaceFilter(marketingKeywords.workspaceId, marketingKeywords.userId, wid, uid)];
    if (channel) {
      conditions.push(eq(marketingKeywords.channel, channel));
    }

    const rows = await db
      .select()
      .from(marketingKeywords)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(marketingKeywords.createdAt));

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
    const { keyword, channel, currentRank, searchVolume, targetUrl } = body;

    const [row] = await db
      .insert(marketingKeywords)
      .values({
        userId: uid,
        workspaceId: wid,
        keyword,
        channel,
        currentRank: currentRank || null,
        searchVolume: searchVolume || null,
        targetUrl: targetUrl || null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
