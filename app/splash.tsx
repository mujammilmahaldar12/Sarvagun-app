import React, { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ParticleSystem } from '@/components/ui/ParticleSystem';
import { GRADIENT_PRESETS } from '@/utils/gradientAnimations';

export default function Splash() {
  const { theme, isDark } = useTheme();
  const animationRef = useRef(null);
  const [animationError, setAnimationError] = useState(false);
  
  // Minimal professional animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.95);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(20);

  useEffect(() => {
    // Clean, professional fade-in
    logoOpacity.value = withTiming(1, { 
      duration: 800, 
      easing: Easing.out(Easing.cubic) 
    });
    
    logoScale.value = withTiming(1, { 
      duration: 800, 
      easing: Easing.out(Easing.cubic) 
    });

    // Content follows smoothly
    contentOpacity.value = withDelay(
      400,
      withTiming(1, { 
        duration: 800, 
        easing: Easing.out(Easing.cubic) 
      })
    );
    
    contentY.value = withDelay(
      400,
      withTiming(0, { 
        duration: 800, 
        easing: Easing.out(Easing.cubic) 
      })
    );

    // Navigate after minimal delay
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Clean animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <LinearGradient
      colors={isDark 
        ? ['#1A0B2E', '#2D1545', '#3E1F5C', '#4A276E'] 
        : ['#FFFFFF', '#FCF9FD', '#F8F4F9', '#F0E6F2']
      }
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Subtle purple gradient blur circles in background */}
      <Animated.View style={[styles.bgCircle, styles.bgCircle1, logoAnimatedStyle]} />
      <Animated.View style={[styles.bgCircle, styles.bgCircle2, subtitleAnimatedStyle]} />

      {/* Clean Logo */}
      {!animationError && (
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <LottieView
            ref={animationRef}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
            source={require("../assets/animations/sarvagun.json")}
            onAnimationFailure={(error) => {
              if (__DEV__) {
                console.warn('Lottie animation failed:', error);
              }
              setAnimationError(true);
            }}
          />
        </Animated.View>
      )}

      {/* Clean Text - Single fade in */}
      <Animated.View style={[styles.contentContainer, subtitleAnimatedStyle]}>
        <Text style={[styles.brandName, { color: theme.text }]}>
          SARVAGUN
        </Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enterprise Resource Planning
        </Text>

        {/* Minimal loading indicator */}
        <Animated.View style={[styles.loadingBar, subtitleAnimatedStyle]}>
          <Animated.View style={[styles.loadingProgress, { backgroundColor: theme.primary }]} />
        </Animated.View>

        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Powered by BlingSquare
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.06,
  },
  bgCircle1: {
    width: 400,
    height: 400,
    backgroundColor: '#6D376D',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    width: 350,
    height: 350,
    backgroundColor: '#8B5CF6',
    bottom: -80,
    left: -80,
  },
  logoContainer: {
    marginBottom: spacing.xl * 1.5,
  },
  lottieAnimation: {
    width: 160,
    height: 160,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...getTypographyStyle('sm', 'medium'),
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: 13,
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  loadingBar: {
    width: 200,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: spacing.xl,
  },
  loadingProgress: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  tagline: {
    ...getTypographyStyle('xs', 'regular'),
    letterSpacing: 0.5,
    opacity: 0.4,
    marginTop: spacing.md,
  },
});
