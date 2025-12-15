import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  // Animation values
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  const navigateToHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) });

    // Content fade in
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    // Loading dots animation
    const animateDot = (dotValue: Animated.SharedValue<number>, delay: number) => {
      dotValue.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.ease }),
            withTiming(0.3, { duration: 400, easing: Easing.ease })
          ),
          -1,
          false
        )
      );
    };

    animateDot(dot1Opacity, 600);
    animateDot(dot2Opacity, 800);
    animateDot(dot3Opacity, 1000);

    // Navigate after splash
    const timer = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 300 });
      contentOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(navigateToHome)();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
    transform: [{ scale: interpolate(dot1Opacity.value, [0.3, 1], [0.8, 1]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
    transform: [{ scale: interpolate(dot2Opacity.value, [0.3, 1], [0.8, 1]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
    transform: [{ scale: interpolate(dot3Opacity.value, [0.3, 1], [0.8, 1]) }],
  }));

  return (
    <View style={styles.container}>
      {/* Subtle gradient background using layered views */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/sarvagun_logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
          <Text style={styles.brandName}>Sarvagun</Text>
          <Text style={styles.tagline}>Work smarter, not harder</Text>
        </Animated.View>

        {/* Loading Dots */}
        <Animated.View style={[styles.loadingContainer, contentAnimatedStyle]}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, contentAnimatedStyle]}>
        <Text style={styles.footerText}>by Blingsquare</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  gradientLayer1: {
    position: 'absolute',
    top: -height * 0.3,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  gradientLayer2: {
    position: 'absolute',
    bottom: -height * 0.2,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
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
  tagline: {
    fontSize: 15,
    color: '#71717A',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  loadingContainer: {
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
