import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { threadsAccount } from "@/lib/db/schema";
import { eq } from "drizzle-orm";


export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const accounts = await db
    .select()
    .from(threadsAccount)
    .where(eq(threadsAccount.userId, auth.userId))
    .limit(1);

  return NextResponse.json(accounts[0] || null);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { username } = body as { username: string };

  if (!username) {
    return NextResponse.json({ error: "username 필수" }, { status: 400 });
  }

  // Check existing
  const existing = await db
    .select()
    .from(threadsAccount)
    .where(eq(threadsAccount.userId, auth.userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(threadsAccount)
      .set({ username, isConnected: true, connectedAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsAccount.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(threadsAccount)
    .values({ userId: auth.userId, username, isConnected: true, connectedAt: new Date() })
    .returning();

  return NextResponse.json(created);
}

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const existing = await db
    .select()
    .from(threadsAccount)
    .where(eq(threadsAccount.userId, auth.userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(threadsAccount)
      .set({ isConnected: false, updatedAt: new Date() })
      .where(eq(threadsAccount.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  return NextResponse.json(null);
}
