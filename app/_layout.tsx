import "./disable-logs";
import "./global.css";
import { Stack } from "expo-router";
import { View, Text, StyleSheet, Animated } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from "expo-updates";
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';
import { QueryProvider } from '@/lib/queryClient';
import { PushNotificationProvider } from '@/store/pushNotificationContext';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from "lottie-react-native";
import { NetworkStatusBanner } from '@/components';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Keep the native splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

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

// Animated Splash Component - Modern Professional Design
function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo entrance - smooth scale and fade
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Content fade in with delay
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Pulsing dots animation
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1Anim, 0);
    animateDot(dot2Anim, 150);
    animateDot(dot3Anim, 300);

    // Navigate after splash
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={splashStyles.container}>
      {/* Subtle gradient circles */}
      <View style={splashStyles.gradientCircle1} />
      <View style={splashStyles.gradientCircle2} />

      {/* Main Content */}
      <View style={splashStyles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            splashStyles.logoWrapper,
            {
              opacity: logoAnim,
              transform: [
                {
                  scale: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={splashStyles.logoContainer}>
            <Animated.Image
              source={require("../assets/images/sarvagun_logo.jpg")}
              style={splashStyles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Brand Text */}
        <Animated.View
          style={[
            splashStyles.textContainer,
            { opacity: contentAnim },
          ]}
        >
          <Text style={splashStyles.brandName}>Sarvagun</Text>
          <Text style={splashStyles.taglineText}>Work smarter, not harder</Text>
        </Animated.View>

        {/* Loading Dots */}
        <Animated.View
          style={[
            splashStyles.dotsContainer,
            { opacity: contentAnim },
          ]}
        >
          <Animated.View style={[splashStyles.dot, { opacity: dot1Anim }]} />
          <Animated.View style={[splashStyles.dot, { opacity: dot2Anim }]} />
          <Animated.View style={[splashStyles.dot, { opacity: dot3Anim }]} />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[splashStyles.footer, { opacity: contentAnim }]}>
        <Text style={splashStyles.footerText}>by Blingsquare</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  gradientCircle1: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(236, 72, 153, 0.04)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  logoWrapper: {
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 15,
    color: '#71717A',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

// Component to initialize push notifications
function PushNotificationInitializer() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Only check for updates in production (not in development)
        if (!__DEV__ && Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          } catch (updateError) {
            // Silently fail update check - don't crash the app
            console.log("Update check skipped or failed:", updateError);
          }
        }
      } catch (e) {
        console.log("Prepare failed:", e);
      } finally {
        // Hide native splash and show animated splash
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.log("Splash hide failed:", splashError);
        }
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowAnimatedSplash(false);
  };

  if (!appReady || showAnimatedSplash) {
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <PushNotificationProvider>
            <PushNotificationInitializer />
            <ErrorBoundary>
              <View style={styles.container}>
                <NetworkStatusBanner />
                <Stack screenOptions={{ headerShown: false }}>
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
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  mainText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...getTypographyStyle('sm', 'medium'),
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagline: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingBar: {
    width: 180,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
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
