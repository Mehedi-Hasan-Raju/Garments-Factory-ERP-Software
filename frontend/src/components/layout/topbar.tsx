
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Menu,
  Moon,
  Search,
  Sun,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import UserProfileMenu from "@/components/layout/user-profile-menu";
import {
  useNotifications,
  useNotificationUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";

interface TopbarProps {
  onMenuClick: () => void;
}

const notificationTypeStyles: Record<string, string> = {
  GENERAL: "bg-muted text-muted-foreground",
  INVENTORY: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PRODUCTION: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PURCHASE: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  PAYMENT: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  SHIPMENT: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  HR: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  TASK: "bg-secondary text-secondary-foreground",
};

function formatNotificationDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useNotificationUnreadCount();

  const {
    data: notificationData,
    isPending,
    isError,
    refetch,
  } = useNotifications({
    page: 1,
    limit: 5,
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = unreadData?.data?.unreadCount ?? 0;
  const notifications = notificationData?.data ?? [];

  // Close popover when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isNotificationOpen) return;

    function handleOutsideClick(event: PointerEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationOpen]);

  const notificationLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleViewAll = () => {
    setIsNotificationOpen(false);
    router.push("/dashboard/notifications");
  };

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <span>Workspace</span>
          <span>/</span>
          <span className="font-semibold text-foreground">
            Dashboard
          </span>
        </div>

        <div className="sm:hidden">
          <p className="text-sm font-semibold">Dashboard</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 md:flex lg:w-64">
          <Search
            size={16}
            className="shrink-0 text-muted-foreground"
          />

          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />

          <kbd className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
            /
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() =>
              setIsNotificationOpen((previous) => !previous)
            }
            aria-label={notificationLabel}
            aria-expanded={isNotificationOpen}
            aria-haspopup="dialog"
            title={notificationLabel}
            className={`relative rounded-lg p-2 transition-colors ${
              isNotificationOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span
                aria-live="polite"
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[9px] font-bold leading-none text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {isNotificationOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-[calc(100%+14px)] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-background shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Notifications
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {unreadCount > 0
                      ? `${unreadCount} unread notifications`
                      : "You're all caught up"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:opacity-80 disabled:opacity-50"
                  >
                    {markAllAsReadMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCheck size={14} />
                    )}
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {isPending ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Loader2
                      size={22}
                      className="animate-spin text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Loading notifications...
                    </p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <p className="text-sm font-medium">
                      Unable to load notifications
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                      <Bell
                        size={20}
                        className="text-muted-foreground"
                      />
                    </div>
                    <p className="text-sm font-medium">
                      No notifications yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      New updates will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex gap-3 px-4 py-3 transition-colors ${
                          notification.isRead
                            ? "bg-background"
                            : "bg-primary/[0.04]"
                        }`}
                      >
                        {/* Unread Indicator */}
                        <div className="flex shrink-0 pt-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              notification.isRead
                                ? "bg-transparent"
                                : "bg-primary"
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold leading-5">
                              {notification.title}
                            </p>

                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                notificationTypeStyles[
                                  notification.type
                                ] ?? notificationTypeStyles.GENERAL
                              }`}
                            >
                              {notification.type}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatNotificationDate(
                                notification.createdAt,
                              )}
                            </span>

                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                disabled={markAsReadMutation.isPending}
                                aria-label={`Mark ${notification.title} as read`}
                                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline disabled:opacity-50"
                              >
                                <Check size={12} />
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
                >
                  View all notifications
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        <UserProfileMenu />
      </div>
    </header>
  );
}
