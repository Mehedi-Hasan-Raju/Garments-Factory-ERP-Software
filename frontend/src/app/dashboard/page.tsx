
import {
  Activity,
  AlertTriangle,
  Boxes,
  Factory,
  Package,
  Users,
  Warehouse,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  MonthlyProductionChart,
  ProductionStatusChart,
  StockMovementChart,
} from "@/components/dashboard/dashboard-charts";

const stats = [
  {
    title: "Total Products",
    value: "—",
    description: "Active product records",
    icon: Package,
  },
  {
    title: "Total Employees",
    value: "—",
    description: "Factory workforce",
    icon: Users,
  },
  {
    title: "Warehouses",
    value: "—",
    description: "Active warehouses",
    icon: Warehouse,
  },
  {
    title: "Production Orders",
    value: "—",
    description: "Current production",
    icon: Factory,
  },
];

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard Overview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor your factory operations and business performance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Activity size={15} />
            Factory Workspace
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>

                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={19} />
                  </div>
                </div>

                <h2 className="mt-5 text-2xl font-bold tracking-tight">
                  {stat.value}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Analytics */}
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <ProductionStatusChart />
          </div>

          <div className="xl:col-span-2">
            <MonthlyProductionChart />
          </div>
        </div>

        {/* Stock Analytics */}
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <StockMovementChart />
          </div>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Inventory Alerts</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock requiring attention
                </p>
              </div>

              <AlertTriangle size={19} className="text-amber-500" />
            </div>

            <div className="mt-6 flex min-h-[210px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center">
              <Boxes size={30} className="text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                Inventory data not connected
              </p>
              <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                Low-stock alerts will appear here after API integration.
              </p>
            </div>
          </section>
        </div>

        {/* Recent Production */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Recent Production Orders</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest factory production activity
              </p>
            </div>
            <Factory size={19} className="text-muted-foreground" />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Order Number</th>
                  <th className="px-3 py-3 font-medium">Style</th>
                  <th className="px-3 py-3 font-medium">Buying House</th>
                  <th className="px-3 py-3 font-medium">Quantity</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    Production order API data will appear here.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
