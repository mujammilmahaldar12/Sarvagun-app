/**
 * Notification Type Definitions
 * Complete type system for notifications, alerts, and real-time updates
 */

import { User } from './user';

export type NotificationType =
  | 'leave_request'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_cancelled'
  | 'event_created'
  | 'event_updated'
  | 'event_reminder'
  | 'finance_expense'
  | 'finance_invoice'
  | 'project_assigned'
  | 'project_updated'
  | 'announcement'
  | 'system_alert'
  | 'attendance_reminder'
  | 'task_assigned';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: number;
  user: number; // user ID
  user_details?: User;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  read: boolean; // Convenience boolean for status === 'read'
  
  // Metadata for deep linking
  related_object_id?: number;
  related_object_type?: 'leave' | 'event' | 'expense' | 'invoice' | 'project' | 'task';
  action_url?: string;
  
  // Actor information (who triggered the notification)
  actor_id?: number;
  actor_name?: string;
  actor_avatar?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  action_label?: string;
  
  // Timestamps
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  high_priority: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface CreateNotificationData {
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  related_object_id?: number;
  related_object_type?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationData {
  status?: NotificationStatus;
  read_at?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    leave_updates: boolean;
    event_updates: boolean;
    finance_updates: boolean;
    project_updates: boolean;
    announcements: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:mm format
    end_time: string;
  };
}

// UI Helper types
export interface NotificationGroup {
  date: string; // e.g., "Today", "Yesterday", "Nov 20"
  notifications: Notification[];
}

export interface NotificationIcon {
  name: string;
  color: string;
  backgroundColor: string;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  isPrimary?: boolean;
}
