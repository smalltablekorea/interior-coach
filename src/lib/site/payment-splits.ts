import { z } from "zod";

// 대금분할 항목 1개 — 폼/서버 액션 공용 스키마.
export const paymentSplitInputSchema = z.object({
  itemName: z.string().trim().min(1, "항목명을 입력해주세요"),
  amount: z.number().int().nonnegative("금액은 0 이상 정수여야 합니다"),
  status: z.enum(["예정", "청구", "완납"]).default("예정"),
  scheduledDate: z.string().nullable().optional(),
});

export type PaymentSplitInput = z.infer<typeof paymentSplitInputSchema>;

export const MIN_SPLITS = 2;
export const MAX_SPLITS = 6;

export type SplitsValidation =
  | { ok: true; splits: PaymentSplitInput[] }
  | { ok: false; error: string };

/**
 * 대금분할 검증 — 항목 수(2~6) + 합계(= 총 계약금액) 두 조건 모두 충족해야 통과.
 * 폼·서버 양쪽에서 같은 검증을 쓰도록 분리.
 */
export function validatePaymentSplits(
  rawSplits: unknown,
  contractAmount: number,
): SplitsValidation {
  if (!Array.isArray(rawSplits)) {
    return { ok: false, error: "대금분할 항목이 누락되었습니다" };
  }

  if (rawSplits.length < MIN_SPLITS || rawSplits.length > MAX_SPLITS) {
    return {
      ok: false,
      error: `대금분할은 ${MIN_SPLITS}~${MAX_SPLITS}개 항목이어야 합니다 (현재 ${rawSplits.length}개)`,
    };
  }

  const parsed: PaymentSplitInput[] = [];
  for (let i = 0; i < rawSplits.length; i++) {
    const result = paymentSplitInputSchema.safeParse(rawSplits[i]);
    if (!result.success) {
      const first = result.error.issues[0];
      return { ok: false, error: `${i + 1}번째 항목: ${first?.message ?? "형식 오류"}` };
    }
    parsed.push(result.data);
  }

  const total = parsed.reduce((sum, s) => sum + s.amount, 0);
  if (total !== contractAmount) {
    return {
      ok: false,
      error: `대금분할 합계(${total.toLocaleString()}원)가 총 계약금액(${contractAmount.toLocaleString()}원)과 다릅니다`,
    };
  }

  return { ok: true, splits: parsed };
}
