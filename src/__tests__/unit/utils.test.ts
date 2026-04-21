import { describe, it, expect } from "vitest";
import { fmt, fmtNum, fmtM, fmtShort, fmtDate, cn } from "@/lib/utils";

describe("fmt — 금액 포맷 (원)", () => {
  it("formats positive number", () => {
    expect(fmt(1234567)).toContain("1,234,567");
    expect(fmt(1234567)).toContain("원");
  });

  it("handles zero", () => {
    expect(fmt(0)).toBe("0원");
  });

  it("handles null/undefined", () => {
    expect(fmt(null)).toBe("0원");
    expect(fmt(undefined)).toBe("0원");
  });

  it("handles negative numbers", () => {
    const result = fmt(-5000);
    expect(result).toContain("5,000");
    expect(result).toContain("원");
  });
});

describe("fmtNum — 숫자 포맷 (단위 없음)", () => {
  it("formats with commas", () => {
    expect(fmtNum(1234567)).toBe("1,234,567");
  });

  it("handles null", () => {
    expect(fmtNum(null)).toBe("0");
  });
});

describe("fmtM — 만원 단위", () => {
  it("converts to 만 unit", () => {
    expect(fmtM(50000000)).toBe("5000만");
  });

  it("rounds to nearest 만", () => {
    expect(fmtM(15000)).toBe("2만"); // rounds 1.5
  });

  it("handles null", () => {
    expect(fmtM(null)).toBe("0만");
  });
});

describe("fmtShort — 축약 금액", () => {
  it("formats 억 for >= 100M", () => {
    expect(fmtShort(198000000)).toContain("억");
  });

  it("formats 만 for >= 10K", () => {
    expect(fmtShort(50000)).toContain("만");
  });

  it("plain format for small amounts", () => {
    expect(fmtShort(5000)).not.toContain("만");
  });

  it("handles null", () => {
    expect(fmtShort(null)).toBe("0");
  });
});

describe("fmtDate — 날짜 포맷", () => {
  it("formats date string", () => {
    const result = fmtDate("2026-03-17T00:00:00Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/17/);
  });

  it("handles Date object", () => {
    const result = fmtDate(new Date("2026-01-01"));
    expect(result).toMatch(/2026/);
  });

  it("handles null/undefined", () => {
    expect(fmtDate(null)).toBe("-");
    expect(fmtDate(undefined)).toBe("-");
  });
});

describe("cn — classname merge", () => {
  it("joins valid classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("handles empty", () => {
    expect(cn()).toBe("");
  });
});
