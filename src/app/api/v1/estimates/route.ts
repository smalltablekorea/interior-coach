import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { estimates, estimateItems, sites } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, stripHtml } from "@/lib/api/validate";

// ─── v1 견적 빌더 입력 스키마 ───
// EstimateBuilder에서 제출하는 raw 페이로드를 검증/정제한다.

const safeText = z
  .string()
  .transform((s) => stripHtml(s.trim()));

const safeTextOptional = z
  .string()
  .optional()
  .transform((s) => (s ? stripHtml(s.trim()) : ""));

// areaPyeong은 빌더에서 string 또는 number로 전달될 수 있다.
const areaPyeongField = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return 0;
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  })
  .pipe(z.number().min(0).max(100000));

const lineItemSchema = z.object({
  name: safeText.pipe(z.string().min(1, "항목명은 필수입니다")),
  qty: z.number().min(0).default(1),
  unit: safeTextOptional,
  amount: z.number().min(0).default(0),
});

const categorySchema = z.object({
  id: safeTextOptional,
  name: safeText.pipe(z.string().min(1, "카테고리명은 필수입니다")),
  grade: safeTextOptional,
  gradeKey: safeTextOptional,
  amount: z.number().min(0).default(0),
  lineItems: z.array(lineItemSchema).default([]),
});

const companyInfoSchema = z
  .object({
    companyName: safeTextOptional,
    representative: safeTextOptional,
    companyAddress: safeTextOptional,
    companyPhone: safeTextOptional,
    businessNumber: safeTextOptional,
  })
  .default({
    companyName: "",
    representative: "",
    companyAddress: "",
    companyPhone: "",
    businessNumber: "",
  });

export const estimateBuilderSchema = z.object({
  title: safeText.pipe(z.string().min(1, "제목은 필수입니다")),
  clientName: safeTextOptional,
  siteAddress: safeTextOptional,
  clientPhone: safeTextOptional,
  estimateDate: safeTextOptional,
  areaPyeong: areaPyeongField,
  gradeKey: safeTextOptional,
  gradeName: safeTextOptional,
  projectType: safeTextOptional,
  categories: z.array(categorySchema).default([]),
  subtotal: z.number().min(0).default(0),
  profitRate: z.number().min(0).max(100).default(0),
  profitAmount: z.number().min(0).default(0),
  overheadRate: z.number().min(0).max(100).default(0),
  overheadAmount: z.number().min(0).default(0),
  vatOn: z.boolean().default(false),
  vatAmount: z.number().min(0).default(0),
  grandTotal: z.number().min(0).default(0),
  companyInfo: companyInfoSchema,
  notes: safeTextOptional,
});

// EstimateBuilder에서 저장
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("estimates", "write");
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  const wid = auth.workspaceId;

  const validation = await validateBody(request, estimateBuilderSchema);
  if (!validation.ok) return validation.response;
  const data = validation.data;

  try {
    // 1. 현장(site) 자동 생성
    const [site] = await db
      .insert(sites)
      .values({
        userId,
        workspaceId: wid,
        name: data.title,
        address: data.siteAddress || null,
        areaPyeong: data.areaPyeong || null,
        status: "견적중",
      })
      .returning();

    // 2. 견적 생성
    const metadata = {
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      siteAddress: data.siteAddress,
      estimateDate: data.estimateDate,
      areaPyeong: data.areaPyeong,
      gradeKey: data.gradeKey,
      gradeName: data.gradeName,
      projectType: data.projectType,
      subtotal: data.subtotal,
      profitAmount: data.profitAmount,
      overheadAmount: data.overheadAmount,
      vatAmount: data.vatAmount,
      companyInfo: data.companyInfo,
    };

    const [estimate] = await db
      .insert(estimates)
      .values({
        userId,
        workspaceId: wid,
        siteId: site.id,
        version: 1,
        totalAmount: Math.round(data.grandTotal),
        profitRate: data.profitRate,
        overheadRate: data.overheadRate,
        vatEnabled: data.vatOn,
        status: "작성중",
        memo: data.notes || null,
        metadata,
      })
      .returning();

    // 3. 카테고리 → estimate_items 변환
    const allItems: {
      estimateId: string;
      category: string;
      itemName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      sortOrder: number;
    }[] = [];

    let sortOrder = 0;
    for (const cat of data.categories) {
      for (const item of cat.lineItems) {
        const qty = item.qty || 1;
        allItems.push({
          estimateId: estimate.id,
          category: cat.name,
          itemName: item.name,
          unit: item.unit || "식",
          quantity: qty,
          unitPrice: qty > 0 ? Math.round(item.amount / qty) : Math.round(item.amount),
          amount: Math.round(item.amount),
          sortOrder: sortOrder++,
        });
      }
    }

    if (allItems.length > 0) {
      await db.insert(estimateItems).values(allItems);
    }

    return ok({
      id: estimate.id,
      siteId: site.id,
      totalAmount: estimate.totalAmount,
      status: estimate.status,
    });
  } catch (error) {
    return serverError(error);
  }
}
