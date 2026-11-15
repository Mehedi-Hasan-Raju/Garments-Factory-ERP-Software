import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { notificationService } from "@/services/notification.service";

import type {
  NotificationQueryParams,
} from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,

  lists: () =>
    [...notificationKeys.all, "list"] as const,

  list: (params: NotificationQueryParams) =>
    [...notificationKeys.lists(), params] as const,

  details: () =>
    [...notificationKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...notificationKeys.details(), id] as const,

  unreadCount: ["notification-unread-count"] as const,
};

export function useNotifications(
  params: NotificationQueryParams,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getAll(params),
    staleTime: 30 * 1000,
  });
}

export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationService.getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationService.getById(id),
    enabled: Boolean(id),
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
}

export function useMarkNotificationAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsUnread,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.delete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
}
