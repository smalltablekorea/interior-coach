import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktAutomations, mktAutomationSteps } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// 자동화 목록
export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const automations = await db
      .select()
      .from(mktAutomations)
      .orderBy(desc(mktAutomations.isSystem), desc(mktAutomations.createdAt));

    // 각 자동화의 단계 수 조회
    const result = await Promise.all(
      automations.map(async (auto) => {
        const steps = await db
          .select()
          .from(mktAutomationSteps)
          .where(eq(mktAutomationSteps.automationId, auto.id))
          .orderBy(mktAutomationSteps.sortOrder);

        return {
          ...auto,
          safeguards: auto.safeguards as Record<string, unknown> | null,
          stepCount: steps.length,
          steps,
        };
      })
    );

    return NextResponse.json({ automations: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "자동화 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 자동화 생성
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { name, description, triggerEvent, triggerSegmentId, safeguards, steps } = body;

  if (!name) {
    return NextResponse.json({ error: "name 필수" }, { status: 400 });
  }

  try {
    const [automation] = await db
      .insert(mktAutomations)
      .values({
        name,
        description: description || null,
        status: "draft",
        triggerEvent: triggerEvent || null,
        triggerSegmentId: triggerSegmentId || null,
        safeguards: safeguards || {
          noNightSend: true,
          excludeRecentPayers: false,
          maxSendPerDay: 3,
          dedupeWindow: 24,
          preventReentry: true,
        },
        isSystem: false,
      })
      .returning();

    // 단계 생성
    if (steps && Array.isArray(steps) && steps.length > 0) {
      await db.insert(mktAutomationSteps).values(
        steps.map((step: { type: string; config: unknown }, idx: number) => ({
          automationId: automation.id,
          sortOrder: idx,
          type: step.type,
          config: step.config,
        }))
      );
    }

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "자동화 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 자동화 수정 (상태 변경 포함)
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
      "name", "description", "status", "triggerEvent",
      "triggerSegmentId", "safeguards",
    ];
    for (const key of allowedFields) {
      if (fields[key] !== undefined) updateFields[key] = fields[key];
    }

    await db
      .update(mktAutomations)
      .set(updateFields)
      .where(eq(mktAutomations.id, id));

    // 단계 업데이트 (전체 교체 방식)
    if (fields.steps && Array.isArray(fields.steps)) {
      await db.delete(mktAutomationSteps).where(eq(mktAutomationSteps.automationId, id));
      if (fields.steps.length > 0) {
        await db.insert(mktAutomationSteps).values(
          fields.steps.map((step: { type: string; config: unknown }, idx: number) => ({
            automationId: id,
            sortOrder: idx,
            type: step.type,
            config: step.config,
          }))
        );
      }
    }

    return NextResponse.json({ message: "수정되었습니다" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "자동화 수정 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
