import { apiClient } from "@/lib/api-client";

import type {
  AuditLog,
  AuditLogQuery,
  AuditLogListResponse,
  AuditLogDetailsResponse,
} from "@/types/audit-log";

export const auditLogService = {
  async getAll(query: AuditLogQuery) {
    const response = await apiClient.get<AuditLogListResponse>(
      "/audit-logs",
      {
        params: query,
      },
    );

    return response.data;
  },

  async getById(id: string): Promise<AuditLog> {
    const response = await apiClient.get<AuditLogDetailsResponse>(
      `/audit-logs/${id}`,
    );

    return response.data.data;
  },
};