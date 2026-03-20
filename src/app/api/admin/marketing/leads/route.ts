import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktLeads } from "@/lib/db/schema";
import { desc, eq, ilike, or, sql, count } from "drizzle-orm";
import type { LeadListItem } from "@/lib/types/marketing";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort") || "lead_score";
  const sortDir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  try {
    let whereConditions = undefined;

    if (status) {
      whereConditions = eq(mktLeads.status, status);
    }
    if (search) {
      const searchCond = or(
        ilike(mktLeads.email, `%${search}%`),
        ilike(mktLeads.name, `%${search}%`)
      );
      whereConditions = whereConditions
        ? sql`${whereConditions} AND ${searchCond}`
        : searchCond;
    }

    const orderCol =
      sortBy === "created_at" ? mktLeads.createdAt
        : sortBy === "last_active" ? mktLeads.lastActiveAt
          : sortBy === "name" ? mktLeads.name
            : mktLeads.leadScore;

    const orderExpr = sortDir === "asc" ? sql`${orderCol} ASC NULLS LAST` : sql`${orderCol} DESC NULLS LAST`;

    const rows = await db
      .select()
      .from(mktLeads)
      .where(whereConditions ?? undefined)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ total: count() })
      .from(mktLeads)
      .where(whereConditions ?? undefined);

    const leads: LeadListItem[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.email,
      name: r.name,
      lastEvent: r.lastEvent,
      lastEventAt: r.lastEventAt?.toISOString() ?? null,
      source: r.firstSource,
      medium: r.firstMedium,
      campaign: r.firstCampaign,
      leadScore: r.leadScore,
      segment: r.currentSegment,
      lastActiveAt: r.lastActiveAt?.toISOString() ?? null,
      status: r.status as LeadListItem["status"],
      paymentStatus: r.hasPaid ? "paid" : r.hasSubmitted ? "submitted" : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: totalResult?.total ?? 0,
        totalPages: Math.ceil((totalResult?.total ?? 0) / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "리드 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
