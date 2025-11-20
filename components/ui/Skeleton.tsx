import React from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, spacing } from '../../constants/designTokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonGroupProps {
  count?: number;
  height?: number;
  spacing?: number;
}

export const SkeletonText: React.FC<SkeletonGroupProps> = ({
  count = 3,
  height = 16,
  spacing: gap = spacing.sm,
}) => {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          height={height}
          width={index === count - 1 ? '60%' : '100%'}
        />
      ))}
    </View>
  );
};

export const SkeletonCircle: React.FC<{ size: number }> = ({ size }) => {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
