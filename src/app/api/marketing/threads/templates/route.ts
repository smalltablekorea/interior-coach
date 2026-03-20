import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { threadsTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

const USER_ID = "system";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const conditions = [eq(threadsTemplates.userId, USER_ID)];
  if (category) {
    conditions.push(eq(threadsTemplates.category, category));
  }

  const templates = await db
    .select()
    .from(threadsTemplates)
    .where(and(...conditions))
    .orderBy(desc(threadsTemplates.createdAt));

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, category, contentTemplate, hashtagTemplate } = body;

  if (!name || !category || !contentTemplate) {
    return NextResponse.json({ error: "name, category, contentTemplate 필수" }, { status: 400 });
  }

  const [created] = await db
    .insert(threadsTemplates)
    .values({ userId: USER_ID, name, category, contentTemplate, hashtagTemplate: hashtagTemplate || null })
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
    .update(threadsTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(threadsTemplates.id, id), eq(threadsTemplates.userId, USER_ID)))
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
    .delete(threadsTemplates)
    .where(and(eq(threadsTemplates.id, id), eq(threadsTemplates.userId, USER_ID)));

  return NextResponse.json({ success: true });
}
