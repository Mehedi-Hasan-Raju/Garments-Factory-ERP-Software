import type { Request, Response } from "express";
import { AppError } from "../../lib/app-error.js";
import { dashboardQuerySchema } from "./dashboard.validation.js";
import { dashboardService } from "./dashboard.service.js";

class DashboardController {
  async getOverview(req: Request, res: Response) {
    if (!req.authUser) {
      throw new AppError("Authentication required.", 401);
    }

    const parsed = dashboardQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid dashboard query.",
        400
      );
    }

    const result = await dashboardService.getOverview(
      req.authUser,
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully.",
      data: result,
    });
  }
}

export const dashboardController = new DashboardController();
