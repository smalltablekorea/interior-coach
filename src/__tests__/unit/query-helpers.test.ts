import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  parsePagination,
  buildPaginationMeta,
  parseFilters,
  searchPattern,
} from "@/lib/api/query-helpers";

function req(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("parsePagination", () => {
  it("returns defaults when no params", () => {
    const p = parsePagination(req("/api/test"));
    expect(p.page).toBe(1);
    expect(p.limit).toBe(20);
    expect(p.offset).toBe(0);
  });

  it("parses page and limit", () => {
    const p = parsePagination(req("/api/test?page=3&limit=10"));
    expect(p.page).toBe(3);
    expect(p.limit).toBe(10);
    expect(p.offset).toBe(20);
  });

  it("clamps page to minimum 1", () => {
    const p = parsePagination(req("/api/test?page=-5"));
    expect(p.page).toBe(1);
  });

  it("clamps limit to max 100", () => {
    const p = parsePagination(req("/api/test?limit=500"));
    expect(p.limit).toBe(100);
  });

  it("clamps limit to minimum 1", () => {
    const p = parsePagination(req("/api/test?limit=0"));
    expect(p.limit).toBe(1);
  });
});

describe("buildPaginationMeta", () => {
  it("calculates totalPages correctly", () => {
    const meta = buildPaginationMeta(95, { page: 1, limit: 10, offset: 0 });
    expect(meta.total).toBe(95);
    expect(meta.totalPages).toBe(10);
  });

  it("handles zero total", () => {
    const meta = buildPaginationMeta(0, { page: 1, limit: 20, offset: 0 });
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });
});

describe("parseFilters", () => {
  it("extracts allowed filters only", () => {
    const filters = parseFilters(
      req("/api/test?status=active&search=홍길동&evil=drop"),
      ["status", "search"]
    );
    expect(filters.status).toBe("active");
    expect(filters.search).toBe("홍길동");
    expect(filters).not.toHaveProperty("evil");
  });

  it("skips missing params", () => {
    const filters = parseFilters(req("/api/test"), ["status"]);
    expect(filters).toEqual({});
  });
});

describe("searchPattern", () => {
  it("wraps term in % wildcards", () => {
    expect(searchPattern("아파트")).toBe("%아파트%");
  });

  it("escapes % and _ in search term", () => {
    const result = searchPattern("50%_off");
    expect(result).toContain("\\%");
    expect(result).toContain("\\_");
  });
});
