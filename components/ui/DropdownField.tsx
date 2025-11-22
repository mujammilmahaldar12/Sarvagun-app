import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

interface DropdownFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  disabled?: boolean;
}

export default function DropdownField({ 
  label, 
  value, 
  placeholder, 
  onPress, 
  required = false,
  icon = "chevron-down-outline",
  error,
  disabled = false,
}: DropdownFieldProps) {
  const { theme } = useTheme();
  const { spacing, typography, borderRadius } = designSystem;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={{ 
        fontSize: typography.sizes.sm, 
        fontWeight: typography.weights.semibold, 
        color: theme.text,
        marginBottom: spacing[2]
      }}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      
      <Pressable
        onPress={disabled ? undefined : onPress}
        android_disableSound={true}
        disabled={disabled}
        style={({ pressed }) => ({
          borderWidth: 1.5,
          borderColor: error 
            ? theme.error 
            : value 
            ? theme.primary 
            : theme.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3] + 2,
          backgroundColor: disabled ? theme.border + '20' : theme.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        })}
      >
        <Text 
          style={{ 
            color: value ? theme.text : theme.textSecondary,
            fontSize: typography.sizes.base,
            fontWeight: value ? typography.weights.medium : typography.weights.regular,
            flex: 1,
            marginRight: spacing[2],
          }} 
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons 
          name={icon} 
          size={22} 
          color={disabled ? theme.textSecondary : value ? theme.primary : theme.textSecondary} 
        />
      </Pressable>

      {error && (
        <Text style={{
          fontSize: typography.sizes.xs,
          color: theme.error,
          marginTop: spacing[1],
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}
