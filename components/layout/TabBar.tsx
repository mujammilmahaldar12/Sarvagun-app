import React, { memo, useCallback } from 'react';
import { View, ScrollView, Pressable, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

export interface Tab {
  key?: string;
  id?: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  style?: any;
  variant?: 'pill' | 'underline';
}

// Memoized tab item to prevent unnecessary re-renders
const TabItem = memo(({
  tab,
  isActive,
  onPress,
  theme,
  isDark,
  variant = 'pill',
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  theme: any;
  isDark: boolean;
  variant?: 'pill' | 'underline';
}) => {
  // Premium subtle look
  const activeBg = theme.primary + '15'; // 15% opacity primary

  if (variant === 'underline') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: isActive ? theme.primary : 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {tab.icon && (
          <Ionicons
            name={tab.icon}
            size={18}
            color={isActive ? theme.primary : theme.textSecondary}
          />
        )}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600', // Match Finance module style
            color: isActive ? theme.primary : theme.text,
          }}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              minWidth: 24,
              alignItems: 'center',
              backgroundColor: isActive ? theme.primary : theme.textSecondary + '20',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isActive ? '#fff' : theme.textSecondary,
              }}
            >
              {tab.badge}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16, // Adjusted padding
        paddingVertical: 12, // Increased height
        borderRadius: 12,
        backgroundColor: isActive ? activeBg : 'transparent',
        gap: 8,
        opacity: pressed ? 0.7 : 1,
        borderWidth: 1,
        borderColor: isActive ? theme.primary : 'transparent',
        minHeight: 48, // Fixed minimum height
      })}
    >
      {tab.icon && (
        <Ionicons
          name={tab.icon}
          size={20}
          color={isActive ? theme.primary : (isDark ? '#9CA3AF' : '#6B7280')}
          style={{ marginTop: -1 }}
        />
      )}
      <Text
        style={{
          color: isActive ? theme.primary : (isDark ? '#9CA3AF' : '#6B7280'),
          fontSize: designSystem.typography.sizes.sm,
          fontWeight: isActive ? '600' : '500',
          textAlign: 'center',
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {tab.label}
      </Text>
      {tab.badge !== undefined && (
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: isActive ? theme.primary : theme.textSecondary + '20',
            marginLeft: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: isActive ? '#fff' : theme.textSecondary,
            }}
          >
            {tab.badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

function TabBar({ tabs, activeTab, onTabChange, style, variant = 'pill' }: TabBarProps) {
  const { theme, isDark } = useTheme();

  const handleTabPress = useCallback((key: string) => {
    onTabChange(key);
  }, [onTabChange]);

  return (
    <View style={[{
      backgroundColor: theme.background,
      paddingVertical: variant === 'pill' ? 12 : 0,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          gap: variant === 'pill' ? 12 : 0,
          alignItems: 'center',
          minWidth: '100%',
        }}
      >
        {tabs.map((tab) => {
          const tabKey = tab.key || tab.id || tab.label;
          return (
            <TabItem
              key={tabKey}
              tab={{ ...tab, key: tabKey }}
              isActive={activeTab === tabKey}
              onPress={() => handleTabPress(tabKey)}
              theme={theme}
              isDark={isDark}
              variant={variant}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default memo(TabBar);