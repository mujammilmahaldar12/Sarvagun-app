/**
 * Push Notification Hook
 * Easy access to push notification functionality
 */

import { useCallback } from 'react';
import { usePushNotifications } from '@/store/pushNotificationContext';
import pushNotificationService from '@/services/pushNotification.service';

interface UseNotificationsReturn {
  // State
  hasPermission: boolean;
  isLoading: boolean;
  pushToken: string | null;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, data?: Record<string, any>) => Promise<string>;
  scheduleNotification: (
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, any>
    ) => Promise<string>; // Use a loose type for trigger input to prevent type import causing runtime require
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  
  // Badge
  clearBadge: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const {
    hasPermission,
    isLoading,
    expoPushToken,
    requestPermissions,
    sendLocalNotification,
    clearBadge,
    setBadgeCount,
  } = usePushNotifications();

  /**
   * Schedule a notification for a specific time
   */
  const scheduleNotification = useCallback(
    // Avoid importing expo-notifications at module top-level (Expo Go SDK 53 limitation)
    async (
      title: string,
      body: string,
      triggerDate: Date,
      data?: Record<string, any>
    ): Promise<string> => {
      const seconds = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));
      
      // We don't import Notifications here to avoid triggering expo-notifications' runtime code in Expo Go.
      // Pass a simple object that the service will accept as trigger.
      return pushNotificationService.scheduleLocalNotification(
        { title, body, data, sound: true },
        { seconds, repeats: false } as any
      );
    },
    []
  );

  /**
   * Cancel a scheduled notification
   */
  const cancelNotification = useCallback(async (id: string) => {
    await pushNotificationService.cancelNotification(id);
  }, []);

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = useCallback(async () => {
    await pushNotificationService.cancelAllNotifications();
  }, []);

  return {
    hasPermission,
    isLoading,
    pushToken: expoPushToken,
    requestPermissions,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    clearBadge,
    setBadgeCount,
  };
}

export default useNotifications;
