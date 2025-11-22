/**
 * Progress Component
 * Linear and Circular progress indicators with animations
 */
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressVariant = 'linear' | 'circular';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressProps {
  value: number; // 0-100
  variant?: ProgressVariant;
  size?: ProgressSize;
  color?: string;
  gradient?: [string, string];
  showPercentage?: boolean;
  indeterminate?: boolean;
  label?: string;
  thickness?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  variant = 'linear',
  size = 'md',
  color,
  gradient,
  showPercentage = false,
  indeterminate = false,
  label,
  thickness,
}) => {
  const { colors } = useThemeStore();
  
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const progressColor = color || colors.primary;

  useEffect(() => {
    if (indeterminate) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      progress.value = withSpring(Math.min(Math.max(value, 0), 100) / 100);
    }
  }, [value, indeterminate]);

  if (variant === 'circular') {
    const sizeConfig = {
      sm: { diameter: 40, stroke: thickness || 4 },
      md: { diameter: 60, stroke: thickness || 6 },
      lg: { diameter: 80, stroke: thickness || 8 },
    };

    const { diameter, stroke } = sizeConfig[size];
    const radius = (diameter - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
      <View style={{ alignItems: 'center', gap: spacing[2] }}>
        {label && (
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text }}>
            {label}
          </Text>
        )}
        <View style={{ position: 'relative' }}>
          <Svg width={diameter} height={diameter}>
            {/* Background Circle */}
            <Circle
              cx={diameter / 2}
              cy={diameter / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={stroke}
              fill="none"
            />
            {/* Progress Circle */}
            <AnimatedCircle
              cx={diameter / 2}
              cy={diameter / 2}
              r={radius}
              stroke={progressColor}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${diameter / 2}, ${diameter / 2}`}
            />
          </Svg>
          {showPercentage && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: size === 'sm' ? typography.sizes.xs : size === 'md' ? typography.sizes.sm : typography.sizes.base,
                  fontWeight: typography.weights.bold,
                  color: colors.text,
                }}
              >
                {Math.round(value)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Linear variant
  const sizeConfig = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const height = thickness || sizeConfig[size];

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * 200 - 100 }],
  }));

  return (
    <View style={{ gap: spacing[2] }}>
      {label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text }}>
            {label}
          </Text>
          {showPercentage && (
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: progressColor }}>
              {Math.round(value)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          height,
          backgroundColor: colors.border,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        }}
      >
        {indeterminate ? (
          <Animated.View
            style={[
              shimmerStyle,
              {
                width: '100%',
                height: '100%',
                backgroundColor: progressColor,
              },
            ]}
          />
        ) : gradient ? (
          <Animated.View style={[progressStyle, { height: '100%' }]}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              progressStyle,
              {
                height: '100%',
                backgroundColor: progressColor,
                borderRadius: borderRadius.full,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
};

export default Progress;
