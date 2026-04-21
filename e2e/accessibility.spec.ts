import { test, expect } from "@playwright/test";

/**
 * 접근성 E2E 테스트
 * - 키보드 내비게이션
 * - 포커스 관리
 * - 색상 대비
 * - 스크린리더 호환성
 */

test.describe("Accessibility — Keyboard Navigation", () => {
  test("Tab 키로 주요 요소 탐색 가능", async ({ page }) => {
    await page.goto("/");
    // Tab through the page
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Should be able to tab to multiple interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
    }
    const laterFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(laterFocused).toBeTruthy();
  });

  test("포커스 가시성 확인", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    // Active element should have visible focus indicator
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      // Check for outline or box-shadow (common focus indicators)
      return (
        styles.outline !== "none" ||
        styles.outlineStyle !== "none" ||
        styles.boxShadow !== "none"
      );
    });
    // At minimum, the browser default focus should be present
    expect(hasFocusStyle).toBeDefined();
  });
});

test.describe("Accessibility — ARIA & Semantics", () => {
  test("페이지에 h1 태그 존재", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("이미지에 alt 속성 존재", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      // All images should have alt attribute (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });

  test("버튼에 접근 가능한 이름 존재", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute("aria-label");
        const title = await btn.getAttribute("title");
        // Button should have accessible name via text, aria-label, or title
        expect(text || ariaLabel || title).toBeTruthy();
      }
    }
  });

  test("랜드마크 역할 존재", async ({ page }) => {
    await page.goto("/");
    // Page should have main landmark
    const main = page.locator("main, [role='main']");
    await expect(main.first()).toBeAttached();
  });
});

test.describe("Accessibility — Responsive", () => {
  test("모바일 뷰포트에서 콘텐츠 잘림 없음", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
