import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? "system";
  } catch {
    return "system";
  }
}

const VALID_STATUSES = ["작성중", "발송", "승인", "거절"];

// 견적 상태 변경
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `유효하지 않은 상태입니다. 가능한 값: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: estimates.id, status: estimates.status })
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다" }, { status: 404 });
  }

  await db
    .update(estimates)
    .set({ status, updatedAt: new Date() })
    .where(eq(estimates.id, id));

  return NextResponse.json({
    message: `상태가 '${status}'(으)로 변경되었습니다`,
    previousStatus: existing.status,
    newStatus: status,
  });
}
