import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { designSystem } from "@/constants/designSystem";

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
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    marginVertical: designSystem.spacing[2],
  };

  const labelStyle: TextStyle = {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: '500',
    color: theme.text,
    marginBottom: designSystem.spacing[1],
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
    borderRadius: designSystem.borderRadius.md,
    paddingHorizontal: designSystem.spacing[3],
    paddingVertical: multiline ? designSystem.spacing[3] : designSystem.spacing[2],
    gap: designSystem.spacing[2],
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: designSystem.typography.sizes.base,
    fontWeight: '400',
    color: theme.text,
    minHeight: multiline ? numberOfLines * 20 : undefined,
  };

  const messageStyle: TextStyle = {
    fontSize: designSystem.typography.sizes.xs,
    fontWeight: '400',
    color: error ? theme.error : theme.textSecondary,
    marginTop: designSystem.spacing[1],
    marginLeft: designSystem.spacing[1],
  };

  return (
    <View style={[containerStyle, style]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={error ? theme.error : theme.textSecondary}
            style={{ marginTop: multiline ? designSystem.spacing[1] : 0 }}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={theme.textSecondary}
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
              size={20} 
              color={theme.textSecondary}
              style={{ marginTop: multiline ? designSystem.spacing[1] : 0 }}
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
