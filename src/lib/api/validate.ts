import { NextRequest } from "next/server";
import { z } from "zod";
import { err } from "./response";

/**
 * 요청 body를 Zod 스키마로 검증
 * 성공 시 파싱된 데이터, 실패 시 NextResponse 에러 반환
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: ReturnType<typeof err> }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const issues = result.error.issues;
      const messages = issues.map((issue: z.core.$ZodIssue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
      return { ok: false, response: err(`입력값 오류: ${messages}`) };
    }
    return { ok: true, data: result.data };
  } catch {
    return { ok: false, response: err("요청 본문을 파싱할 수 없습니다") };
  }
}

// ─── 공통 Zod 스키마 ───

export const customerSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().nullable().optional(),
  email: z.string().email("이메일 형식이 올바르지 않습니다").nullable().optional(),
  address: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  status: z.enum(["상담중", "계약완료", "시공중", "완료", "이탈", "시공완료", "A/S", "VIP"]).optional().default("상담중"),
  memo: z.string().nullable().optional(),
});

export const siteSchema = z.object({
  name: z.string().min(1, "현장명은 필수입니다"),
  customerId: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
  buildingType: z.enum(["아파트", "빌라", "오피스텔", "주택", "상가"]).nullable().optional(),
  areaPyeong: z.number().positive().nullable().optional(),
  status: z.enum(["상담", "상담중", "견적중", "계약", "계약완료", "시공중", "완료", "시공완료", "A/S"]).optional().default("상담중"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});

export const estimateItemSchema = z.object({
  category: z.string().min(1, "공종명은 필수입니다"),
  itemName: z.string().min(1, "항목명은 필수입니다"),
  unit: z.string().nullable().optional(),
  quantity: z.number().min(0).optional().default(1),
  unitPrice: z.number().min(0).optional().default(0),
  amount: z.number().min(0).optional().default(0),
  sortOrder: z.number().optional().default(0),
  memo: z.string().nullable().optional(),
});

export const estimateSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  version: z.number().int().positive().optional().default(1),
  totalAmount: z.number().min(0).optional().default(0),
  profitRate: z.number().min(0).max(1).optional().default(0),
  overheadRate: z.number().min(0).max(1).optional().default(0),
  vatEnabled: z.boolean().optional().default(true),
  grade: z.string().nullable().optional(),
  status: z.enum(["초안", "작성중", "발송", "확정", "승인", "거절"]).optional().default("작성중"),
  memo: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  items: z.array(estimateItemSchema).optional(),
});

export const contractSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  estimateId: z.string().uuid().nullable().optional(),
  contractAmount: z.number().min(0, "계약금액은 필수입니다"),
  deposit: z.number().min(0).optional().default(0),
  status: z.enum(["계약대기", "서명완료", "진행중", "완료", "해지"]).optional().default("계약대기"),
  contractDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});

export const workerSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().nullable().optional(),
  trade: z.string().min(1, "직종은 필수입니다"),
  dailyWage: z.number().min(0).nullable().optional(),
  memo: z.string().nullable().optional(),
});

export const expenseSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  category: z.enum(["자재비", "인건비", "운반비", "장비비", "기타"], { message: "카테고리는 필수입니다" }),
  description: z.string().nullable().optional(),
  amount: z.number().min(0, "금액은 필수입니다"),
  date: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
});

export const materialSchema = z.object({
  name: z.string().min(1, "자재명은 필수입니다"),
  category: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().min(0).nullable().optional(),
  supplier: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});
