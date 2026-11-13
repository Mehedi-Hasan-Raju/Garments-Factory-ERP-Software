import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const sensitiveKey = /(password|token|secret|authorization|cookie|credential|api.?key)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 2000 ? `${value.slice(0, 2000)}...[TRUNCATED]` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 50).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? "[REDACTED]" : sanitize(item, depth + 1),
      ]),
    );
  }
  return String(value);
}

export function attachAuditTrail(req: Request, res: Response): void {
  if (res.locals.auditTrailAttached) return;
  res.locals.auditTrailAttached = true;

  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;

  const path = req.originalUrl.split("?")[0].slice(0, 500);
  const segments = path.split("/").filter(Boolean);
  const moduleName = (segments[2] ?? "unknown").slice(0, 100);
  if (["notifications", "audit-logs"].includes(moduleName)) return;

  const actor = req.authUser;
  if (!actor) return;

  const body = sanitize(req.body);
  const requestData = body && typeof body === "object"
    ? (body as Prisma.InputJsonValue)
    : undefined;
  const params = req.params as Record<string, string | undefined>;
  const resourceId = (params.id ?? (req.body as Record<string, unknown> | undefined)?.id);
  const userAgent = req.get("user-agent");

  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    void prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role.code,
        action: method === "POST" ? "CREATE" : method === "DELETE" ? "DELETE" : "UPDATE",
        module: moduleName,
        method,
        path,
        resourceId: resourceId ? String(resourceId).slice(0, 100) : null,
        statusCode: res.statusCode,
        ipAddress: req.ip?.slice(0, 45),
        userAgent: userAgent?.slice(0, 1000),
        ...(requestData !== undefined ? { requestData } : {}),
      },
    }).catch((error: unknown) => {
      console.error("[audit-trail] Failed to write audit log:", error);
    });
  });
}
