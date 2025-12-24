import "./disable-logs";
import "./global.css";
import { Stack } from "expo-router";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
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

// Cinematic Splash - Brand Story Experience
function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const [stage, setStage] = useState(0);

  // Animation Values - Using more fluid physics
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.95)).current; // Added for subtle breathing
  const bgOpacity = useRef(new Animated.Value(0)).current;

  // Story Sequence
  const STORY = [
    { text: "Simplifying HR", color: '#A78BFA' },      // Soft Purple
    { text: "Mastering Events", color: '#60A5FA' },    // Soft Blue
    { text: "Optimizing Finance", color: '#34D399' },  // Soft Green
    { text: "Sarvagun", color: '#FFFFFF' }         // White (Final)
  ];

  useEffect(() => {
    // Stage 0: Logo Entrance - Slower, more elegant spring
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 12, tension: 10, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start();

    // Sequence Orchestration
    const runSequence = async () => {
      // Helper for buttery text transition
      const showText = () => {
        textTranslateY.setValue(15); // Smaller movement distance for elegance
        textOpacity.setValue(0);
        textScale.setValue(0.95);

        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic) // Smooth entry
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)) // Subtle overshoot
          }),
          Animated.timing(textScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start();
      };

      const hideText = () => {
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic)
          }),
          Animated.timing(textTranslateY, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(textScale, {
            toValue: 1.05, // Slight growth on exit
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
      };

      // Stage 1: HR
      setStage(0);
      showText();
      await new Promise(r => setTimeout(r, 1400)); // Slightly longer read time
      hideText();
      await new Promise(r => setTimeout(r, 200));  // Faster gap

      // Stage 2: Events
      setStage(1);
      showText();
      Animated.timing(bgOpacity, { toValue: 0.5, duration: 800, useNativeDriver: false }).start(); // Smooth color blend
      await new Promise(r => setTimeout(r, 1400));
      hideText();
      await new Promise(r => setTimeout(r, 200));

      // Stage 3: Finance
      setStage(2);
      showText();
      Animated.timing(bgOpacity, { toValue: 1, duration: 800, useNativeDriver: false }).start();
      await new Promise(r => setTimeout(r, 1400));
      hideText();
      await new Promise(r => setTimeout(r, 200));

      // Stage 4: Finale
      setStage(3);
      Animated.timing(bgOpacity, { toValue: 0, duration: 1200, useNativeDriver: false }).start(); // Visual palate cleanser

      // Grand Reveal
      textTranslateY.setValue(30);
      textOpacity.setValue(0);
      textScale.setValue(0.9);

      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1.15, friction: 12, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(textTranslateY, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();

      // Hold then Finish
      await new Promise(r => setTimeout(r, 1800));

      // Elegant Exit
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => onFinish());
    };

    // Start sequence
    setTimeout(runSequence, 500);
  }, []);

  const currentStory = STORY[stage];

  // Interpolate background colors
  const bgColor1 = bgOpacity.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#1A0B2E', '#0F172A', '#064E3B'] // Deep Purple -> Deep Blue -> Deep Green
  });

  const bgColor2 = bgOpacity.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#2D1545', '#1E3A8A', '#065F46']
  });

  return (
    <Animated.View style={[splashStyles.container, { backgroundColor: bgColor1 }]}>
      {/* Background Gradient elements for depth */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.6, backgroundColor: bgColor2 }]} />

      <View style={splashStyles.content}>
        {/* Pulsing Logo */}
        <Animated.View
          style={[
            splashStyles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={splashStyles.logoContainer}>
            <Animated.Image
              source={require("../assets/images/sarvagun_logo.jpg")}
              style={splashStyles.logo}
            />
          </View>
        </Animated.View>

        {/* Dynamic Story Text */}
        <Animated.View
          style={[
            splashStyles.textContainer,
            {
              opacity: textOpacity,
              transform: [
                { translateY: textTranslateY },
                { scale: textScale }
              ],
            },
          ]}
        >
          {stage < 3 ? (
            <Text style={[splashStyles.storyText, { color: currentStory.color }]}>
              {currentStory.text}
            </Text>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={splashStyles.brandName}>Sarvagun</Text>
              <Text style={splashStyles.taglineText}>Work Smarter. Not Harder.</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0B2E', // Fallback
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoWrapper: {
    marginBottom: 40,
    borderRadius: 30, // Updated to match new logo container
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 35,
    elevation: 25,
  },
  logoGradient: {
    padding: 0,
    borderRadius: 30,
    borderWidth: 0, // Removed border completely
    borderColor: 'transparent',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'transparent', // Removed white background
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch', // Force fill to eliminate any gaps
  },
  textContainer: {
    height: 80, // Increased height for better retention
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyText: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 38,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 12,
  },
  taglineText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0, // Hidden as requested, or I can remove the View entirely in next step
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  const { theme, isDark } = useTheme();

  // Background color for smooth rotation transitions
  const rootBgColor = isDark ? '#0F0E10' : '#F5F3F7';

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
    <SafeAreaProvider style={{ flex: 1, backgroundColor: rootBgColor }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBgColor }}>
        <QueryProvider>
          <PushNotificationProvider>
            <PushNotificationInitializer />
            <ErrorBoundary>
              <View style={[styles.container, { backgroundColor: rootBgColor }]}>
                <NetworkStatusBanner />
                <Stack screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: rootBgColor },
                  animation: 'none' // Disable animation during rotation
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
