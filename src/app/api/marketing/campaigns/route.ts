import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingCampaigns } from "@/lib/db/schema";
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

    const conditions = [workspaceFilter(marketingCampaigns.workspaceId, marketingCampaigns.userId, wid, uid)];
    if (channel) {
      conditions.push(eq(marketingCampaigns.channel, channel));
    }

    const rows = await db
      .select()
      .from(marketingCampaigns)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(marketingCampaigns.createdAt));

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
    const {
      channel,
      name,
      startDate,
      endDate,
      budget,
      spent,
      inquiries,
      contracts,
      contractAmount,
    } = body;

    const [row] = await db
      .insert(marketingCampaigns)
      .values({
        userId: uid,
        workspaceId: wid,
        channel,
        name,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget || 0,
        spent: spent || 0,
        inquiries: inquiries || 0,
        contracts: contracts || 0,
        contractAmount: contractAmount || 0,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
