import "./disable-logs";
import "./global.css";
import { Slot } from "expo-router";
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

// Animated Splash Component - Ultra Smooth Buttery Animation
function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { theme, isDark } = useTheme();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    // Ultra smooth sequence
    Animated.sequence([
      // Logo breathes in smoothly
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
      
      // Brief pause
      Animated.delay(200),
      
      // Text fades in ultra smoothly
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer effect continuously
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A2E', '#16213E']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.splashContainer}>
        {/* Floating Logo with Gentle Pulse */}
        <Animated.View
          style={{
            opacity: logoAnim,
            transform: [
              { 
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              },
              { scale: pulseAnim },
            ],
            marginBottom: spacing['2xl'],
          }}
        >
          <View style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 100,
            padding: spacing.lg,
            borderWidth: 2,
            borderColor: 'rgba(139, 92, 246, 0.3)',
          }}>
            {!animationError ? (
              <LottieView
                autoPlay
                loop
                speed={1}
                style={styles.lottieAnimation}
                source={require("../assets/animations/sarvagun.json")}
                onAnimationFailure={() => setAnimationError(true)}
              />
            ) : (
              <View style={[styles.lottieAnimation, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 80, color: '#8B5CF6', fontWeight: '900' }}>S</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* App Name with Shimmer Effect */}
        <Animated.View
          style={{
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
            alignItems: 'center',
          }}
        >
          {/* Text with Shimmer Container */}
          <View style={{ 
            position: 'relative', 
            overflow: 'hidden',
            paddingHorizontal: 20,
            height: 70,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Main Text */}
            <Text
              style={[
                styles.mainText,
                { 
                  color: '#FFFFFF',
                  textAlign: 'center',
                },
              ]}
            >
              SARVAGUN
            </Text>
            
            {/* Shimmer Overlay */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -150,
                width: 400,
                justifyContent: 'center',
                transform: [{ translateX: shimmerTranslate }],
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(139, 92, 246, 0.6)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ 
                  height: 70,
                  width: '100%',
                }}
              />
            </Animated.View>
          </View>

          {/* Subtitle */}
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[styles.subtitle, { color: '#9CA3AF' }]}>
              Enterprise Resource Planning
            </Text>
          </View>
        </Animated.View>

        {/* Elegant Loading Indicator */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 80,
            opacity: textAnim,
          }}
        >
          <View style={styles.loadingBar}>
            <Animated.View
              style={{
                width: '35%',
                height: '100%',
                borderRadius: 10,
                transform: [
                  {
                    translateX: shimmerTranslate.interpolate({
                      inputRange: [-300, 300],
                      outputRange: [-80, 220],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flex: 1,
                  borderRadius: 10,
                }}
              />
            </Animated.View>
          </View>
          <Text style={[styles.tagline, { color: '#6B7280', marginTop: spacing.lg }]}>
            Powered by BlingSquare
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

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
        // Check for updates
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      } catch (e) {
        console.log("Update check failed:", e);
      } finally {
        // Hide native splash and show animated splash
        await SplashScreen.hideAsync();
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
                <Slot />
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
