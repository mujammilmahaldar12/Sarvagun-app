/**
 * Notification React Query Hooks
 * Handles data fetching, caching, and mutations for notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '@/services/notification.service';
import {
  Notification,
  NotificationFilters,
  NotificationStats,
  UpdateNotificationData,
  NotificationPreferences,
} from '@/types/notification';

// Query keys for cache management
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) =>
    [...notificationQueryKeys.lists(), { filters }] as const,
  details: () => [...notificationQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...notificationQueryKeys.details(), id] as const,
  stats: () => [...notificationQueryKeys.all, 'stats'] as const,
  preferences: () => [...notificationQueryKeys.all, 'preferences'] as const,
};

/**
 * Fetch all notifications
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch unread notifications only
 */
export function useUnreadNotifications() {
  return useNotifications({ status: 'unread' });
}

/**
 * Fetch a single notification
 */
export function useNotification(id: number) {
  return useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: () => notificationService.getNotification(id),
    enabled: !!id,
  });
}

/**
 * Fetch notification statistics with real-time updates
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: notificationQueryKeys.stats(),
    queryFn: () => notificationService.getNotificationStats(),
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
    refetchIntervalInBackground: true, // Continue polling in background
  });
}

/**
 * Real-time notification polling with aggressive refresh
 */
export function useRealtimeNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 15000, // 15 seconds
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch user notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationQueryKeys.preferences(),
    queryFn: () => notificationService.getPreferences(),
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: (data) => {
      // Update the notification in cache
      queryClient.setQueryData(
        notificationQueryKeys.detail(data.id),
        data
      );

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      });

      // Update stats
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

/**
 * Update notification
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNotificationData }) =>
      notificationService.updateNotification(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        notificationQueryKeys.detail(data.id),
        data
      );
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: notificationQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
}

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      notificationService.updatePreferences(preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationQueryKeys.preferences(), data);
    },
  });
}

/**
 * Get unread count (derived from stats)
 */
export function useUnreadCount() {
  const { data: stats } = useNotificationStats();
  return stats?.unread || 0;
}
