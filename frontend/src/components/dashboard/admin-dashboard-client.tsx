"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ClipboardList,
  Factory,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import RoleGuard from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAdminDashboard } from "@/hooks/use-dashboard";

import type {
  DashboardRange,
  DashboardQuery,
} from "@/types/dashboard";

const initialQuery: DashboardQuery = {
  range: "30d",
  recentLimit: 5,
};

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "green",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  color?: "green" | "amber" | "purple" | "orange" | "neutral";
}) {
  const colors = {
    green: "bg-[#E8F0DF] text-[#557D5B]",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className={`rounded-lg p-3 ${colors[color]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

function AdminDashboardContent() {
  const [query, setQuery] = useState<DashboardQuery>(initialQuery);

  const { data, isLoading, isError, refetch, isFetching } =
    useAdminDashboard(query);

  const dashboard = data?.data;

  const updateRange = (range: DashboardRange) => {
    setQuery((previous) => ({
      ...previous,
      range,
    }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F7F8F3] p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-white" />
        </div>
      </main>
    );
  }

  if (isError || !dashboard) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F7F8F3] p-6">
        <div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto text-red-500" size={36} />

          <h2 className="mt-4 text-lg font-semibold">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while retrieving dashboard information.
          </p>

          <button
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#6B9B70] px-4 py-2 text-sm font-medium text-white hover:bg-[#557D5B]"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const {
    managers,
    employees,
    departments,
    warehouses,
    products,
    inventory,
    purchasing,
    production,
    recent,
    notifications,
  } = dashboard;
  const workforceData = [
    { label: "Active managers", value: managers.active },
    { label: "Total employees", value: employees.total },
    { label: "Active employees", value: employees.active },
    { label: "Departments", value: departments.active },
    { label: "Warehouses", value: warehouses.active },
  ];
  const employeeStatusData = [
    { name: "Active", value: employees.active, color: "#6B9B70" },
    {
      name: "Inactive",
      value: Math.max(employees.total - employees.active, 0),
      color: "#CBD5E1",
    },
  ];
  const stockRecordCount = Math.max(inventory.stockRecordCount, 0);
  const lowStockCount = Math.min(
    Math.max(inventory.lowStockCount, 0),
    stockRecordCount,
  );
  const inventoryData = [
    { label: "Active products", value: products.active },
    { label: "Stock records", value: stockRecordCount },
    { label: "Low stock records", value: lowStockCount },
    { label: "Warehouses", value: inventory.warehouseCount },
  ];
  const stockHealthData = [
    {
      name: "Healthy",
      value: stockRecordCount - lowStockCount,
      color: "#6B9B70",
    },
    { name: "Low stock", value: lowStockCount, color: "#D9A441" },
  ];

  return (
    <main className="min-h-screen bg-[#F7F8F3] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-[#6B9B70]">
              Garments Factory ERP
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor factory operations, inventory and workforce.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={query.range}
              onChange={(event) =>
                updateRange(event.target.value as DashboardRange)
              }
              className="h-10 rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#6B9B70]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Workforce & Infrastructure */}
        <section className="space-y-4">
          <SectionTitle
            title="Workforce & Infrastructure"
            description="Overview of factory workforce and operational resources."
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel
              title="Workforce & Infrastructure"
              description="Headcount and active operational resources."
            >
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workforceData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={122}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatNumber(Number(value)),
                        "People / locations",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#6B9B70"
                      radius={[0, 5, 5, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel
              title="Employee Status"
              description="Active and inactive employees."
            >
              {employees.total === 0 ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  No employee data available.
                </div>
              ) : (
                <div className="relative mt-2 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={employeeStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={66}
                        outerRadius={96}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {employeeStatusData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatNumber(Number(value)),
                          "Employees",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                    <span className="text-2xl font-bold">
                      {formatNumber(employees.total)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Employees
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-5">
                    {employeeStatusData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}: {formatNumber(item.value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartPanel>
          </div>
        </section>

        {/* Inventory */}
        <section className="space-y-4">
          <SectionTitle
            title="Inventory Overview"
            description="Current stock and product availability across warehouses."
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel
              title="Inventory Overview"
              description={`Total stock quantity: ${formatNumber(
                Number(inventory.totalStockQuantity) || 0,
              )}`}
            >
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={122}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatNumber(Number(value)),
                        "Records",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#6B9B70"
                      radius={[0, 5, 5, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel
              title="Stock Health"
              description="Stock records grouped by availability."
            >
              {stockRecordCount === 0 ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  No stock records available.
                </div>
              ) : (
                <div className="relative mt-2 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockHealthData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={66}
                        outerRadius={96}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {stockHealthData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatNumber(Number(value)),
                          "Stock records",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                    <span className="text-2xl font-bold">
                      {formatNumber(stockRecordCount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stock records
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-5">
                    {stockHealthData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}: {formatNumber(item.value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartPanel>
          </div>
        </section>

        {/* Purchasing & Production */}
        <section className="space-y-4">
          <SectionTitle
            title="Purchasing & Production"
            description="Monitor purchase orders and active production operations."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Purchase Orders"
              value={purchasing.totalPurchaseOrders}
              description="All purchase orders"
              icon={ShoppingCart}
            />

            <StatCard
              title="Pending Approvals"
              value={purchasing.pendingApproval}
              description="Purchase orders awaiting approval"
              icon={ClipboardList}
              color="amber"
            />

            <StatCard
              title="Active Production Orders"
              value={production.activeOrders}
              description="Currently active production orders"
              icon={Factory}
              color="purple"
            />
          </div>
        </section>

        {/* Recent Production Orders */}
        <section className="space-y-4">
          <SectionTitle
            title="Recent Production Orders"
            description="Recently created production orders within the selected period."
          />

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {recent.productionOrders.length === 0 ? (
              <div className="p-10 text-center">
                <Factory
                  className="mx-auto text-muted-foreground"
                  size={32}
                />
                <p className="mt-3 text-sm font-medium">
                  No production orders found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No recent production activity for this period.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b bg-[#F7F8F3] text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Order</th>
                      <th className="px-5 py-4 font-semibold">Product</th>
                      <th className="px-5 py-4 font-semibold">Buying House</th>
                      <th className="px-5 py-4 font-semibold">Quantity</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Delivery Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {recent.productionOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.styleNumber}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">{order.product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.product.sku}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {order.buyingHouse.name}
                        </td>

                        <td className="px-5 py-4 font-medium tabular-nums">
                          {order.orderQuantity.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-[#E8F0DF] px-3 py-1 text-xs font-medium text-[#557D5B]">
                            {order.status.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle
              title="Recent Notifications"
              description="Latest system notifications for your account."
            />

            <Link
              href="/dashboard/notifications"
              className="text-sm font-medium text-[#6B9B70] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#E8F0DF] p-2.5 text-[#557D5B]">
                  <Bell size={20} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Notification Center
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recent account activity
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {notifications.unreadCount} unread
              </span>
            </div>

            {notifications.recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Activity
                  className="mx-auto text-muted-foreground"
                  size={28}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  No recent notifications
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-5 ${
                      !notification.isRead ? "bg-[#F7F8F3]/70" : ""
                    }`}
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#6B9B70]" />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="shrink-0 text-xs font-medium text-[#6B9B70] hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <p>Garments Factory ERP · Admin Overview</p>
          <p>
            Updated:{" "}
            {data.generatedAt
              ? new Date(data.generatedAt).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardShell>
        <AdminDashboardContent />
      </DashboardShell>
    </RoleGuard>
  );
}