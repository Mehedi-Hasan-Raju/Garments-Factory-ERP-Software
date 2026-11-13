import type { Request, Response } from "express";
import { AppError } from "../../lib/app-error.js";
import { auditLogService } from "./audit-log.service.js";
import { auditLogIdSchema, auditLogQuerySchema } from "./audit-log.validation.js";

export const auditLogController = {
  async findAll(req: Request, res: Response) {
    const parsed = auditLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid audit log query", 400);
    }
    const result = await auditLogService.findAll(parsed.data);
    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result.logs,
      pagination: result.pagination,
    });
  },

  async findById(req: Request, res: Response) {
    const parsed = auditLogIdSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError("Invalid audit log ID", 400);
    const log = await auditLogService.findById(parsed.data.id);
    return res.status(200).json({
      success: true,
      message: "Audit log retrieved successfully",
      data: log,
    });
  },
};
