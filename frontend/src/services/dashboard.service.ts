import { apiClient } from "@/lib/api-client";

import type {
  ApiResponse,
  DashboardOverviewResponse,
  DashboardQuery,
  OwnerDashboardData,
} from "@/types/dashboard";

export const dashboardService = {
  async getOverview(query: DashboardQuery) {
    const response = await apiClient.get<
      ApiResponse<DashboardOverviewResponse<OwnerDashboardData>>
    >("/dashboard/overview", {
      params: query,
    });

    return response.data.data;
  },
};