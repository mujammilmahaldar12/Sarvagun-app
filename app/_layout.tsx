import "./disable-logs";
import "./global.css";
import { Slot } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from "expo-updates";
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';
import { QueryProvider } from '@/lib/queryClient';

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
  // Use a simple fallback theme for error state
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

export default function RootLayout() {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      } catch (e) {
        console.log("Update check failed:", e);
      }
    }

    checkForUpdates();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <ErrorBoundary>
            <View style={styles.container}>
              <Slot />
            </View>
          </ErrorBoundary>
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
