"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const subscribeToYear = () => () => {};
const getCurrentYear = (): number | null =>
  typeof window === "undefined" ? null : new Date().getFullYear();
const getServerYear = (): number | null => null;

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentYear = useSyncExternalStore(
    subscribeToYear,
    getCurrentYear,
    getServerYear,
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          © {currentYear ?? ""} Garments ERP. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
