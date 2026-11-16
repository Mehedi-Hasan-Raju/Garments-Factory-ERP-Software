"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Factory,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import RoleGuard from "@/components/auth/role-guard";

import {
  useCreateProductionOrder,
  useProductionOrder,
  useProductionOrders,
  useProductionReferences,
  useUpdateProductionProgress,
  useUpdateProductionStatus,
} from "@/hooks/use-production-orders";

import type {
  ProductionOrder,
  ProductionOrderPayload,
  ProductionProgressPayload,
  ProductionStatus,
  ShipmentStatus,
} from "@/types/production-order";

const STATUS_FLOW: ProductionStatus[] = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "QC",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_STYLE: Record<ProductionStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  CUTTING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SEWING: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  QC: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  SHIPPED: "bg-[#E8F0DF] text-[#527C57] dark:bg-emerald-950 dark:text-emerald-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const SHIPMENT_STYLE: Record<ShipmentStatus, string> = {
  NOT_SHIPPED: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  READY: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PARTIALLY_SHIPPED: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  SHIPPED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/10";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B9B70] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#58865E] disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function quantity(value: string | number) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 3,
  });
}

function canChangeStatus(status: ProductionStatus) {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

function ProductionOrdersContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showProgress, setShowProgress] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [nextStatus, setNextStatus] = useState<ProductionStatus>("PENDING");

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search.trim() && { search: search.trim() }),
      ...(status && { status: status as ProductionStatus }),
    }),
    [page, search, status],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useProductionOrders(query);

  const { data: selectedOrder, isLoading: detailsLoading } =
    useProductionOrder(selectedId);

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  const createMutation = useCreateProductionOrder();
  const progressMutation = useUpdateProductionProgress();
  const statusMutation = useUpdateProductionStatus();

  const openStatusDialog = (order: ProductionOrder) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status);

    const next = STATUS_FLOW[currentIndex + 1];

    if (!next) {
      toast.error("No further status transition is available.");
      return;
    }

    setNextStatus(next);
    setSelectedId(order.id);
    setShowStatus(true);
  };

  const submitStatus = async () => {
    if (!selectedId) return;

    try {
      await statusMutation.mutateAsync({
        id: selectedId,
        status: nextStatus,
      });

      toast.success(`Production status changed to ${nextStatus}.`);
      setShowStatus(false);
      setSelectedId(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update status.",
      );
    }
  };

  const submitProgress = async (
    payload: ProductionProgressPayload,
  ) => {
    if (!selectedId) return;

    try {
      await progressMutation.mutateAsync({
        id: selectedId,
        payload,
      });

      toast.success("Production progress updated successfully.");
      setShowProgress(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update production progress.",
      );
    }
  };

  const handleCreate = async (payload: ProductionOrderPayload) => {
    try {
      await createMutation.mutateAsync(payload);

      toast.success("Production order created successfully.");
      setShowCreate(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to create production order.",
      );
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6B9B70]">
              <Factory size={17} />
              Garments Factory ERP
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              Production Orders
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage factory orders, production quantities and workflow.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={buttonClass}
            >
              <Plus size={17} />
              Create Production Order
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Production Orders
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {total.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-[#E8F0DF] p-3 text-[#6B9B70] dark:bg-emerald-950 dark:text-emerald-300">
                <Factory size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Records on Current Page
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {orders.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5EFE0] p-3 text-[#B28A3E] dark:bg-amber-950 dark:text-amber-300">
                <Activity size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <div>
              <label className={labelClass}>Search Orders</label>
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Order number, style, buyer, product..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Production Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className={inputClass}
              >
                <option value="">All Statuses</option>
                {[
                  ...STATUS_FLOW,
                  "CANCELLED",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted md:w-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Production Order List
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                View production orders and manage their progress.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {total.toLocaleString()} orders found
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
            <div className="p-12 text-center">
              <p className="font-medium text-red-600">
                Failed to load production orders.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 rounded-lg bg-[#6B9B70] px-4 py-2 text-sm text-white"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Factory
                size={38}
                className="mx-auto text-gray-300"
              />
              <h3 className="mt-3 font-semibold text-foreground">
                No production orders found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a production order or change your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Buying House / Buyer</th>
                      <th className="px-5 py-4">Product / Style</th>
                      <th className="px-5 py-4">Quantity</th>
                      <th className="px-5 py-4">Production Status</th>
                      <th className="px-5 py-4">Shipment</th>
                      <th className="px-5 py-4">Delivery Date</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-muted/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(order.orderDate)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {order.buyingHouse?.name || "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.buyer?.name || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {order.product?.name || "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.styleNumber}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium text-foreground">
                          {quantity(order.orderQuantity)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[order.status]}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SHIPMENT_STYLE[order.shipmentStatus]}`}
                          >
                            {order.shipmentStatus.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {formatDate(order.deliveryDate)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(order.id)}
                              title="View details"
                              className="rounded-lg border border-border p-2 text-muted-foreground hover:border-[#6B9B70] hover:text-[#6B9B70] dark:hover:text-emerald-300"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              disabled={!canChangeStatus(order.status)}
                              onClick={() => openStatusDialog(order)}
                              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-[#6B9B70] hover:text-[#6B9B70] disabled:opacity-40 dark:hover:text-emerald-300"
                            >
                              Next Status
                            </button>

                            <button
                              type="button"
                              disabled={
                                order.status === "DELIVERED" ||
                                order.status === "CANCELLED"
                              }
                              onClick={() => {
                                setSelectedId(order.id);
                                setShowProgress(true);
                              }}
                              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-[#6B9B70] hover:text-[#6B9B70] disabled:opacity-40 dark:hover:text-emerald-300"
                            >
                              Progress
                            </button>
                          </div>
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
                  {total} total orders
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((value) => value - 1)}
                    className="rounded-lg border border-border p-2 text-muted-foreground disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages ||
                      totalPages === 0 ||
                      isFetching
                    }
                    onClick={() => setPage((value) => value + 1)}
                    className="rounded-lg border border-border p-2 text-muted-foreground disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <ProductionOrderForm
          loading={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Details Modal */}
      {selectedId && !showProgress && !showStatus && (
        <ProductionOrderDetails
          order={selectedOrder}
          loading={detailsLoading}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Progress Modal */}
      {showProgress && selectedId && (
        <ProductionProgressForm
          order={selectedOrder}
          loading={detailsLoading || progressMutation.isPending}
          onClose={() => setShowProgress(false)}
          onSubmit={submitProgress}
        />
      )}

      {/* Status Confirmation */}
      {showStatus && selectedId && (
        <ConfirmStatusDialog
          nextStatus={nextStatus}
          loading={statusMutation.isPending}
          onClose={() => {
            setShowStatus(false);
            setSelectedId(null);
          }}
          onConfirm={submitStatus}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------
   CREATE PRODUCTION ORDER
------------------------------------------------------- */

function ProductionOrderForm({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductionOrderPayload) => Promise<void>;
}) {
  const { data: references, isLoading, isError } =
    useProductionReferences();

  const [form, setForm] = useState({
    orderNumber: "",
    buyingHouseId: "",
    buyerId: "",
    productId: "",
    styleNumber: "",
    designImageUrl: "",
    orderQuantity: "",
    fabricRequirement: "0",
    fabricRequirementUnit: "KG",
    targetPrice: "",
    currency: "BDT",
    paymentTerms: "",
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    notes: "",
  });

  const [formError, setFormError] = useState("");

  const buyers =
    references?.buyers.filter(
      (buyer) => buyer.buyingHouseId === form.buyingHouseId,
    ) ?? [];

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "buyingHouseId" ? { buyerId: "" } : {}),
    }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.orderNumber.trim() ||
      !form.buyingHouseId ||
      !form.buyerId ||
      !form.productId ||
      !form.styleNumber.trim() ||
      !form.orderQuantity ||
      !form.targetPrice ||
      !form.deliveryDate
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (
      form.orderDate &&
      form.deliveryDate < form.orderDate
    ) {
      setFormError("Delivery date cannot be before order date.");
      return;
    }

    const payload: ProductionOrderPayload = {
      orderNumber: form.orderNumber.trim(),
      buyingHouseId: form.buyingHouseId,
      buyerId: form.buyerId,
      productId: form.productId,
      styleNumber: form.styleNumber.trim(),
      designImageUrl: form.designImageUrl.trim() || null,
      orderQuantity: Number(form.orderQuantity),
      fabricRequirement: Number(form.fabricRequirement || 0),
      fabricRequirementUnit: form.fabricRequirementUnit.trim(),
      targetPrice: Number(form.targetPrice),
      currency: form.currency.trim().toUpperCase(),
      paymentTerms: form.paymentTerms.trim() || null,
      orderDate: new Date(form.orderDate).toISOString(),
      deliveryDate: new Date(form.deliveryDate).toISOString(),
      notes: form.notes.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <Modal title="Create Production Order" onClose={onClose}>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading buying houses, buyers and products...
        </div>
      ) : isError || !references ? (
        <div className="p-8 text-center text-sm text-red-600">
          Failed to load reference data. Check Buying House, Buyer and Product APIs.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order Number *">
              <input
                value={form.orderNumber}
                onChange={(e) => update("orderNumber", e.target.value)}
                className={inputClass}
                placeholder="PO-2026-001"
                required
              />
            </Field>

            <Field label="Style Number *">
              <input
                value={form.styleNumber}
                onChange={(e) => update("styleNumber", e.target.value)}
                className={inputClass}
                placeholder="STYLE-001"
                required
              />
            </Field>

            <Field label="Buying House *">
              <select
                value={form.buyingHouseId}
                onChange={(e) => update("buyingHouseId", e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select Buying House</option>
                {references.buyingHouses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Buyer *">
              <select
                value={form.buyerId}
                onChange={(e) => update("buyerId", e.target.value)}
                className={inputClass}
                disabled={!form.buyingHouseId}
                required
              >
                <option value="">Select Buyer</option>
                {buyers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.buyerCode})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Product *">
              <select
                value={form.productId}
                onChange={(e) => update("productId", e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select Product</option>
                {references.products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Design Image URL">
              <input
                type="url"
                value={form.designImageUrl}
                onChange={(e) => update("designImageUrl", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </Field>

            <Field label="Order Quantity *">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={form.orderQuantity}
                onChange={(e) => update("orderQuantity", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Fabric Requirement">
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.fabricRequirement}
                onChange={(e) =>
                  update("fabricRequirement", e.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Fabric Unit">
              <input
                value={form.fabricRequirementUnit}
                onChange={(e) =>
                  update("fabricRequirementUnit", e.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Target Price *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.targetPrice}
                onChange={(e) => update("targetPrice", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Currency">
              <input
                maxLength={3}
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Order Date">
              <input
                type="date"
                value={form.orderDate}
                onChange={(e) => update("orderDate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Delivery Date *">
              <input
                type="date"
                min={form.orderDate}
                value={form.deliveryDate}
                onChange={(e) => update("deliveryDate", e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          </div>

          <Field label="Payment Terms">
            <textarea
              value={form.paymentTerms}
              onChange={(e) => update("paymentTerms", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className={inputClass}
              rows={3}
            />
          </Field>

          {formError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={buttonClass}
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------
   PRODUCTION ORDER DETAILS
------------------------------------------------------- */

function ProductionOrderDetails({
  order,
  loading,
  onClose,
}: {
  order?: ProductionOrder;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal title="Production Order Details" onClose={onClose}>
      {loading || !order ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading production order...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {order.orderNumber}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[order.status]}`}
            >
              {order.status}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Buying House" value={order.buyingHouse?.name} />
            <Info label="Buyer" value={order.buyer?.name} />
            <Info label="Product" value={order.product?.name} />
            <Info label="SKU" value={order.product?.sku} />
            <Info label="Style Number" value={order.styleNumber} />
            <Info label="Order Quantity" value={quantity(order.orderQuantity)} />
            <Info
              label="Fabric Requirement"
              value={`${quantity(order.fabricRequirement)} ${order.fabricRequirementUnit}`}
            />
            <Info
              label="Target Price"
              value={`${order.currency} ${quantity(order.targetPrice)}`}
            />
            <Info
              label="Order Value"
              value={`${order.currency} ${quantity(order.orderValue)}`}
            />
            <Info label="Order Date" value={formatDate(order.orderDate)} />
            <Info label="Delivery Date" value={formatDate(order.deliveryDate)} />
            <Info
              label="Shipment Status"
              value={order.shipmentStatus.replaceAll("_", " ")}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Production Progress
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Info
                label="Cutting"
                value={quantity(order.cuttingQuantity)}
              />
              <Info
                label="Sewing"
                value={quantity(order.sewingQuantity)}
              />
              <Info
                label="Rejected"
                value={quantity(order.rejectedQuantity)}
              />
              <Info
                label="Finished Goods"
                value={quantity(order.finishedGoodsQuantity)}
              />
            </div>
          </div>

          {order.designImageUrl && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Design Image
              </h3>
              <img
                src={order.designImageUrl}
                alt={`Design for ${order.orderNumber}`}
                className="max-h-64 rounded-lg border border-border object-contain"
              />
            </div>
          )}

          {order.notes && (
            <Info label="Notes" value={order.notes} />
          )}
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------
   PRODUCTION PROGRESS FORM
------------------------------------------------------- */

function ProductionProgressForm({
  order,
  loading,
  onClose,
  onSubmit,
}: {
  order?: ProductionOrder;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductionProgressPayload) => Promise<void>;
}) {
  const [cutting, setCutting] = useState("");
  const [sewing, setSewing] = useState("");
  const [rejected, setRejected] = useState("");
  const [finished, setFinished] = useState("");
  const [error, setError] = useState("");

  if (!order) {
    return (
      <Modal title="Update Production Progress" onClose={onClose}>
        <p className="p-8 text-center text-sm text-muted-foreground">
          Loading order details...
        </p>
      </Modal>
    );
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const payload: ProductionProgressPayload = {
      ...(cutting !== "" && { cuttingQuantity: Number(cutting) }),
      ...(sewing !== "" && { sewingQuantity: Number(sewing) }),
      ...(rejected !== "" && { rejectedQuantity: Number(rejected) }),
      ...(finished !== "" && {
        finishedGoodsQuantity: Number(finished),
      }),
    };

    if (Object.keys(payload).length === 0) {
      setError("Enter at least one production quantity.");
      return;
    }

    const cuttingValue = Number(
      cutting === "" ? order.cuttingQuantity : cutting,
    );
    const sewingValue = Number(
      sewing === "" ? order.sewingQuantity : sewing,
    );
    const rejectedValue = Number(
      rejected === "" ? order.rejectedQuantity : rejected,
    );
    const finishedValue = Number(
      finished === "" ? order.finishedGoodsQuantity : finished,
    );

    if (cuttingValue > Number(order.orderQuantity)) {
      setError("Cutting quantity cannot exceed order quantity.");
      return;
    }

    if (sewingValue > cuttingValue) {
      setError("Sewing quantity cannot exceed cutting quantity.");
      return;
    }

    if (rejectedValue > sewingValue) {
      setError("Rejected quantity cannot exceed sewing quantity.");
      return;
    }

    if (finishedValue > sewingValue - rejectedValue) {
      setError(
        "Finished goods cannot exceed accepted sewing quantity.",
      );
      return;
    }

    await onSubmit(payload);
  };

  return (
    <Modal title="Update Production Progress" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Production Order</p>
          <p className="mt-1 font-semibold text-foreground">
            {order.orderNumber} · {order.styleNumber}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Order quantity: {quantity(order.orderQuantity)}
          </p>
        </div>

        <Field label="Cutting Quantity">
          <input
            type="number"
            min="0"
            step="0.001"
            value={cutting}
            onChange={(e) => setCutting(e.target.value)}
            placeholder={order.cuttingQuantity}
            className={inputClass}
          />
        </Field>

        <Field label="Sewing Quantity">
          <input
            type="number"
            min="0"
            step="0.001"
            value={sewing}
            onChange={(e) => setSewing(e.target.value)}
            placeholder={order.sewingQuantity}
            className={inputClass}
          />
        </Field>

        <Field label="Rejected Quantity">
          <input
            type="number"
            min="0"
            step="0.001"
            value={rejected}
            onChange={(e) => setRejected(e.target.value)}
            placeholder={order.rejectedQuantity}
            className={inputClass}
          />
        </Field>

        <Field label="Finished Goods Quantity">
          <input
            type="number"
            min="0"
            step="0.001"
            value={finished}
            onChange={(e) => setFinished(e.target.value)}
            placeholder={order.finishedGoodsQuantity}
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>

          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Updating..." : "Update Progress"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------
   STATUS CONFIRMATION
------------------------------------------------------- */

function ConfirmStatusDialog({
  nextStatus,
  loading,
  onClose,
  onConfirm,
}: {
  nextStatus: ProductionStatus;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Confirm Status Change" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Are you sure you want to move this production order to the
          following status?
        </p>

        <div className="rounded-xl bg-muted p-5 text-center">
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLE[nextStatus]}`}
          >
            {nextStatus}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          The backend will validate whether this transition is allowed.
          Required production quantities must already be recorded.
        </p>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={buttonClass}
          >
            {loading ? "Updating..." : "Confirm Change"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------
   SHARED UI HELPERS
------------------------------------------------------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="font-semibold text-foreground">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export default function ProductionOrdersPage() {
  return (
    <RoleGuard
      allowedRoles={[
        "OWNER",
        "ADMIN",
        "MANAGER",
        "ACCOUNTANT",
        "STOREKEEPER",
      ]}
    >
      <ProductionOrdersContent />
    </RoleGuard>
  );
}