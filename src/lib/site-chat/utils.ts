import crypto from "crypto";

/** 고객 포털용 slug 생성 (예: jamsil-lwe-a7k2) */
export function generatePortalSlug(siteName: string): string {
  const base = siteName
    .replace(/[^a-zA-Z0-9가-힣]/g, "")
    .slice(0, 10)
    .toLowerCase();
  const suffix = crypto.randomBytes(3).toString("hex").slice(0, 4);
  // 한글이면 랜덤 prefix 사용
  const prefix = /[가-힣]/.test(base)
    ? crypto.randomBytes(3).toString("hex").slice(0, 6)
    : base;
  return `${prefix}-${suffix}`;
}

/** 비밀번호 해시 (bcrypt 대신 간단 HMAC) */
export async function hashPortalPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return `${salt}:${hash}`;
}

/** 비밀번호 검증 */
export async function verifyPortalPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computed = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return computed === hash;
}

/** IP 기반 Rate Limiter (인메모리, 서버리스 환경 적합) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/** 스팸 필터 */
export function isSpam(content: string): { spam: boolean; reason?: string } {
  if (content.length < 3) {
    return { spam: true, reason: "메시지가 너무 짧습니다 (최소 3자)" };
  }
  if (content.length > 2000) {
    return { spam: true, reason: "메시지가 너무 깁니다 (최대 2000자)" };
  }
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount >= 3) {
    return { spam: true, reason: "URL이 너무 많습니다 (최대 2개)" };
  }
  return { spam: false };
}

/** SSE 이벤트 구독자 관리 */
type SSEClient = {
  controller: ReadableStreamDefaultController;
  roomId: string;
};

const sseClients = new Map<string, Set<SSEClient>>();

export function addSSEClient(roomId: string, client: SSEClient) {
  if (!sseClients.has(roomId)) {
    sseClients.set(roomId, new Set());
  }
  sseClients.get(roomId)!.add(client);
}

export function removeSSEClient(roomId: string, client: SSEClient) {
  sseClients.get(roomId)?.delete(client);
  if (sseClients.get(roomId)?.size === 0) {
    sseClients.delete(roomId);
  }
}

export function broadcastToRoom(
  roomId: string,
  event: string,
  data: unknown,
) {
  const clients = sseClients.get(roomId);
  if (!clients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();

  for (const client of clients) {
    try {
      client.controller.enqueue(encoder.encode(payload));
    } catch {
      // 연결이 끊어진 클라이언트 제거
      removeSSEClient(roomId, client);
    }
  }
}
