import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktAdminCampaigns, mktSegments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// 캠페인 목록
export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const campaigns = await db
      .select({
        id: mktAdminCampaigns.id,
        name: mktAdminCampaigns.name,
        description: mktAdminCampaigns.description,
        goal: mktAdminCampaigns.goal,
        channel: mktAdminCampaigns.channel,
        status: mktAdminCampaigns.status,
        budget: mktAdminCampaigns.budget,
        spent: mktAdminCampaigns.spent,
        startDate: mktAdminCampaigns.startDate,
        endDate: mktAdminCampaigns.endDate,
        utmSource: mktAdminCampaigns.utmSource,
        utmMedium: mktAdminCampaigns.utmMedium,
        utmCampaign: mktAdminCampaigns.utmCampaign,
        kpiMetric: mktAdminCampaigns.kpiMetric,
        kpiTarget: mktAdminCampaigns.kpiTarget,
        kpiCurrent: mktAdminCampaigns.kpiCurrent,
        impressions: mktAdminCampaigns.impressions,
        clicks: mktAdminCampaigns.clicks,
        signups: mktAdminCampaigns.signups,
        payments: mktAdminCampaigns.payments,
        revenue: mktAdminCampaigns.revenue,
        targetSegmentId: mktAdminCampaigns.targetSegmentId,
        segmentName: mktSegments.name,
        createdAt: mktAdminCampaigns.createdAt,
      })
      .from(mktAdminCampaigns)
      .leftJoin(mktSegments, eq(mktAdminCampaigns.targetSegmentId, mktSegments.id))
      .orderBy(desc(mktAdminCampaigns.createdAt));

    return NextResponse.json({ campaigns });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "캠페인 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 캠페인 생성
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const {
    name, description, goal, channel, budget,
    startDate, endDate, utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
    targetSegmentId, kpiMetric, kpiTarget,
  } = body;

  if (!name || !channel) {
    return NextResponse.json({ error: "name, channel 필수" }, { status: 400 });
  }

  try {
    const [campaign] = await db
      .insert(mktAdminCampaigns)
      .values({
        name,
        description: description || null,
        goal: goal || null,
        channel,
        status: "draft",
        budget: budget || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        targetSegmentId: targetSegmentId || null,
        kpiMetric: kpiMetric || null,
        kpiTarget: kpiTarget || null,
        createdBy: adminCheck.session.userId,
      })
      .returning();

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "캠페인 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 캠페인 수정
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  try {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = [
      "name", "description", "goal", "channel", "status",
      "budget", "spent", "startDate", "endDate",
      "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
      "targetSegmentId", "kpiMetric", "kpiTarget", "kpiCurrent",
    ];
    for (const key of allowedFields) {
      if (fields[key] !== undefined) updateFields[key] = fields[key];
    }

    await db
      .update(mktAdminCampaigns)
      .set(updateFields)
      .where(eq(mktAdminCampaigns.id, id));

    return NextResponse.json({ message: "수정되었습니다" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "캠페인 수정 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
