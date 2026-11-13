import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function AdminDashboard() {
  return (
    <RoleDashboardPage
      role="ADMIN"
      title="Admin Dashboard"
      description="Manage users, departments, warehouses and factory operations."
    />
  );
}