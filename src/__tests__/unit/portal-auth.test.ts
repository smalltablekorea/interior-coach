import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before importing
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInnerJoin = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: (cond: unknown) => ({
          limit: (n: number) => Promise.resolve([]),
        }),
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    }),
  },
}));

describe("portal-auth", () => {
  describe("validatePortalToken", () => {
    it("should export validatePortalToken function", async () => {
      const mod = await import("@/lib/portal-auth");
      expect(typeof mod.validatePortalToken).toBe("function");
    });

    it("should return invalid for empty token", async () => {
      const { validatePortalToken } = await import("@/lib/portal-auth");
      const result = await validatePortalToken("");
      expect(result.valid).toBe(false);
    });
  });
});
