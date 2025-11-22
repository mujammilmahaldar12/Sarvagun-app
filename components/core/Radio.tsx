/**
 * Radio Component
 * Animated radio button with group support
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

type RadioSize = 'sm' | 'md' | 'lg';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  orientation?: 'vertical' | 'horizontal';
  size?: RadioSize;
  color?: string;
  error?: string;
  disabled?: boolean;
}

export const Radio: React.FC<RadioProps> = ({
  value,
  onChange,
  options,
  orientation = 'vertical',
  size = 'md',
  color,
  error,
  disabled = false,
}) => {
  const { colors } = useThemeStore();
  const haptics = useHapticFeedback();

  const sizeConfig = {
    sm: { outer: 18, inner: 10, fontSize: typography.sizes.sm },
    md: { outer: 22, inner: 12, fontSize: typography.sizes.base },
    lg: { outer: 26, inner: 14, fontSize: typography.sizes.lg },
  };

  const currentSize = sizeConfig[size];
  const radioColor = color || colors.primary;

  const RadioButton: React.FC<{ option: RadioOption }> = ({ option }) => {
    const scale = useSharedValue(1);
    const innerScale = useSharedValue(value === option.value ? 1 : 0);

    React.useEffect(() => {
      innerScale.value = withSpring(value === option.value ? 1 : 0);
    }, [value, option.value]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const innerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: innerScale.value }],
      opacity: innerScale.value,
    }));

    const handlePress = () => {
      if (!disabled && !option.disabled) {
        haptics.triggerLight();
        scale.value = withSpring(0.9, {}, () => {
          scale.value = withSpring(1);
        });
        onChange(option.value);
      }
    };

    const isSelected = value === option.value;

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || option.disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          opacity: disabled || option.disabled ? 0.5 : 1,
          gap: spacing[2],
          marginBottom: orientation === 'vertical' ? spacing[3] : 0,
        }}
      >
        {/* Radio Circle */}
        <Animated.View
          style={[
            animatedStyle,
            {
              width: currentSize.outer,
              height: currentSize.outer,
              borderRadius: borderRadius.full,
              borderWidth: 2,
              borderColor: error ? colors.error : isSelected ? radioColor : colors.border,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Animated.View
            style={[
              innerAnimatedStyle,
              {
                width: currentSize.inner,
                height: currentSize.inner,
                borderRadius: borderRadius.full,
                backgroundColor: radioColor,
              },
            ]}
          />
        </Animated.View>

        {/* Label & Description */}
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Text
            style={{
              fontSize: currentSize.fontSize,
              fontWeight: typography.weights.medium,
              color: colors.text,
            }}
          >
            {option.label}
          </Text>
          {option.description && (
            <Text
              style={{
                fontSize: typography.sizes.sm,
                color: colors.textSecondary,
                marginTop: spacing[1],
              }}
            >
              {option.description}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View>
      <View
        style={{
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: orientation === 'horizontal' ? spacing[4] : 0,
        }}
      >
        {options.map((option) => (
          <RadioButton key={option.value} option={option} />
        ))}
      </View>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.error,
            marginTop: spacing[1],
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Radio;
