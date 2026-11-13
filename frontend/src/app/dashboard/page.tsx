"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { getDashboardPath } from "@/lib/auth/role-routes";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user?.role?.code) {
      router.replace(getDashboardPath(user.role.code));
    }

    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Redirecting to your dashboard...
      </p>
    </div>
  );
}