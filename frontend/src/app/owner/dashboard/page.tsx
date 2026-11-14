import RoleGuard from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import OwnerDashboardContent from "@/components/dashboard/owner-dashboard-content";

export default function OwnerDashboard() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <DashboardShell>
        <OwnerDashboardContent />
      </DashboardShell>
    </RoleGuard>
  );
}