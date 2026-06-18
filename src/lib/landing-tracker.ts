/**
 * 랜딩페이지 클라이언트 트래킹 sender.
 *
 * 서버 라우트(/api/track-event)는 출시 전부터 있었지만 클라이언트 호출이 누락되어
 * 출시 1주일간 모든 page_view가 미수집된 채 운영됨 — 마케팅 깔때기 측정 불가 상태.
 * 이 모듈로 page_view·cta_click·section_view·scroll_depth 를 fire-and-forget 전송.
 *
 * - sessionId: sessionStorage에 30분 TTL 로 유지
 * - 첫 진입 시 utm_*·referrer 자동 캡처 후 sessionStorage 에 보관 → 세션 내 모든 이벤트에 첨부
 * - 실패는 swallow (트래킹 때문에 UX가 깨지면 안 됨)
 */

const SESSION_KEY = "ic_session_id";
const ATTR_KEY = "ic_session_attr";
const SESSION_TTL_MS = 30 * 60 * 1000;

type EventType = "page_view" | "section_view" | "cta_click" | "scroll_depth";

interface SessionAttribution {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
}

interface TrackPayload {
  sessionId: string;
  eventType: EventType;
  sectionName?: string | null;
  ctaName?: string | null;
  scrollDepth?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
}

function randomId(): string {
  // crypto.randomUUID 미지원 환경(구브라우저) 대비.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; at: number };
      if (Date.now() - parsed.at < SESSION_TTL_MS) {
        // 활동 발생 시 TTL 갱신
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, at: Date.now() }));
        return parsed.id;
      }
    }
    const id = randomId();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: Date.now() }));
    return id;
  } catch {
    return randomId();
  }
}

function captureAttribution(): SessionAttribution {
  if (typeof window === "undefined") return {};
  try {
    const cached = sessionStorage.getItem(ATTR_KEY);
    if (cached) return JSON.parse(cached) as SessionAttribution;
    const url = new URL(window.location.href);
    const attr: SessionAttribution = {
      utmSource: url.searchParams.get("utm_source"),
      utmMedium: url.searchParams.get("utm_medium"),
      utmCampaign: url.searchParams.get("utm_campaign"),
      referrer: document.referrer || null,
    };
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    return attr;
  } catch {
    return {};
  }
}

async function send(payload: TrackPayload): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // sendBeacon이 가장 신뢰성 높음(언로드 시에도 전송).
    if ("sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/track-event", blob);
      return;
    }
    await fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // swallow
  }
}

function buildPayload(
  eventType: EventType,
  extras: Omit<TrackPayload, "sessionId" | "eventType"> = {},
): TrackPayload {
  const attr = captureAttribution();
  return {
    sessionId: getOrCreateSessionId(),
    eventType,
    ...attr,
    ...extras,
  };
}

/** 페이지 진입 시 1회 호출 (useEffect 안에서). 같은 세션 내 중복 호출은 서버에서 dedupe 권장. */
export function trackPageView(): void {
  void send(buildPayload("page_view"));
}

export function trackSectionView(sectionName: string): void {
  void send(buildPayload("section_view", { sectionName }));
}

export function trackCtaClick(ctaName: string, sectionName?: string): void {
  void send(buildPayload("cta_click", { ctaName, sectionName: sectionName ?? null }));
}

export function trackScrollDepth(depth: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(depth)));
  void send(buildPayload("scroll_depth", { scrollDepth: clamped }));
}
