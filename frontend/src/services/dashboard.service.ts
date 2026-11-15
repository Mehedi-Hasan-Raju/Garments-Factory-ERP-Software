import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  DashboardOverviewResponse,
  DashboardQuery,
} from "@/types/dashboard";

export const dashboardService = {
  async getOverview<T>(query: DashboardQuery) {
    const response = await apiClient.get<
      ApiResponse<DashboardOverviewResponse<T>>
    >("/dashboard/overview", {
      params: query,
    });

    return response.data.data;
  },
};