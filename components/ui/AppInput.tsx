import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { spacing, borderRadius, borderWidth, iconSizes } from "@/constants/designTokens";
import { getTypographyStyle } from "@/utils/styleHelpers";

type AppInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
};

export default function AppInput({ 
  label, 
  value, 
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  helperText,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
}: AppInputProps) {
  const { colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    marginVertical: spacing.sm,
  };

  const labelStyle: TextStyle = {
    ...getTypographyStyle('sm', 'medium'),
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: error ? '#EF4444' : isFocused ? colors.primary : colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: multiline ? spacing.md : spacing.sm,
    gap: spacing.sm,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    ...getTypographyStyle('base', 'regular'),
    color: colors.text,
    minHeight: multiline ? numberOfLines * 20 : undefined,
  };

  const messageStyle: TextStyle = {
    ...getTypographyStyle('xs', 'regular'),
    color: error ? '#EF4444' : colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  };

  return (
    <View style={[containerStyle, style]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={iconSizes.sm} 
            color={error ? '#EF4444' : colors.textSecondary}
            style={{ marginTop: multiline ? spacing.xs : 0 }}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyle}
        />
        
        {rightIcon && (
          <Pressable onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Ionicons 
              name={rightIcon} 
              size={iconSizes.sm} 
              color={colors.textSecondary}
              style={{ marginTop: multiline ? spacing.xs : 0 }}
            />
          </Pressable>
        )}
      </View>

      {(error || helperText) && (
        <Text style={messageStyle}>{error || helperText}</Text>
      )}
    </View>
  );
}
