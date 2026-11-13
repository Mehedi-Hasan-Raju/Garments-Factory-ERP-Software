import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function ManagerDashboard() {
  return (
    <RoleDashboardPage
      role="MANAGER"
      title="Manager Dashboard"
      description="Manage employees, production activities and warehouse operations."
    />
  );
}