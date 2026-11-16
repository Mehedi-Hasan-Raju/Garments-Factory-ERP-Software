
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

export const STATUS_COLORS = [
  "#6B9B70", // Green
  "#D9A441", // Amber
  "#527D57", // Forest green
  "#D97757", // Orange
  "#C75C5C", // Red
  "#91A68A", // Sage
  "#87958A", // Muted sage
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatQuantity = (value: string) => {
  const number = Number(value);

  return Number.isFinite(number) ? formatNumber(number) : value;
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
      className={`min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function OwnerDashboardCharts({
  dashboard,
}: {
  dashboard: OwnerDashboardData;
}) {
  // Production orders by status
  const totalOrders = dashboard.production.totalOrders;

  const productionData = Object.entries(
    dashboard.production.byStatus ?? {},
  ).map(([status, count]) => ({
    status: status.replaceAll("_", " "),
    count,
  }));

  // Production quantities
  const productionQuantityData = [
    {
      stage: "Cutting",
      quantity: Number(dashboard.production.cuttingQuantity) || 0,
      color: "#6B9B70",
    },
    {
      stage: "Sewing",
      quantity: Number(dashboard.production.sewingQuantity) || 0,
      color: "#527D57",
    },
    {
      stage: "Rejected",
      quantity: Number(dashboard.production.rejectedQuantity) || 0,
      color: "#D9A441",
    },
  ];

  // Inventory stock health
  const stockRecords = dashboard.inventory.stockRecordCount;
  const lowStock = dashboard.inventory.lowStockCount;

  const healthyStock = Math.max(stockRecords - lowStock, 0);

  // Recent stock movements
  const stockMovements = dashboard.recent.stockMovements ?? [];

  return (
    <div className="space-y-5">
      {/* Production analytics */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Production Overview"
          description="Production orders grouped by current workflow status"
        >
          {productionData.length === 0 ? (
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
                          STATUS_COLORS[index % STATUS_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      "Orders",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                <span className="text-2xl font-bold text-foreground">
                  {formatNumber(totalOrders)}
                </span>

                <span className="text-[11px] text-muted-foreground">
                  Total orders
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {productionData.map((item, index) => (
                  <div
                    key={item.status}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[index % STATUS_COLORS.length],
                      }}
                    />

                    <span className="capitalize">{item.status}</span>

                    <span className="font-semibold text-foreground">
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
          description="Cutting, sewing and rejected production quantities"
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
                    stroke="var(--border)"
                    strokeDasharray="3 5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--popover-foreground)",
                    }}
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
                      <Cell key={item.stage} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Inventory analytics */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Inventory Stock Health"
          description="Healthy stock records compared with low-stock records"
        >
          {stockRecords === 0 ? (
            <EmptyChart message="No inventory records available." />
          ) : (
            <div className="flex min-h-[230px] flex-col justify-center gap-7 px-1 sm:px-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground/80">
                    Healthy stock
                  </span>

                  <span className="font-semibold text-foreground">
                    {formatNumber(healthyStock)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#6B9B70]"
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
                  <span className="font-medium text-foreground/80">
                    Low stock
                  </span>

                  <span className="font-semibold text-foreground">
                    {formatNumber(lowStock)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#D9A441]"
                    style={{
                      width: `${Math.min(
                        (lowStock / stockRecords) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">
                  Total stock records
                </span>

                <span className="font-semibold text-foreground">
                  {formatNumber(stockRecords)}
                </span>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Recent Stock Movements"
          description="Latest inventory movement records"
        >
          {stockMovements.length === 0 ? (
            <EmptyChart message="No recent stock movements found." />
          ) : (
            <div className="space-y-0">
              {stockMovements.slice(0, 5).map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {movement.product.name}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {movement.movementNo} ·{" "}
                      {movement.type.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">
                      {formatQuantity(movement.quantity)}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
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
