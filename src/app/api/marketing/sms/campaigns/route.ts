import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsCampaigns } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const rows = await db
      .select()
      .from(smsCampaigns)
      .where(eq(smsCampaigns.userId, auth.userId))
      .orderBy(desc(smsCampaigns.createdAt));

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { name, type, targetGrade, targetSource, steps, startDate, endDate } = body;

    if (!name) {
      return err("캠페인 이름은 필수입니다.");
    }

    const [row] = await db
      .insert(smsCampaigns)
      .values({
        userId: auth.userId,
        name,
        type: type || "drip",
        targetGrade,
        targetSource,
        steps,
        startDate,
        endDate,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return err("id required");
    }

    const [row] = await db
      .update(smsCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(smsCampaigns.id, id), eq(smsCampaigns.userId, auth.userId)))
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await request.json();
    if (!id) {
      return err("id required");
    }

    await db.delete(smsCampaigns).where(and(eq(smsCampaigns.id, id), eq(smsCampaigns.userId, auth.userId)));
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
