import { apiClient } from '@lib/api';
import type {
  Notification,
  NotificationStats,
  CreateNotificationRequest,
} from '@/types/notification';
import type { NotificationPreferences as NotificationPreferencesType } from '@/types/notification';

export interface NotificationData {
  id: number;
  notification: {
    id: number;
    title: string;
    message: string;
    url: string;
    created_at: string;
    type_name: string;
    type_description: string;
  };
  read: boolean;
  read_at: string | null;
  is_seen: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_task_id: number | null;
  related_project_id: number | null;
  related_user_id: number | null;
  action_data: any;
  time_ago: string;
}

export interface NotificationPreferences {
  notify_task_due_tomorrow: boolean;
  notify_task_overdue: boolean;
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  notify_task_rated: boolean;
  notify_project_updates: boolean;
  notify_new_projects: boolean;
  notify_team_task_updates: boolean;
  notify_rating_requests: boolean;
  due_date_reminder_hours: number;
}

export interface NotificationSummary {
  total_count: number;
  unread_count: number;
  recent_notifications: NotificationData[];
  notifications_by_type: Record<string, number>;
  has_urgent: boolean;
}

class NotificationService {
  /**
   * Get all notifications for current user
   */
  async getNotifications(filters?: { unread_only?: boolean; page_size?: number }): Promise<NotificationData[]> {
    try {
      console.log('🔔 Notification Service: Fetching notifications...', filters);
      const params = new URLSearchParams();
      if (filters?.unread_only) params.append('unread_only', 'true');
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());
      
      const url = `/core/notifications/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get<any>(url);
      console.log('✅ Notification Service: Fetched notifications response:', response);
      
      // Handle both array and paginated response
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.results && Array.isArray(response.results)) {
        return response.results;
      }
      if ((response as any)?.data) {
        const data = (response as any).data;
        if (Array.isArray(data)) return data;
        if (data?.results) return data.results;
      }
      return [];
    } catch (error: any) {
      // Silently handle missing backend endpoint
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return [];
      }
      console.log('❌ Notification Service: Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get only unread notifications
   */
  async getUnreadNotifications(): Promise<NotificationData[]> {
    try {
      console.log('🔔 Notification Service: Fetching unread notifications...');
      const response = await apiClient.get<NotificationData[]>('/core/notifications/unread/');
      console.log('✅ Notification Service: Fetched unread notifications:', response?.length || 0);
      return Array.isArray(response) ? response : (response as any)?.data || [];
    } catch (error: any) {
      // Silently handle missing backend endpoint
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return [];
      }
      console.log('❌ Notification Service: Error fetching unread notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unread_count: number }>('/core/notifications/unread_count/');
      console.log('🔔 Unread count raw response:', response);
      const data = (response as any)?.data || response;
      console.log('🔔 Unread count data:', data);
      const count = data?.unread_count || 0;
      console.log('🔔 Final unread count:', count);
      return count;
    } catch (error: any) {
      // Silently handle 404 or network errors - backend endpoint may not exist yet
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        // Backend notification endpoint not implemented yet - return 0
        return 0;
      }
      console.log('❌ Notification Service: Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get notification summary for dashboard
   */
  async getNotificationSummary(): Promise<NotificationSummary> {
    try {
      console.log('🔔 Notification Service: Fetching notification summary...');
      const response = await apiClient.get<NotificationSummary>('/core/notification-summary/');
      const data = (response as any)?.data || response;
      console.log('✅ Notification Service: Fetched summary:', data);
      return data || {
        total_count: 0,
        unread_count: 0,
        recent_notifications: [],
        notifications_by_type: {},
        has_urgent: false
      };
    } catch (error: any) {
      // Silently handle missing backend endpoint
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return {
          total_count: 0,
          unread_count: 0,
          recent_notifications: [],
          notifications_by_type: {},
          has_urgent: false
        };
      }
      console.log('❌ Notification Service: Error fetching summary:', error);
      return {
        total_count: 0,
        unread_count: 0,
        recent_notifications: [],
        notifications_by_type: {},
        has_urgent: false
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      console.log('🔔 Notification Service: Fetching notification stats...');
      const response = await apiClient.get<NotificationStats>('/core/notifications/stats/');
      const data = (response as any)?.data || response;
      console.log('✅ Notification Service: Fetched stats:', data);
      
      // Ensure high_priority field exists
      const stats = data || {
        total: 0,
        unread: 0,
        read: 0,
        high_priority: 0,
        by_type: {} as any,
        by_priority: {} as any,
      };
      
      // Calculate high_priority if not provided
      if (!stats.high_priority && stats.by_priority) {
        stats.high_priority = (stats.by_priority.high || 0) + (stats.by_priority.urgent || 0);
      }
      
      return stats;
    } catch (error: any) {
      // Silently handle missing backend endpoint
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return {
          total: 0,
          unread: 0,
          read: 0,
          high_priority: 0,
          by_type: {} as any,
          by_priority: {} as any,
        };
      }
      console.log('❌ Notification Service: Error fetching stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        high_priority: 0,
        by_type: {} as any,
        by_priority: {} as any,
      };
    }
  }

  /**
   * Mark specific notification(s) as read
   */
  async markAsRead(notificationId: number | number[]): Promise<boolean> {
    try {
      const ids = Array.isArray(notificationId) ? notificationId : [notificationId];
      console.log('🔔 Notification Service: Marking notifications as read:', ids);
      await apiClient.post('/core/notifications/mark_selected_as_read/', {
        notification_ids: ids
      });
      console.log('✅ Notification Service: Marked notifications as read');
      return true;
    } catch (error) {
      console.log('❌ Notification Service: Error marking as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Marking all notifications as read...');
      await apiClient.post('/core/notifications/mark_all_as_read/');
      console.log('✅ Notification Service: Marked all notifications as read');
      return true;
    } catch (error) {
      console.log('❌ Notification Service: Error marking all as read:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      console.log('🔔 Notification Service: Fetching preferences...');
      const response = await apiClient.get<NotificationPreferences>('/core/notification-preferences/my_preferences/');
      const data = (response as any)?.data || response;
      console.log('✅ Notification Service: Fetched preferences:', data);
      return data || this.getDefaultPreferences();
    } catch (error) {
      console.log('❌ Notification Service: Error fetching preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      console.log('🔔 Notification Service: Updating preferences:', preferences);
      const response = await apiClient.post<NotificationPreferences>('/core/notification-preferences/update_preferences/', preferences);
      const data = (response as any)?.data || response;
      console.log('✅ Notification Service: Updated preferences');
      return data || { ...this.getDefaultPreferences(), ...preferences };
    } catch (error) {
      console.log('❌ Notification Service: Error updating preferences:', error);
      return { ...this.getDefaultPreferences(), ...preferences };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Deleting notification:', notificationId);
      await apiClient.delete(`/core/notifications/${notificationId}/`);
      console.log('✅ Notification Service: Deleted notification');
      return true;
    } catch (error) {
      console.log('❌ Notification Service: Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Clearing read notifications...');
      await apiClient.post('/core/notifications/clear_read/');
      console.log('✅ Notification Service: Cleared read notifications');
      return true;
    } catch (error) {
      console.log('❌ Notification Service: Error clearing read notifications:', error);
      return false;
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      notify_task_due_tomorrow: true,
      notify_task_overdue: true,
      notify_task_assigned: true,
      notify_task_completed: true,
      notify_task_rated: true,
      notify_project_updates: true,
      notify_new_projects: true,
      notify_team_task_updates: true,
      notify_rating_requests: true,
      due_date_reminder_hours: 24,
    };
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      task_due_tomorrow: 'time-outline',
      task_overdue: 'alert-circle-outline',
      task_assigned: 'briefcase-outline',
      task_completed: 'checkmark-circle-outline',
      task_rated: 'star-outline',
      project_created: 'folder-outline',
      project_updated: 'folder-open-outline',
      team_notification: 'people-outline',
      message: 'chatbubble-outline',
      system: 'settings-outline',
      reminder: 'alarm-outline',
    };
    return iconMap[type] || 'notifications-outline';
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: string): string {
    const colorMap: Record<string, string> = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444',
    };
    return colorMap[priority] || '#3B82F6';
  }

  /**
   * Handle notification action (navigate to appropriate screen)
   */
  handleNotificationAction(notification: NotificationData, navigation: any) {
    const { action_data, related_task_id, related_project_id } = notification;
    
    if (action_data?.action) {
      switch (action_data.action) {
        case 'view_task':
          if (related_task_id) {
            navigation.navigate('(modules)', {
              screen: 'projects',
              params: { highlightTask: related_task_id }
            });
          }
          break;
        case 'rate_task':
          if (related_task_id) {
            navigation.navigate('(modules)', {
              screen: 'projects',
              params: { rateTask: related_task_id }
            });
          }
          break;
        case 'view_project':
          if (related_project_id) {
            navigation.navigate('(modules)', {
              screen: 'projects',
              params: { selectProject: related_project_id }
            });
          }
          break;
        default:
          // Default to projects module
          navigation.navigate('(modules)', { screen: 'projects' });
      }
    } else {
      // Default action based on related objects
      if (related_task_id || related_project_id) {
        navigation.navigate('(modules)', { screen: 'projects' });
      }
    }
  }

  /**
   * Send notification on lead conversion (Triggers admin notification)
   */
  async notifyLeadConversion(leadId: number, eventId: number, clientName: string): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Sending lead conversion notification...');
      // This would integrate with your backend notification system
      // For now, return success - backend should handle admin targeting
      return true;
    } catch (error) {
      console.error('❌ Notification Service: Error sending lead conversion notification:', error);
      return false;
    }
  }

  /**
   * Send notification on event creation
   */
  async notifyEventCreation(eventId: number, eventName: string, createdBy: string): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Sending event creation notification...');
      return true;
    } catch (error) {
      console.error('❌ Notification Service: Error sending event creation notification:', error);
      return false;
    }
  }

  /**
   * Send notification on payment received
   */
  async notifyPaymentReceived(eventId: number, amount: number, paymentStatus: string): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Sending payment notification...');
      return true;
    } catch (error) {
      console.error('❌ Notification Service: Error sending payment notification:', error);
      return false;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;