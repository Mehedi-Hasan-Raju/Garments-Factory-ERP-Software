import ProtectedRoute from "@/components/auth/protected-route";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}