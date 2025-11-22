import { withSpring, withTiming, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Spring animation configurations
export const SPRING_CONFIGS = {
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 150,
  } as WithSpringConfig,
  bouncy: {
    damping: 15,
    mass: 1,
    stiffness: 300,
  } as WithSpringConfig,
  snappy: {
    damping: 25,
    mass: 1,
    stiffness: 400,
  } as WithSpringConfig,
} as const;

// Timing animation configurations
export const TIMING_CONFIGS = {
  fast: {
    duration: 150,
  } as WithTimingConfig,
  normal: {
    duration: 250,
  } as WithTimingConfig,
  slow: {
    duration: 350,
  } as WithTimingConfig,
} as const;

// Animation scale values
export const SCALE_VALUES = {
  press: 0.95,
  active: 1.02,
  small: 0.85,
  normal: 1,
} as const;

// Opacity values
export const OPACITY_VALUES = {
  hidden: 0,
  disabled: 0.5,
  pressed: 0.8,
  visible: 1,
} as const;

// Rotation values (in degrees)
export const ROTATION_VALUES = {
  none: '0deg',
  quarter: '90deg',
  half: '180deg',
  full: '360deg',
} as const;

// Translation values
export const TRANSLATION_VALUES = {
  none: 0,
  small: 5,
  medium: 10,
  large: 20,
} as const;

// Ripple animation configuration
export const RIPPLE_CONFIG = {
  duration: 400,
  maxRadius: 100,
  initialOpacity: 0.3,
  finalOpacity: 0,
} as const;

// Haptic feedback type mappings
export const HAPTIC_TYPES = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  // Note: SelectionType is deprecated in newer versions of expo-haptics
  // selection: Haptics.SelectionType,
  notification: {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  },
} as const;

// Animation helper functions
export const createSpringAnimation = (
  value: number,
  config: keyof typeof SPRING_CONFIGS = 'gentle'
) => {
  'worklet';
  return withSpring(value, SPRING_CONFIGS[config]);
};

export const createTimingAnimation = (
  value: number,
  config: keyof typeof TIMING_CONFIGS = 'normal'
) => {
  'worklet';
  return withTiming(value, TIMING_CONFIGS[config]);
};

// Button animation presets
export const BUTTON_ANIMATIONS = {
  press: {
    scale: SCALE_VALUES.press,
    opacity: OPACITY_VALUES.pressed,
  },
  release: {
    scale: SCALE_VALUES.normal,
    opacity: OPACITY_VALUES.visible,
  },
  active: {
    scale: SCALE_VALUES.active,
    opacity: OPACITY_VALUES.visible,
  },
} as const;

// Card animation presets
export const CARD_ANIMATIONS = {
  press: {
    scale: SCALE_VALUES.press,
    translateY: TRANSLATION_VALUES.small,
  },
  release: {
    scale: SCALE_VALUES.normal,
    translateY: TRANSLATION_VALUES.none,
  },
  hover: {
    scale: SCALE_VALUES.active,
    translateY: -TRANSLATION_VALUES.small,
  },
} as const;

// Animation duration constants
export const DURATION = {
  quick: 150,
  normal: 250,
  slow: 400,
  entrance: 300,
  exit: 200,
} as const;

// Easing functions (for timing animations)
export const EASING = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  linear: 'linear',
} as const;

export type SpringConfigType = keyof typeof SPRING_CONFIGS;
export type TimingConfigType = keyof typeof TIMING_CONFIGS;
export type HapticType = keyof typeof HAPTIC_TYPES;
export type AnimationDuration = keyof typeof DURATION;