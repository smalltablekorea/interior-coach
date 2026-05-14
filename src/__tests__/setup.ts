import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve(
      new Map([
        ["authorization", "Bearer test-token"],
        ["cookie", "better-auth.session_token=test-session"],
      ])
    )
  ),
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "test-session" })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
