export type UserRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "STOREKEEPER"
  | "EMPLOYEE";

export interface AuthUser {
  id: string;
  email: string;
  status: string;
  role: {
    id: string;
    name: string;
    code: UserRole;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface CurrentUserResponse {
  user: AuthUser;
}