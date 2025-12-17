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
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-10);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const ringScale1 = useSharedValue(0.8);
  const ringScale2 = useSharedValue(0.8);
  const ringScale3 = useSharedValue(0.8);
  const ringOpacity1 = useSharedValue(0);
  const ringOpacity2 = useSharedValue(0);
  const ringOpacity3 = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const particleOpacity = useSharedValue(0);

  const navigateToHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    // Logo entrance with bounce
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    logoRotation.value = withSpring(0, { damping: 10, stiffness: 80 });

    // Expanding rings animation
    const animateRing = (
      scaleValue: { value: number },
      opacityValue: { value: number },
      delay: number
    ) => {
      scaleValue.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
            withTiming(0.8, { duration: 0 })
          ),
          -1,
          false
        )
      );
      opacityValue.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 200 }),
            withTiming(0, { duration: 1800 }),
            withTiming(0, { duration: 0 })
          ),
          -1,
          false
        )
      );
    };

    animateRing(ringScale1, ringOpacity1, 300);
    animateRing(ringScale2, ringOpacity2, 800);
    animateRing(ringScale3, ringOpacity3, 1300);

    // Content slide up
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    contentTranslateY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));

    // Shimmer effect
    shimmerPosition.value = withDelay(
      600,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.ease }),
        -1,
        false
      )
    );

    // Particle effect
    particleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));

    // Navigate after splash
    const timer = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 400 });
      logoScale.value = withTiming(0.8, { duration: 400 });
      contentOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(navigateToHome)();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ringOpacity1.value,
    transform: [{ scale: ringScale1.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ringOpacity2.value,
    transform: [{ scale: ringScale2.value }],
  }));

  const ring3Style = useAnimatedStyle(() => ({
    opacity: ringOpacity3.value,
    transform: [{ scale: ringScale3.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerPosition.value, [-1, 0, 1], [0, 0.8, 0]),
    transform: [{ translateX: interpolate(shimmerPosition.value, [-1, 1], [-100, 100]) }],
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated particles/stars background */}
      <Animated.View style={[styles.particlesContainer, particleStyle]}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                opacity: Math.random() * 0.5 + 0.3,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Expanding Rings */}
        <View style={styles.ringsContainer}>
          <Animated.View style={[styles.ring, ring1Style]} />
          <Animated.View style={[styles.ring, ring2Style]} />
          <Animated.View style={[styles.ring, ring3Style]} />
        </View>

        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <LinearGradient
            colors={['#6D376D', '#9D5B9D']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInner}>
              <Image
                source={require("../assets/images/sarvagun_logo.jpg")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
          <Text style={styles.brandName}>Sarvagun</Text>
          <Text style={styles.tagline}>Work smarter, not harder</Text>
        </Animated.View>

        {/* Modern Loading Bar */}
        <Animated.View style={[styles.loadingContainer, contentAnimatedStyle]}>
          <View style={styles.loadingBar}>
            <Animated.View style={[styles.loadingProgress, shimmerStyle]} />
          </View>
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
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  ringsContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(157, 91, 157, 0.5)',
  },
  logoWrapper: {
    marginBottom: 40,
    overflow: 'hidden',
    borderRadius: 32,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 32,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    width: 120,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#9D5B9D',
    borderRadius: 2,
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
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
