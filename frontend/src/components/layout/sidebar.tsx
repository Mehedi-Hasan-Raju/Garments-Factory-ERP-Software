"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowDownUp,
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Package,
  PackageSearch,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        available: true,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Inventory", href: "/dashboard/inventory", icon: Package, available: false },
      { label: "Warehouse", href: "/dashboard/warehouse", icon: Warehouse, available: false },
      { label: "Stock Movement", href: "/dashboard/stock-movement", icon: ArrowDownUp, available: false },
      { label: "Procurement", href: "/dashboard/procurement", icon: ShoppingCart, available: false },
      { label: "Production", href: "/dashboard/production", icon: Factory, available: false },
      { label: "Quality Control", href: "/dashboard/quality-control", icon: ClipboardList, available: false },
      { label: "Finished Goods", href: "/dashboard/finished-goods", icon: Boxes, available: false },
      { label: "Shipments", href: "/dashboard/shipments", icon: Truck, available: false },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Suppliers", href: "/dashboard/suppliers", icon: Building2, available: false },
      { label: "Buying Houses", href: "/dashboard/buying-houses", icon: PackageSearch, available: false },
      { label: "Employees", href: "/dashboard/employees", icon: Users, available: false },
    ],
  },
  {
    title: "FINANCE & REPORTS",
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: Wallet, available: false },
      { label: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3, available: false },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Activity Logs", href: "/dashboard/activity-logs", icon: Activity, available: false },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, available: false },
    ],
  },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col
          border-r border-sidebar-border bg-sidebar text-sidebar-foreground
          transition-all duration-300
          lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0
          ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Factory size={20} />
            </div>

            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="whitespace-nowrap text-sm font-bold tracking-tight">
                Garments ERP
              </p>
              <p className="text-[10px] text-muted-foreground">
                FACTORY MANAGEMENT
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-sidebar-accent lg:hidden"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:flex"
          >
            <ChevronLeft
              size={17}
              className={collapsed ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
            <div key={group.title}>
              <p
                className={`mb-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground ${
                  collapsed ? "lg:hidden" : ""
                }`}
              >
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  const content = (
                    <>
                      <Icon size={18} className="shrink-0" />
                      <span className={`flex-1 truncate text-[13px] ${collapsed ? "lg:hidden" : ""}`}>
                        {item.label}
                      </span>
                      {!item.available && !collapsed && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </>
                  );

                  const className = `
                    group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left
                    transition-colors
                    ${
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                    ${!item.available ? "cursor-not-allowed opacity-60" : ""}
                  `;

                  return item.available ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={className}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={item.href}
                      title={collapsed ? `${item.label} — Coming soon` : "Coming soon"}
                      aria-disabled="true"
                      className={className}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-sidebar-accent/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Factory size={16} />
              </div>
              <div className={collapsed ? "lg:hidden" : ""}>
                <p className="text-xs font-semibold">Factory Workspace</p>
                <p className="text-[10px] text-muted-foreground">ERP System</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
