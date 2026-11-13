import {
  apiClient,
  initializeCsrfToken,
} from "@/lib/api-client";

import type {
  ApiResponse,
  AuthUser,
  LoginInput,
  LoginResponse,
  CurrentUserResponse,
} from "@/types/auth";

export const authService = {
  async login(input: LoginInput): Promise<AuthUser> {
    await initializeCsrfToken();

    const response = await apiClient.post<
      ApiResponse<LoginResponse>
    >("/auth/login", input);

    return response.data.data.user;
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<
      ApiResponse<CurrentUserResponse>
    >("/auth/me");

    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async refresh(): Promise<void> {
    await initializeCsrfToken();

    await apiClient.post("/auth/refresh");
  },
};