import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { estimateTemplates, estimates, estimateItems } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";

// 템플릿 목록 조회
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const templates = await db
      .select({
        id: estimateTemplates.id,
        name: estimateTemplates.name,
        description: estimateTemplates.description,
        buildingType: estimateTemplates.buildingType,
        areaPyeong: estimateTemplates.areaPyeong,
        gradeKey: estimateTemplates.gradeKey,
        usageCount: estimateTemplates.usageCount,
        createdAt: estimateTemplates.createdAt,
      })
      .from(estimateTemplates)
      .where(
        and(
          workspaceFilter(estimateTemplates.workspaceId, estimateTemplates.userId, auth.workspaceId, auth.userId),
          isNull(estimateTemplates.deletedAt)
        )
      )
      .orderBy(desc(estimateTemplates.usageCount));

    return ok({ templates });
  } catch (error) {
    return serverError(error);
  }
}

// 템플릿 생성 (견적서에서 저장 또는 직접 생성)
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, description, buildingType, areaPyeong, gradeKey, items, metadata, fromEstimateId } = body as {
      name: string;
      description?: string;
      buildingType?: string;
      areaPyeong?: number;
      gradeKey?: string;
      items?: unknown[];
      metadata?: Record<string, unknown>;
      fromEstimateId?: string;
    };

    if (!name) return err("템플릿 이름은 필수입니다.");

    let templateItems = items;
    let templateMeta = metadata;

    // 기존 견적서에서 템플릿 생성
    if (fromEstimateId) {
      const [est] = await db
        .select({
          profitRate: estimates.profitRate,
          overheadRate: estimates.overheadRate,
          vatEnabled: estimates.vatEnabled,
          metadata: estimates.metadata,
        })
        .from(estimates)
        .where(
          and(
            eq(estimates.id, fromEstimateId),
            workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId),
            isNull(estimates.deletedAt)
          )
        );

      if (!est) return notFound("원본 견적을 찾을 수 없습니다");

      const estItems = await db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, fromEstimateId))
        .orderBy(estimateItems.sortOrder);

      templateItems = estItems.map((i) => ({
        category: i.category,
        itemName: i.itemName,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      }));

      templateMeta = {
        profitRate: est.profitRate,
        overheadRate: est.overheadRate,
        vatEnabled: est.vatEnabled,
        ...(est.metadata as Record<string, unknown> || {}),
      };
    }

    if (!templateItems || !Array.isArray(templateItems) || templateItems.length === 0) {
      return err("템플릿 항목이 필요합니다.");
    }

    const [template] = await db
      .insert(estimateTemplates)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name,
        description: description || null,
        buildingType: buildingType || null,
        areaPyeong: areaPyeong || null,
        gradeKey: gradeKey || null,
        items: templateItems,
        metadata: templateMeta || null,
      })
      .returning();

    return ok(template);
  } catch (error) {
    return serverError(error);
  }
}
