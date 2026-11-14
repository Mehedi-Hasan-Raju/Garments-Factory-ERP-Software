
"use client";

import type { ReactNode } from "react";

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

import type { OwnerDashboardData } from "@/types/dashboard";

interface OwnerDashboardChartsProps {
  dashboard: OwnerDashboardData;
}

export const STATUS_COLORS = [
  "#16a34a",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#64748b",
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatQuantity = (value: string) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? formatNumber(number)
    : value;
};

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function MetricChartCard({
  title,
  description,
  value,
  unit,
  data,
  dataKey,
  nameKey,
  color,
}: {
  title: string;
  description: string;
  value: string;
  unit: string;
  data: Record<string, string | number>[];
  dataKey: string;
  nameKey: string;
  color: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {unit}
        </span>
      </div>

      <div className="h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 10, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 5"
              vertical={false}
            />

            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip
              formatter={(value) => [
                formatNumber(Number(value)),
                unit,
              ]}
            />

            <Bar
              dataKey={dataKey}
              name={unit}
              fill={color}
              radius={[7, 7, 0, 0]}
              maxBarSize={65}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400 dark:bg-slate-800/50">
      {message}
    </div>
  );
}

export default function OwnerDashboardCharts({
  dashboard,
}: OwnerDashboardChartsProps) {
  // Total products
  const productCount = dashboard.inventory.productCount;

  const productData = [
    {
      name: "Products",
      value: productCount,
    },
  ];

  // Total production orders and status breakdown
  const totalOrders = dashboard.production.totalOrders;

  const productionData = Object.entries(
    dashboard.production.byStatus ?? {},
  ).map(([status, count]) => ({
    status: status.replaceAll("_", " "),
    count,
  }));

  const orderChartData =
    productionData.length > 0
      ? productionData
      : totalOrders > 0
        ? [{ status: "Total Orders", count: totalOrders }]
        : [];

  // Available stock quantity
  const stockQuantity =
    Number(dashboard.inventory.totalStockQuantity) || 0;

  const stockData = [
    {
      name: "Available Stock",
      quantity: stockQuantity,
    },
  ];

  // Inventory stock health
  const stockRecords = dashboard.inventory.stockRecordCount;
  const lowStock = dashboard.inventory.lowStockCount;

  const healthyStock = Math.max(
    stockRecords - lowStock,
    0,
  );

  const inventoryData = [
    {
      name: "Healthy stock",
      value: healthyStock,
      color: "#16a34a",
    },
    {
      name: "Low stock",
      value: lowStock,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  // Production quantities
  const productionQuantityData = [
    {
      stage: "Cutting",
      quantity:
        Number(dashboard.production.cuttingQuantity) || 0,
      color: "#16a34a",
    },
    {
      stage: "Sewing",
      quantity:
        Number(dashboard.production.sewingQuantity) || 0,
      color: "#8b5cf6",
    },
    {
      stage: "Rejected",
      quantity:
        Number(dashboard.production.rejectedQuantity) || 0,
      color: "#f59e0b",
    },
  ];

  // Recent stock movements
  const stockMovements =
    dashboard.recent.stockMovements ?? [];

  return (
    <div className="space-y-5">

      {/* Main metric charts */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

        <MetricChartCard
          title="Total Products"
          description="Total registered products in inventory"
          value={formatNumber(productCount)}
          unit="Products"
          data={productData}
          dataKey="value"
          nameKey="name"
          color="#6366f1"
        />

        <MetricChartCard
          title="Total Orders"
          description="Production orders grouped by current status"
          value={formatNumber(totalOrders)}
          unit="Orders"
          data={orderChartData.map((item) => ({
            status: item.status,
            count: item.count,
          }))}
          dataKey="count"
          nameKey="status"
          color="#0ea5e9"
        />

        <MetricChartCard
          title="Available Stock"
          description="Total quantity currently recorded in inventory"
          value={formatQuantity(
            dashboard.inventory.totalStockQuantity,
          )}
          unit="Quantity"
          data={stockData}
          dataKey="quantity"
          nameKey="name"
          color="#14b8a6"
        />

      </div>

      {/* Production analytics */}
      <div className="grid gap-5 xl:grid-cols-2">

        <ChartCard
          title="Production Overview"
          description="Production orders by their current workflow status"
        >
          {totalOrders === 0 ? (
            <EmptyChart message="No production data available." />
          ) : (
            <div className="relative h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productionData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    innerRadius={66}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {productionData.map((item, index) => (
                      <Cell
                        key={item.status}
                        fill={
                          STATUS_COLORS[
                            index % STATUS_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      "Orders",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {formatNumber(totalOrders)}
                </span>

                <span className="text-[11px] text-slate-500">
                  Total orders
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {productionData.map((item, index) => (
                  <div
                    key={item.status}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[
                            index % STATUS_COLORS.length
                          ],
                      }}
                    />

                    <span className="capitalize">
                      {item.status}
                    </span>

                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Production Quantity"
          description="Recorded cutting, sewing and rejected quantities"
        >
          {productionQuantityData.every(
            (item) => item.quantity === 0,
          ) ? (
            <EmptyChart message="No production quantity data available." />
          ) : (
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productionQuantityData}
                  margin={{
                    top: 12,
                    right: 8,
                    left: -18,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      "Quantity",
                    ]}
                  />

                  <Bar
                    dataKey="quantity"
                    name="Quantity"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={54}
                  >
                    {productionQuantityData.map((item) => (
                      <Cell
                        key={item.stage}
                        fill={item.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

      </div>

      {/* Inventory and stock movement */}
      <div className="grid gap-5 xl:grid-cols-2">

        <ChartCard
          title="Inventory Stock Health"
          description="Low-stock records compared with other stock records"
        >
          {stockRecords === 0 ? (
            <EmptyChart message="No inventory records available." />
          ) : (
            <div className="flex min-h-[230px] flex-col justify-center gap-7 px-1 sm:px-5">

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Healthy stock
                  </span>

                  <span className="font-semibold text-slate-800 dark:text-white">
                    {formatNumber(healthyStock)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${Math.min(
                        (healthyStock / stockRecords) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Low stock
                  </span>

                  <span className="font-semibold text-slate-800 dark:text-white">
                    {formatNumber(lowStock)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min(
                        (lowStock / stockRecords) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <span className="text-slate-500">
                  Total stock records
                </span>

                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatNumber(stockRecords)}
                </span>
              </div>

            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Recent Stock Movements"
          description="Latest stock movement records from the backend"
        >
          {stockMovements.length === 0 ? (
            <EmptyChart message="No recent stock movements found." />
          ) : (
            <div className="space-y-0">
              {stockMovements.slice(0, 5).map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                      {movement.product.name}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {movement.movementNo} ·{" "}
                      {movement.type.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">
                      {formatQuantity(movement.quantity)}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(
                        movement.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
