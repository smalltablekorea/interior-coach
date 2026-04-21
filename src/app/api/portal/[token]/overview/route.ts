import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import {
  sites,
  constructionPhases,
  siteChatRooms,
  siteChatPinnedSummary,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 토큰입니다." },
      { status: 401 }
    );
  }

  const { customer, site } = result;

  // Get current active phase
  const phases = await db
    .select()
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, site.id));

  const currentPhase = phases.find((p) => p.status === "진행중") || null;

  // Get pinned summary from chat room
  let pinnedSummary = null;
  const chatRooms = await db
    .select()
    .from(siteChatRooms)
    .where(eq(siteChatRooms.siteId, site.id))
    .limit(1);

  if (chatRooms.length > 0) {
    const summaryRows = await db
      .select()
      .from(siteChatPinnedSummary)
      .where(eq(siteChatPinnedSummary.roomId, chatRooms[0].id))
      .limit(1);

    if (summaryRows.length > 0) {
      pinnedSummary = summaryRows[0];
    }
  }

  return NextResponse.json({
    customer: {
      name: customer.name,
    },
    site: {
      name: site.name,
      address: site.address,
      buildingType: site.buildingType,
      areaPyeong: site.areaPyeong,
      status: site.status,
      startDate: site.startDate,
      endDate: site.endDate,
      progress: site.progress ?? 0,
      budget: site.budget,
      spent: site.spent,
    },
    currentPhase: currentPhase
      ? {
          id: currentPhase.id,
          category: currentPhase.category,
          progress: currentPhase.progress,
          status: currentPhase.status,
          plannedStart: currentPhase.plannedStart,
          plannedEnd: currentPhase.plannedEnd,
        }
      : null,
    pinnedSummary: pinnedSummary
      ? {
          currentProgressPercent: pinnedSummary.currentProgressPercent,
          nextMilestoneTitle: pinnedSummary.nextMilestoneTitle,
          nextMilestoneDate: pinnedSummary.nextMilestoneDate,
          pendingPaymentAmount: pinnedSummary.pendingPaymentAmount,
          pendingPaymentDueDate: pinnedSummary.pendingPaymentDueDate,
          openDefectsCount: pinnedSummary.openDefectsCount,
        }
      : null,
  });
}
