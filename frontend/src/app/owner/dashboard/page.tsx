import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function OwnerDashboard() {
  return (
    <RoleDashboardPage
      role="OWNER"
      title="Owner Dashboard"
      description="Complete factory overview, business performance and system management."
    />
  );
}