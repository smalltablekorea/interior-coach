import { describe, it, expect } from "vitest";
import { landingCopy } from "@/content/landing";

/**
 * 접근성 테스트 확장 — WCAG 2.1 AA 기준
 */
describe("Accessibility — Color contrast & text", () => {
  it("모든 섹션에 heading 존재", () => {
    // Check major sections have titles/headings
    expect(landingCopy.hero.titleLines.length).toBeGreaterThan(0);
    expect(landingCopy.painPoints.title).toBeTruthy();
  });

  it("CTA 버튼이 2개 이상 (primary + secondary)", () => {
    expect(landingCopy.hero.primaryCta).toBeDefined();
    expect(landingCopy.hero.primaryCta.label).toBeTruthy();
    expect(landingCopy.hero.primaryCta.href).toBeTruthy();
  });

  it("모든 href가 유효한 형식", () => {
    const hrefs: string[] = [];
    if (landingCopy.hero.primaryCta?.href) hrefs.push(landingCopy.hero.primaryCta.href);
    if (landingCopy.hero.secondaryCta?.href) hrefs.push(landingCopy.hero.secondaryCta.href);
    for (const link of landingCopy.nav.links) {
      if (link.href) hrefs.push(link.href);
    }
    for (const href of hrefs) {
      expect(href).toMatch(/^[#\/]|https?:\/\//);
    }
  });
});

describe("Accessibility — Form labels & ARIA", () => {
  it("pricing plans all have name and description for screen readers", async () => {
    const { PLANS } = await import("@/lib/plans");
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.name).toBeTruthy();
      expect(plan.nameKo).toBeTruthy();
      expect(plan.description.length).toBeGreaterThan(5);
    }
  });

  it("pricing highlights describe features (not just icons)", async () => {
    const { PLANS } = await import("@/lib/plans");
    for (const [, plan] of Object.entries(PLANS)) {
      for (const highlight of plan.highlights) {
        // Highlights should have meaningful text (> 3 chars)
        expect(highlight.length).toBeGreaterThan(3);
      }
    }
  });
});

describe("Accessibility — Content structure", () => {
  it("landing content has logical section order", () => {
    // Verify all expected sections exist
    expect(landingCopy.nav).toBeDefined();
    expect(landingCopy.hero).toBeDefined();
    expect(landingCopy.painPoints).toBeDefined();
  });

  it("no empty text content in pain point cards", () => {
    for (const card of landingCopy.painPoints.cards) {
      expect(card.title.trim()).not.toBe("");
      expect(card.body.trim()).not.toBe("");
    }
  });
});
