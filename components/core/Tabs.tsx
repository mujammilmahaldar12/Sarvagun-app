/**
 * Tabs Component
 * Animated tabs with sliding indicator
 */
import React, { useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

type TabVariant = 'line' | 'pill' | 'enclosed';

interface Tab {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: TabVariant;
  color?: string;
  scrollable?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  color,
  scrollable = false,
}) => {
  const { colors } = useThemeStore();
  
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabRefs = useRef<{ [key: string]: { x: number; width: number } }>({});

  const activeColor = color || colors.primary;

  React.useEffect(() => {
    const activeTabData = tabRefs.current[activeTab];
    if (activeTabData) {
      indicatorPosition.value = withSpring(activeTabData.x);
      indicatorWidth.value = withSpring(activeTabData.width);
    }
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  const handleTabPress = (tab: Tab) => {
    if (!tab.disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(tab.key);
    }
  };

  const handleTabLayout = (key: string, x: number, width: number) => {
    tabRefs.current[key] = { x, width };
  };

  const renderTab = (tab: Tab, index: number) => {
    const isActive = activeTab === tab.key;
    const showSeparator = variant === 'line' && index < tabs.length - 1;

    return (
      <React.Fragment key={tab.key}>
        <Pressable
          onPress={() => handleTabPress(tab)}
          disabled={tab.disabled}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            handleTabLayout(tab.key, x, width);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
            paddingHorizontal: variant === 'line' ? spacing[6] : spacing[5],
            paddingVertical: spacing[4],
            opacity: tab.disabled ? 0.5 : pressed ? 0.7 : 1,
            minHeight: 52,
            ...(variant === 'pill' && {
              backgroundColor: isActive ? activeColor : 'transparent',
              borderRadius: borderRadius.full,
              marginHorizontal: spacing[1],
            }),
            ...(variant === 'enclosed' && {
              backgroundColor: isActive ? colors.surface : 'transparent',
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: isActive ? activeColor : colors.border,
              marginRight: index < tabs.length - 1 ? spacing[2] : 0,
            }),
          })}
        >
        {tab.icon && (
          <Ionicons
            name={tab.icon}
            size={20}
            color={
              variant === 'pill' && isActive
                ? '#FFFFFF'
                : isActive
                ? activeColor
                : colors.textSecondary
            }
          />
        )}
        <Text
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: isActive ? typography.weights.semibold : typography.weights.medium,
            color:
              variant === 'pill' && isActive
                ? '#FFFFFF'
                : isActive
                ? variant === 'enclosed'
                  ? colors.text
                  : activeColor
                : colors.textSecondary,
          }}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View
            style={{
              backgroundColor: variant === 'pill' && isActive ? '#FFFFFF30' : activeColor,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
              minWidth: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.bold,
                color: variant === 'pill' && isActive ? '#FFFFFF' : '#FFFFFF',
              }}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Pressable>
      
      {/* Vertical Separator */}
      {showSeparator && (
        <View
          style={{
            width: 1,
            height: 28,
            backgroundColor: colors.border,
            alignSelf: 'center',
            marginHorizontal: spacing[2],
          }}
        />
      )}
      </React.Fragment>
    );
  };

  const TabsContainer = scrollable ? ScrollView : View;

  return (
    <View>
      <TabsContainer
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          backgroundColor:
            variant === 'enclosed' ? colors.background : 'transparent',
          borderRadius: variant === 'enclosed' ? borderRadius.lg : 0,
          padding: variant === 'enclosed' ? spacing[2] : 0,
        }}
      >
        <View style={{ flexDirection: 'row', position: 'relative' }}>
          {tabs.map((tab, index) => renderTab(tab, index))}

          {/* Sliding Indicator (for line variant) */}
          {variant === 'line' && (
            <Animated.View
              style={[
                indicatorStyle,
                {
                  position: 'absolute',
                  bottom: -2,
                  height: 4,
                  backgroundColor: activeColor,
                  borderRadius: borderRadius.full,
                },
              ]}
            />
          )}
        </View>
      </TabsContainer>

      {/* Bottom Border (for line variant) */}
      {variant === 'line' && (
        <View
          style={{
            height: 2,
            backgroundColor: colors.border,
            opacity: 0.3,
          }}
        />
      )}
    </View>
  );
};

export default Tabs;
