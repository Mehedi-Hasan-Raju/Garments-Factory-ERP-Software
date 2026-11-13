
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  X,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { ROLE_NAVIGATION } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface RoleSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}

export default function RoleSidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: RoleSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role?.code;

  if (!role) return null;

  const navigation = ROLE_NAVIGATION[role];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300",
          "md:sticky md:top-0 md:z-30 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-64 md:w-20" : "w-64",
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          {!collapsed || mobileOpen ? (
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Garments ERP
              </h2>
              <p className="text-xs text-muted-foreground">
                {role} Workspace
              </p>
            </div>
          ) : (
            <span className="mx-auto text-lg font-bold">G</span>
          )}

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted md:block"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {navigation.map((group) => (
            <div key={group.title} className="space-y-2">
              {(!collapsed || mobileOpen) && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  const className = cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    item.disabled && "cursor-not-allowed opacity-50",
                    collapsed && !mobileOpen && "md:justify-center md:px-2",
                  );

                  if (item.disabled) {
                    return (
                      <div
                        key={item.href}
                        className={className}
                        aria-disabled="true"
                        title={item.label + " - Coming soon"}
                      >
                        <Icon className="size-4 shrink-0" />

                        {(!collapsed || mobileOpen) && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            <LockKeyhole className="size-3.5" />
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={className}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                    >
                      <Icon className="size-4 shrink-0" />

                      {(!collapsed || mobileOpen) && (
                        <span>{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t p-4">
          {(!collapsed || mobileOpen) && (
            <p className="text-xs text-muted-foreground">
              Garments Factory Management System
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
