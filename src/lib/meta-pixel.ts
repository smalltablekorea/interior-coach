/** Meta Pixel 이벤트 트래킹 헬퍼 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params);
  }
}

/** 결제 완료 */
export function trackPurchase(value: number, currency = "KRW") {
  track("Purchase", { value, currency });
}

/** 결제 시작 (장바구니/결제 페이지 진입) */
export function trackInitiateCheckout(value?: number) {
  track("InitiateCheckout", value != null ? { value, currency: "KRW" } : undefined);
}

/** 장바구니 추가 (상품 선택) */
export function trackAddToCart(value?: number) {
  track("AddToCart", value != null ? { value, currency: "KRW" } : undefined);
}

/** 리드 (회원가입/견적 요청 등) */
export function trackLead() {
  track("Lead");
}

/** 컨텐츠 조회 (분석 결과 등) */
export function trackViewContent(contentName?: string) {
  track("ViewContent", contentName ? { content_name: contentName } : undefined);
}
