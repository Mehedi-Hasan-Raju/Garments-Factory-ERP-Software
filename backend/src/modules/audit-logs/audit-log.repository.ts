import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { AuditLogQuery } from "./audit-log.validation.js";

class AuditLogRepository {
  async findAll(query: AuditLogQuery) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.module && { module: query.module }),
      ...(query.action && { action: query.action }),
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.fromDate || query.toDate ? {
        createdAt: {
          ...(query.fromDate && { gte: query.fromDate }),
          ...(query.toDate && { lte: query.toDate }),
        },
      } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return {
      logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  findById(id: string) {
    return prisma.auditLog.findUnique({ where: { id } });
  }
}

export const auditLogRepository = new AuditLogRepository();
