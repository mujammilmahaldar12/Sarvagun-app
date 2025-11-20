import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, iconSizes, duration } from '../../constants/designTokens';
import { getTypographyStyle, getShadowStyle } from '../../utils/styleHelpers';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#10B981' },
  error: { icon: 'close-circle', color: '#EF4444' },
  warning: { icon: 'warning', color: '#F59E0B' },
  info: { icon: 'information-circle', color: '#3B82F6' },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration: customDuration = 3000,
  onHide,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration.normal,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, customDuration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderLeftColor: config.color,
    borderLeftWidth: 4,
    ...getShadowStyle('xl'),
  };

  const messageStyle: TextStyle = {
    ...getTypographyStyle('sm', 'medium'),
    color: theme.colors.text,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={config.icon} size={iconSizes.md} color={config.color} />
      <Text style={[styles.message, messageStyle]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    zIndex: 9999,
  },
  message: {
    flex: 1,
  },
});

// Hook for using Toast
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const show = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hide = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return {
    toast,
    showToast: show,
    hideToast: hide,
  };
};
