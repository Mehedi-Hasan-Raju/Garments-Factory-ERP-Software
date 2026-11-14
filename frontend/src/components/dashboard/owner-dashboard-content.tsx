
"use client";

import { useState } from "react";
import {
  Users,
  Package,
  Warehouse,
  ClipboardList,
  ShoppingCart,
  Truck,
  RefreshCw,
  AlertTriangle,
  Boxes,
} from "lucide-react";

import { useOwnerDashboard } from "@/hooks/use-dashboard";
import type { DashboardRange } from "@/types/dashboard";
import OwnerDashboardCharts, {
  STATUS_COLORS,
} from "@/components/dashboard/owner-dashboard-charts";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const stats = [
  {
    key: "products",
    label: "Total Products",
    icon: Package,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "stock",
    label: "Stock Available",
    icon: Boxes,
    iconClass: "bg-sky-50 text-sky-600",
  },
  {
    key: "orders",
    label: "Total Orders",
    icon: ClipboardList,
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    key: "employees",
    label: "Total Employees",
    icon: Users,
    iconClass: "bg-violet-50 text-violet-600",
  },
] as const;

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof AlertTriangle;
  iconClass: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-slate-800 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
          {label}
        </p>
        <p className="mt-1 truncate text-[10px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
    CUTTING: "bg-sky-50 text-sky-700 ring-sky-600/20",
    SEWING: "bg-violet-50 text-violet-700 ring-violet-600/20",
    QC: "bg-orange-50 text-orange-700 ring-orange-600/20",
    SHIPPED: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
    CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
        styles[normalized] ??
        "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function OwnerDashboardContent() {
  const [range, setRange] = useState<DashboardRange>("30d");

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useOwnerDashboard({
    range,
    recentLimit: 5,
  });

  if (isPending) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-52 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-800 dark:text-white">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  const dashboard = data.data;

  const values: Record<(typeof stats)[number]["key"], string> = {
    products: formatNumber(dashboard.inventory.productCount),
    stock: formatNumber(
      Number(dashboard.inventory.totalStockQuantity) || 0,
    ),
    orders: formatNumber(dashboard.production.totalOrders),
    employees: formatNumber(dashboard.employees.total),
  };

  const summaryCards = [
    {
      label: "Low Stock Products",
      value: formatNumber(dashboard.inventory.lowStockCount),
      description: "Below stock threshold",
      icon: AlertTriangle,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Warehouses",
      value: formatNumber(dashboard.inventory.warehouseCount),
      description: "Registered warehouses",
      icon: Warehouse,
      iconClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Recent Shipments",
      value: formatNumber(dashboard.shipments.total),
      description: "Total shipment records",
      icon: Truck,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pending Purchase Orders",
      value: formatNumber(dashboard.purchasing.pendingApproval),
      description: "Awaiting approval",
      icon: ShoppingCart,
      iconClass: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400">
            GARMENTS ERP / OVERVIEW
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-2xl">
            Inventory Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track stock, orders and factory performance at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(event) =>
              setRange(event.target.value as DashboardRange)
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Dashboard date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.key}
              className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <Icon className="size-[17px]" />
                </div>
              </div>

              <p className="mt-5 text-2xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-[28px]">
                {values[stat.key]}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Current system records
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <OwnerDashboardCharts dashboard={dashboard} />

      {/* Operational status */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
              Factory Operations
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current production workflow status
            </p>
          </div>
          <span className="text-[10px] text-slate-400">
            {formatNumber(dashboard.production.totalOrders)} total orders
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(dashboard.production.byStatus ?? {}).map(
            ([status, count], index) => (
              <div
                key={status}
                className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">
                    {status.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[index % STATUS_COLORS.length],
                    }}
                  />
                </div>
                <p className="mt-2 text-xl font-bold text-slate-800 dark:text-white">
                  {formatNumber(count)}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Recent production orders */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
              Recent Production Orders
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest production orders from your factory
            </p>
          </div>
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-500 dark:bg-slate-800">
            Latest {dashboard.recent.productionOrders.length} records
          </span>
        </div>

        {dashboard.recent.productionOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No recent production orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Buying House</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Style</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Delivery Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dashboard.recent.productionOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-600">
                      #{order.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                      {order.buyingHouse.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                      {order.product.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {order.styleNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-slate-700 dark:text-slate-200">
                      {formatNumber(order.orderQuantity)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-[10px] text-slate-400">
            Showing {dashboard.recent.productionOrders.length} recent production orders
          </p>
        </div>
      </section>

      {/* Bottom summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-[10px] text-slate-400">
        <span>Garments ERP · Owner Dashboard</span>
        <span>
          Updated: {new Date(data.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
