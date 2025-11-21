/**
 * Unified Design System for Sarvagun App
 * Professional design tokens with proper theme support
 * Replaces: themeStore.tsx, colors.ts, and enhances designTokens.ts
 */

// Base Color Palette
const baseColors = {
  // Brand Colors
  purple: {
    50: '#F8F4F9',
    100: '#F0E6F2',
    200: '#E0CCE5',
    300: '#D1B3D8',
    400: '#C299CB',
    500: '#6D376D', // Primary
    600: '#5A2D5A',
    700: '#472447',
    800: '#341B34',
    900: '#211221',
  },
  
  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Semantic Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    900: '#064E3B',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    900: '#92400E',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    900: '#991B1B',
  },
  
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    900: '#1E3A8A',
  },
} as const;

// Chart Colors for Analytics
const chartColors = {
  primary: '#6D376D',
  secondary: '#8B5CF6',
  tertiary: '#14B8A6',
  quaternary: '#F59E0B',
  quinary: '#EF4444',
  senary: '#3B82F6',
  septenary: '#EC4899',
  octonary: '#06B6D4',
} as const;

// Status Colors with Semantic Meaning
const statusColors = {
  // Lead Status
  pending: {
    light: { bg: baseColors.warning[50], text: baseColors.warning[600] },
    dark: { bg: baseColors.warning[900], text: baseColors.warning[100] },
  },
  converted: {
    light: { bg: baseColors.success[50], text: baseColors.success[600] },
    dark: { bg: baseColors.success[900], text: baseColors.success[100] },
  },
  rejected: {
    light: { bg: baseColors.error[50], text: baseColors.error[600] },
    dark: { bg: baseColors.error[900], text: baseColors.error[100] },
  },
  
  // Event Status
  planned: {
    light: { bg: baseColors.info[50], text: baseColors.info[600] },
    dark: { bg: baseColors.info[900], text: baseColors.info[100] },
  },
  inProgress: {
    light: { bg: baseColors.purple[100], text: baseColors.purple[600] },
    dark: { bg: baseColors.purple[800], text: baseColors.purple[200] },
  },
  completed: {
    light: { bg: baseColors.success[50], text: baseColors.success[600] },
    dark: { bg: baseColors.success[900], text: baseColors.success[100] },
  },
  cancelled: {
    light: { bg: baseColors.error[50], text: baseColors.error[600] },
    dark: { bg: baseColors.error[900], text: baseColors.error[100] },
  },
} as const;

// Theme Definitions
export const lightTheme = {
  // Base Colors
  background: '#F5F3F7',
  surface: baseColors.neutral[0],
  surfaceElevated: baseColors.neutral[50],
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Primary Brand
  primary: baseColors.purple[500],
  primaryHover: baseColors.purple[600],
  primaryPressed: baseColors.purple[700],
  primaryDisabled: baseColors.purple[300],
  
  // Text Colors
  text: baseColors.neutral[900],
  textSecondary: baseColors.neutral[600],
  textTertiary: baseColors.neutral[400],
  textInverse: baseColors.neutral[0],
  textDisabled: baseColors.neutral[400],
  
  // Border Colors
  border: '#E3DCE9',
  borderSecondary: baseColors.neutral[200],
  borderFocus: baseColors.purple[500],
  
  // Interactive Colors
  link: baseColors.purple[500],
  linkHover: baseColors.purple[600],
  
  // Semantic Colors
  success: baseColors.success[500],
  warning: baseColors.warning[500],
  error: baseColors.error[500],
  info: baseColors.info[500],
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',
} as const;

export const darkTheme = {
  // Base Colors
  background: '#0F0E10',
  surface: '#1A171D',
  surfaceElevated: '#252229',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Primary Brand
  primary: '#9D5B9D',
  primaryHover: '#B066B0',
  primaryPressed: '#8A4A8A',
  primaryDisabled: '#5A3D5A',
  
  // Text Colors
  text: baseColors.neutral[50],
  textSecondary: baseColors.neutral[300],
  textTertiary: baseColors.neutral[400],
  textInverse: baseColors.neutral[900],
  textDisabled: baseColors.neutral[500],
  
  // Border Colors
  border: '#2A242E',
  borderSecondary: baseColors.neutral[700],
  borderFocus: '#9D5B9D',
  
  // Interactive Colors
  link: '#9D5B9D',
  linkHover: '#B066B0',
  
  // Semantic Colors
  success: baseColors.success[500],
  warning: baseColors.warning[500],
  error: baseColors.error[500],
  info: baseColors.info[500],
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
  shadowHeavy: 'rgba(0, 0, 0, 0.4)',
} as const;

// Typography Scale
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing Scale (4px base unit)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Border Radius Scale
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Shadow Presets
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Animation Durations
export const duration = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Layout Constants
export const layout = {
  screenPadding: spacing[4],
  containerMaxWidth: 1200,
  headerHeight: 56,
  tabBarHeight: 64,
  cardMinHeight: 80,
  touchTarget: 44,
} as const;

// Icon Sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
} as const;

// Export Types
export type ThemeName = 'light' | 'dark';
export type Theme = typeof lightTheme;
export type SpacingKey = keyof typeof spacing;
export type TypographySizeKey = keyof typeof typography.sizes;
export type TypographyWeightKey = keyof typeof typography.weights;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type IconSizeKey = keyof typeof iconSizes;

// Export Design System
export const designSystem = {
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  baseColors,
  chartColors,
  statusColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  duration,
  layout,
  iconSizes,
} as const;

export default designSystem;