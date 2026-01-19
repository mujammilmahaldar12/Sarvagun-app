import "./disable-logs";
import "./global.css";
import { Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from "expo-updates";
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';
import { QueryProvider } from '@/lib/queryClient';
import { PushNotificationProvider } from '@/store/pushNotificationContext';
import { NetworkStatusBanner } from '@/components';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationToastProvider } from '@/store/notificationToastContext';

// Hide splash screen immediately on app start
SplashScreen.hideAsync().catch(() => { });

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return <ErrorFallback error={(this.state as any).error} />;
    }

    return (this.props as any).children;
  }
}

// Error fallback component with theme support
function ErrorFallback({ error }: { error: any }) {
  const fallbackTheme = {
    background: '#FFFFFF',
    primary: '#6D376D',
    textSecondary: '#666666',
    text: '#999999'
  };

  return (
    <View style={[styles.errorContainer, { backgroundColor: fallbackTheme.background }]}>
      <Text style={[styles.errorTitle, { color: fallbackTheme.primary }]}>Sarvagun</Text>
      <Text style={[styles.errorMessage, { color: fallbackTheme.textSecondary }]}>
        Something went wrong. Please restart the app.
      </Text>
      {__DEV__ && (
        <Text style={[styles.errorDetails, { color: fallbackTheme.text }]}>
          Error: {String(error)}
        </Text>
      )}
    </View>
  );
}

// Component to initialize push notifications
function PushNotificationInitializer() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const { isDark } = useTheme();

  // Background color for smooth rotation transitions
  const rootBgColor = isDark ? '#0F0E10' : '#F5F3F7';

  useEffect(() => {
    // Check for updates in background (production only)
    if (!__DEV__ && Updates.isEnabled) {
      Updates.checkForUpdateAsync()
        .then(update => {
          if (update.isAvailable) {
            Updates.fetchUpdateAsync().then(() => Updates.reloadAsync());
          }
        })
        .catch(() => { });
    }
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: rootBgColor }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBgColor }}>
        <QueryProvider>
          <PushNotificationProvider>
            <NotificationToastProvider>
              <PushNotificationInitializer />
              <ErrorBoundary>
                <View style={[styles.container, { backgroundColor: rootBgColor }]}>
                  <NetworkStatusBanner />
                  <Stack screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: rootBgColor },
                    animation: 'none'
                  }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(dashboard)" />
                    <Stack.Screen name="(settings)" />
                    <Stack.Screen name="(modules)" />
                    <Stack.Screen name="splash" />
                    <Stack.Screen name="welcome-celebration" />
                  </Stack>
                </View>
              </ErrorBoundary>
            </NotificationToastProvider>
          </PushNotificationProvider>
        </QueryProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...getTypographyStyle('base', 'medium'),
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDetails: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
  },
});
