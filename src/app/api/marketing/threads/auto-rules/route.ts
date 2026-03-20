import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { threadsAutoRules, threadsTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

const USER_ID = "system";

export async function GET() {
  const rules = await db
    .select({
      id: threadsAutoRules.id,
      name: threadsAutoRules.name,
      type: threadsAutoRules.type,
      templateId: threadsAutoRules.templateId,
      templateName: threadsTemplates.name,
      schedule: threadsAutoRules.schedule,
      isActive: threadsAutoRules.isActive,
      lastTriggeredAt: threadsAutoRules.lastTriggeredAt,
      triggerCount: threadsAutoRules.triggerCount,
      config: threadsAutoRules.config,
      createdAt: threadsAutoRules.createdAt,
    })
    .from(threadsAutoRules)
    .leftJoin(threadsTemplates, eq(threadsAutoRules.templateId, threadsTemplates.id))
    .where(eq(threadsAutoRules.userId, USER_ID))
    .orderBy(desc(threadsAutoRules.createdAt));

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, templateId, schedule, config } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "name, type 필수" }, { status: 400 });
  }

  const [created] = await db
    .insert(threadsAutoRules)
    .values({
      userId: USER_ID,
      name,
      type,
      templateId: templateId || null,
      schedule: schedule || null,
      config: config || null,
    })
    .returning();

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const [updated] = await db
    .update(threadsAutoRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(threadsAutoRules.id, id), eq(threadsAutoRules.userId, USER_ID)))
    .returning();

  return NextResponse.json(updated || null);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  await db
    .delete(threadsAutoRules)
    .where(and(eq(threadsAutoRules.id, id), eq(threadsAutoRules.userId, USER_ID)));

  return NextResponse.json({ success: true });
}
