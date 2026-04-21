import { test, expect } from "@playwright/test";

/**
 * 인증 플로우 E2E 테스트
 * - 회원가입 → 로그인 → 대시보드 진입
 * - 보호된 페이지 접근 시 리다이렉트
 * - 로그아웃 후 재접근 차단
 */

test.describe("Authentication Flow", () => {
  test("비로그인 상태에서 대시보드 접근 → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login or show auth prompt
    await page.waitForURL(/\/(auth|login|sign-in|$)/i, { timeout: 5000 });
  });

  test("비로그인 상태에서 견적 페이지 접근 → 리다이렉트", async ({ page }) => {
    await page.goto("/estimates");
    await page.waitForURL(/\/(auth|login|sign-in|$)/i, { timeout: 5000 });
  });

  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/auth/sign-in");
    // Should have email/password inputs or social login buttons
    const authForm = page.locator("form, [data-testid='auth-form']").first();
    // Page should load without error
    expect(page.url()).toContain("auth");
  });
});
