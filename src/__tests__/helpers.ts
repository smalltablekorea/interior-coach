import { vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock DB ───
export function createMockDb() {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    then: vi.fn().mockResolvedValue([]),
  };
  return mockChain;
}

// ─── Mock Auth ───
export const mockAuthSuccess = {
  ok: true as const,
  userId: "test-user-123",
  workspaceId: "test-workspace-456",
  workspaceRole: "owner" as const,
  session: {
    user: { id: "test-user-123", name: "테스트 사용자", email: "test@example.com" },
  },
};

export const mockAuthFailure = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  }),
};

// ─── Request builder ───
export function createRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

// ─── XSS payloads for security testing ───
export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><script>alert(document.cookie)</script>',
  "javascript:alert('XSS')",
  '<svg onload=alert(1)>',
  "{{constructor.constructor('return this')()}}", // prototype pollution
  "${7*7}", // template injection
  '<iframe src="javascript:alert(1)">',
];

// ─── SQL injection payloads ───
export const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1; SELECT * FROM users --",
  "' UNION SELECT * FROM user --",
  "admin'--",
  "1' AND 1=1 UNION SELECT null,version() --",
];

// ─── Performance timer ───
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - start };
}
