import { NextRequest } from "next/server";
import { z } from "zod";
import { err } from "./response";

// ─── XSS 방지 sanitization ───
/**
 * HTML 태그와 꺾쇠 괄호를 제거한다.
 * 저장 단계의 방어선(defense-in-depth) — 렌더 단계는 React 기본 이스케이프에 의존.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
}

/** 문자열 필드에 대한 sanitize transform을 적용한 z.string() */
const safeString = () => z.string().transform((s) => stripHtml(s.trim()));
const safeStringMin = (min: number, msg: string) =>
  z.string().min(min, msg).transform((s) => stripHtml(s.trim()));
const safeStringNullable = () =>
  z.string().nullable().optional().transform((s) => (s ? stripHtml(s.trim()) : s));

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
  name: safeStringMin(1, "이름은 필수입니다"),
  phone: safeStringNullable(),
  email: z.string().email("이메일 형식이 올바르지 않습니다").nullable().optional(),
  address: safeStringNullable(),
  source: safeStringNullable(),
  status: z.enum(["상담중", "계약완료", "시공중", "완료", "이탈", "시공완료", "A/S", "VIP"]).optional().default("상담중"),
  memo: safeStringNullable(),
});

export const siteSchema = z.object({
  name: safeStringMin(1, "현장명은 필수입니다"),
  customerId: z.string().uuid().nullable().optional(),
  address: safeStringNullable(),
  buildingType: z.enum(["아파트", "빌라", "오피스텔", "주택", "상가"]).nullable().optional(),
  areaPyeong: z.number().positive().nullable().optional(),
  status: z.enum(["상담", "상담중", "견적중", "계약", "계약완료", "시공중", "완료", "시공완료", "A/S"]).optional().default("상담중"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  memo: safeStringNullable(),
});

export const estimateItemSchema = z.object({
  category: safeStringMin(1, "공종명은 필수입니다"),
  itemName: safeStringMin(1, "항목명은 필수입니다"),
  unit: safeStringNullable(),
  quantity: z.number().min(0).optional().default(1),
  unitPrice: z.number().min(0).optional().default(0),
  amount: z.number().min(0).optional().default(0),
  sortOrder: z.number().optional().default(0),
  memo: safeStringNullable(),
});

export const estimateSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  version: z.number().int().positive().optional().default(1),
  totalAmount: z.number().min(0).optional().default(0),
  profitRate: z.number().min(0).max(100).optional().default(0),
  overheadRate: z.number().min(0).max(100).optional().default(0),
  vatEnabled: z.boolean().optional().default(true),
  grade: z.string().nullable().optional(),
  status: z.enum(["초안", "작성중", "발송", "확정", "승인", "거절"]).optional().default("작성중"),
  memo: safeStringNullable(),
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
  memo: safeStringNullable(),
});

export const workerSchema = z.object({
  name: safeStringMin(1, "이름은 필수입니다"),
  phone: safeStringNullable(),
  trade: safeStringMin(1, "직종은 필수입니다"),
  dailyWage: z.number().min(0).nullable().optional(),
  memo: safeStringNullable(),
});

export const expenseSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  category: z.enum(["자재비", "인건비", "운반비", "장비비", "기타"], { message: "카테고리는 필수입니다" }),
  description: safeStringNullable(),
  amount: z.number().min(0, "금액은 필수입니다"),
  date: z.string().nullable().optional(),
  paymentMethod: safeStringNullable(),
  vendor: safeStringNullable(),
  receiptUrl: z.string().url().nullable().optional(),
});

export const materialSchema = z.object({
  name: safeStringMin(1, "자재명은 필수입니다"),
  category: safeStringNullable(),
  brand: safeStringNullable(),
  grade: safeStringNullable(),
  unit: safeStringNullable(),
  unitPrice: z.number().min(0).nullable().optional(),
  supplier: safeStringNullable(),
  memo: safeStringNullable(),
});

// ─── 고객 포털(인테리어코치) 채팅 메시지 ───
// 공개 POST 엔드포인트에서 저장/브로드캐스트 전에 반드시 통과해야 한다.
const PORTAL_MESSAGE_MAX_CONTENT = 4000;
const PORTAL_DISPLAY_NAME_MAX = 120;

export const portalChatMessageSchema = z.object({
  content: z
    .string({ message: "content는 문자열이어야 합니다" })
    .min(1, "content는 필수입니다")
    .transform((s) => stripHtml(s).slice(0, PORTAL_MESSAGE_MAX_CONTENT))
    .refine((s) => s.trim().length > 0, { message: "content는 비어있을 수 없습니다" }),
  displayName: z
    .string({ message: "displayName은 문자열이어야 합니다" })
    .min(1, "displayName은 필수입니다")
    .transform((s) => stripHtml(s.trim()).slice(0, PORTAL_DISPLAY_NAME_MAX))
    .refine((s) => s.length > 0, { message: "displayName은 비어있을 수 없습니다" }),
  password: z.string().optional(),
});
