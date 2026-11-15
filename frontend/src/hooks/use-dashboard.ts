"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

import type {
  AdminDashboardData,
  DashboardQuery,
  OwnerDashboardData,
} from "@/types/dashboard";

export const DASHBOARD_QUERY_KEY = ["dashboard"];

export function useOwnerDashboard(query: DashboardQuery) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "OWNER", query],
    queryFn: () =>
      dashboardService.getOverview<OwnerDashboardData>(query),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useAdminDashboard(query: DashboardQuery) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "ADMIN", query],
    queryFn: () =>
      dashboardService.getOverview<AdminDashboardData>(query),
    staleTime: 60 * 1000,
    retry: 1,
  });
}