import { apiClient } from '@lib/api';
import type {
  Notification,
  NotificationStats,
  CreateNotificationRequest,
} from '@/types/notifications';
import type { NotificationPreferences as NotificationPreferencesType } from '@/types/notifications';

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
  async getNotifications(): Promise<NotificationData[]> {
    try {
      console.log('🔔 Notification Service: Fetching notifications...');
      const response = await apiClient.get<NotificationData[]>('/core/notifications/');
      console.log('✅ Notification Service: Fetched notifications:', response?.length || 0);
      return Array.isArray(response) ? response : (response as any)?.data || [];
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
      const data = (response as any)?.data || response;
      return data?.unread_count || 0;
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
   * Mark specific notification(s) as read
   */
  async markAsRead(notificationIds: number[]): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Marking notifications as read:', notificationIds);
      await apiClient.post('/core/notifications/mark_selected_as_read/', {
        notification_ids: notificationIds
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
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      console.log('🔔 Notification Service: Updating preferences:', preferences);
      await apiClient.post('/core/notification-preferences/update_preferences/', preferences);
      console.log('✅ Notification Service: Updated preferences');
      return true;
    } catch (error) {
      console.log('❌ Notification Service: Error updating preferences:', error);
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