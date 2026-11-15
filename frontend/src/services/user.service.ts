import { apiClient } from "@/lib/api-client";
import type {
  CreateUserPayload,
  GetUsersParams,
  User,
  UserListResponse,
  UserPagination,
} from "@/types/user";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedUsersResponse extends ApiResponse<User[]> {
  pagination: UserPagination;
}

export const userService = {
  async getUsers(params: GetUsersParams): Promise<UserListResponse> {
    const response = await apiClient.get<PaginatedUsersResponse>(
      "/users",
      {
        params,
      },
    );

    return {
      users: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createUser(payload: CreateUserPayload) {
    const response = await apiClient.post("/users", payload);

    return response.data;
  },
};