/**
 * Switch Component
 * Animated toggle switch with spring animation
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, interpolateColor } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: SwitchSize;
  color?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  size = 'md',
  color,
}) => {
  const { colors } = useThemeStore();
  
  const switchAnim = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    switchAnim.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      switchAnim.value,
      [0, 1],
      [colors.border, color || colors.primary]
    );

    return {
      backgroundColor,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const sizeConfig = {
      sm: { track: 40, thumb: 16, offset: 20 },
      md: { track: 48, thumb: 20, offset: 24 },
      lg: { track: 56, thumb: 24, offset: 28 },
    };

    const config = sizeConfig[size];
    
    const translateX = interpolate(
      switchAnim.value,
      [0, 1],
      [2, config.offset]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const handlePress = async () => {
    if (!disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(!value);
    }
  };

  const sizeConfig = {
    sm: { track: 40, thumb: 16, height: 20 },
    md: { track: 48, thumb: 20, height: 24 },
    lg: { track: 56, thumb: 24, height: 28 },
  };

  const currentSize = sizeConfig[size];

  return (
    <View style={{ marginBottom: spacing[3] }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
          gap: spacing[3],
        }}
      >
        {/* Switch Track */}
        <Animated.View
          style={[
            trackStyle,
            {
              width: currentSize.track,
              height: currentSize.height,
              borderRadius: borderRadius.full,
              justifyContent: 'center',
            },
          ]}
        >
          {/* Switch Thumb */}
          <Animated.View
            style={[
              thumbStyle,
              {
                width: currentSize.thumb,
                height: currentSize.thumb,
                borderRadius: borderRadius.full,
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              },
            ]}
          />
        </Animated.View>

        {/* Label & Description */}
        {(label || description) && (
          <View style={{ flex: 1 }}>
            {label && (
              <Text
                style={{
                  fontSize: typography.sizes.base,
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

        {loading && (
          <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>
            Loading...
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default Switch;
