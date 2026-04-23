import { describe, it, expect } from "vitest";
import { stripHtml } from "@/lib/api/validate";

describe("stripHtml — XSS defense", () => {
  it("strips script tags", () => {
    expect(stripHtml('<script>alert("xss")</script>')).not.toContain("<script");
    expect(stripHtml('<script>alert("xss")</script>')).not.toContain("</script");
  });

  it("strips img onerror", () => {
    expect(stripHtml("<img src=x onerror=alert(1)>")).not.toContain("<img");
  });

  it("strips svg onload", () => {
    expect(stripHtml("<svg onload=alert(1)>")).not.toContain("<svg");
  });

  it("strips iframe", () => {
    expect(stripHtml('<iframe src="javascript:alert(1)">')).not.toContain("<iframe");
  });

  it("strips nested tags", () => {
    expect(stripHtml("<b><i><script>alert(1)</script></i></b>")).not.toContain("<");
  });

  it("preserves normal text", () => {
    expect(stripHtml("인테리어 견적 요청")).toBe("인테리어 견적 요청");
  });

  it("removes angle brackets even without tags", () => {
    const result = stripHtml("test < > end");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });
});
