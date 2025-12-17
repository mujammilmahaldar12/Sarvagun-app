import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Text } from 'react-native';

// Base tab bar height (without safe area)
const BASE_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 56;

// Export function to get total tab bar height including safe area
export const getTabBarHeight = (bottomInset: number = 0) => {
  if (Platform.OS === 'ios') {
    return BASE_TAB_BAR_HEIGHT; // iOS already includes safe area in the 90px
  }
  return BASE_TAB_BAR_HEIGHT + bottomInset; // Android needs explicit bottom inset
};

export default function DashboardLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the AI chat page
  const isOnAIChatPage = pathname === '/(dashboard)/ai-chat';

  // Calculate dynamic tab bar height based on device safe area
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 8 : Math.max(8, insets.bottom);

  // AI Button animation
  const aiPulse = useSharedValue(1);
  const aiGlow = useSharedValue(0.3);

  useEffect(() => {
    aiPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.ease }),
        withTiming(1, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      true
    );
    aiGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.ease }),
        withTiming(0.3, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  const aiButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: aiPulse.value }],
  }));

  const aiGlowStyle = useAnimatedStyle(() => ({
    opacity: aiGlow.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
            height: tabBarHeight,
            paddingBottom: tabBarPaddingBottom,
            paddingTop: 8,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="modules"
          options={{
            title: 'Modules',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quick-add"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <View
                className="items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: theme.primary,
                  marginTop: -20,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                  borderWidth: 3,
                  borderColor: isDark ? '#1F2937' : '#FFFFFF',
                }}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'trophy' : 'trophy-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="my-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ai-chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="goal-detail"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="performance-metrics"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics-projects"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics-hr"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics-events"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics-finance"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="realtime-demo"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
