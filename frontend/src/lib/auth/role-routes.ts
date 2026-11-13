import type { UserRole } from "@/types/auth";

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  OWNER: "/owner/dashboard",
  ADMIN: "/admin/dashboard",
  MANAGER: "/manager/dashboard",
  ACCOUNTANT: "/accountant/dashboard",
  STOREKEEPER: "/storekeeper/dashboard",
  EMPLOYEE: "/employee/dashboard",
};

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role] ?? "/login";
}