export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type Category =
  | "dashboard"
  | "customers"
  | "sites"
  | "estimates"
  | "contracts"
  | "construction"
  | "schedule"
  | "materials"
  | "workers"
  | "expenses"
  | "marketing"
  | "settlement"
  | "tax"
  | "settings";

export type Action = "read" | "write" | "delete" | "admin";

// Role hierarchy (higher index = more permission)
const ROLE_HIERARCHY: WorkspaceRole[] = ["viewer", "member", "manager", "admin", "owner"];

// Category access matrix: which roles can do what
const PERMISSION_MATRIX: Record<Category, Record<Action, WorkspaceRole>> = {
  dashboard:     { read: "viewer",  write: "member",  delete: "admin",  admin: "owner" },
  customers:     { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  sites:         { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  estimates:     { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  contracts:     { read: "viewer",  write: "manager", delete: "admin",  admin: "admin" },
  construction:  { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  schedule:      { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  materials:     { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  workers:       { read: "viewer",  write: "manager", delete: "admin",  admin: "admin" },
  expenses:      { read: "viewer",  write: "member",  delete: "manager", admin: "admin" },
  marketing:     { read: "member",  write: "manager", delete: "admin",  admin: "admin" },
  settlement:    { read: "manager", write: "admin",   delete: "admin",  admin: "owner" },
  tax:           { read: "manager", write: "admin",   delete: "admin",  admin: "owner" },
  settings:      { read: "admin",   write: "admin",   delete: "owner",  admin: "owner" },
};

export function getRoleLevel(role: WorkspaceRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function isRoleAtLeast(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function checkPermission(
  role: WorkspaceRole,
  category: Category,
  action: Action = "read"
): boolean {
  // admin, owner는 모든 카테고리·액션 무조건 허용
  if (role === "admin" || role === "owner") return true;

  const matrix = PERMISSION_MATRIX[category];
  if (!matrix) return false;
  const requiredRole = matrix[action];
  if (!requiredRole) return false;
  return isRoleAtLeast(role, requiredRole);
}

export function getAccessibleCategories(role: WorkspaceRole): Category[] {
  return (Object.keys(PERMISSION_MATRIX) as Category[]).filter(
    (cat) => checkPermission(role, cat, "read")
  );
}

// Map nav paths to categories
export function pathToCategory(pathname: string): Category | null {
  const map: Record<string, Category> = {
    "/dashboard": "dashboard",
    "/customers": "customers",
    "/sites": "sites",
    "/estimates": "estimates",
    "/contracts": "contracts",
    "/construction": "construction",
    "/schedule": "schedule",
    "/materials": "materials",
    "/workers": "workers",
    "/expenses": "expenses",
    "/marketing": "marketing",
    "/settlement": "settlement",
    "/tax": "tax",
    "/settings": "settings",
  };
  for (const [prefix, cat] of Object.entries(map)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return cat;
  }
  return null;
}
