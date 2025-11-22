/**
 * ListItem Component
 * Enhanced with swipe actions and animations
 */
import React, { useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius, typography } = designSystem;

type ListItemVariant = 'default' | 'card' | 'minimal';

interface SwipeAction {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  leftIconBackground?: string;
  leftContent?: React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  variant?: ListItemVariant;
  swipeActions?: {
    left?: SwipeAction[];
    right?: SwipeAction[];
  };
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  showDivider?: boolean;
  animated?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leftIcon,
  leftIconColor,
  leftIconBackground,
  leftContent,
  rightIcon = 'chevron-forward',
  rightContent,
  variant = 'default',
  swipeActions,
  onPress,
  onLongPress,
  disabled = false,
  showDivider = true,
  animated = true,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const actionTriggered = useRef(false);

  const SWIPE_THRESHOLD = 80;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!swipeActions || disabled) return;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (!swipeActions || disabled) return;
      
      const swipeDistance = Math.abs(event.translationX);
      
      if (swipeDistance > SWIPE_THRESHOLD) {
        if (event.translationX > 0 && swipeActions.left?.[0]) {
          runOnJS(swipeActions.left[0].onPress)();
          runOnJS(haptics.triggerMedium)();
        } else if (event.translationX < 0 && swipeActions.right?.[0]) {
          runOnJS(swipeActions.right[0].onPress)();
          runOnJS(haptics.triggerMedium)();
        }
      }
      
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
    transform: [{ translateX: translateX.value > 0 ? 0 : -100 }],
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
    transform: [{ translateX: translateX.value < 0 ? 0 : 100 }],
  }));

  const handlePressIn = () => {
    if (animated && !disabled) {
      scale.value = withSpring(0.98);
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

  const getVariantStyle = () => {
    switch (variant) {
      case 'card':
        return {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing[4],
          marginVertical: spacing[2],
          ...designSystem.shadows.sm,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
        };
    }
  };

  const iconBackgroundColor = leftIconBackground || `${colors.primary}15`;
  const iconColor = leftIconColor || colors.primary;

  return (
    <View style={{ position: 'relative' }}>
      {/* Swipe Actions Background */}
      {swipeActions && (
        <>
          {/* Left Actions */}
          {swipeActions.left && (
            <Animated.View
              style={[
                leftActionStyle,
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingLeft: spacing[4],
                },
              ]}
            >
              {swipeActions.left.map((action, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: action.backgroundColor,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: borderRadius.md,
                    marginRight: spacing[2],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[1],
                  }}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  {action.label && (
                    <Text style={{ color: action.color, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>
                      {action.label}
                    </Text>
                  )}
                </View>
              ))}
            </Animated.View>
          )}
          
          {/* Right Actions */}
          {swipeActions.right && (
            <Animated.View
              style={[
                rightActionStyle,
                {
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: spacing[4],
                },
              ]}
            >
              {swipeActions.right.map((action, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: action.backgroundColor,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: borderRadius.md,
                    marginLeft: spacing[2],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[1],
                  }}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  {action.label && (
                    <Text style={{ color: action.color, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>
                      {action.label}
                    </Text>
                  )}
                </View>
              ))}
            </Animated.View>
          )}
        </>
      )}

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle, getVariantStyle(), { opacity: disabled ? 0.5 : 1 }]}>
          <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: variant === 'card' ? spacing[4] : spacing[4],
                paddingVertical: spacing[3],
                gap: spacing[3],
              }}
            >
              {/* Left Icon/Content */}
              {leftContent || (leftIcon && (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.md,
                    backgroundColor: iconBackgroundColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={leftIcon} size={20} color={iconColor} />
                </View>
              ))}

              {/* Text Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.sizes.base,
                    fontWeight: typography.weights.medium,
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text
                    style={{
                      fontSize: typography.sizes.sm,
                      color: colors.textSecondary,
                      marginTop: spacing[1],
                    }}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                )}
                {description && (
                  <Text
                    style={{
                      fontSize: typography.sizes.xs,
                      color: colors.textSecondary,
                      marginTop: spacing[1],
                    }}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                )}
              </View>

              {/* Right Icon/Content */}
              {rightContent || (onPress && rightIcon && (
                <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />
              ))}
            </View>

            {/* Divider */}
            {showDivider && variant === 'default' && (
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginLeft: leftIcon || leftContent ? spacing[4] + 40 + spacing[3] : spacing[4],
                }}
              />
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default ListItem;
