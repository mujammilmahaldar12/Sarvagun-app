/**
 * Badge Component
 * Consolidates Chip + StatusBadge with animations
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

type BadgeVariant = 'filled' | 'outlined' | 'subtle' | 'status' | 'dot';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
type StatusType =
  | 'success' | 'error' | 'warning' | 'info'
  | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  | 'draft' | 'converted' | 'planned' | 'in-progress' | 'completed' | 'cancelled';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  status?: StatusType;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  closeable?: boolean;
  onClose?: () => void;
  onPress?: () => void;
  animated?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'subtle',
  size = 'md',
  status,
  color,
  icon,
  closeable = false,
  onClose,
  onPress,
  animated = true,
  pulse = false,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  
  const scale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseAnim.value = withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
      const interval = setInterval(() => {
        pulseAnim.value = withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animated ? scale.value * pulseAnim.value : 1 }],
  }));

  const handlePressIn = () => {
    if (animated && (onPress || closeable)) {
      scale.value = withSpring(0.95);
      haptics.triggerSelection();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (onPress) {
      haptics.triggerLight();
      onPress();
    }
  };

  const handleClose = () => {
    if (onClose) {
      haptics.triggerLight();
      scale.value = withSequence(
        withSpring(1.1),
        withTiming(0, { duration: 200 }, () => {
          onClose();
        })
      );
    }
  };

  // Status color mapping
  const getStatusColor = (statusType: StatusType): string => {
    const statusColors: Record<StatusType, string> = {
      success: colors.success || '#10B981',
      error: colors.error || '#EF4444',
      warning: colors.warning || '#F59E0B',
      info: colors.primary,
      pending: colors.warning || '#F59E0B',
      approved: colors.success || '#10B981',
      rejected: colors.error || '#EF4444',
      active: colors.success || '#10B981',
      inactive: colors.textSecondary,
      draft: colors.textSecondary,
      converted: colors.success || '#10B981',
      planned: colors.primary,
      'in-progress': colors.primaryHover,
      completed: colors.success || '#10B981',
      cancelled: colors.error || '#EF4444',
    };
    return statusColors[statusType];
  };

  // Status icon mapping
  const getStatusIcon = (statusType: StatusType): keyof typeof Ionicons.glyphMap => {
    const statusIcons: Record<StatusType, keyof typeof Ionicons.glyphMap> = {
      success: 'checkmark-circle',
      error: 'close-circle',
      warning: 'warning',
      info: 'information-circle',
      pending: 'hourglass-outline',
      approved: 'checkmark-circle',
      rejected: 'close-circle',
      active: 'checkmark-circle',
      inactive: 'remove-circle',
      draft: 'create-outline',
      converted: 'checkmark-done-circle',
      planned: 'calendar-outline',
      'in-progress': 'time-outline',
      completed: 'checkmark-done-circle',
      cancelled: 'ban',
    };
    return statusIcons[statusType];
  };

  const badgeColor = status ? getStatusColor(status) : color || colors.primary;
  const badgeIcon = status ? getStatusIcon(status) : icon;

  // Size configurations
  const sizeConfig = {
    xs: { padding: spacing[1], fontSize: typography.sizes.xs, iconSize: 12 },
    sm: { padding: spacing[1] + 2, fontSize: typography.sizes.xs, iconSize: 14 },
    md: { padding: spacing[2], fontSize: typography.sizes.sm, iconSize: 16 },
    lg: { padding: spacing[2] + 2, fontSize: typography.sizes.base, iconSize: 18 },
  };

  const currentSize = sizeConfig[size];

  // Safe color with fallback
  const safeColor = badgeColor || colors.primary || '#3B82F6';

  // Variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: safeColor,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: safeColor,
        };
      case 'subtle':
        return {
          backgroundColor: `${safeColor}20`,
          borderWidth: 0,
        };
      case 'status':
        return {
          backgroundColor: `${safeColor}15`,
          borderWidth: 0,
        };
      case 'dot':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: `${safeColor}20`,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'filled') return '#FFFFFF';
    return safeColor;
  };

  // Dot variant
  if (variant === 'dot') {
    return (
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: size === 'xs' ? 6 : size === 'sm' ? 8 : size === 'md' ? 10 : 12,
            height: size === 'xs' ? 6 : size === 'sm' ? 8 : size === 'md' ? 10 : 12,
            borderRadius: borderRadius.full,
            backgroundColor: safeColor,
          }}
        />
      </Animated.View>
    );
  }

  const BadgeContent = (
    <Animated.View
      style={[
        animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: currentSize.padding + 4,
          paddingVertical: currentSize.padding,
          borderRadius: borderRadius.full,
          gap: spacing[1],
          alignSelf: 'flex-start',
          ...getVariantStyle(),
        },
      ]}
    >
      {badgeIcon && <Ionicons name={badgeIcon} size={currentSize.iconSize} color={getTextColor()} />}
      {label && (
        <Text
          style={{
            fontSize: currentSize.fontSize,
            fontWeight: typography.weights.semibold,
            color: getTextColor(),
          }}
        >
          {label}
        </Text>
      )}
      {closeable && onClose && (
        <Pressable onPress={handleClose} hitSlop={8}>
          <Ionicons name="close" size={currentSize.iconSize} color={getTextColor()} />
        </Pressable>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {BadgeContent}
      </Pressable>
    );
  }

  return BadgeContent;
};

export default Badge;
