
"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, Pencil, Shirt, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";
import {
  useSewingEntries,
  useCreateSewing,
  useUpdateSewing,
} from "@/hooks/use-sewing";
import type {
  SewingEntry,
  SewingQueryParams,
  CreateSewingInput,
} from "@/types/sewing";

const formSchema = z.object({
  sewingNumber: z.string().trim().min(1, "Enter a sewing number"),
  productionOrderId: z.string().uuid("Select a production order"),
  sewingDate: z.string().min(1, "Select a sewing date"),
  sewingLine: z.string().optional(),
  sewingQuantity: z.coerce.number().positive("Quantity must be greater than 0"),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface ProductionOrderOption {
  id: string;
  orderNumber: string;
  styleNumber: string | null;
  status: string;
  orderQuantity: number | string;
  cuttingQuantity: number | string;
  sewingQuantity: number | string;
}

interface ProductionOrderListResponse {
  success: boolean;
  data: ProductionOrderOption[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const today = new Date().toISOString().slice(0, 10);

function numberValue(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function getErrorMessage(error: unknown) {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return (
    err.response?.data?.message ??
    err.message ??
    "Something went wrong. Please try again."
  );
}

export default function SewingClient() {
  const { user } = useAuth();
  const role = user?.role?.code;
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role ?? "");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SewingEntry | null>(null);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const params: SewingQueryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [page, search, fromDate, toDate],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSewingEntries(params);

  const createMutation = useCreateSewing();
  const updateMutation = useUpdateSewing();

  const ordersQuery = useQuery({
    queryKey: ["production-orders", "sewing-options"],
    queryFn: async () => {
      const response = await apiClient.get<ProductionOrderListResponse>(
        "/production-orders",
        { params: { page: 1, limit: 100 } },
      );
      return response.data;
    },
    enabled: canManage && dialogOpen,
  });

  const eligibleOrders = (ordersQuery.data?.data ?? []).filter((order) =>
    ["CUTTING", "SEWING"].includes(order.status),
  );

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sewingNumber: "",
      productionOrderId: "",
      sewingDate: today,
      sewingLine: "",
      sewingQuantity: 0,
      notes: "",
    },
  });

  function openCreateDialog() {
    setEditingEntry(null);
    form.reset({
      sewingNumber: "",
      productionOrderId: "",
      sewingDate: today,
      sewingLine: "",
      sewingQuantity: 0,
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(entry: SewingEntry) {
    setEditingEntry(entry);
    form.reset({
      sewingNumber: entry.sewingNumber,
      productionOrderId: entry.productionOrderId,
      sewingDate: entry.sewingDate.slice(0, 10),
      sewingLine: entry.sewingLine ?? "",
      sewingQuantity: numberValue(entry.sewingQuantity),
      notes: entry.notes ?? "",
    });
    setDialogOpen(true);
  }

  function requestSubmit(values: FormValues) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    if (!pendingValues) return;

    try {
      if (editingEntry) {
        await updateMutation.mutateAsync({
          id: editingEntry.id,
          data: {
            sewingDate: pendingValues.sewingDate,
            sewingLine: pendingValues.sewingLine || null,
            sewingQuantity: pendingValues.sewingQuantity,
            notes: pendingValues.notes || null,
          },
        });
        toast.success("Sewing entry updated successfully");
      } else {
        const payload: CreateSewingInput = {
          sewingNumber: pendingValues.sewingNumber,
          productionOrderId: pendingValues.productionOrderId,
          sewingDate: pendingValues.sewingDate,
          sewingLine: pendingValues.sewingLine || null,
          sewingQuantity: pendingValues.sewingQuantity,
          notes: pendingValues.notes || null,
        };
        await createMutation.mutateAsync(payload);
        toast.success("Sewing entry created successfully");
      }

      setConfirmOpen(false);
      setDialogOpen(false);
      setPendingValues(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  const totalSewing = entries.reduce(
    (sum, entry) => sum + numberValue(entry.sewingQuantity),
    0,
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Shirt className="h-6 w-6 text-[#6B9B70]" />
            <h1 className="text-2xl font-semibold text-foreground">Sewing</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track sewing production by order and sewing line.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B9B70] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#58865e]"
          >
            <Plus size={17} /> New Sewing Entry
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Entries on this page" value={entries.length} />
        <StatCard title="Sewing quantity on this page" value={totalSewing.toLocaleString()} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              placeholder="Search sewing no, order no, style, line..."
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[#6B9B70]"
            />
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setPage(1);
              setFromDate(event.target.value);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#6B9B70]"
            aria-label="From date"
          />

          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => {
              setPage(1);
              setToDate(event.target.value);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#6B9B70]"
            aria-label="To date"
          />

          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold text-foreground">Sewing Records</h2>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#6B9B70] dark:hover:text-emerald-300"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
            <button onClick={() => refetch()} className="mt-3 text-sm font-medium text-[#6B9B70]">
              Try again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center">
            <Shirt className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No sewing entries found</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a sewing entry or change your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Sewing No.</th>
                  <th className="px-4 py-3">Production Order</th>
                  <th className="px-4 py-3">Style</th>
                  <th className="px-4 py-3">Sewing Line</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Sewing Qty</th>
                  {canManage && <th className="px-4 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/70">
                    <td className="px-4 py-3 font-medium text-foreground">{entry.sewingNumber}</td>
                    <td className="px-4 py-3">{entry.productionOrder?.orderNumber ?? "—"}</td>
                    <td className="px-4 py-3">{entry.productionOrder?.styleNumber ?? "—"}</td>
                    <td className="px-4 py-3">{entry.sewingLine || "—"}</td>
                    <td className="px-4 py-3">{formatDate(entry.sewingDate)}</td>
                    <td className="px-4 py-3 font-medium">{numberValue(entry.sewingQuantity).toLocaleString()}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditDialog(entry)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-[#e8f0df] hover:text-[#527e57] dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                          aria-label={`Edit ${entry.sewingNumber}`}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card text-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  {editingEntry ? "Edit Sewing Entry" : "Create Sewing Entry"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Enter sewing production details.</p>
              </div>
              <button onClick={() => setDialogOpen(false)} className="text-2xl text-muted-foreground hover:text-foreground" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={form.handleSubmit(requestSubmit)} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Sewing Number" error={form.formState.errors.sewingNumber?.message}>
                  <input
                    {...form.register("sewingNumber")}
                    disabled={Boolean(editingEntry)}
                    placeholder="e.g. SEW-001"
                    className="field"
                  />
                </FormField>

                <FormField label="Production Order" error={form.formState.errors.productionOrderId?.message}>
                  <select
                    {...form.register("productionOrderId")}
                    disabled={Boolean(editingEntry)}
                    className="field"
                  >
                    <option value="">Select production order</option>
                    {eligibleOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} · {order.styleNumber ?? "No style"} · {order.status}
                      </option>
                    ))}
                  </select>
                  {ordersQuery.isLoading && <small className="text-muted-foreground">Loading orders...</small>}
                  {ordersQuery.isError && <small className="text-red-500">Could not load production orders.</small>}
                  {!ordersQuery.isLoading && eligibleOrders.length === 0 && (
                    <small className="text-amber-600">No eligible production orders available.</small>
                  )}
                </FormField>

                <FormField label="Sewing Date" error={form.formState.errors.sewingDate?.message}>
                  <input type="date" {...form.register("sewingDate")} className="field" />
                </FormField>

                <FormField label="Sewing Quantity" error={form.formState.errors.sewingQuantity?.message}>
                  <input type="number" min="0.01" step="any" {...form.register("sewingQuantity")} className="field" />
                </FormField>

                <FormField label="Sewing Line" error={form.formState.errors.sewingLine?.message}>
                  <input {...form.register("sewingLine")} placeholder="e.g. Line A" className="field" />
                </FormField>
              </div>

              <FormField label="Notes" error={form.formState.errors.notes?.message}>
                <textarea {...form.register("notes")} rows={3} placeholder="Optional notes..." className="field" />
              </FormField>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-lg bg-[#6B9B70] px-5 py-2 text-sm font-medium text-white hover:bg-[#58865e] disabled:opacity-50"
                >
                  Review & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && pendingValues && (
        <ConfirmDialog
          title={editingEntry ? "Confirm sewing update" : "Confirm new sewing entry"}
          description={
            editingEntry
              ? "Are you sure you want to update this sewing entry?"
              : `Create sewing entry ${pendingValues.sewingNumber} with quantity ${pendingValues.sewingQuantity}?`
          }
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmSubmit}
        />
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-500">{error}</span>}
    </label>
  );
}

function ConfirmDialog({
  title,
  description,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-foreground shadow-xl">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
            Back
          </button>
          <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-[#6B9B70] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {loading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
