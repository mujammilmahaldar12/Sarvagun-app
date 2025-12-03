// Notification Type Definitions

export type NotificationType = 
  | 'lead_converted' 
  | 'event_created' 
  | 'event_updated'
  | 'event_cancelled'
  | 'payment_received'
  | 'expense_added'
  | 'vendor_assigned'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: {
    event_id?: number;
    lead_id?: number;
    user_id?: number;
    amount?: number;
    [key: string]: any;
  };
  created_at: string;
  read_at?: string;
  recipient_id: number;
  sender_id?: number;
  sender_name?: string;
}

export interface NotificationPreferences {
  lead_converted: boolean;
  event_created: boolean;
  event_updated: boolean;
  event_cancelled: boolean;
  payment_received: boolean;
  expense_added: boolean;
  vendor_assigned: boolean;
  system: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  high_priority: number;
  today: number;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  recipient_ids?: number[]; // For targeted notifications
  send_to_admins?: boolean; // For admin-only notifications
}
