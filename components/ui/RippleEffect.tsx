import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { RIPPLE_CONFIG, TIMING_CONFIGS } from '@/utils/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface RippleEffectProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  rippleColor?: string;
  rippleOpacity?: number;
  rippleDuration?: number;
  centered?: boolean;
  style?: any;
  testID?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  rippleColor = '#000000',
  rippleOpacity = 0.1,
  rippleDuration = RIPPLE_CONFIG.duration,
  centered = false,
  style,
  testID,
}) => {
  const rippleScale = useSharedValue(0);
  const rippleOpacityValue = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  
  const containerRef = useRef<View>(null);

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;

    if (centered) {
      // Center the ripple
      containerRef.current?.measure((x, y, width, height) => {
        rippleX.value = width / 2;
        rippleY.value = height / 2;
      });
    } else {
      // Position ripple at touch point
      const { locationX, locationY } = event.nativeEvent;
      rippleX.value = locationX;
      rippleY.value = locationY;
    }

    // Start ripple animation
    rippleScale.value = 0;
    rippleOpacityValue.value = rippleOpacity;
    
    rippleScale.value = withTiming(1, {
      duration: rippleDuration,
    });
    
    rippleOpacityValue.value = withTiming(0, {
      duration: rippleDuration,
    });
  };

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    onLongPress?.();
  };

  const animatedRippleStyle = useAnimatedStyle(() => {
    const size = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2;
    
    return {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: rippleColor,
      opacity: rippleOpacityValue.value,
      transform: [
        { translateX: rippleX.value - size / 2 },
        { translateY: rippleY.value - size / 2 },
        { scale: rippleScale.value },
      ],
    };
  });

  return (
    <View style={[styles.container, style]} ref={containerRef}>
      <Pressable
        onPressIn={handlePressIn}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        style={styles.pressable}
        testID={testID}
      >
        <View style={styles.content}>
          {children}
        </View>
        <Animated.View style={animatedRippleStyle} pointerEvents="none" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  content: {
    width: '100%',
    height: '100%',
  },
});

export default RippleEffect;