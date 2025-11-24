import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const { spacing, typography, borderRadius } = designSystem;

export default function WelcomeCelebration() {
  const { colors } = useThemeStore();
  const { markAsNotFirstTime } = useFirstTimeUser();
  const confettiRef = useRef<LottieView>(null);
  const celebrationRef = useRef<LottieView>(null);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Start animations
    confettiRef.current?.play();
    celebrationRef.current?.play();

    // Animated entrance
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 80 }),
      withSpring(1, { damping: 15, stiffness: 100 })
    );
    
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 90 });

    // Progress bar animation
    progressWidth.value = withTiming(100, { 
      duration: 3500, 
      easing: Easing.linear 
    });

    // Auto-navigate after animation
    const timer = setTimeout(() => {
      navigateToDashboard();
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, []);

  const navigateToDashboard = async () => {
    await markAsNotFirstTime();
    router.replace('/(dashboard)/home');
  };

  const handleSkip = () => {
    navigateToDashboard();
  };

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.primary, colors.primaryHover, '#8B5CF6', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti Animation - Full Screen */}
      <LottieView
        ref={confettiRef}
        source={require('@/assets/animations/sarvagun.json')}
        style={styles.confettiAnimation}
        loop={true}
        autoPlay
      />

      {/* Skip Button */}
      <Animated.View 
        entering={FadeIn.delay(1000).duration(500)}
        style={styles.skipButton}
      >
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => ({
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={styles.skipText}>Skip →</Text>
        </Pressable>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, mainAnimatedStyle]}>
        {/* Celebration Icon/Animation */}
        <View style={styles.celebrationContainer}>
          <LottieView
            ref={celebrationRef}
            source={require('@/assets/animations/sarvagun.json')}
            style={styles.celebrationAnimation}
            autoPlay
            loop={false}
          />
          <View style={styles.iconOverlay}>
            <Ionicons name="rocket" size={64} color="#FFFFFF" />
          </View>
        </View>

        {/* Welcome Text */}
        <Animated.Text 
          entering={FadeInUp.delay(400).duration(600).springify()}
          style={styles.title}
        >
          🎉 Welcome to Sarvagun!
        </Animated.Text>

        <Animated.Text 
          entering={FadeInUp.delay(600).duration(600).springify()}
          style={styles.subtitle}
        >
          Your all-in-one workspace for HR, Projects, Events & Finance
        </Animated.Text>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {[
            { icon: 'people', text: 'Manage Team', color: '#FF6B6B', delay: 800 },
            { icon: 'briefcase', text: 'Track Projects', color: '#4ECDC4', delay: 900 },
            { icon: 'calendar', text: 'Plan Events', color: '#FFD93D', delay: 1000 },
            { icon: 'cash', text: 'Handle Finance', color: '#95E1D3', delay: 1100 },
          ].map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(feature.delay).duration(500).springify()}
              style={styles.featureItem}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Loading Progress */}
        <Animated.View 
          entering={FadeIn.delay(1200).duration(500)}
          style={styles.progressContainer}
        >
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>
          <Text style={styles.loadingText}>Setting up your workspace...</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Decorative Elements */}
      <Animated.View 
        entering={FadeIn.delay(1500).duration(800)}
        style={styles.bottomDecoration}
      >
        <View style={styles.decorativeDots}>
          {[0, 1, 2].map((i) => (
            <View 
              key={i} 
              style={[
                styles.dot,
                { 
                  opacity: 0.3 + (i * 0.2),
                  transform: [{ scale: 0.8 + (i * 0.1) }]
                }
              ]} 
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiAnimation: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing[4],
    zIndex: 3,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    zIndex: 2,
    width: '100%',
  },
  celebrationContainer: {
    width: 180,
    height: 180,
    marginBottom: spacing[6],
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationAnimation: {
    width: 220,
    height: 220,
    position: 'absolute',
  },
  iconOverlay: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[3],
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 28,
    paddingHorizontal: spacing[4],
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[8],
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    minWidth: 140,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[3],
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  decorativeDots: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
