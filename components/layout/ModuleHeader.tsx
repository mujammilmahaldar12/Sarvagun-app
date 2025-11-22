import React from 'react';
import { View, Text, Pressable, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface ModuleHeaderProps {
  title: string;
  onSearch?: () => void;
  onFilter?: () => void;
  showBack?: boolean;
  rightActions?: React.ReactNode;
}

export default function ModuleHeader({
  title,
  onSearch,
  onFilter,
  showBack = true,
  rightActions,
}: ModuleHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginRight: 12,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
          )}
          <Text
            className="text-xl font-bold flex-1"
            style={{ color: theme.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightActions || (
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {onFilter && (
              <Pressable
                onPress={onFilter}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: pressed ? theme.primary + '15' : 'transparent',
                })}
              >
                <Ionicons name="options-outline" size={22} color={theme.text} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
