import React from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function LeaveModuleScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="exit" size={80} color="#EF4444" />
        <Text
          className="text-2xl font-bold mt-6 mb-3 text-center"
          style={{ color: theme.colors.text }}
        >
          Leave Management
        </Text>
        <Text
          className="text-base text-center mb-6"
          style={{ color: theme.colors.textSecondary }}
        >
          Apply and approve leave requests. Features coming soon.
        </Text>
      </View>
    </View>
  );
}
