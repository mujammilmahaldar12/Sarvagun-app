/**
 * Push Notifications Hook
 * Connects push notifications with notification store
 * Shows local notifications when new notifications arrive
 */

import { useEffect, useCallback } from 'react';
import { useNotificationsStore } from '@/store/notificationsStore';
import pushNotificationService from '@/services/pushNotification.service';
import { useAuthStore } from '@/store/authStore';

export const usePushNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const { addNotification, fetchNotifications, fetchStats } = useNotificationsStore();

  /**
   * Initialize push notifications when user is authenticated
   */
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, addNotification, fetchNotifications, fetchStats]);

  /**
   * Send a test local notification
   */
  const sendTestNotification = useCallback(async () => {
    try {
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
  }, []);

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
