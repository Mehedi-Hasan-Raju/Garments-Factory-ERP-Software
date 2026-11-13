"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const productionStatusData = [
  { name: "Pending", value: 12, color: "var(--chart-3)" },
  { name: "Cutting", value: 18, color: "var(--chart-1)" },
  { name: "Sewing", value: 25, color: "var(--chart-2)" },
  { name: "QC", value: 10, color: "var(--chart-4)" },
  { name: "Completed", value: 20, color: "var(--chart-5)" },
  { name: "Shipped", value: 10, color: "var(--primary)" },
  { name: "Delivered", value: 5, color: "var(--muted-foreground)" },
];

const monthlyProductionData = [
  { month: "Jan", orders: 18, completed: 12 },
  { month: "Feb", orders: 22, completed: 16 },
  { month: "Mar", orders: 19, completed: 14 },
  { month: "Apr", orders: 28, completed: 21 },
  { month: "May", orders: 25, completed: 20 },
  { month: "Jun", orders: 32, completed: 26 },
  { month: "Jul", orders: 29, completed: 23 },
  { month: "Aug", orders: 35, completed: 29 },
  { month: "Sep", orders: 31, completed: 25 },
  { month: "Oct", orders: 38, completed: 32 },
  { month: "Nov", orders: 34, completed: 28 },
  { month: "Dec", orders: 42, completed: 36 },
];

const stockMovementData = [
  { month: "Jan", received: 420, issued: 310 },
  { month: "Feb", received: 500, issued: 390 },
  { month: "Mar", received: 460, issued: 350 },
  { month: "Apr", received: 620, issued: 480 },
  { month: "May", received: 580, issued: 440 },
  { month: "Jun", received: 700, issued: 560 },
];

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function ChartHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function PreviewLabel() {
  return (
    <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-600">
      Preview data
    </span>
  );
}

export function ProductionStatusChart() {
  const total = productionStatusData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartHeader
          title="Production Status"
          description="Distribution of production orders"
        />
        <PreviewLabel />
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_1fr]">
        <div className="relative h-[230px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productionStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
              >
                {productionStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-[10px] text-muted-foreground">
              Total orders
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {productionStatusData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-semibold tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MonthlyProductionChart() {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartHeader
          title="Production Performance"
          description="Monthly production orders vs completed orders"
        />
        <PreviewLabel />
      </div>

      <div className="mt-6 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyProductionData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            />
            <Bar
              dataKey="orders"
              name="Total Orders"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function StockMovementChart() {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartHeader
          title="Stock Movement"
          description="Monthly stock received and issued"
        />
        <PreviewLabel />
      </div>

      <div className="mt-6 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={stockMovementData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line
              type="monotone"
              dataKey="received"
              name="Stock Received"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="issued"
              name="Stock Issued"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
