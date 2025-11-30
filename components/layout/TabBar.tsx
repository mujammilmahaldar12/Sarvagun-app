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
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: isActive ? '#6D376D' : theme.surface,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 90,
        opacity: pressed ? 0.9 : 1,
        shadowColor: isActive ? '#6D376D' : '#000',
        shadowOffset: { width: 0, height: isActive ? 6 : 2 },
        shadowOpacity: isActive ? 0.5 : 0.15,
        shadowRadius: isActive ? 10 : 4,
        elevation: isActive ? 8 : 3,
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? '#6D376D' : theme.border,
      })}
    >
      {tab.icon && (
        <View style={{
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
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
    {!isLast && (
      <View style={{
        width: 1,
        height: 40,
        backgroundColor: isDark ? '#374151' : '#E5E7EB',
        marginHorizontal: 8,
      }} />
    )}
  </View>
));

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