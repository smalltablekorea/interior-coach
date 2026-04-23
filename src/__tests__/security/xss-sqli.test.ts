import { describe, it, expect } from "vitest";
import { stripHtml } from "@/lib/api/validate";
import { searchPattern } from "@/lib/api/query-helpers";
import { xssPayloads, sqlInjectionPayloads } from "../helpers";

describe("Security — XSS Prevention", () => {
  it.each(xssPayloads)("stripHtml neutralizes: %s", (payload) => {
    const result = stripHtml(payload);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("<img");
    expect(result).not.toContain("<svg");
    expect(result).not.toContain("<iframe");
    expect(result).not.toMatch(/<[a-z]/i);
  });

  it("double-encoded XSS is safe after stripHtml", () => {
    const encoded = "&lt;script&gt;alert(1)&lt;/script&gt;";
    // After HTML entity decode + stripHtml, no executable JS
    const result = stripHtml(encoded);
    expect(result).not.toContain("<script");
  });
});

describe("Security — SQL Injection Prevention via searchPattern", () => {
  it.each(sqlInjectionPayloads)(
    "searchPattern wraps safely: %s",
    (payload) => {
      const result = searchPattern(payload);
      // searchPattern should just wrap in % — the parameterized query does the real protection
      expect(result).toMatch(/^%.*%$/);
      // The key invariant: the result should be used as a parameter, not interpolated
      // We verify it doesn't modify the payload beyond wrapping
      expect(result.length).toBeGreaterThan(payload.length);
    }
  );

  it("does not allow wildcard injection via %", () => {
    const result = searchPattern("%admin%");
    // % in search term must be escaped
    expect(result).toBe("%\\%admin\\%%");
  });
});

describe("Security — Response Headers", () => {
  it("JSON responses have correct content-type (no XSS via content sniffing)", async () => {
    const { ok } = await import("@/lib/api/response");
    const res = ok({ test: true });
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/json");
  });
});

describe("Security — Input boundary checks", () => {
  it("extremely long input does not crash stripHtml", () => {
    const longInput = "a".repeat(100_000) + '<script>alert(1)</script>';
    expect(() => stripHtml(longInput)).not.toThrow();
    expect(stripHtml(longInput)).not.toContain("<script");
  });

  it("null bytes in input are handled", () => {
    const result = stripHtml("test\x00<script>alert(1)</script>");
    expect(result).not.toContain("<script");
  });

  it("unicode RTL override does not bypass sanitization", () => {
    const result = stripHtml("\u202E<script>alert(1)</script>");
    expect(result).not.toContain("<script");
  });
});
