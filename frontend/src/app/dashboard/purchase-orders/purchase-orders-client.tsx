"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  PackageCheck,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import {
  usePurchaseOrders,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
} from "@/hooks/use-purchase-orders";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { PurchaseOrderStatus } from "@/types/purchase-order";

type ActionType = "submit" | "approve" | "cancel";

const purchaseOrderStatuses: PurchaseOrderStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
];

const statusStyles: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-100 text-green-800",
  PARTIALLY_RECEIVED: "bg-emerald-50 text-emerald-700",
  RECEIVED: "bg-green-200 text-green-900",
  CANCELLED: "bg-red-50 text-red-700",
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const isOwner = user?.role.code === "OWNER";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{
    type: ActionType;
    id: string;
    poNumber: string;
  } | null>(null);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      page,
      limit: 10,
    }),
    [search, status, page],
  );

  const { data, isLoading, isError, refetch } =
    usePurchaseOrders(query);

  const submitMutation = useSubmitPurchaseOrder();
  const approveMutation = useApprovePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();

  const rows = data?.purchaseOrders ?? [];
  const pagination = data?.pagination;

  const actionLoading =
    submitMutation.isPending ||
    approveMutation.isPending ||
    cancelMutation.isPending;

  async function handleConfirm() {
    if (!action) return;

    try {
      if (action.type === "submit") {
        await submitMutation.mutateAsync(action.id);
        toast.success("Purchase order submitted successfully");
      }

      if (action.type === "approve") {
        await approveMutation.mutateAsync(action.id);
        toast.success("Purchase order approved successfully");
      }

      if (action.type === "cancel") {
        await cancelMutation.mutateAsync(action.id);
        toast.success("Purchase order cancelled successfully");
      }

      setAction(null);
    } catch {
      toast.error("Unable to complete the action. Please try again.");
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage supplier purchases and incoming materials.
          </p>
        </div>

        {isOwner && (
          <Link
            href="/dashboard/purchase-orders/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B9B70] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#58845D]"
          >
            <Plus size={17} />
            Create Purchase Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Orders"
          value={pagination?.total ?? rows.length}
          icon={<ShoppingCart size={20} />}
        />
        <SummaryCard
          label="Current Page"
          value={page}
          icon={<PackageCheck size={20} />}
        />
        <SummaryCard
          label="Page Count"
          value={pagination?.totalPages ?? 1}
          icon={<CheckCircle size={20} />}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search PO number..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-[#6B9B70] dark:border-gray-700"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PurchaseOrderStatus | "");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">All Statuses</option>
            {purchaseOrderStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading purchase orders...
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">
              Failed to load purchase orders.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm font-medium text-[#6B9B70]"
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart
              size={32}
              className="mx-auto mb-3 text-gray-400"
            />
            <p className="font-medium text-gray-800 dark:text-white">
              No purchase orders found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create a purchase order to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                    <th className="px-3 py-3">PO Number</th>
                    <th className="px-3 py-3">Supplier</th>
                    <th className="px-3 py-3">Warehouse</th>
                    <th className="px-3 py-3">Order Date</th>
                    <th className="px-3 py-3">Total Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                    >
                      <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">
                        {po.poNumber}
                      </td>
                      <td className="px-3 py-4">
                        {po.supplier?.supplierName ?? "—"}
                      </td>
                      <td className="px-3 py-4">
                        {po.warehouse?.name ?? "—"}
                      </td>
                      <td className="px-3 py-4">
                        {formatDate(po.orderDate)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatMoney(po.totalAmount)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[po.status] ?? statusStyles.DRAFT
                          }`}
                        >
                          {statusLabels[po.status] ?? po.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            title="View details"
                            onClick={() =>
                              router.push(
                                `/dashboard/purchase-orders/${po.id}`,
                              )
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          {isOwner && po.status === "DRAFT" && (
                            <>
                              <ActionButton
                                title="Edit"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/purchase-orders/${po.id}/edit`,
                                  )
                                }
                              >
                                <Pencil size={16} />
                              </ActionButton>

                              <ActionButton
                                title="Submit for approval"
                                onClick={() =>
                                  setAction({
                                    type: "submit",
                                    id: po.id,
                                    poNumber: po.poNumber,
                                  })
                                }
                              >
                                <Send size={16} />
                              </ActionButton>
                            </>
                          )}

                          {isOwner &&
                            po.status === "PENDING_APPROVAL" && (
                              <ActionButton
                                title="Approve"
                                onClick={() =>
                                  setAction({
                                    type: "approve",
                                    id: po.id,
                                    poNumber: po.poNumber,
                                  })
                                }
                              >
                                <CheckCircle size={16} />
                              </ActionButton>
                            )}

                          {isOwner &&
                            ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(
                              po.status,
                            ) && (
                              <ActionButton
                                title="Cancel"
                                onClick={() =>
                                  setAction({
                                    type: "cancel",
                                    id: po.id,
                                    poNumber: po.poNumber,
                                  })
                                }
                              >
                                <XCircle size={16} />
                              </ActionButton>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-xs text-gray-500">
                Page {pagination?.page ?? page} of{" "}
                {pagination?.totalPages ?? 1}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border p-2 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  disabled={
                    page >= (pagination?.totalPages ?? 1)
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border p-2 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(action)}
        title={
          action?.type === "submit"
            ? "Submit Purchase Order?"
            : action?.type === "approve"
              ? "Approve Purchase Order?"
              : "Cancel Purchase Order?"
        }
        description={
          action
            ? `Are you sure you want to ${action.type} ${action.poNumber}?`
            : ""
        }
        confirmText={
          action?.type === "submit"
            ? "Submit"
            : action?.type === "approve"
              ? "Approve"
              : "Cancel Order"
        }
        variant={action?.type === "cancel" ? "danger" : "warning"}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-[#6B9B70]">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-md p-2 text-gray-500 transition hover:bg-green-50 hover:text-[#58845D] dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString();
}

function formatMoney(value: string | number) {
  return `৳${Number(value).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}