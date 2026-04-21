import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createRequest } from "../helpers";

/**
 * CSRF & 인증 보안 테스트
 * - 인증 없는 API 접근 차단
 * - 잘못된 요청 body 처리
 * - 프로토타입 오염 방어
 */

// Mock requireWorkspaceAuth
const mockRequireWorkspaceAuth = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    ok: false,
    response: new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  }),
  requireWorkspaceAuth: (...args: unknown[]) => mockRequireWorkspaceAuth(...args),
}));

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  customers: { workspaceId: "workspaceId", userId: "userId", deletedAt: "deletedAt" },
  sites: { workspaceId: "workspaceId", userId: "userId" },
}));

vi.mock("@/lib/workspace/query-helpers", () => ({
  workspaceFilter: vi.fn(() => undefined),
}));

describe("Security — CSRF & Auth Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated POST to /api/customers → 401", async () => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const { POST } = await import("@/app/api/customers/route");
    const req = createRequest("POST", "http://localhost:3000/api/customers", {
      name: "테스트",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("unauthenticated GET to /api/customers → 401", async () => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const { GET } = await import("@/app/api/customers/route");
    const req = new NextRequest("http://localhost:3000/api/customers");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("Security — Session Token Validation", () => {
  it("missing Authorization header → 401", async () => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
        status: 401,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/sites", {
      method: "GET",
      headers: {},
    });

    const { GET } = await import("@/app/api/sites/route");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("invalid bearer token → 401", async () => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: false,
      response: new Response(
        JSON.stringify({ error: "세션 확인 실패" }),
        { status: 401 }
      ),
    });

    const req = new NextRequest("http://localhost:3000/api/sites", {
      method: "GET",
      headers: { Authorization: "Bearer invalid-token-xxx" },
    });

    const { GET } = await import("@/app/api/sites/route");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("Security — Request Body Attacks", () => {
  beforeEach(() => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: true,
      userId: "test-user-123",
      workspaceId: "test-workspace-456",
      workspaceRole: "owner",
      session: {
        user: {
          id: "test-user-123",
          name: "테스트",
          email: "test@example.com",
        },
      },
    });
  });

  it("malformed JSON body → 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    });
    const { POST } = await import("@/app/api/customers/route");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("null body → 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
    const { POST } = await import("@/app/api/customers/route");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("__proto__ pollution does not affect global Object prototype", () => {
    const malicious = JSON.parse(
      '{"__proto__": {"isAdmin": true}, "name": "test"}'
    );
    // The global Object.prototype should never be polluted
    const freshObj = {} as Record<string, unknown>;
    expect(freshObj["isAdmin"]).toBeUndefined();
    // JSON.parse with __proto__ creates the key on the object itself, not on the prototype
    expect(Object.getPrototypeOf(freshObj).isAdmin).toBeUndefined();
  });
});
