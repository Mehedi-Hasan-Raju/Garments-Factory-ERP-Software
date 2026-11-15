export type UserRoleCode =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "ACCOUNTANT"
  | "STOREKEEPER";

export type UserStatus = "ACTIVE" | "DISABLED" | "LOCKED";

export interface UserRole {
  id: string;
  name: string;
  code: UserRoleCode;
}

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  users: User[];
  pagination: UserPagination;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roleCode?: UserRoleCode | "";
  status?: UserStatus | "";
  sortBy?: "createdAt" | "email";
  sortOrder?: "asc" | "desc";
}

export interface CreateUserPayload {
  email: string;
  password: string;
  roleCode: Exclude<UserRoleCode, "OWNER">;
}