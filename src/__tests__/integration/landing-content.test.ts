import { describe, it, expect } from "vitest";
import { landingCopy } from "@/content/landing";

/**
 * Landing page content integrity tests.
 * Verifies the content structure that all landing sections depend on.
 * If these break, the entire landing page renders incorrectly.
 */
describe("Landing Content — Structure integrity", () => {
  it("nav has logo, links, and CTAs", () => {
    expect(landingCopy.nav.logo).toBeTruthy();
    expect(landingCopy.nav.links.length).toBeGreaterThan(0);
    expect(landingCopy.nav.ctaLogin.href).toContain("/auth");
    expect(landingCopy.nav.ctaSignup.href).toContain("/auth");
  });

  it("hero has all required fields", () => {
    const { hero } = landingCopy;
    expect(hero.eyebrow).toBeTruthy();
    expect(hero.titleLines.length).toBeGreaterThan(0);
    expect(hero.subtitle).toBeTruthy();
    expect(hero.primaryCta.label).toBeTruthy();
    expect(hero.primaryCta.href).toBeTruthy();
    expect(hero.secondaryCta.label).toBeTruthy();
  });

  it("painPoints has 4 cards", () => {
    expect(landingCopy.painPoints.cards.length).toBe(4);
    for (const card of landingCopy.painPoints.cards) {
      expect(card.icon).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.body).toBeTruthy();
    }
  });

  it("features has blocks", () => {
    expect(landingCopy.features.blocks.length).toBeGreaterThan(0);
  });

  it("pricing section exists with plans", () => {
    expect(landingCopy.pricing).toBeDefined();
    expect(landingCopy.pricing.title).toBeTruthy();
  });

  it("all nav links point to valid anchors", () => {
    for (const link of landingCopy.nav.links) {
      expect(link.href).toMatch(/^#[a-z]/);
      expect(link.label).toBeTruthy();
    }
  });

  it("CTA buttons have non-empty labels", () => {
    expect(landingCopy.hero.primaryCta.label.length).toBeGreaterThan(0);
    expect(landingCopy.hero.secondaryCta.label.length).toBeGreaterThan(0);
  });
});
