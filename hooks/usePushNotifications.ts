/**
 * Push Notifications Hook
 * Connects push notifications with notification store
 * Shows in-app toast notifications when new notifications arrive
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNotificationsStore } from '@/store/notificationsStore';
import pushNotificationService from '@/services/pushNotification.service';
import { useAuthStore } from '@/store/authStore';
import { useNotificationToast } from '@/store/notificationToastContext';

export const usePushNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const { addNotification, fetchNotifications, fetchStats, stats } = useNotificationsStore();

  // Use try-catch to safely get the toast context (may not be available during initial render)
  let showNotification: ((toast: any) => void) | null = null;
  try {
    const toastContext = useNotificationToast();
    showNotification = toastContext.showNotification;
  } catch {
    // Toast context not available yet - this is fine during initial render
  }

  // Track if we've shown the "welcome back" notification
  const hasShownWelcomeNotification = useRef(false);

  /**
   * Initialize push notifications when user is authenticated
   */
  useEffect(() => {
    if (!isAuthenticated) {
      hasShownWelcomeNotification.current = false;
      return;
    }

    const initializePushNotifications = async () => {
      try {
        const token = await pushNotificationService.initialize();
        if (token) {
          console.log('✅ Push notifications initialized');
        }
      } catch (error) {
        console.error('❌ Failed to initialize push notifications:', error);
      }
    };

    initializePushNotifications();
  }, [isAuthenticated]);

  /**
   * Show toast when user logs in and has unread notifications
   */
  useEffect(() => {
    if (!isAuthenticated || !showNotification) return;
    if (hasShownWelcomeNotification.current) return;

    // Fetch stats first
    fetchStats();
  }, [isAuthenticated, showNotification, fetchStats]);

  // Show welcome notification when stats update and there are unread notifications
  useEffect(() => {
    if (!isAuthenticated || !showNotification) return;
    if (hasShownWelcomeNotification.current) return;

    if (stats && stats.unread > 0) {
      hasShownWelcomeNotification.current = true;

      // Show toast about unread notifications
      showNotification({
        title: '📬 You have notifications',
        message: `You have ${stats.unread} unread notification${stats.unread > 1 ? 's' : ''}`,
        type: 'info',
        actionUrl: '/(dashboard)/notifications',
      });
    }
  }, [isAuthenticated, showNotification, stats]);

  /**
   * Listen for new notifications from backend
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Setup notification listeners
    pushNotificationService.setupListeners(
      (notification: any) => {
        console.log('📩 New notification received:', notification?.request?.content);

        const content = notification?.request?.content;
        if (content) {
          // Add to notification store
          const newNotification = {
            id: Date.now(), // Temporary ID until we sync with backend
            user: 0,
            type: content.data?.type || 'system_alert',
            title: content.title || 'New Notification',
            message: content.body || '',
            priority: content.data?.priority || 'medium',
            status: 'unread' as const,
            read: false,
            created_at: new Date().toISOString(),
            metadata: content.data,
          };

          addNotification(newNotification as any);

          // Show in-app toast notification
          if (showNotification) {
            showNotification({
              title: content.title || 'New Notification',
              message: content.body || '',
              type: content.data?.type || 'info',
              actionUrl: content.data?.action_url,
              data: content.data,
            });
          }
        }

        // Refresh notifications from backend
        fetchNotifications();
        fetchStats();
      },
      (response: any) => {
        console.log('👆 User tapped notification:', response);
        // Navigation is handled by PushNotificationProvider
      }
    );

    return () => {
      // Cleanup listeners
      pushNotificationService.removeListeners();
    };
  }, [isAuthenticated, addNotification, fetchNotifications, fetchStats, showNotification]);

  /**
   * Send a test local notification (also shows toast)
   */
  const sendTestNotification = useCallback(async () => {
    try {
      // Show in-app toast
      if (showNotification) {
        showNotification({
          title: 'Test Notification 🔔',
          message: 'This is a test notification from Sarvagun',
          type: 'info',
        });
      }

      // Also send system notification
      await pushNotificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification from Sarvagun',
        {
          type: 'system_alert',
          priority: 'medium',
        }
      );
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  }, [showNotification]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      const granted = await pushNotificationService.requestPermissions();
      return granted;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }, []);

  return {
    sendTestNotification,
    requestPermissions,
  };
};

