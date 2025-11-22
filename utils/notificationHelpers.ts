/**
 * Notification Utilities
 * Helper functions for notification formatting, grouping, and navigation
 */

import { router } from 'expo-router';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationGroup,
  NotificationIcon,
} from '@/types/notification';

/**
 * Get notification icon configuration based on type
 */
export function getNotificationIcon(type: NotificationType): NotificationIcon {
  const iconMap: Record<NotificationType, NotificationIcon> = {
    leave_request: {
      name: 'calendar-outline',
      color: '#F59E0B',
      backgroundColor: '#F59E0B15',
    },
    leave_approved: {
      name: 'checkmark-circle',
      color: '#10B981',
      backgroundColor: '#10B98115',
    },
    leave_rejected: {
      name: 'close-circle',
      color: '#EF4444',
      backgroundColor: '#EF444415',
    },
    leave_cancelled: {
      name: 'ban',
      color: '#6B7280',
      backgroundColor: '#6B728015',
    },
    event_created: {
      name: 'calendar',
      color: '#8B5CF6',
      backgroundColor: '#8B5CF615',
    },
    event_updated: {
      name: 'calendar-outline',
      color: '#8B5CF6',
      backgroundColor: '#8B5CF615',
    },
    event_reminder: {
      name: 'alarm',
      color: '#F59E0B',
      backgroundColor: '#F59E0B15',
    },
    finance_expense: {
      name: 'receipt',
      color: '#EC4899',
      backgroundColor: '#EC489915',
    },
    finance_invoice: {
      name: 'document-text',
      color: '#06B6D4',
      backgroundColor: '#06B6D415',
    },
    project_assigned: {
      name: 'briefcase',
      color: '#3B82F6',
      backgroundColor: '#3B82F615',
    },
    project_updated: {
      name: 'briefcase-outline',
      color: '#3B82F6',
      backgroundColor: '#3B82F615',
    },
    announcement: {
      name: 'megaphone',
      color: '#8B5CF6',
      backgroundColor: '#8B5CF615',
    },
    system_alert: {
      name: 'alert-circle',
      color: '#EF4444',
      backgroundColor: '#EF444415',
    },
    attendance_reminder: {
      name: 'time',
      color: '#F59E0B',
      backgroundColor: '#F59E0B15',
    },
    task_assigned: {
      name: 'checkbox',
      color: '#10B981',
      backgroundColor: '#10B98115',
    },
  };

  return iconMap[type] || iconMap.system_alert;
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: NotificationPriority): string {
  const colorMap: Record<NotificationPriority, string> = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#F97316',
    urgent: '#EF4444',
  };

  return colorMap[priority];
}

/**
 * Format notification time (relative)
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // Format as date for older notifications
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): NotificationGroup[] {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;

    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  // Convert to array and sort by date
  return Object.entries(groups)
    .map(([date, notifications]) => ({ date, notifications }))
    .sort((a, b) => {
      if (a.date === 'Today') return -1;
      if (b.date === 'Today') return 1;
      if (a.date === 'Yesterday') return -1;
      if (b.date === 'Yesterday') return 1;
      return new Date(b.notifications[0].created_at).getTime() - 
             new Date(a.notifications[0].created_at).getTime();
    });
}

/**
 * Navigate to notification target
 */
export function handleNotificationPress(notification: Notification) {
  if (!notification.related_object_id || !notification.related_object_type) {
    return;
  }

  const { related_object_type, related_object_id } = notification;

  switch (related_object_type) {
    case 'leave':
      router.push(`/(modules)/hr/${related_object_id}`);
      break;
    case 'event':
      router.push(`/(modules)/events/${related_object_id}`);
      break;
    case 'expense':
      router.push(`/(modules)/finance/expense-detail/${related_object_id}`);
      break;
    case 'invoice':
      router.push(`/(modules)/finance/invoice-detail?id=${related_object_id}`);
      break;
    case 'project':
      router.push(`/(modules)/projects/${related_object_id}`);
      break;
    case 'task':
      // Navigate to tasks screen when available
      console.log('Navigate to task:', related_object_id);
      break;
    default:
      console.log('Unknown notification type:', related_object_type);
  }
}

/**
 * Get notification action label based on type
 */
export function getNotificationActionLabel(type: NotificationType): string {
  const labelMap: Record<NotificationType, string> = {
    leave_request: 'View Request',
    leave_approved: 'View Leave',
    leave_rejected: 'View Details',
    leave_cancelled: 'View Leave',
    event_created: 'View Event',
    event_updated: 'See Changes',
    event_reminder: 'View Event',
    finance_expense: 'View Expense',
    finance_invoice: 'View Invoice',
    project_assigned: 'Open Project',
    project_updated: 'View Updates',
    announcement: 'Read More',
    system_alert: 'View',
    attendance_reminder: 'Mark Attendance',
    task_assigned: 'View Task',
  };

  return labelMap[type] || 'View';
}

/**
 * Filter notifications by search query
 */
export function filterNotificationsBySearch(
  notifications: Notification[],
  query: string
): Notification[] {
  if (!query.trim()) return notifications;

  const lowerQuery = query.toLowerCase();
  return notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(lowerQuery) ||
      notification.message.toLowerCase().includes(lowerQuery) ||
      notification.actor_name?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort notifications by priority and date
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  const priorityOrder: Record<NotificationPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...notifications].sort((a, b) => {
    // First by read status (unread first)
    if (a.status !== b.status) {
      return a.status === 'unread' ? -1 : 1;
    }

    // Then by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Finally by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Get notification type display name
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  const labelMap: Record<NotificationType, string> = {
    leave_request: 'Leave Request',
    leave_approved: 'Leave Approved',
    leave_rejected: 'Leave Rejected',
    leave_cancelled: 'Leave Cancelled',
    event_created: 'New Event',
    event_updated: 'Event Updated',
    event_reminder: 'Event Reminder',
    finance_expense: 'Expense',
    finance_invoice: 'Invoice',
    project_assigned: 'Project Assignment',
    project_updated: 'Project Update',
    announcement: 'Announcement',
    system_alert: 'System Alert',
    attendance_reminder: 'Attendance',
    task_assigned: 'Task Assignment',
  };

  return labelMap[type] || type;
}
