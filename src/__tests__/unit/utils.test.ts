import { describe, it, expect } from "vitest";
import { fmt, fmtNum, fmtM, fmtShort, fmtDate, cn } from "@/lib/utils";

describe("fmt — 금액 포맷 (원 단위)", () => {
  it("null → '0원'", () => expect(fmt(null)).toBe("0원"));
  it("undefined → '0원'", () => expect(fmt(undefined)).toBe("0원"));
  it("0 → '0원'", () => expect(fmt(0)).toBe("0원"));
  it("1234567 → 천 단위 콤마 + 원", () => {
    expect(fmt(1234567)).toContain("1,234,567");
    expect(fmt(1234567)).toMatch(/원$/);
  });
  it("음수도 포맷", () => expect(fmt(-5000)).toMatch(/-5,000원/));
});

describe("fmtNum — 숫자 포맷 (단위 없음)", () => {
  it("null → '0'", () => expect(fmtNum(null)).toBe("0"));
  it("1234567 → '1,234,567'", () => expect(fmtNum(1234567)).toContain("1,234,567"));
});

describe("fmtM — 만원 단위", () => {
  it("null → '0만'", () => expect(fmtM(null)).toBe("0만"));
  it("10000 → '1만'", () => expect(fmtM(10000)).toBe("1만"));
  it("150000000 → '15000만'", () => expect(fmtM(150000000)).toBe("15000만"));
  it("rounds correctly", () => expect(fmtM(15000)).toBe("2만")); // 1.5 rounds to 2
});

describe("fmtShort — 축약 포맷", () => {
  it("null → '0'", () => expect(fmtShort(null)).toBe("0"));
  it("< 10000 → 콤마 포맷", () => expect(fmtShort(5000)).toContain("5,000"));
  it("10000~1억 → 만 단위", () => expect(fmtShort(15000000)).toMatch(/1,500만/));
  it("1억 이상 → 억 단위", () => expect(fmtShort(120000000)).toBe("1.2억"));
  it("정확히 1억 → 1.0억", () => expect(fmtShort(100000000)).toBe("1.0억"));
});

describe("fmtDate — 날짜 포맷", () => {
  it("null → '-'", () => expect(fmtDate(null)).toBe("-"));
  it("undefined → '-'", () => expect(fmtDate(undefined)).toBe("-"));
  it("Date object 포맷", () => {
    const result = fmtDate(new Date("2026-03-17T00:00:00"));
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/17/);
  });
  it("string date 파싱", () => {
    const result = fmtDate("2026-01-01");
    expect(result).toContain("2026");
  });
});

describe("cn — 클래스네임 병합", () => {
  it("strings만", () => expect(cn("a", "b", "c")).toBe("a b c"));
  it("falsy 제거", () => expect(cn("a", false, null, undefined, "b")).toBe("a b"));
  it("빈 인자 → 빈 문자열", () => expect(cn()).toBe(""));
  it("빈 문자열 제거", () => expect(cn("a", "", "b")).toBe("a b"));
});
