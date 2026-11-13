"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { getDashboardPath } from "@/lib/auth/role-routes";
import type { UserRole } from "@/types/auth";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, status } = useAuth();

  const userRole = user?.role?.code;
  const hasAccess = userRole ? allowedRoles.includes(userRole) : false;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && userRole && !hasAccess) {
      router.replace(getDashboardPath(userRole));
    }
  }, [status, userRole, hasAccess, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Verifying permissions...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">
          Unable to verify your session. Please try again.
        </p>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}