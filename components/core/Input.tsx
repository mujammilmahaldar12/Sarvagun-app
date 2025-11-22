/**
 * Unified Input Component
 * Consolidates: AppInput, FormField, SearchBar
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  
  // Variants
  variant?: 'default' | 'outlined' | 'filled' | 'search';
  
  // Icons
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  
  // Validation
  error?: string;
  helperText?: string;
  required?: boolean;
  
  // States
  disabled?: boolean;
  loading?: boolean;
  
  // Password toggle
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  
  // Search specific
  onClear?: () => void;
  onSearch?: (query: string) => void;
  
  // Styling
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'outlined',
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  helperText,
  required = false,
  disabled = false,
  loading = false,
  secureTextEntry = false,
  showPasswordToggle = false,
  onClear,
  onSearch,
  containerStyle,
  labelStyle,
  inputStyle,
  multiline = false,
  ...textInputProps
}) => {
  const { colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Animations
  const shakeAnimation = useSharedValue(0);
  const borderColorAnimation = useSharedValue(0);

  // Shake animation for errors
  React.useEffect(() => {
    if (error) {
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  // Border color animation on focus
  React.useEffect(() => {
    borderColorAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderRadius: variant === 'search' ? borderRadius.xl : borderRadius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: multiline ? spacing[3] : spacing[3],
      gap: spacing[2],
    };

    if (variant === 'search') {
      return {
        ...baseStyle,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: isFocused ? colors.primary : colors.border,
      };
    }

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
      };
    }

    if (variant === 'outlined') {
      return {
        ...baseStyle,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
    };
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (variant === 'search') {
      onSearch?.(text);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Determine right icon
  const determineRightIcon = (): keyof typeof Ionicons.glyphMap | undefined => {
    if (loading) return undefined;
    if (variant === 'search' && value.length > 0) return 'close-circle';
    if (showPasswordToggle && secureTextEntry) {
      return isPasswordVisible ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  const handleRightIconPress = () => {
    if (variant === 'search' && value.length > 0) {
      handleClear();
    } else if (showPasswordToggle && secureTextEntry) {
      togglePasswordVisibility();
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const finalRightIcon = determineRightIcon();

  return (
    <View style={[{ marginBottom: spacing[4] }, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            {
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.text,
              marginBottom: spacing[1],
            },
            labelStyle,
          ]}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View style={[getVariantStyles(), inputStyle, animatedStyle]}>
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? colors.error : colors.textSecondary}
            style={{ marginTop: multiline ? spacing[1] : 0 }}
          />
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled && !loading}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            fontSize: typography.sizes.base,
            color: colors.text,
            paddingVertical: 0,
            minHeight: multiline ? 80 : undefined,
          }}
          {...textInputProps}
        />

        {/* Right Icon */}
        {finalRightIcon && (
          <Pressable
            onPress={handleRightIconPress}
            disabled={!handleRightIconPress}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
              marginTop: multiline ? spacing[1] : 0,
            })}
          >
            <Ionicons
              name={finalRightIcon}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: error ? colors.error : colors.textSecondary,
            marginTop: spacing[1],
            marginLeft: spacing[1],
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

export default Input;
