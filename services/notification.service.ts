/**
 * Notification Service
 * Handles all notification-related API calls
 */

import api from './api';
import {
  Notification,
  NotificationStats,
  NotificationFilters,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationPreferences,
} from '@/types/notification';

const NOTIFICATION_ENDPOINTS = {
  LIST: '/core/notifications/',
  DETAIL: (id: number) => `/core/notifications/${id}/`,
  MARK_READ: (id: number) => `/core/notifications/${id}/mark_as_read/`,
  MARK_ALL_READ: '/core/notifications/mark_all_as_read/',
  DELETE: (id: number) => `/core/notifications/${id}/`,
  DELETE_ALL: '/core/notifications/delete_all/',
  STATS: '/core/notification-summary/',
  PREFERENCES: '/core/notification-preferences/my_preferences/',
};

class NotificationService {
  /**
   * Get all notifications with optional filters
   */
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<Notification[]>(
      `${NOTIFICATION_ENDPOINTS.LIST}?${params.toString()}`
    );
    // API returns data directly, handle both cases
    const data = (response as any)?.data ?? response;
    return Array.isArray(data) ? data : data?.results || [];
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(id: number): Promise<Notification> {
    const response = await api.get<Notification>(NOTIFICATION_ENDPOINTS.DETAIL(id));
    return (response as any)?.data ?? response;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>(NOTIFICATION_ENDPOINTS.STATS);
    return (response as any)?.data ?? response;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.post<Notification>(NOTIFICATION_ENDPOINTS.MARK_READ(id));
    return (response as any)?.data ?? response;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      NOTIFICATION_ENDPOINTS.MARK_ALL_READ
    );
    return (response as any)?.data ?? response;
  }

  /**
   * Update notification
   */
  async updateNotification(
    id: number,
    data: UpdateNotificationData
  ): Promise<Notification> {
    const response = await api.patch<Notification>(
      NOTIFICATION_ENDPOINTS.DETAIL(id),
      data
    );
    return (response as any)?.data ?? response;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(NOTIFICATION_ENDPOINTS.DELETE(id));
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      NOTIFICATION_ENDPOINTS.DELETE_ALL
    );
    return (response as any)?.data ?? response;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>(
      NOTIFICATION_ENDPOINTS.PREFERENCES
    );
    return (response as any)?.data ?? response;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await api.patch<NotificationPreferences>(
      NOTIFICATION_ENDPOINTS.PREFERENCES,
      preferences
    );
    return (response as any)?.data ?? response;
  }

  /**
   * Create a notification (admin/system only)
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await api.post<Notification>(NOTIFICATION_ENDPOINTS.LIST, data);
    return (response as any)?.data ?? response;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const stats = await this.getNotificationStats();
    return stats.unread;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
