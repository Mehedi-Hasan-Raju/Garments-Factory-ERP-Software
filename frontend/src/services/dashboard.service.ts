import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  DashboardOverview,
} from "@/types/dashboard";

export type DashboardRange = "7d" | "30d" | "90d";

export async function getDashboardOverview(
  range: DashboardRange = "30d",
  recentLimit = 5,
): Promise<DashboardOverview> {
  const response = await apiClient.get<
    ApiResponse<DashboardOverview>
  >("/dashboard/overview", {
    params: {
      range,
      recentLimit,
    },
  });

  return response.data.data;
}