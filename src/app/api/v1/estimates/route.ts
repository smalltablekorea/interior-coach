import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimates, estimateItems, sites } from "@/lib/db/schema";
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

interface LineItem {
  name: string;
  qty: number;
  unit: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  grade: string;
  gradeKey: string;
  amount: number;
  lineItems: LineItem[];
}

interface CompanyInfo {
  companyName?: string;
  representative?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessNumber?: string;
}

// EstimateBuilder에서 저장
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  const body = await request.json();

  const {
    title,
    clientName,
    siteAddress,
    clientPhone,
    estimateDate,
    areaPyeong,
    gradeKey,
    gradeName,
    projectType,
    categories,
    subtotal,
    profitRate,
    profitAmount,
    overheadRate,
    overheadAmount,
    vatOn,
    vatAmount,
    grandTotal,
    companyInfo,
    notes,
  } = body as {
    title: string;
    clientName: string;
    siteAddress: string;
    clientPhone: string;
    estimateDate: string;
    areaPyeong: string;
    gradeKey: string;
    gradeName: string;
    projectType: string;
    categories: Category[];
    subtotal: number;
    profitRate: number;
    profitAmount: number;
    overheadRate: number;
    overheadAmount: number;
    vatOn: boolean;
    vatAmount: number;
    grandTotal: number;
    companyInfo: CompanyInfo;
    notes: string;
  };

  // 1. 현장(site) 자동 생성
  const [site] = await db
    .insert(sites)
    .values({
      userId,
      name: title || "견적서",
      address: siteAddress || null,
      areaPyeong: parseFloat(areaPyeong) || null,
      status: "견적중",
    })
    .returning();

  // 2. 견적 생성
  const metadata = {
    title,
    clientName,
    clientPhone,
    siteAddress,
    estimateDate,
    areaPyeong: parseFloat(areaPyeong) || 0,
    gradeKey,
    gradeName,
    projectType,
    subtotal,
    profitAmount,
    overheadAmount,
    vatAmount,
    companyInfo,
  };

  const [estimate] = await db
    .insert(estimates)
    .values({
      userId,
      siteId: site.id,
      version: 1,
      totalAmount: Math.round(grandTotal),
      profitRate: profitRate ?? 0,
      overheadRate: overheadRate ?? 0,
      vatEnabled: vatOn ?? false,
      status: "작성중",
      memo: notes || null,
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
  for (const cat of categories) {
    for (const item of cat.lineItems) {
      allItems.push({
        estimateId: estimate.id,
        category: cat.name,
        itemName: item.name,
        unit: item.unit || "식",
        quantity: item.qty || 1,
        unitPrice: item.qty > 0 ? Math.round(item.amount / item.qty) : Math.round(item.amount),
        amount: Math.round(item.amount),
        sortOrder: sortOrder++,
      });
    }
  }

  if (allItems.length > 0) {
    await db.insert(estimateItems).values(allItems);
  }

  return NextResponse.json(
    {
      id: estimate.id,
      siteId: site.id,
      totalAmount: estimate.totalAmount,
      status: estimate.status,
    },
    { status: 201 }
  );
}
