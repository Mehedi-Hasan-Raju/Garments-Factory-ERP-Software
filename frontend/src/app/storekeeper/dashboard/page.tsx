import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function StorekeeperDashboard() {
  return (
    <RoleDashboardPage
      role="STOREKEEPER"
      title="Storekeeper Dashboard"
      description="Manage stock receiving, issuing, transfers and inventory."
    />
  );
}