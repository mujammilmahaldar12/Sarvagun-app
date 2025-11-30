/**
 * Push Notification Context
 * Provides push notification state and handlers throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import pushNotificationService, { NotificationResponse } from '@/services/pushNotification.service';
import { useAuthStore } from '@/store/authStore';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface PushNotificationContextType {
  expoPushToken: string | null;
  notification: any | null;
  hasPermission: boolean;
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, data?: Record<string, any>) => Promise<string>;
  clearBadge: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = useCallback((notification: any) => {
    console.log('📩 Notification received in foreground:', notification?.request?.content?.title);
    setNotification(notification);
    
    // You can show an in-app toast/banner here instead of system notification
    // Or let the system notification handler show it
  }, []);

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  const handleNotificationResponse = useCallback((response: NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('👆 Notification tapped with data:', data);

    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'task':
        case 'task_assigned':
        case 'task_completed':
        case 'task_rated':
          if (data.task_id) {
            router.push(`/(modules)/tasks/${data.task_id}` as any);
          } else {
            router.push('/(modules)/tasks' as any);
          }
          break;
          
        case 'leave':
        case 'leave_approved':
        case 'leave_rejected':
          router.push('/(modules)/leaves' as any);
          break;
          
        case 'event':
        case 'event_reminder':
          if (data.event_id) {
            router.push(`/(modules)/events/${data.event_id}` as any);
          } else {
            router.push('/(modules)/events' as any);
          }
          break;
          
        case 'project':
        case 'project_update':
          if (data.project_id) {
            router.push(`/(modules)/projects/${data.project_id}` as any);
          } else {
            router.push('/(modules)/projects' as any);
          }
          break;
          
        case 'team':
        case 'team_update':
          router.push('/(modules)/hr' as any);
          break;
          
        case 'announcement':
        case 'general':
        default:
          router.push('/(dashboard)/notifications' as any);
          break;
      }
    } else {
      // Default: go to notifications screen
      router.push('/(dashboard)/notifications' as any);
    }
  }, [router]);

  /**
   * Initialize push notifications when user is authenticated
   */
  useEffect(() => {
    let isMounted = true;

    const initNotifications = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        // Check permissions first
        const permissionGranted = await pushNotificationService.checkPermissions();
        if (isMounted) setHasPermission(permissionGranted);

        // Initialize push notifications
        const token = await pushNotificationService.initialize();
        if (isMounted && token) {
          setExpoPushToken(token);
        }

        // Setup listeners
        pushNotificationService.setupListeners(
          handleNotificationReceived,
          handleNotificationResponse
        );

        // Check if app was opened via notification
        const lastResponse = await pushNotificationService.getLastNotificationResponse();
        if (lastResponse) {
          handleNotificationResponse({
            notification: lastResponse.notification,
            actionIdentifier: lastResponse.actionIdentifier,
          });
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initNotifications();

    return () => {
      isMounted = false;
      pushNotificationService.removeListeners();
    };
  }, [isAuthenticated, handleNotificationReceived, handleNotificationResponse]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await pushNotificationService.requestPermissions();
      setHasPermission(granted);

      if (granted && !expoPushToken) {
        // Initialize only if we don't have a token yet
        const token = await pushNotificationService.initialize();
        if (token) setExpoPushToken(token);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'To receive important updates, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // This will prompt user to open settings
                if (Platform.OS === 'ios') {
                  // iOS specific
                }
              }
            }
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  /**
   * Send a local notification
   */
  const sendLocalNotification = useCallback(
    async (title: string, body: string, data?: Record<string, any>): Promise<string> => {
      return pushNotificationService.sendLocalNotification(title, body, data);
    },
    []
  );

  /**
   * Clear notification badge
   */
  const clearBadge = useCallback(async () => {
    await pushNotificationService.clearBadge();
  }, []);

  /**
   * Set notification badge count
   */
  const setBadgeCount = useCallback(async (count: number) => {
    await pushNotificationService.setBadgeCount(count);
  }, []);

  const value: PushNotificationContextType = {
    expoPushToken,
    notification,
    hasPermission,
    isLoading,
    requestPermissions,
    sendLocalNotification,
    clearBadge,
    setBadgeCount,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

/**
 * Hook to use push notification context
 */
export function usePushNotifications(): PushNotificationContextType {
  const context = useContext(PushNotificationContext);
  
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  
  return context;
}

export default PushNotificationContext;
