"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardOverview,
  type DashboardRange,
} from "@/services/dashboard.service";

export function useDashboard(range: DashboardRange = "30d") {
  return useQuery({
    queryKey: ["dashboard", "overview", range],
    queryFn: () => getDashboardOverview(range, 8),
    staleTime: 60 * 1000,
    retry: false,
  });
}