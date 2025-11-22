/**
 * Checkbox Component
 * Animated checkbox with indeterminate state
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  error?: string;
  size?: CheckboxSize;
  color?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled = false,
  error,
  size = 'md',
  color,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();
  
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(checked || indeterminate ? 1 : 0);
  }, [checked, indeterminate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handlePress = () => {
    if (!disabled) {
      haptics.triggerLight();
      scale.value = withSpring(0.9, {}, () => {
        scale.value = withSpring(1);
      });
      onChange(!checked);
    }
  };

  const sizeConfig = {
    sm: { box: 20, icon: 16, fontSize: typography.sizes.sm },
    md: { box: 24, icon: 18, fontSize: typography.sizes.base },
    lg: { box: 28, icon: 22, fontSize: typography.sizes.lg },
  };

  const currentSize = sizeConfig[size];
  const checkColor = color || colors.primary;

  return (
    <View style={{ marginBottom: spacing[3] }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          opacity: disabled ? 0.5 : 1,
          gap: spacing[2],
        }}
      >
        {/* Checkbox Box */}
        <Animated.View
          style={[
            animatedStyle,
            {
              width: currentSize.box,
              height: currentSize.box,
              borderRadius: borderRadius.sm,
              borderWidth: 2,
              borderColor: error ? colors.error : checked || indeterminate ? checkColor : colors.border,
              backgroundColor: checked || indeterminate ? checkColor : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Animated.View style={checkAnimatedStyle}>
            <Ionicons
              name={indeterminate ? 'remove' : 'checkmark'}
              size={currentSize.icon}
              color="#FFFFFF"
            />
          </Animated.View>
        </Animated.View>

        {/* Label & Description */}
        {(label || description) && (
          <View style={{ flex: 1, paddingTop: 2 }}>
            {label && (
              <Text
                style={{
                  fontSize: currentSize.fontSize,
                  fontWeight: typography.weights.medium,
                  color: colors.text,
                }}
              >
                {label}
              </Text>
            )}
            {description && (
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.textSecondary,
                  marginTop: spacing[1],
                }}
              >
                {description}
              </Text>
            )}
          </View>
        )}
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.error,
            marginTop: spacing[1],
            marginLeft: currentSize.box + spacing[2],
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Checkbox;
