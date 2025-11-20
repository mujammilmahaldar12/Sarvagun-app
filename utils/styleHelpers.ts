/**
 * Style Helper Utilities
 * Reusable functions for generating consistent styles
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { shadows, elevation, spacing, borderRadius, typography } from '../constants/designTokens';
import type { ShadowKey, ElevationKey, SpacingKey, BorderRadiusKey } from '../constants/designTokens';

/**
 * Get platform-appropriate shadow/elevation styles
 */
export const getElevationStyle = (level: ShadowKey | ElevationKey = 'md'): ViewStyle => {
  if (Platform.OS === 'ios') {
    return shadows[level as ShadowKey] || shadows.md;
  } else {
    return {
      elevation: elevation[level as ElevationKey] || elevation.md,
    };
  }
};

/**
 * Combine shadow and elevation for cross-platform consistency
 */
export const getShadowStyle = (level: ShadowKey = 'md'): ViewStyle => {
  return {
    ...shadows[level],
    elevation: elevation[level as ElevationKey] || elevation.md,
  };
};

/**
 * Generate spacing object for margin/padding
 */
export const getSpacing = (
  top?: SpacingKey,
  right?: SpacingKey,
  bottom?: SpacingKey,
  left?: SpacingKey
): ViewStyle => {
  const style: ViewStyle = {};
  
  if (top !== undefined) style.marginTop = spacing[top];
  if (right !== undefined) style.marginRight = spacing[right];
  if (bottom !== undefined) style.marginBottom = spacing[bottom];
  if (left !== undefined) style.marginLeft = spacing[left];
  
  return style;
};

/**
 * Generate padding object
 */
export const getPadding = (
  top?: SpacingKey,
  right?: SpacingKey,
  bottom?: SpacingKey,
  left?: SpacingKey
): ViewStyle => {
  const style: ViewStyle = {};
  
  if (top !== undefined) style.paddingTop = spacing[top];
  if (right !== undefined) style.paddingRight = spacing[right];
  if (bottom !== undefined) style.paddingBottom = spacing[bottom];
  if (left !== undefined) style.paddingLeft = spacing[left];
  
  return style;
};

/**
 * Generate uniform padding/margin
 */
export const getUniformSpacing = (size: SpacingKey, type: 'padding' | 'margin' = 'padding'): ViewStyle => {
  const value = spacing[size];
  return type === 'padding' 
    ? { padding: value }
    : { margin: value };
};

/**
 * Generate border radius style
 */
export const getBorderRadius = (
  topLeft?: BorderRadiusKey,
  topRight?: BorderRadiusKey,
  bottomRight?: BorderRadiusKey,
  bottomLeft?: BorderRadiusKey
): ViewStyle => {
  if (topLeft && !topRight && !bottomRight && !bottomLeft) {
    // If only one value provided, apply to all corners
    return { borderRadius: borderRadius[topLeft] };
  }
  
  const style: ViewStyle = {};
  if (topLeft !== undefined) style.borderTopLeftRadius = borderRadius[topLeft];
  if (topRight !== undefined) style.borderTopRightRadius = borderRadius[topRight];
  if (bottomRight !== undefined) style.borderBottomRightRadius = borderRadius[bottomRight];
  if (bottomLeft !== undefined) style.borderBottomLeftRadius = borderRadius[bottomLeft];
  
  return style;
};

/**
 * Generate text style with typography tokens
 */
export const getTypographyStyle = (
  size: keyof typeof typography.sizes,
  weight?: keyof typeof typography.weights,
  lineHeight?: keyof typeof typography.lineHeights
): TextStyle => {
  const style: TextStyle = {
    fontSize: typography.sizes[size],
  };
  
  if (weight) {
    style.fontWeight = typography.weights[weight];
  }
  
  if (lineHeight) {
    style.lineHeight = typography.sizes[size] * typography.lineHeights[lineHeight];
  }
  
  return style;
};

/**
 * Create a card container style with consistent shadow and border radius
 */
export const getCardStyle = (
  backgroundColor: string,
  shadowLevel: ShadowKey = 'md',
  radiusLevel: BorderRadiusKey = 'lg'
): ViewStyle => {
  return {
    backgroundColor,
    borderRadius: borderRadius[radiusLevel],
    ...getShadowStyle(shadowLevel),
  };
};

/**
 * Create a flex container with common patterns
 */
export const getFlexStyle = (
  direction: 'row' | 'column' = 'column',
  justify?: ViewStyle['justifyContent'],
  align?: ViewStyle['alignItems'],
  gap?: SpacingKey
): ViewStyle => {
  const style: ViewStyle = {
    display: 'flex',
    flexDirection: direction,
  };
  
  if (justify) style.justifyContent = justify;
  if (align) style.alignItems = align;
  if (gap) style.gap = spacing[gap];
  
  return style;
};

/**
 * Create a centered container
 */
export const getCenteredStyle = (): ViewStyle => ({
  justifyContent: 'center',
  alignItems: 'center',
});

/**
 * Apply opacity for different states
 */
export const getOpacityStyle = (state: 'disabled' | 'hover' | 'pressed'): ViewStyle => {
  const opacityMap = {
    disabled: 0.5,
    hover: 0.8,
    pressed: 0.6,
  };
  
  return { opacity: opacityMap[state] };
};

/**
 * Create a circular container style
 */
export const getCircularStyle = (size: number, backgroundColor?: string): ViewStyle => {
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(backgroundColor && { backgroundColor }),
    ...getCenteredStyle(),
  };
};

/**
 * Create an absolute positioned overlay
 */
export const getOverlayStyle = (opacity: number = 0.4, backgroundColor: string = '#000'): ViewStyle => {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor,
    opacity,
  };
};

/**
 * Create a divider style
 */
export const getDividerStyle = (color: string, thickness: number = 1, marginVertical?: SpacingKey): ViewStyle => {
  const style: ViewStyle = {
    height: thickness,
    backgroundColor: color,
  };
  
  if (marginVertical) {
    style.marginVertical = spacing[marginVertical];
  }
  
  return style;
};
