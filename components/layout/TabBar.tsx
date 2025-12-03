import React, { memo, useCallback } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem, baseColors } from '@/constants/designSystem';

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

// Memoized tab item to prevent unnecessary re-renders
const TabItem = memo(({ 
  tab, 
  isActive, 
  onPress, 
  theme, 
  isDark,
  isLast 
}: { 
  tab: Tab; 
  isActive: boolean; 
  onPress: () => void; 
  theme: any;
  isDark: boolean;
  isLast: boolean;
}) => {
  // Fixed contrast colors - Active tab always stands out
  const colors = {
    active: {
      background: '#6D376D',  // Purple
      text: '#FFFFFF',        // White
      icon: '#FFFFFF',        // White
      border: '#6D376D',      // Purple
    },
    inactive: {
      background: isDark ? '#1F2937' : '#F3F4F6',  // Dark gray / Light gray
      text: isDark ? '#9CA3AF' : '#374151',        // Light gray / Dark gray
      icon: isDark ? '#6B7280' : '#6D376D',        // Gray / Purple
      border: isDark ? '#374151' : '#E5E7EB',      // Border
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: isActive ? colors.active.background : colors.inactive.background,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minWidth: 90,
          opacity: pressed ? 0.7 : 1,
          shadowColor: isActive ? '#6D376D' : '#000',
          shadowOffset: { width: 0, height: isActive ? 4 : 2 },
          shadowOpacity: isActive ? 0.3 : 0.1,
          shadowRadius: isActive ? 8 : 3,
          elevation: isActive ? 6 : 2,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.inactive.border,
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
              color={isActive ? colors.active.icon : colors.inactive.icon}
            />
          </View>
        )}
        <Text
          style={{
            color: isActive ? colors.active.text : colors.inactive.text,
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: isActive ? '700' : '600',
            textAlign: 'center',
          }}
        >
          {tab.label}
        </Text>
      </Pressable>
      {/* Vertical Divider */}
      {!isLast && (
        <View style={{
          width: 1,
          height: 40,
          backgroundColor: isDark ? '#374151' : '#E5E7EB',
          marginHorizontal: 8,
        }} />
      )}
    </View>
  );
});

function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { theme, isDark } = useTheme();

  const handleTabPress = useCallback((key: string) => {
    onTabChange(key);
  }, [onTabChange]);

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
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => handleTabPress(tab.key)}
            theme={theme}
            isDark={isDark}
            isLast={index === tabs.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default memo(TabBar);