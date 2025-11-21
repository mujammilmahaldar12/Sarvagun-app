/**
 * Unified FormField Component
 * Professional form component with consistent styling and validation
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, borderRadius } from '../../constants/designSystem';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  helper?: string;
  isLoading?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  icon,
  onIconPress,
  containerStyle,
  labelStyle,
  inputStyle,
  helper,
  isLoading = false,
  variant = 'outlined',
  value,
  ...textInputProps
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: theme.surfaceElevated,
          borderWidth: 1,
          borderColor: error ? theme.error : theme.border,
          borderRadius: borderRadius.md,
        };
      case 'outlined':
        return {
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: error ? theme.error : theme.border,
          borderRadius: borderRadius.md,
        };
      default:
        return {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: error ? theme.error : theme.border,
          borderRadius: borderRadius.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[{ marginBottom: spacing[4] }, containerStyle]}>
      {/* Label */}
      <Text
        style={[
          {
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: theme.text,
            marginBottom: spacing[1],
          },
          labelStyle,
        ]}
      >
        {label}
        {required && (
          <Text style={{ color: theme.error }}> *</Text>
        )}
      </Text>

      {/* Input Container */}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            ...variantStyles,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
          },
          inputStyle,
        ]}
      >
        {/* Text Input */}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: typography.sizes.base,
              color: theme.text,
              paddingVertical: 0, // Remove default padding
            },
          ]}
          placeholderTextColor={theme.textSecondary}
          value={value}
          editable={!isLoading}
          {...textInputProps}
        />

        {/* Icon */}
        {icon && (
          <TouchableOpacity
            onPress={onIconPress}
            disabled={!onIconPress || isLoading}
            style={{ marginLeft: spacing[2] }}
          >
            <Ionicons
              name={icon}
              size={20}
              color={error ? theme.error : theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text or Error */}
      {(error || helper) && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: error ? theme.error : theme.textSecondary,
            marginTop: spacing[1],
            marginLeft: spacing[1],
          }}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
};