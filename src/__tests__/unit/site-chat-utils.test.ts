import { describe, it, expect } from "vitest";
import {
  generatePortalSlug,
  hashPortalPassword,
  verifyPortalPassword,
  checkRateLimit,
  isSpam,
} from "@/lib/site-chat/utils";

describe("generatePortalSlug — 포털 슬러그 생성", () => {
  it("영문 사이트명 → 영문 prefix + suffix", () => {
    const slug = generatePortalSlug("jamsil-tower");
    expect(slug).toMatch(/^[a-z0-9]+-[a-z0-9]{4}$/);
  });

  it("한글 사이트명 → 랜덤 prefix", () => {
    const slug = generatePortalSlug("잠실르엘");
    expect(slug).toMatch(/^[a-f0-9]+-[a-f0-9]{4}$/);
  });

  it("매번 다른 slug 생성 (randomness)", () => {
    const a = generatePortalSlug("test-site");
    const b = generatePortalSlug("test-site");
    expect(a).not.toBe(b);
  });

  it("특수문자 제거", () => {
    const slug = generatePortalSlug("test!@#$%site");
    expect(slug).not.toMatch(/[!@#$%]/);
  });
});

describe("hashPortalPassword / verifyPortalPassword", () => {
  it("해시 후 검증 성공", async () => {
    const hash = await hashPortalPassword("secret123");
    expect(hash).toContain(":"); // salt:hash format
    const valid = await verifyPortalPassword("secret123", hash);
    expect(valid).toBe(true);
  });

  it("틀린 비밀번호 → false", async () => {
    const hash = await hashPortalPassword("secret123");
    const valid = await verifyPortalPassword("wrong-password", hash);
    expect(valid).toBe(false);
  });

  it("같은 비밀번호라도 다른 해시 (salt)", async () => {
    const hash1 = await hashPortalPassword("same-pass");
    const hash2 = await hashPortalPassword("same-pass");
    expect(hash1).not.toBe(hash2);
  });

  it("잘못된 해시 포맷 → false", async () => {
    expect(await verifyPortalPassword("test", "no-colon")).toBe(false);
    expect(await verifyPortalPassword("test", "")).toBe(false);
  });
});

describe("checkRateLimit — IP 기반 레이트 리밋", () => {
  it("첫 요청 → 허용", () => {
    expect(checkRateLimit("unique-ip-1", 3, 60000)).toBe(true);
  });

  it("한도 내 연속 요청 → 허용", () => {
    const ip = "unique-ip-2-" + Date.now();
    expect(checkRateLimit(ip, 3, 60000)).toBe(true);
    expect(checkRateLimit(ip, 3, 60000)).toBe(true);
    expect(checkRateLimit(ip, 3, 60000)).toBe(true);
  });

  it("한도 초과 → 거부", () => {
    const ip = "unique-ip-3-" + Date.now();
    checkRateLimit(ip, 2, 60000);
    checkRateLimit(ip, 2, 60000);
    expect(checkRateLimit(ip, 2, 60000)).toBe(false);
  });

  it("다른 IP는 별도 한도", () => {
    const ip1 = "unique-ip-4a-" + Date.now();
    const ip2 = "unique-ip-4b-" + Date.now();
    checkRateLimit(ip1, 1, 60000);
    expect(checkRateLimit(ip1, 1, 60000)).toBe(false);
    expect(checkRateLimit(ip2, 1, 60000)).toBe(true);
  });
});

describe("isSpam — 스팸 필터", () => {
  it("정상 메시지 → spam: false", () => {
    expect(isSpam("안녕하세요, 인테리어 상담 요청합니다")).toEqual({ spam: false });
  });

  it("너무 짧은 메시지 (< 3자) → spam", () => {
    const result = isSpam("hi");
    expect(result.spam).toBe(true);
    expect(result.reason).toContain("짧");
  });

  it("너무 긴 메시지 (> 2000자) → spam", () => {
    const result = isSpam("a".repeat(2001));
    expect(result.spam).toBe(true);
    expect(result.reason).toContain("깁");
  });

  it("URL 3개 이상 → spam", () => {
    const result = isSpam("http://a.com http://b.com https://c.com 링크");
    expect(result.spam).toBe(true);
    expect(result.reason).toContain("URL");
  });

  it("URL 2개 이하 → OK", () => {
    expect(isSpam("http://a.com http://b.com 참고 링크")).toEqual({ spam: false });
  });

  it("정확히 3자 → OK", () => {
    expect(isSpam("안녕하")).toEqual({ spam: false });
  });

  it("정확히 2000자 → OK", () => {
    expect(isSpam("가".repeat(2000))).toEqual({ spam: false });
  });
});
