// ─── Toss Payments API 헬퍼 ───

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function getSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다");
  return key;
}

function authHeader(): string {
  return "Basic " + Buffer.from(getSecretKey() + ":").toString("base64");
}

async function tossRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: true; data: T } | { ok: false; error: TossError }> {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    method: options.method || "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, error: data as TossError };
  }

  return { ok: true, data: data as T };
}

// ─── Types ───

export interface TossError {
  code: string;
  message: string;
}

export interface TossBillingKey {
  mId: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  billingKey: string;
  card: {
    issuerCode: string;
    acquirerCode: string;
    number: string;
    cardType: string;
    ownerType: string;
  };
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  receipt?: { url: string };
  card?: {
    issuerCode: string;
    number: string;
    cardType: string;
  };
}

// ─── API Functions ───

/** 빌링키 발급 (카드 인증 후 authKey로 빌링키 확인) */
export async function issueBillingKey(params: {
  authKey: string;
  customerKey: string;
}) {
  return tossRequest<TossBillingKey>("/billing/authorizations/issue", {
    body: params,
  });
}

/** 빌링키로 자동결제 실행 */
export async function executeBillingPayment(params: {
  billingKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}) {
  const { billingKey, ...body } = params;
  return tossRequest<TossPayment>(`/billing/${billingKey}`, { body });
}

/** 결제 취소 */
export async function cancelPayment(params: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}) {
  const { paymentKey, ...body } = params;
  return tossRequest<TossPayment>(`/payments/${paymentKey}/cancel`, { body });
}

/** 결제 조회 */
export async function getPayment(paymentKey: string) {
  return tossRequest<TossPayment>(`/payments/${paymentKey}`, { method: "GET" });
}

// ─── Helpers ───

/** 주문번호 생성 (YYYYMMDD-UUID prefix) */
export function generateOrderId(userId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 10);
  return `IC-${date}-${userId.slice(0, 8)}-${rand}`;
}

/** 고객키 생성 (Toss에서 고객 식별용) */
export function generateCustomerKey(userId: string): string {
  return `customer_${userId}`;
}
