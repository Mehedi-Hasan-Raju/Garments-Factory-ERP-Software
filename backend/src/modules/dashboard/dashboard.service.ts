import { AppError } from "../../lib/app-error.js";
import { dashboardRepository } from "./dashboard.repository.js";
import type { DashboardQuery } from "./dashboard.validation.js";

const rangeToDays = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

class DashboardService {
  async getOverview(user: {
    id: string;
    role: { code: string };
  }, query: DashboardQuery) {
    const options = {
      since: new Date(Date.now() - rangeToDays[query.range] * 24 * 60 * 60 * 1000),
      recentLimit: query.recentLimit,
    };

    let dashboard: unknown;

    switch (user.role.code) {
      case "OWNER":
        dashboard = await dashboardRepository.getOwnerDashboard(user.id, options);
        break;
      case "ADMIN":
        dashboard = await dashboardRepository.getAdminDashboard(user.id, options);
        break;
      case "MANAGER":
        dashboard = await dashboardRepository.getManagerDashboard(user.id, options);
        break;
      case "EMPLOYEE":
        dashboard = await dashboardRepository.getEmployeeDashboard(
          user.id,
          options
        );
        break;
      case "ACCOUNTANT":
        dashboard = await dashboardRepository.getAccountantDashboard(user.id, options);
        break;
      case "STOREKEEPER":
        dashboard = await dashboardRepository.getStorekeeperDashboard(user.id, options);
        break;
      default:
        throw new AppError("Dashboard is not available for this role.", 403);
    }

    return {
      role: user.role.code,
      generatedAt: new Date().toISOString(),
      range: query.range,
      data: dashboard,
    };
  }
}

export const dashboardService = new DashboardService();
