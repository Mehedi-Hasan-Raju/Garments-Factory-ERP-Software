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
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
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
    <main className="min-h-screen bg-[#F7F8F3] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6B9B70]">
              <ShieldCheck size={17} />
              Garments Factory ERP
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor and review system activities performed by users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Audit Records
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {total.toLocaleString()}
                </h2>
              </div>

              <div className="rounded-xl bg-[#E8F0DF] p-3 text-[#6B9B70]">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Current Page Records
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {logs.length}
                </h2>
              </div>

              <div className="rounded-xl bg-[#F5EFE0] p-3 text-[#B28A3E]">
                <FileSearch size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#6B9B70]" />
              <h2 className="font-semibold text-gray-900">
                Filter Audit Logs
              </h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-[#6B9B70] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Module
              </label>
              <input
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. users, products"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value as AuditAction | "");
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6B9B70]"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Actor ID
              </label>
              <input
                value={actorId}
                onChange={(e) => {
                  setActorId(e.target.value);
                  setPage(1);
                }}
                placeholder="User UUID"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#6B9B70]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#6B9B70]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#6B9B70]"
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Activity History
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest activities appear first.
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {total.toLocaleString()} records found
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-red-600">
                Failed to load audit logs.
              </p>
              <p className="mt-1 text-sm text-gray-500">
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
              <h3 className="mt-3 font-semibold text-gray-800">
                No audit records found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no activities matching your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-[#F7F8F3] text-xs uppercase text-gray-500">
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

                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log: AuditLog) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-[#F7F8F3]/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {log.actorEmail || "Unknown user"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
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

                        <td className="px-5 py-4 font-medium capitalize text-gray-700">
                          {log.module}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            {log.method}
                          </span>
                        </td>

                        <td className="max-w-36 truncate px-5 py-4 text-xs text-gray-500">
                          {log.resourceId || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedId(log.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#6B9B70] hover:text-[#6B9B70]"
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {Math.max(totalPages, 1)}
                  {" · "}
                  {total} total records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages || isFetching || totalPages === 0
                    }
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Audit Log Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Complete record information
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-3">
                  <div className="h-8 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 animate-pulse rounded bg-gray-100" />
                  <div className="h-32 animate-pulse rounded bg-gray-100" />
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
                        className="rounded-lg bg-[#F7F8F3] p-3"
                      >
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="mt-1 break-all text-sm font-medium text-gray-800">
                          {value ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      Request Path
                    </h3>
                    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300">
                      {selectedLog.path}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      Request Data
                    </h3>
                    <pre className="max-h-72 overflow-auto rounded-lg bg-gray-900 p-4 text-xs leading-6 text-gray-100">
                      {selectedLog.requestData
                        ? JSON.stringify(selectedLog.requestData, null, 2)
                        : "No request data available."}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      User Agent
                    </h3>
                    <p className="break-all rounded-lg bg-[#F7F8F3] p-3 text-xs text-gray-600">
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