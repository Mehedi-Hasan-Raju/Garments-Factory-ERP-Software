import RoleDashboardPage from "@/components/dashboard/role-dashboard-page";

export default function AccountantDashboard() {
  return (
    <RoleDashboardPage
      role="ACCOUNTANT"
      title="Accountant Dashboard"
      description="Manage payroll, financial records and financial reports."
    />
  );
}