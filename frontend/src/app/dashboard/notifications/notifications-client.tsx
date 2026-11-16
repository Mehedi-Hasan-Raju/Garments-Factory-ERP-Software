"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Factory,
  CreditCard,
  Truck,
  Users,
  ClipboardList,
  Trash2,
  Inbox,
  Loader2,
  Filter,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  useNotifications,
  useNotificationUnreadCount,
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";

import type {
  Notification,
  NotificationType,
} from "@/types/notification";

const notificationTypes: {
  value: NotificationType;
  label: string;
}[] = [
  { value: "GENERAL", label: "General" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "PRODUCTION", label: "Production" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "PAYMENT", label: "Payment" },
  { value: "SHIPMENT", label: "Shipment" },
  { value: "HR", label: "HR" },
  { value: "TASK", label: "Task" },
];

const typeStyles: Record<
  NotificationType,
  { label: string; className: string }
> = {
  GENERAL: {
    label: "General",
    className: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  },
  INVENTORY: {
    label: "Inventory",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  PRODUCTION: {
    label: "Production",
    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  PURCHASE: {
    label: "Purchase",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  PAYMENT: {
    label: "Payment",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  SHIPMENT: {
    label: "Shipment",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  HR: {
    label: "HR",
    className: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  },
  TASK: {
    label: "Task",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
};

function getNotificationIcon(type: NotificationType) {
  const iconClass = "h-5 w-5";

  switch (type) {
    case "INVENTORY":
      return <Package className={iconClass} />;

    case "PRODUCTION":
      return <Factory className={iconClass} />;

    case "PURCHASE":
      return <ClipboardList className={iconClass} />;

    case "PAYMENT":
      return <CreditCard className={iconClass} />;

    case "SHIPMENT":
      return <Truck className={iconClass} />;

    case "HR":
      return <Users className={iconClass} />;

    case "TASK":
      return <CheckCheck className={iconClass} />;

    default:
      return <Bell className={iconClass} />;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function NotificationsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    NotificationType | "all"
  >("all");

  const [deleteTarget, setDeleteTarget] =
    useState<Notification | null>(null);

  const queryParams = {
    page,
    limit: 10,
    ...(readFilter !== "all" && {
      isRead: readFilter,
    }),
    ...(typeFilter !== "all" && {
      type: typeFilter,
    }),
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useNotifications(queryParams);

  const { data: unreadData } =
    useNotificationUnreadCount();

  const markAsReadMutation =
    useMarkNotificationAsRead();

  const markAsUnreadMutation =
    useMarkNotificationAsUnread();

  const markAllMutation =
    useMarkAllNotificationsAsRead();

  const deleteMutation = useDeleteNotification();

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const unreadCount =
    unreadData?.data?.unreadCount ?? 0;

  const isActionPending =
    markAsReadMutation.isPending ||
    markAsUnreadMutation.isPending ||
    markAllMutation.isPending ||
    deleteMutation.isPending;

  const handleReadToggle = (notification: Notification) => {
    const mutation = notification.isRead
      ? markAsUnreadMutation
      : markAsReadMutation;

    mutation.mutate(notification.id, {
      onSuccess: () => {
        toast.success(
          notification.isRead
            ? "Notification marked as unread"
            : "Notification marked as read",
        );
      },
      onError: () => {
        toast.error("Failed to update notification");
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: (response) => {
        toast.success(
          `${response.data.updatedCount} notifications marked as read`,
        );
      },
      onError: () => {
        toast.error("Failed to mark notifications as read");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Notification deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete notification");
      },
    });
  };

  const handleOpenNotification = (
    notification: Notification,
  ) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id, {
        onError: () => {
          toast.error("Failed to mark notification as read");
        },
      });
    }

    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith("/")) {
        router.push(notification.actionUrl);
      } else {
        toast.error("Invalid notification destination");
      }
    }
  };

  const handleReadFilterChange = (
    value: "all" | "true" | "false",
  ) => {
    setReadFilter(value);
    setPage(1);
  };

  const handleTypeFilterChange = (
    value: NotificationType | "all",
  ) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0DF] text-[#527D57] dark:bg-emerald-950 dark:text-emerald-300">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Stay updated with your factory activities.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isActionPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D5E2D1] bg-card px-4 py-2.5 text-sm font-medium text-[#527D57] transition hover:bg-[#F1F6ED] disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          {markAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Mark all as read
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Unread notifications
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {unreadCount}
              </p>
            </div>

            <div className="rounded-xl bg-[#E8F0DF] p-3 text-[#527D57] dark:bg-emerald-950 dark:text-emerald-300">
              <Bell className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Notifications on this page
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {notifications.length}
              </p>
            </div>

            <div className="rounded-xl bg-[#F0F3EC] p-3 text-[#71866B] dark:bg-muted dark:text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4 text-[#6B9B70]" />
            Filters
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[480px]">
            <select
              value={readFilter}
              onChange={(e) =>
                handleReadFilterChange(
                  e.target.value as "all" | "true" | "false",
                )
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/10"
            >
              <option value="all">All notifications</option>
              <option value="false">Unread only</option>
              <option value="true">Read only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                handleTypeFilterChange(
                  e.target.value as NotificationType | "all",
                )
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/10"
            >
              <option value="all">All types</option>
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold text-foreground">
              All notifications
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your latest account notifications
            </p>
          </div>

          {isFetching && !isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-[#6B9B70]" />
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#6B9B70]" />
            <p className="mt-3 text-sm text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Bell className="h-9 w-9 text-gray-300" />
            <h3 className="mt-3 font-semibold text-foreground">
              Failed to load notifications
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong while retrieving notifications.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#6B9B70] px-4 py-2 text-sm font-medium text-white hover:bg-[#58865D]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="rounded-full bg-[#F1F5ED] p-4 text-[#789675] dark:bg-muted dark:text-muted-foreground">
                <Inbox className="h-8 w-8" />
              </div>

              <h3 className="mt-4 font-semibold text-foreground">
                No notifications found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                You do not have any notifications matching these filters.
              </p>
            </div>
          )}

        {/* Notification items */}
        {!isLoading && !isError && notifications.length > 0 && (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex flex-col gap-4 px-5 py-5 transition hover:bg-[#FAFCF8] dark:hover:bg-muted/70 sm:flex-row sm:items-start ${
                  !notification.isRead ? "bg-[#F7FAF4] dark:bg-emerald-950/30" : "bg-card"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    !notification.isRead
                      ? "bg-[#E5EFDF] text-[#527D57] dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-sm ${
                        !notification.isRead
                          ? "font-bold text-foreground"
                          : "font-semibold text-foreground/80"
                      }`}
                    >
                      {notification.title}
                    </h3>

                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#6B9B70]" />
                    )}

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        typeStyles[notification.type].className
                      }`}
                    >
                      {typeStyles[notification.type].label}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(notification.createdAt)}
                    </span>

                    <span>
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                  </div>

                  {notification.actionUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenNotification(notification)
                      }
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B8B60] hover:text-[#416B46] dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      View details
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    title={
                      notification.isRead
                        ? "Mark as unread"
                        : "Mark as read"
                    }
                    disabled={isActionPending}
                    onClick={() =>
                      handleReadToggle(notification)
                    }
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-[#C8DCC3] hover:bg-[#F1F6ED] hover:text-[#527D57] disabled:opacity-50 dark:hover:border-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                  >
                    {notification.isRead ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    title="Delete notification"
                    disabled={deleteMutation.isPending}
                    onClick={() =>
                      setDeleteTarget(notification)
                    }
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading &&
          !isError &&
          pagination &&
          pagination.totalPages > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) *
                      pagination.limit +
                    1}
                {" - "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}{" "}
                of {pagination.total} notifications
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-foreground">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages || isFetching
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Delete notification?
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Are you sure you want to delete this notification?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
