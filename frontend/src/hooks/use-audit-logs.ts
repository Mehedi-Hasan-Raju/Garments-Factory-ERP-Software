"use client";

import { useQuery } from "@tanstack/react-query";

import { auditLogService } from "@/services/audit-log.service";
import type { AuditLogQuery } from "@/types/audit-log";

export const AUDIT_LOG_QUERY_KEY = ["audit-logs"];

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: [...AUDIT_LOG_QUERY_KEY, query],

    queryFn: () => auditLogService.getAll(query),

    staleTime: 30 * 1000,

    placeholderData: (previousData) => previousData,

    retry: 1,
  });
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: [...AUDIT_LOG_QUERY_KEY, "details", id],

    queryFn: () => auditLogService.getById(id!),

    enabled: Boolean(id),

    staleTime: 60 * 1000,

    retry: 1,
  });
}