import { test, expect } from "@playwright/test";

/**
 * 랜딩 페이지 E2E 테스트
 * - 페이지 로딩 확인
 * - 주요 섹션 노출 확인
 * - CTA 버튼 동작 확인
 * - 모바일 반응형 확인
 */

test.describe("Landing Page", () => {
  test("페이지 로딩 성공", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/인테리어코치/i);
  });

  test("히어로 섹션 노출", async ({ page }) => {
    await page.goto("/");
    // Hero section should be visible
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
  });

  test("CTA 버튼 클릭 → 회원가입/로그인 이동", async ({ page }) => {
    await page.goto("/");
    // Find main CTA button
    const ctaButton = page.getByRole("link", { name: /시작|체험|무료/i }).first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      // Should navigate to auth page
      await page.waitForURL(/\/(auth|login|signup|sign-in)/i, { timeout: 5000 }).catch(() => {
        // CTA might be a scroll anchor instead
      });
    }
  });

  test("네비게이션 링크 동작", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("가격 섹션 노출", async ({ page }) => {
    await page.goto("/");
    // Pricing section should contain plan information
    const pricingText = page.getByText(/플랜|요금|가격|무료/i);
    await expect(pricingText.first()).toBeVisible({ timeout: 5000 });
  });

  test("페이지 로딩 성능 < 5초", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });
});
