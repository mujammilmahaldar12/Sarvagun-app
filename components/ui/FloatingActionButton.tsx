import React from 'react';
import { Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  color,
  size = 60,
}: FloatingActionButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        right: 20,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </Pressable>
  );
}
