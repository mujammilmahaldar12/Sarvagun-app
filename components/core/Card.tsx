/**
 * Card Component
 * Consolidates AppCard + KPICard with advanced animations
 */
import React, { useRef } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius, typography } = designSystem;

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient' | 'kpi';
type ShadowLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  // Content
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  
  // KPI specific
  value?: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  gradientColors?: [string, string];
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  
  // Variants
  variant?: CardVariant;
  shadow?: ShadowLevel;
  padding?: keyof typeof spacing;
  
  // Interactions
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  
  // Animations
  loading?: boolean;
  animated?: boolean;
  
  // Styles
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  value,
  icon,
  gradientColors,
  trend,
  trendValue,
  variant = 'default',
  shadow = 'md',
  padding = 'base',
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  animated = true,
  style,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const flip = useSharedValue(0);

  // Shimmer animation for loading
  React.useEffect(() => {
    if (loading) {
      shimmer.value = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      );
      const interval = setInterval(() => {
        shimmer.value = withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      {
        rotateY: `${interpolate(
          flip.value,
          [0, 1],
          [0, 180],
          Extrapolate.CLAMP
        )}deg`,
      },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.8]),
  }));

  const handlePressIn = () => {
    if (animated && !disabled) {
      scale.value = withSpring(0.97);
      haptics.triggerSelection();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      haptics.triggerLight();
      onPress();
    }
  };

  const handleLongPress = () => {
    if (!disabled && onLongPress) {
      haptics.triggerMedium();
      onLongPress();
    }
  };

  const getShadowStyle = (): ViewStyle => {
    const shadows = {
      none: {},
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
      xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    };
    return shadows[shadow];
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          ...getShadowStyle(),
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
        };
    }
  };

  // KPI Card variant
  if (variant === 'kpi') {
    const defaultGradient: [string, string] = [colors.primary, colors.primaryHover];
    const cardGradient = gradientColors || defaultGradient;

    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        style={[{ flex: 1 }, style]}
      >
        <Animated.View style={[animatedStyle, { flex: 1 }]}>
          <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: borderRadius.lg,
              padding: spacing[5],
              minHeight: 140,
              opacity: disabled ? 0.5 : 1,
              ...getShadowStyle(),
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, opacity: 0.9 }}>
                  {title}
                </Text>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: typography.sizes['3xl'],
                    fontWeight: typography.weights.bold,
                    marginTop: spacing[2],
                    marginBottom: spacing[1],
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {value}
                </Text>
                {subtitle && (
                  <Text style={{ color: '#FFFFFF', fontSize: typography.sizes.xs, opacity: 0.85, marginTop: spacing[1] }}>
                    {subtitle}
                  </Text>
                )}
              </View>
              {icon && (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: borderRadius.full,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={icon} size={28} color="#FFF" />
                </View>
              )}
            </View>

            {trend && trendValue && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: spacing[3],
                  paddingTop: spacing[3],
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons
                  name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                  size={16}
                  color="#FFF"
                />
                <Text style={{ color: '#FFFFFF', fontSize: typography.sizes.xs, marginLeft: spacing[1], opacity: 0.9 }}>
                  {trendValue}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  // Gradient Card variant
  if (variant === 'gradient' && gradientColors) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        style={style}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: borderRadius.lg,
              padding: spacing[padding],
              opacity: disabled ? 0.5 : 1,
              ...getShadowStyle(),
            }}
          >
            {loading && (
              <Animated.View
                style={[
                  shimmerStyle,
                  {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: borderRadius.lg,
                  },
                ]}
              />
            )}
            {title && (
              <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: '#FFFFFF', marginBottom: subtitle ? spacing[1] : spacing[3] }}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={{ fontSize: typography.sizes.sm, color: '#FFFFFF', opacity: 0.9, marginBottom: spacing[3] }}>
                {subtitle}
              </Text>
            )}
            {children}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  // Default, Elevated, Outlined variants
  const CardContent = (
    <Animated.View
      style={[
        animatedStyle,
        getVariantStyle(),
        {
          borderRadius: borderRadius.lg,
          padding: spacing[padding],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && (
        <Animated.View
          style={[
            shimmerStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        />
      )}
      {title && (
        <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: subtitle ? spacing[1] : spacing[3] }}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing[3] }}>
          {subtitle}
        </Text>
      )}
      {children}
    </Animated.View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
};

export default Card;
