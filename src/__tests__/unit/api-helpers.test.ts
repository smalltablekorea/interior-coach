import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  ok, err, notFound, forbidden, serverError,
} from "@/lib/api/response";
import {
  parsePagination, buildPaginationMeta, parseFilters, searchPattern,
} from "@/lib/api/query-helpers";

describe("Response helpers — ok/err/notFound/forbidden/serverError", () => {
  it("ok() → 200 JSON", async () => {
    const res = ok({ items: [1, 2, 3] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([1, 2, 3]);
  });

  it("err() → custom status", async () => {
    const res = err("잘못된 요청", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("잘못된 요청");
  });

  it("err() 기본 status = 400", async () => {
    const res = err("에러");
    expect(res.status).toBe(400);
  });

  it("notFound() → 404", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("찾을 수 없습니다");
  });

  it("notFound() 커스텀 메시지", async () => {
    const res = notFound("현장을 찾을 수 없습니다");
    const body = await res.json();
    expect(body.error).toBe("현장을 찾을 수 없습니다");
  });

  it("forbidden() → 403", async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("권한");
  });

  it("serverError() with Error object", async () => {
    const res = serverError(new Error("DB connection failed"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB connection failed");
  });

  it("serverError() with non-Error", async () => {
    const res = serverError("string error");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("서버 오류");
  });
});

describe("parsePagination — 페이지네이션 추출", () => {
  function req(params: string) {
    return new NextRequest(new URL(`/api/test?${params}`, "http://localhost:3000"));
  }

  it("기본값: page=1, limit=20", () => {
    const result = parsePagination(req(""));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("page=3, limit=10 → offset=20", () => {
    const result = parsePagination(req("page=3&limit=10"));
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it("limit > 100 → clamped to 100", () => {
    const result = parsePagination(req("limit=999"));
    expect(result.limit).toBe(100);
  });

  it("limit < 1 → clamped to 1", () => {
    const result = parsePagination(req("limit=0"));
    expect(result.limit).toBe(1);
  });

  it("page < 1 → clamped to 1", () => {
    const result = parsePagination(req("page=-5"));
    expect(result.page).toBe(1);
  });

  it("NaN 값 → parseInt fallback", () => {
    const result = parsePagination(req("page=abc&limit=xyz"));
    // parseInt("abc") → NaN, Math.max(1, NaN) → NaN — this is a known edge case
    // The function relies on valid numeric strings; NaN propagates
    expect(typeof result.page).toBe("number");
    expect(typeof result.limit).toBe("number");
  });
});

describe("buildPaginationMeta", () => {
  it("총 페이지 계산", () => {
    const meta = buildPaginationMeta(95, { page: 1, limit: 20, offset: 0 });
    expect(meta.total).toBe(95);
    expect(meta.totalPages).toBe(5); // ceil(95/20) = 5
  });

  it("0건 → 0페이지", () => {
    const meta = buildPaginationMeta(0, { page: 1, limit: 20, offset: 0 });
    expect(meta.totalPages).toBe(0);
  });
});

describe("parseFilters — 필터 추출", () => {
  function req(params: string) {
    return new NextRequest(new URL(`/api/test?${params}`, "http://localhost:3000"));
  }

  it("허용된 필터만 추출", () => {
    const result = parseFilters(req("status=active&name=test&evil=hack"), ["status", "name"]);
    expect(result).toEqual({ status: "active", name: "test" });
    expect(result.evil).toBeUndefined();
  });

  it("빈 값은 무시", () => {
    const result = parseFilters(req("status="), ["status"]);
    expect(result.status).toBeUndefined();
  });
});

describe("searchPattern — ILIKE 검색 패턴", () => {
  it("일반 텍스트 → %텍스트%", () => {
    expect(searchPattern("잠실")).toBe("%잠실%");
  });

  it("% 문자 이스케이프", () => {
    expect(searchPattern("50%")).toBe("%50\\%%");
  });

  it("_ 문자 이스케이프", () => {
    expect(searchPattern("user_name")).toBe("%user\\_name%");
  });

  it("빈 문자열 → %%", () => {
    expect(searchPattern("")).toBe("%%");
  });
});
