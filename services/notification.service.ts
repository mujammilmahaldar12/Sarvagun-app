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
  LIST: '/notifications/',
  DETAIL: (id: number) => `/notifications/${id}/`,
  MARK_READ: (id: number) => `/notifications/${id}/mark-read/`,
  MARK_ALL_READ: '/notifications/mark-all-read/',
  DELETE: (id: number) => `/notifications/${id}/`,
  DELETE_ALL: '/notifications/delete-all/',
  STATS: '/notifications/stats/',
  PREFERENCES: '/notifications/preferences/',
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
    return response.data;
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(id: number): Promise<Notification> {
    const response = await api.get<Notification>(NOTIFICATION_ENDPOINTS.DETAIL(id));
    return response.data;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>(NOTIFICATION_ENDPOINTS.STATS);
    return response.data;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.post<Notification>(NOTIFICATION_ENDPOINTS.MARK_READ(id));
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      NOTIFICATION_ENDPOINTS.MARK_ALL_READ
    );
    return response.data;
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
    return response.data;
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
    return response.data;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>(
      NOTIFICATION_ENDPOINTS.PREFERENCES
    );
    return response.data;
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
    return response.data;
  }

  /**
   * Create a notification (admin/system only)
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await api.post<Notification>(NOTIFICATION_ENDPOINTS.LIST, data);
    return response.data;
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
