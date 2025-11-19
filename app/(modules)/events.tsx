import React from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function EventsModuleScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="calendar" size={80} color="#8B5CF6" />
        <Text
          className="text-2xl font-bold mt-6 mb-3 text-center"
          style={{ color: theme.colors.text }}
        >
          Event Management
        </Text>
        <Text
          className="text-base text-center mb-6"
          style={{ color: theme.colors.textSecondary }}
        >
          Plan and organize company events. Features coming soon.
        </Text>
      </View>
    </View>
  );
}
