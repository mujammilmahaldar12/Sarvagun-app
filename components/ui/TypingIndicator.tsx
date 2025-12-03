/**
 * Typing Indicator Component
 * Shows when users are typing
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TypingIndicator as TypingIndicatorType } from '@/services/websocket.service';
import { useTheme } from '@/hooks/useTheme';

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
  style?: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, style }) => {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 150);
    const animation3 = createAnimation(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [typingUsers.length, dot1, dot2, dot3]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        {getTypingText()}
      </Text>
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: theme.colors.primary,
              opacity: dot1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: theme.colors.primary,
              opacity: dot2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: theme.colors.primary,
              opacity: dot3,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

/**
 * Mini typing indicator for chat bubbles
 */
export const MiniTypingIndicator: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -4,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 150);
    const animation3 = createAnimation(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.miniContainer, style]}>
      <Animated.View
        style={[
          styles.miniDot,
          {
            backgroundColor: theme.colors.textSecondary,
            transform: [{ translateY: dot1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.miniDot,
          {
            backgroundColor: theme.colors.textSecondary,
            transform: [{ translateY: dot2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.miniDot,
          {
            backgroundColor: theme.colors.textSecondary,
            transform: [{ translateY: dot3 }],
          },
        ]}
      />
    </View>
  );
};

const miniStyles = StyleSheet.create({
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
