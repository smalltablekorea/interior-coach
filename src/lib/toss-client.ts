// ─── Toss Payments 클라이언트 사이드 헬퍼 ───
// 브라우저에서 안전하게 사용 가능한 함수만 포함

/** 고객키 생성 (Toss에서 고객 식별용) */
export function generateCustomerKey(userId: string): string {
  return `customer_${userId}`;
}
