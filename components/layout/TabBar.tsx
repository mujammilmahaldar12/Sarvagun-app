import React from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

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
    <View style={{ 
      backgroundColor: theme.background,
      paddingVertical: 12,
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          
          return (
            <View key={tab.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => onTabChange(tab.key)}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: isActive ? theme.primary : theme.surface,
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  minWidth: 90,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  shadowColor: isActive ? theme.primary : '#000',
                  shadowOffset: { width: 0, height: isActive ? 4 : 1 },
                  shadowOpacity: isActive ? 0.4 : 0.08,
                  shadowRadius: isActive ? 8 : 3,
                  elevation: isActive ? 6 : 2,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive ? theme.primary : (isDark ? '#374151' : '#E5E7EB'),
                })}
              >
                {tab.icon && (
                  <View style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    borderRadius: 20,
                    padding: isActive ? 6 : 0,
                  }}>
                    <Ionicons
                      name={tab.icon}
                      size={24}
                      color={isActive ? '#FFFFFF' : theme.primary}
                    />
                  </View>
                )}
                <Text
                  style={{
                    color: isActive ? '#FFFFFF' : theme.text,
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: isActive ? designSystem.typography.weights.bold : designSystem.typography.weights.semibold,
                    textAlign: 'center',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
              {/* Vertical Divider */}
              {index < tabs.length - 1 && (
                <View style={{
                  width: 1,
                  height: 40,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  marginHorizontal: 8,
                }} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
