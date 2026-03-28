import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { materials, materialOrders } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

interface ParsedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

interface AnalysisResult {
  storeName: string;
  purchaseDate: string;
  items: ParsedItem[];
  totalAmount: number;
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "write");
  if (!auth.ok) return auth.response;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return err("ANTHROPIC_API_KEY가 설정되지 않았습니다");

    const body = await request.json();
    const { image, mimeType } = body as { image: string; mimeType: string };

    if (!image) return err("이미지가 필요합니다");

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: image,
              },
            },
            {
              type: "text",
              text: `이 영수증/거래명세서 이미지를 분석해주세요.

다음 JSON 형식으로 정확히 응답해주세요 (JSON만 반환, 다른 텍스트 없이):

{
  "storeName": "상호명",
  "purchaseDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "자재명 (인테리어 자재로 판단되는 항목명)",
      "category": "카테고리 (가구/도배/도어/목공/목자재/바닥/보일러/샷시/설비/에어컨/욕실/일정관리/전기/주방/중문/타일/필름/기타 중 하나)",
      "quantity": 1,
      "unit": "단위 (개/박스/m²/롤/세트/EA 등)",
      "unitPrice": 단가(숫자),
      "totalAmount": 합계금액(숫자)
    }
  ],
  "totalAmount": 전체합계(숫자)
}

규칙:
- 금액은 숫자만 (쉼표, 원 기호 제거)
- 날짜가 없으면 오늘 날짜 사용
- 카테고리는 자재 종류에 맞게 분류
- 배송비, 부가세 등은 items에서 제외
- 수량이 불명확하면 1로 설정`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let analysis: AnalysisResult;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON not found");
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { success: false, error: "영수증 분석에 실패했습니다. 다시 시도해주세요.", raw: text },
        { status: 422 }
      );
    }

    return ok(analysis);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const body = await request.json();
    const { items, purchaseDate, siteId } = body as {
      items: ParsedItem[];
      purchaseDate: string;
      siteId?: string;
    };

    const results = {
      ordersAdded: 0,
      materialsUpdated: 0,
      materialsAdded: 0,
      priceNotes: [] as string[],
    };

    for (const item of items) {
      const existingMaterials = await db
        .select()
        .from(materials)
        .where(and(eq(materials.isStandard, true), ilike(materials.name, `%${item.name}%`)))
        .limit(1);

      if (existingMaterials.length > 0) {
        const existing = existingMaterials[0];
        if (existing.unitPrice && existing.unitPrice !== item.unitPrice) {
          const existingMemo = existing.memo || "";
          const newNote = `[${purchaseDate}] 구매단가: ${item.unitPrice.toLocaleString()}원`;
          const updatedMemo = existingMemo ? `${existingMemo}\n${newNote}` : newNote;

          await db
            .update(materials)
            .set({ memo: updatedMemo })
            .where(eq(materials.id, existing.id));

          results.materialsUpdated++;
          results.priceNotes.push(`${item.name}: 기존 ${existing.unitPrice.toLocaleString()}원 → 구매 ${item.unitPrice.toLocaleString()}원`);
        }
      } else {
        await db.insert(materials).values({
          userId: uid,
          workspaceId: wid,
          name: item.name,
          category: item.category,
          unit: item.unit,
          unitPrice: item.unitPrice,
          isStandard: false,
          memo: `[${purchaseDate}] 영수증에서 추가됨`,
        });
        results.materialsAdded++;
      }

      await db.insert(materialOrders).values({
        userId: uid,
        workspaceId: wid,
        siteId: siteId || null,
        materialName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        orderedDate: purchaseDate,
        status: "입고",
        memo: `영수증 분석으로 자동 추가`,
      });
      results.ordersAdded++;
    }

    return ok(results);
  } catch (error) {
    return serverError(error);
  }
}
