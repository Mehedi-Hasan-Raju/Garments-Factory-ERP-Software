"use client";

import RoleGuard from "@/components/auth/role-guard";
import {DashboardShell} from "@/components/layout/dashboard-shell";
import type { UserRole } from "@/types/auth";

interface RoleDashboardPageProps {
  role: UserRole;
  title: string;
  description: string;
}

export default function RoleDashboardPage({
  role,
  title,
  description,
}: RoleDashboardPageProps) {
  return (
    <RoleGuard allowedRoles={[role]}>
      <DashboardShell>
        <main className="min-h-screen bg-muted/40 p-6">
          <div className="mx-auto max-w-7xl space-y-2">
            <p className="text-sm font-medium text-primary">
              Garments Factory ERP
            </p>

            <h1 className="text-2xl font-bold tracking-tight">
              {title}
            </h1>

            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </main>
      </DashboardShell>
    </RoleGuard>
  );
}