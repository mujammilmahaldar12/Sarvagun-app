/**
 * OnboardingTour Component
 * Interactive step-by-step guide for first-time users
 * Professional spotlight overlay with tooltips and gesture hints
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { designSystem } from '@/constants/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const { spacing, borderRadius, typography, iconSizes } = designSystem;

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  spotlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position: 'top' | 'center' | 'bottom';
}

interface OnboardingTourProps {
  visible: boolean;
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  visible,
  steps,
  onComplete,
  onSkip,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  const [currentStep, setCurrentStep] = useState(0);

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const progressWidth = useSharedValue(0);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));
      progressWidth.value = withTiming(progress, { duration: 400, easing: Easing.out(Easing.ease) });
    }
  }, [visible, currentStep]);

  const handleNext = () => {
    haptics.triggerLight();
    
    if (isLastStep) {
      // Fade out and complete
      overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onComplete)();
      });
    } else {
      // Animate to next step
      contentOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 400 })
      );
      contentTranslateY.value = withSequence(
        withTiming(30, { duration: 200 }),
        withSpring(0, { damping: 15 })
      );
      
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      haptics.triggerLight();
      
      contentOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 400 })
      );
      contentTranslateY.value = withSequence(
        withTiming(-30, { duration: 200 }),
        withSpring(0, { damping: 15 })
      );
      
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
      }, 200);
    }
  };

  const handleSkip = () => {
    haptics.triggerMedium();
    overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
      if (onSkip) {
        runOnJS(onSkip)();
      } else {
        runOnJS(onComplete)();
      }
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!visible) return null;

  const getContentPosition = (): any => {
    switch (step.position) {
      case 'top':
        return { top: spacing['4xl'] + (Platform.OS === 'android' ? 40 : 0) };
      case 'bottom':
        return { bottom: spacing['4xl'] + 100 };
      case 'center':
      default:
        return { top: '50%', marginTop: -200 };
    }
  };

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      {/* Dark Overlay with Spotlight */}
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]} />
        
        {/* Spotlight Area (if defined) */}
        {step.spotlightArea && (
          <View
            style={[
              styles.spotlight,
              {
                left: step.spotlightArea.x,
                top: step.spotlightArea.y,
                width: step.spotlightArea.width,
                height: step.spotlightArea.height,
                borderRadius: borderRadius.lg,
              },
            ]}
          />
        )}
      </View>

      {/* Skip Button */}
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={[styles.skipText, { color: colors.textInverse || '#FFFFFF' }]}>Skip Tour</Text>
      </Pressable>

      {/* Content Card */}
      <Animated.View style={[styles.content, getContentPosition(), contentStyle]}>
        <LinearGradient
          colors={[colors.surface, colors.background]}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name={step.icon} size={48} color={colors.primary} />
          </View>

          {/* Step Counter */}
          <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>
            Step {currentStep + 1} of {steps.length}
          </Text>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {step.description}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: colors.primary },
                progressStyle,
              ]}
            />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <Pressable
                onPress={handleBack}
                style={[styles.button, styles.backButton, { borderColor: colors.border }]}
              >
                <Ionicons name="arrow-back" size={iconSizes.sm} color={colors.text} />
                <Text style={[styles.buttonText, { color: colors.text }]}>Back</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleNext}
              style={[
                styles.button,
                styles.nextButton,
                { backgroundColor: colors.primary },
                currentStep === 0 && { flex: 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.textInverse || '#FFFFFF' }]}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={isLastStep ? 'checkmark' : 'arrow-forward'}
                size={iconSizes.sm}
                color={colors.textInverse || '#FFFFFF'}
              />
            </Pressable>
          </View>

          {/* Gesture Hint */}
          {!isLastStep && (
            <View style={styles.hintContainer}>
              <Ionicons name="hand-left-outline" size={iconSizes.sm} color={colors.textSecondary} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Swipe to navigate
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Bottom Dots Indicator */}
      <View style={styles.dotsContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentStep ? colors.primary : `${colors.textSecondary}30`,
                width: index === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    right: spacing.lg,
    padding: spacing.md,
    zIndex: 10,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
  },
  content: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardGradient: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  stepCounter: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular as any,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: 48,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  nextButton: {
    // backgroundColor set inline
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: spacing['4xl'] + 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: borderRadius.full,
  },
});

export default OnboardingTour;
