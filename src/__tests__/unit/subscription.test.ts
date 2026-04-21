import { describe, it, expect } from "vitest";
import { isUnlimitedAccount } from "@/lib/subscription";

describe("isUnlimitedAccount — 관리자 계정 판별", () => {
  it("관리자 이메일 → true", () => {
    expect(isUnlimitedAccount("smalltablekorea@gmail.com")).toBe(true);
    expect(isUnlimitedAccount("test@interior-coach.com")).toBe(true);
  });

  it("대소문자 무관", () => {
    expect(isUnlimitedAccount("SMALLTABLEKOREA@GMAIL.COM")).toBe(true);
    expect(isUnlimitedAccount("SmallTableKorea@Gmail.com")).toBe(true);
  });

  it("일반 이메일 → false", () => {
    expect(isUnlimitedAccount("user@example.com")).toBe(false);
    expect(isUnlimitedAccount("another@gmail.com")).toBe(false);
  });

  it("null/undefined → false", () => {
    expect(isUnlimitedAccount(null)).toBe(false);
    expect(isUnlimitedAccount(undefined)).toBe(false);
  });

  it("빈 문자열 → false", () => {
    expect(isUnlimitedAccount("")).toBe(false);
  });
});
