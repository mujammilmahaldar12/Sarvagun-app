/**
 * FAB (Floating Action Button) Component
 * Enhanced with speed dial and animations
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius, typography } = designSystem;

type FABVariant = 'default' | 'extended' | 'mini';
type FABPosition = 'bottom-right' | 'bottom-center' | 'bottom-left';

interface FABAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  variant?: FABVariant;
  position?: FABPosition;
  color?: string;
  actions?: FABAction[];
  onPress?: () => void;
  size?: number;
}

export const FAB: React.FC<FABProps> = ({
  icon = 'add',
  label,
  variant = 'default',
  position = 'bottom-right',
  color,
  actions = [],
  onPress,
  size,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const fabColor = color || colors.primary;
  
  const fabSize = size || (variant === 'mini' ? 48 : variant === 'extended' ? 56 : 60);

  React.useEffect(() => {
    rotation.value = withSpring(isOpen ? 135 : 0);
  }, [isOpen]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
    haptics.triggerSelection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    haptics.triggerMedium();
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onPress) {
      onPress();
    }
  };

  const handleActionPress = (action: FABAction) => {
    haptics.triggerLight();
    action.onPress();
    setIsOpen(false);
  };

  const getPositionStyle = () => {
    const bottomOffset = Platform.OS === 'ios' ? 30 : 30;  // Fixed 30px from bottom
    switch (position) {
      case 'bottom-center':
        return {
          bottom: bottomOffset,
          alignSelf: 'center' as const,
        };
      case 'bottom-left':
        return {
          bottom: bottomOffset,
          left: 20,  // 20px from left as requested
        };
      case 'bottom-right':
      default:
        return {
          bottom: bottomOffset,
          right: 20,
        };
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        ...getPositionStyle(),
        alignItems: position === 'bottom-right' ? 'flex-end' : position === 'bottom-left' ? 'flex-start' : 'center',
      }}
    >
      {/* Speed Dial Actions */}
      {actions.length > 0 && isOpen && (
        <View style={{ marginBottom: spacing[3], gap: spacing[3] }}>
          {actions.map((action, index) => {
            const actionScale = useSharedValue(0);
            
            React.useEffect(() => {
              actionScale.value = withSpring(isOpen ? 1 : 0);
            }, [isOpen]);

            const actionStyle = useAnimatedStyle(() => ({
              transform: [{ scale: actionScale.value }],
              opacity: interpolate(actionScale.value, [0, 1], [0, 1], Extrapolate.CLAMP),
            }));

            return (
              <Animated.View
                key={index}
                style={[
                  actionStyle,
                  {
                    flexDirection: position === 'bottom-left' ? 'row' : 'row-reverse',
                    alignItems: 'center',
                    gap: spacing[2],
                  },
                ]}
              >
                {/* Label */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: borderRadius.md,
                    ...designSystem.shadows.md,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      color: colors.text,
                    }}
                  >
                    {action.label}
                  </Text>
                </View>

                {/* Action Button */}
                <Pressable
                  onPress={() => handleActionPress(action)}
                  style={({ pressed }) => ({
                    width: 48,
                    height: 48,
                    borderRadius: borderRadius.full,
                    backgroundColor: action.color || colors.surface,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                    ...designSystem.shadows.md,
                  })}
                >
                  <Ionicons name={action.icon} size={24} color={action.color ? '#FFF' : colors.text} />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Main FAB */}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            scaleStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: fabSize,
              paddingHorizontal: variant === 'extended' ? spacing[4] : 0,
              minWidth: fabSize,
              borderRadius: borderRadius.full,
              backgroundColor: fabColor,
              gap: variant === 'extended' ? spacing[2] : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
        >
          <Animated.View style={rotationStyle}>
            <Ionicons name={icon} size={variant === 'mini' ? 24 : 28} color="#FFFFFF" />
          </Animated.View>
          
          {variant === 'extended' && label && (
            <Text
              style={{
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.semibold,
                color: '#FFFFFF',
              }}
            >
              {label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default FAB;
