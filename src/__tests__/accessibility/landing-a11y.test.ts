import { describe, it, expect } from "vitest";
import { landingCopy } from "@/content/landing";

/**
 * Accessibility checks for landing page content.
 * Ensures all interactive elements and images have proper labels.
 */
describe("Accessibility — Landing page", () => {
  it("all nav links have labels", () => {
    for (const link of landingCopy.nav.links) {
      expect(link.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("CTA buttons have descriptive labels (not generic)", () => {
    const generic = ["click here", "클릭", "여기"];
    const ctaLabel = landingCopy.hero.primaryCta.label.toLowerCase();
    for (const g of generic) {
      expect(ctaLabel).not.toContain(g);
    }
  });

  it("hero has sufficient text for screen readers", () => {
    const { hero } = landingCopy;
    const textLength = hero.titleLines.join("").length + hero.subtitle.length;
    expect(textLength).toBeGreaterThan(20);
  });

  it("pain point cards each have icon, title, and body", () => {
    for (const card of landingCopy.painPoints.cards) {
      expect(card.icon, "Missing icon for pain point card").toBeTruthy();
      expect(card.title, "Missing title for pain point card").toBeTruthy();
      expect(card.body, "Missing body for pain point card").toBeTruthy();
    }
  });
});

describe("Accessibility — PLANS pricing", () => {
  it("all plans have description text", async () => {
    const { PLANS } = await import("@/lib/plans");
    for (const [id, plan] of Object.entries(PLANS) as [string, any][]) {
      expect(plan.description, `${id} missing description`).toBeTruthy();
    }
  });
});
