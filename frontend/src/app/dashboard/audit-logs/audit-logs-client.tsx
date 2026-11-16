"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSearch,
  Filter,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import RoleGuard from "@/components/auth/role-guard";

import { useAuditLog, useAuditLogs } from "@/hooks/use-audit-logs";

import type {
  AuditAction,
  AuditLog,
  AuditLogQuery,
} from "@/types/audit-log";

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  UPDATE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const LIMIT = 20;

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditLogContent() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [actorId, setActorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useMemo<AuditLogQuery>(
    () => ({
      page,
      limit: LIMIT,
      ...(module.trim() && { module: module.trim() }),
      ...(action && { action }),
      ...(actorId.trim() && { actorId: actorId.trim() }),
      ...(fromDate && {
        fromDate: new Date(fromDate).toISOString(),
      }),
      ...(toDate && {
        toDate: new Date(
          `${toDate}T23:59:59.999`,
        ).toISOString(),
      }),
    }),
    [page, module, action, actorId, fromDate, toDate],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAuditLogs(query);

  const {
    data: selectedLog,
    isLoading: detailsLoading,
    isError: detailsError,
  } = useAuditLog(selectedId);

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  const resetFilters = () => {
    setModule("");
    setAction("");
    setActorId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasFilters =
    Boolean(module || action || actorId || fromDate || toDate);

  const closeDetails = () => setSelectedId(null);

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6B9B70]">
              <ShieldCheck size={17} />
              Garments Factory ERP
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor and review system activities performed by users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Audit Records
                </p>
                <h2 className="mt-2 text-3xl font-bold text-foreground">
                  {total.toLocaleString()}
                </h2>
              </div>

              <div className="rounded-xl bg-[#E8F0DF] p-3 text-[#6B9B70] dark:bg-emerald-950 dark:text-emerald-300">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Current Page Records
                </p>
                <h2 className="mt-2 text-3xl font-bold text-foreground">
                  {logs.length}
                </h2>
              </div>

              <div className="rounded-xl bg-[#F5EFE0] p-3 text-[#B28A3E] dark:bg-amber-950 dark:text-amber-300">
                <FileSearch size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#6B9B70]" />
              <h2 className="font-semibold text-foreground">
                Filter Audit Logs
              </h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-[#6B9B70] hover:underline dark:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Module
              </label>
              <input
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. users, products"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value as AuditAction | "");
                  setPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70]"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Actor ID
              </label>
              <input
                value={actorId}
                onChange={(e) => {
                  setActorId(e.target.value);
                  setPage(1);
                }}
                placeholder="User UUID"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70]"
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Activity History
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest activities appear first.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {total.toLocaleString()} records found
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-red-600">
                Failed to load audit logs.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as Error)?.message || "Something went wrong."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-lg bg-[#6B9B70] px-4 py-2 text-sm text-white hover:bg-[#58865E]"
              >
                Try again
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileSearch className="mx-auto text-gray-300" size={38} />
              <h3 className="mt-3 font-semibold text-foreground">
                No audit records found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no activities matching your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Actor</th>
                      <th className="px-5 py-4 font-semibold">Action</th>
                      <th className="px-5 py-4 font-semibold">Module</th>
                      <th className="px-5 py-4 font-semibold">Method</th>
                      <th className="px-5 py-4 font-semibold">Resource ID</th>
                      <th className="px-5 py-4 font-semibold">Date & Time</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {logs.map((log: AuditLog) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-muted/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {log.actorEmail || "Unknown user"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.actorRole || "Unknown role"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLES[log.action]}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-medium capitalize text-foreground">
                          {log.module}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {log.method}
                          </span>
                        </td>

                        <td className="max-w-36 truncate px-5 py-4 text-xs text-muted-foreground">
                          {log.resourceId || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedId(log.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-[#6B9B70] hover:text-[#6B9B70] dark:hover:text-emerald-300"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.max(totalPages, 1)}
                  {" · "}
                  {total} total records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages || isFetching || totalPages === 0
                    }
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Details Modal */}
      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeDetails}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  Audit Log Details
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete record information
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-3">
                  <div className="h-8 animate-pulse rounded bg-muted" />
                  <div className="h-8 animate-pulse rounded bg-muted" />
                  <div className="h-32 animate-pulse rounded bg-muted" />
                </div>
              ) : detailsError || !selectedLog ? (
                <p className="text-sm text-red-600">
                  Failed to load audit log details.
                </p>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Actor Email", selectedLog.actorEmail],
                      ["Actor Role", selectedLog.actorRole],
                      ["Action", selectedLog.action],
                      ["Module", selectedLog.module],
                      ["HTTP Method", selectedLog.method],
                      ["Status Code", selectedLog.statusCode],
                      ["Resource ID", selectedLog.resourceId],
                      ["IP Address", selectedLog.ipAddress],
                      ["Date", formatDate(selectedLog.createdAt)],
                      ["Actor ID", selectedLog.actorId],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-muted p-3"
                      >
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                          {value ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      Request Path
                    </h3>
                    <pre className="overflow-x-auto rounded-lg bg-[#17251E] p-4 text-xs text-green-300">
                      {selectedLog.path}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      Request Data
                    </h3>
                    <pre className="max-h-72 overflow-auto rounded-lg bg-[#17251E] p-4 text-xs leading-6 text-gray-100">
                      {selectedLog.requestData
                        ? JSON.stringify(selectedLog.requestData, null, 2)
                        : "No request data available."}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      User Agent
                    </h3>
                    <p className="break-all rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      {selectedLog.userAgent || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AuditLogsPage() {
  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <AuditLogContent />
    </RoleGuard>
  );
}