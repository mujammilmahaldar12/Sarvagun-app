import { create } from 'zustand';
import notificationsService from '@/services/notifications.service';
import type { Notification, NotificationStats, NotificationPreferences } from '@/types/notifications';

interface NotificationsState {
  notifications: Notification[];
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Real-time update (for WebSocket integration)
  addNotification: (notification: Notification) => void;
  updateNotification: (id: number, updates: Partial<Notification>) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  stats: null,
  preferences: null,
  loading: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsService.getNotifications({
        unread_only: unreadOnly,
        page_size: 50,
      });
      set({ notifications, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch notifications', loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await notificationsService.getNotificationStats();
      set({ stats });
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
    }
  },

  fetchPreferences: async () => {
    try {
      const preferences = await notificationsService.getPreferences();
      set({ preferences });
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        ),
        stats: state.stats
          ? { ...state.stats, unread: Math.max(0, state.stats.unread - 1) }
          : null,
      }));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
          read_at: new Date().toISOString(),
        })),
        stats: state.stats ? { ...state.stats, unread: 0 } : null,
      }));
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationsService.deleteNotification(id);
      
      // Update local state
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          stats: state.stats
            ? {
                ...state.stats,
                total: Math.max(0, state.stats.total - 1),
                unread: wasUnread ? Math.max(0, state.stats.unread - 1) : state.stats.unread,
              }
            : null,
        };
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  },

  clearReadNotifications: async () => {
    try {
      await notificationsService.clearReadNotifications();
      
      // Update local state - keep only unread
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.read),
      }));
      
      // Refetch stats
      get().fetchStats();
    } catch (error: any) {
      console.error('Error clearing read notifications:', error);
    }
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    try {
      const updated = await notificationsService.updatePreferences(preferences);
      set({ preferences: updated });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
    }
  },

  // Real-time update methods
  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      stats: state.stats
        ? {
            ...state.stats,
            total: state.stats.total + 1,
            unread: state.stats.unread + 1,
          }
        : null,
    }));
  },

  updateNotification: (id: number, updates: Partial<Notification>) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    }));
  },
}));
