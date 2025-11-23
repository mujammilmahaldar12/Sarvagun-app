/**
 * CelebrationAnimation Component
 * Pure Reanimated 2 implementation - no external dependencies
 * Professional celebration with confetti particles and shimmer overlay
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const { spacing, borderRadius, typography } = designSystem;

interface CelebrationAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  duration?: number; // Total animation duration in ms
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: 'circle' | 'square' | 'star';
}

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
const PARTICLE_COUNT = 30;

const generateConfetti = (): ConfettiParticle[] => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: -50,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 12 + 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 400,
    shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as any,
  }));
};

const ConfettiParticle: React.FC<{ particle: ConfettiParticle; trigger: SharedValue<number> }> = ({ 
  particle, 
  trigger 
}) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(particle.rotation);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger.value === 1) {
      // Delayed start for cascade effect
      translateY.value = withDelay(
        particle.delay,
        withTiming(SCREEN_HEIGHT + 50, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.quad),
        })
      );

      translateX.value = withDelay(
        particle.delay,
        withRepeat(
          withTiming(particle.x + (Math.random() * 100 - 50), {
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        )
      );

      rotate.value = withDelay(
        particle.delay,
        withRepeat(
          withTiming(particle.rotation + 360, {
            duration: 2000,
            easing: Easing.linear,
          }),
          -1,
          false
        )
      );

      opacity.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1, { duration: 300 }),
          withDelay(2000, withTiming(0, { duration: 1000 }))
        )
      );
    }
  }, [trigger.value]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: particle.x,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const renderShape = () => {
    switch (particle.shape) {
      case 'circle':
        return (
          <View
            style={{
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
            }}
          />
        );
      case 'square':
        return (
          <View
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
          />
        );
      case 'star':
        return <Ionicons name="star" size={particle.size} color={particle.color} />;
    }
  };

  return <Animated.View style={animatedStyle}>{renderShape()}</Animated.View>;
};

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  onComplete,
  title = 'Welcome to Sarvagun! 🎉',
  subtitle = 'Get ready for an amazing experience',
  duration = 4000,
}) => {
  const { colors } = useThemeStore();

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const shimmerTranslateX = useSharedValue(-SCREEN_WIDTH);
  const confettiTrigger = useSharedValue(0);

  const [confettiParticles] = React.useState(() => generateConfetti());

  useEffect(() => {
    if (visible) {
      // Overlay fade in
      overlayOpacity.value = withTiming(1, { duration: 300 });

      // Scale animation for celebration icon
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );

      // Title entrance
      titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));

      // Shimmer effect
      shimmerTranslateX.value = withDelay(
        400,
        withRepeat(
          withTiming(SCREEN_WIDTH * 2, { duration: 1500, easing: Easing.linear }),
          3,
          false
        )
      );

      // Trigger confetti
      confettiTrigger.value = withDelay(300, withTiming(1));

      // Auto complete
      const timer = setTimeout(() => {
        // Fade out
        overlayOpacity.value = withTiming(0, { duration: 500 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.primary}05`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer Overlay */}
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Confetti Particles */}
      {confettiParticles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} trigger={confettiTrigger} />
      ))}

      {/* Center Content */}
      <View style={styles.content}>
        {/* Celebration Icon */}
        <Animated.View style={[styles.iconContainer, scaleStyle]}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: `${colors.primary}20`,
                borderColor: `${colors.primary}30`,
              },
            ]}
          >
            <Ionicons name="sparkles" size={64} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Title & Subtitle */}
        <Animated.View style={[styles.textContainer, titleStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </Animated.View>

        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <Ionicons name="star" size={24} color={CONFETTI_COLORS[0]} style={styles.decorativeStar1} />
          <Ionicons name="star" size={32} color={CONFETTI_COLORS[1]} style={styles.decorativeStar2} />
          <Ionicons name="star" size={20} color={CONFETTI_COLORS[2]} style={styles.decorativeStar3} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: -SCREEN_WIDTH,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as any,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium as any,
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  decorativeContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pointerEvents: 'none',
  },
  decorativeStar1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    left: spacing['4xl'],
  },
  decorativeStar2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    right: spacing['4xl'],
  },
  decorativeStar3: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.5,
  },
});

export default CelebrationAnimation;
