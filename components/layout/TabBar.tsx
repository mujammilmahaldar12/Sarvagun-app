import React from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export interface Tab {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingVertical: 8,
        }}
      >
        {tabs.map((tab, index) => (
          <View key={tab.key} style={{ marginRight: index < tabs.length - 1 ? 10 : 0 }}>
            <Pressable
              onPress={() => onTabChange(tab.key)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === tab.key ? 0.15 : 0.05,
                shadowRadius: 3,
                elevation: activeTab === tab.key ? 3 : 1,
                borderWidth: activeTab === tab.key ? 0 : 1,
                borderColor: isDark ? '#374151' : '#E5E7EB',
              })}
            >
              {tab.icon && (
                <View style={{ marginRight: 6 }}>
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.key ? '#FFFFFF' : theme.colors.text}
                  />
                </View>
              )}
              <Text
                style={{
                  color: activeTab === tab.key ? '#FFFFFF' : theme.colors.text,
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? '700' : '600',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
