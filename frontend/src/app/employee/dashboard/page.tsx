import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function EmployeeDashboard() {
  return (
    <RoleDashboardPage
      role="EMPLOYEE"
      title="Employee Dashboard"
      description="View assigned work and authorized factory operations."
    />
  );
}