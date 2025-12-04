/**
 * ParticleSystem Component
 * Floating particle background with configurable particles
 * Optimized with Reanimated 3 for smooth 60fps animations
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  colors: string[];
}

interface ParticleSystemProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  variant?: 'circles' | 'gradient-orbs' | 'dots';
}

const FloatingParticle: React.FC<{ particle: Particle; variant: 'circles' | 'gradient-orbs' | 'dots' }> = ({ 
  particle, 
  variant 
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(particle.opacity);

  React.useEffect(() => {
    // Vertical floating motion
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: particle.duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(30, { duration: particle.duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Horizontal drifting
    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: particle.duration * 1.3, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: particle.duration * 1.3, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Pulsing scale
    scale.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: particle.duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: particle.duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Fade in/out
    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(particle.opacity * 1.2, { duration: particle.duration * 0.6 }),
          withTiming(particle.opacity * 0.4, { duration: particle.duration * 0.6 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (variant === 'gradient-orbs') {
    return (
      <Animated.View
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={particle.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientOrb,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
            },
          ]}
        />
      </Animated.View>
    );
  }

  if (variant === 'dots') {
    return (
      <Animated.View
        style={[
          styles.particle,
          styles.dot,
          {
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.colors[0],
          },
          animatedStyle,
        ]}
      />
    );
  }

  // Default: circles
  return (
    <Animated.View
      style={[
        styles.particle,
        styles.circle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          borderColor: particle.colors[0],
        },
        animatedStyle,
      ]}
    />
  );
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count = 15,
  minSize = 20,
  maxSize = 80,
  colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'],
  variant = 'circles',
}) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      const size = minSize + Math.random() * (maxSize - minSize);
      
      return {
        id: index,
        size,
        x: Math.random() * (SCREEN_WIDTH - size),
        y: Math.random() * (SCREEN_HEIGHT - size),
        duration: 2000 + Math.random() * 3000,
        delay: Math.random() * 1000,
        opacity: 0.15 + Math.random() * 0.25,
        colors: variant === 'gradient-orbs' 
          ? [colors[Math.floor(Math.random() * colors.length)], colors[Math.floor(Math.random() * colors.length)]]
          : [colors[Math.floor(Math.random() * colors.length)]],
      } as Particle;
    });
  }, [count, minSize, maxSize, colors, variant]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} variant={variant} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  circle: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  gradientOrb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
