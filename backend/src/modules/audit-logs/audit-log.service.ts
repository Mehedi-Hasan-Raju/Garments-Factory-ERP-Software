import { AppError } from "../../lib/app-error.js";
import { auditLogRepository } from "./audit-log.repository.js";
import type { AuditLogQuery } from "./audit-log.validation.js";

export const auditLogService = {
  findAll(query: AuditLogQuery) {
    return auditLogRepository.findAll(query);
  },

  async findById(id: string) {
    const log = await auditLogRepository.findById(id);
    if (!log) throw new AppError("Audit log not found", 404);
    return log;
  },
};
