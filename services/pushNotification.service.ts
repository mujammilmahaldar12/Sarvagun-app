/**
 * Push Notification Service
 * Handles Expo push notifications - registration, permissions, and handling
 * Works like Swiggy/Uber - system-level notifications
 */

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Storage key for push token
const PUSH_TOKEN_KEY = '@sarvagun_push_token';
const PUSH_TOKEN_SENT_KEY = '@sarvagun_push_token_sent';

// Notification channel configuration for Android
const ANDROID_CHANNEL_ID = 'sarvagun-notifications';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy-load Notifications module ONLY when needed (not at module load time)
// This prevents SDK 53 Expo Go import errors
let Notifications: typeof import('expo-notifications') | null = null;
let notificationsLoadAttempted = false;

/**
 * Safely load expo-notifications module at runtime (not during bundling)
 * IMPORTANT: In Expo Go SDK 53, we CANNOT load expo-notifications at all
 * Only call this inside functions, never at module top-level
 */
function getNotifications(): typeof import('expo-notifications') | null {
  // CRITICAL: Skip loading entirely in Expo Go to prevent SDK 53 error
  if (isExpoGo) {
    if (!notificationsLoadAttempted) {
      console.log('ℹ️ Running in Expo Go - expo-notifications is disabled (SDK 53 limitation). Use a development build for full push notification support.');
      notificationsLoadAttempted = true;
    }
    return null;
  }

  if (notificationsLoadAttempted) {
    return Notifications;
  }

  notificationsLoadAttempted = true;

  try {
    Notifications = require('expo-notifications');

    // Configure notification handler after successful load
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      console.log('✅ expo-notifications loaded successfully');
    }

    return Notifications;
  } catch (e) {
    console.warn('⚠️ expo-notifications not available:', e);
    return null;
  }
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  categoryId?: string;
}

export interface NotificationResponse {
  notification: any;
  actionIdentifier: string;
  userText?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Check if notifications are available
   */
  isNotificationsAvailable(): boolean {
    return getNotifications() !== null;
  }

  /**
   * Initialize push notifications - call this on app startup
   */
  async initialize(): Promise<string | null> {
    const Notifications = getNotifications();
    if (!Notifications) {
      console.log('ℹ️ Notifications not available - skipping initialization');
      return null;
    }

    console.log('🔔 Initializing push notifications...');

    try {
      // Setup Android notification channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Register for push notifications
      const token = await this.registerForPushNotifications();

      if (token) {
        this.expoPushToken = token;
        await this.savePushToken(token);
        await this.sendTokenToBackend(token);
        console.log('✅ Push notification initialized with token:', token.substring(0, 30) + '...');
      }

      return token;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channel with custom settings
   */
  private async setupAndroidChannel(): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Sarvagun Notifications',
        description: 'All notifications from Sarvagun',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6D376D',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Create additional channels for different notification types
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Task Updates',
        description: 'Notifications about task assignments and updates',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('leaves', {
        name: 'Leave Notifications',
        description: 'Leave request and approval notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('events', {
        name: 'Event Reminders',
        description: 'Upcoming event notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });

      console.log('📱 Android notification channels created');
    } catch (error) {
      console.warn('⚠️ Failed to create notification channels:', error);
    }
  }

  /**
   * Register device for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    const Notifications = getNotifications();
    if (!Notifications) {
      console.log('ℹ️ Notifications not available');
      return null;
    }

    // Check if it's a physical device
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications require a physical device');
      return null;
    }

    // Warn about Expo Go limitations
    if (isExpoGo) {
      console.log('ℹ️ Running in Expo Go - remote push notifications are limited.');
    }

    try {
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        console.log('📝 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('❌ Notification permission denied');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || '1557dae7-23ca-4db5-85dd-7c09b0f761df',
      });

      return tokenData.data;
    } catch (error) {
      // In Expo Go, this may fail but we can still use local notifications
      if (isExpoGo) {
        console.log('ℹ️ Push token unavailable in Expo Go - local notifications will still work');
        return null;
      }
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Save push token locally
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Get saved push token
   */
  async getSavedPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get saved push token:', error);
      return null;
    }
  }

  /**
   * Send push token to backend for storage
   * Always sends to backend - the backend handles duplicates via update_or_create
   * Includes retry logic with exponential backoff for reliability
   */
  async sendTokenToBackend(token: string, retryCount = 3): Promise<boolean> {
    console.log('📤 Registering push token with backend...');

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await api.post('/hr/push-token/', {
          token: token,
          device_type: Platform.OS,
          device_name: Device.deviceName || 'Unknown Device',
        });

        console.log('✅ Push token registered with backend successfully');
        // Save to local storage only after successful registration
        await AsyncStorage.setItem(PUSH_TOKEN_SENT_KEY, token);
        return true;
      } catch (error: any) {
        console.error(`❌ Push token registration attempt ${attempt}/${retryCount} failed:`, error?.message || error);

        if (attempt < retryCount) {
          // Wait before retry with exponential backoff (1s, 2s, 4s)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - clear any stale cached token to ensure retry on next launch
    await AsyncStorage.removeItem(PUSH_TOKEN_SENT_KEY);
    console.error('❌ All push token registration attempts failed. Will retry on next app launch.');
    return false;
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: NotificationResponse) => void
  ): void {
    const Notifications = getNotifications();
    if (!Notifications) {
      console.log('ℹ️ Notifications not available - skipping listener setup');
      return;
    }

    try {
      // Listen for notifications received while app is foregrounded
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('📩 Notification received:', notification.request.content.title);
          onNotificationReceived?.(notification);
        }
      );

      // Listen for user interaction with notification
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Notification tapped:', response.notification.request.content.title);
          onNotificationResponse?.({
            notification: response.notification,
            actionIdentifier: response.actionIdentifier,
            userText: (response as any).userText,
          });
        }
      );

      console.log('👂 Notification listeners setup complete');
    } catch (error) {
      console.warn('⚠️ Failed to setup notification listeners:', error);
    }
  }

  /**
   * Remove notification listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    console.log('🔇 Notification listeners removed');
  }

  /**
   * Schedule a local notification (for reminders, etc.)
   */
  async scheduleLocalNotification(
    data: PushNotificationData,
    trigger?: any
  ): Promise<string> {
    const Notifications = getNotifications();
    if (!Notifications) {
      console.log('ℹ️ Notifications not available');
      return '';
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: data.sound !== false,
          badge: data.badge,
          categoryIdentifier: data.categoryId,
        },
        trigger: trigger || null, // null = immediate
      });

      console.log('📅 Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.warn('⚠️ Failed to schedule notification:', error);
      return '';
    }
  }

  /**
   * Send immediate local notification
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    return this.scheduleLocalNotification({
      title,
      body,
      data,
      sound: true,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
    } catch (error) {
      console.warn('⚠️ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All notifications cancelled');
    } catch (error) {
      console.warn('⚠️ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    const Notifications = getNotifications();
    if (!Notifications) return 0;
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.warn('⚠️ Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Get all delivered notifications
   */
  async getDeliveredNotifications(): Promise<any[]> {
    const Notifications = getNotifications();
    if (!Notifications) return [];
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      return [];
    }
  }

  /**
   * Dismiss a delivered notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.warn('⚠️ Failed to dismiss notification:', error);
    }
  }

  /**
   * Dismiss all delivered notifications
   */
  async dismissAllNotifications(): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.warn('⚠️ Failed to dismiss all notifications:', error);
    }
  }

  /**
   * Check if permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Request permissions (useful for showing permission dialog later)
   */
  async requestPermissions(): Promise<boolean> {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Get the last notification response (app opened via notification)
   */
  async getLastNotificationResponse(): Promise<any | null> {
    const Notifications = getNotifications();
    if (!Notifications) return null;
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
