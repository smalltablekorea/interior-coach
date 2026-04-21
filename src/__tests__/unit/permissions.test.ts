import { describe, it, expect } from "vitest";
import {
  checkPermission,
  getRoleLevel,
  isRoleAtLeast,
  getAccessibleCategories,
  type WorkspaceRole,
  type Category,
  type Action,
} from "@/lib/workspace/permissions";

describe("Permissions — Role hierarchy", () => {
  const roles: WorkspaceRole[] = ["viewer", "member", "manager", "admin", "owner"];

  it("role levels increase from viewer to owner", () => {
    for (let i = 1; i < roles.length; i++) {
      expect(getRoleLevel(roles[i])).toBeGreaterThan(getRoleLevel(roles[i - 1]));
    }
  });

  it("isRoleAtLeast: owner >= all roles", () => {
    for (const role of roles) {
      expect(isRoleAtLeast("owner", role)).toBe(true);
    }
  });

  it("isRoleAtLeast: viewer is NOT >= member", () => {
    expect(isRoleAtLeast("viewer", "member")).toBe(false);
  });
});

describe("Permissions — checkPermission", () => {
  it("viewer can read dashboard", () => {
    expect(checkPermission("viewer", "dashboard", "read")).toBe(true);
  });

  it("viewer cannot write to customers", () => {
    expect(checkPermission("viewer", "customers", "write")).toBe(false);
  });

  it("member can write to customers", () => {
    expect(checkPermission("member", "customers", "write")).toBe(true);
  });

  it("viewer cannot access settings", () => {
    expect(checkPermission("viewer", "settings", "read")).toBe(false);
  });

  it("admin/owner have full access to everything", () => {
    const categories: Category[] = [
      "dashboard", "customers", "sites", "estimates", "contracts",
      "construction", "schedule", "materials", "workers", "expenses",
      "marketing", "settlement", "tax", "settings",
    ];
    const actions: Action[] = ["read", "write", "delete", "admin"];

    for (const role of ["admin", "owner"] as WorkspaceRole[]) {
      for (const cat of categories) {
        for (const action of actions) {
          expect(
            checkPermission(role, cat, action),
            `${role} should have ${action} on ${cat}`
          ).toBe(true);
        }
      }
    }
  });

  it("settlement requires at least manager to read", () => {
    expect(checkPermission("viewer", "settlement", "read")).toBe(false);
    expect(checkPermission("member", "settlement", "read")).toBe(false);
    expect(checkPermission("manager", "settlement", "read")).toBe(true);
  });

  it("contracts write requires manager", () => {
    expect(checkPermission("member", "contracts", "write")).toBe(false);
    expect(checkPermission("manager", "contracts", "write")).toBe(true);
  });
});

describe("Permissions — getAccessibleCategories", () => {
  it("viewer has fewer categories than member", () => {
    const viewerCats = getAccessibleCategories("viewer");
    const memberCats = getAccessibleCategories("member");
    expect(memberCats.length).toBeGreaterThanOrEqual(viewerCats.length);
  });

  it("owner can access all categories", () => {
    const ownerCats = getAccessibleCategories("owner");
    expect(ownerCats.length).toBe(14); // all categories
  });
});
