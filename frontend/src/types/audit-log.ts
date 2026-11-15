export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: AuditAction;
  module: string;
  method: string;
  path: string;
  resourceId: string | null;
  statusCode: number;
  ipAddress: string | null;
  userAgent: string | null;
  requestData: Record<string, unknown> | unknown[] | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  module?: string;
  action?: AuditAction;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  pagination: AuditLogPagination;
}

export interface AuditLogDetailsResponse {
  success: boolean;
  message: string;
  data: AuditLog;
}