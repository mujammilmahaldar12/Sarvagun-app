import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

interface Module {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  bgColor: string;
}

const MODULES: Module[] = [
  {
    id: 'hr',
    title: 'HR',
    icon: 'people',
    route: '/(modules)/hr',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'events',
    title: 'Events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'cash',
    route: '/(modules)/finance',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'leave',
    title: 'Leave',
    icon: 'time',
    route: '/(modules)/leave',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [notificationCount] = useState(5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 70],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const logoScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />

      {/* Fixed Header with Scroll Animation */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          zIndex: 1000,
          opacity: headerOpacity,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 50,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Logo/Text */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Text
            className="text-xl font-bold"
            style={{ color: theme.colors.text }}
          >
            Sarvagun
          </Text>
        </Animated.View>

        {/* Right Icons */}
        <View className="flex-row items-center" style={{ gap: 16 }}>
          {/* Notification Icon with Badge */}
          <Pressable
            onPress={() => router.push('/(dashboard)/notifications')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View className="relative">
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.text}
              />
              {notificationCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: '#EF4444',
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text className="text-white text-xs font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Search Icon */}
          <Pressable
            onPress={() => router.push('/(dashboard)/search' as any)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="search-outline" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 100 : 150,
          paddingBottom: Platform.OS === 'ios' ? 140 : 100,
        }}
      >
        {/* Profile Intro Card with Circle Border */}
        <View className="px-5 mb-6">
          <View
            className="rounded-3xl p-5"
            style={{
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center">
              {/* Circular Profile Photo with Border */}
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 70,
                  height: 70,
                  borderWidth: 3,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary,
                }}
              >
                {user?.photo ? (
                  <Image
                    source={{ uri: user.photo }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                    }}
                  />
                ) : (
                  <Text className="text-2xl font-bold text-white">
                    {getInitials(user?.full_name)}
                  </Text>
                )}
              </View>

              {/* User Info */}
              <View className="flex-1 ml-4">
                <Text
                  className="text-base mb-1"
                  style={{ color: theme.colors.textSecondary, fontSize: 14 }}
                >
                  {getGreeting()} 👋
                </Text>
                <Text
                  className="text-xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {user?.full_name || 'User'}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary, fontSize: 13 }}
                >
                  {user?.designation} • {user?.category}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View
              className="flex-row justify-between mt-5 pt-5"
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark ? '#2A242E' : '#E5E7EB',
              }}
            >
              <View className="items-center flex-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.text }}
                >
                  95%
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                >
                  Attendance
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? '#2A242E' : '#E5E7EB',
                }}
              />
              <View className="items-center flex-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.text }}
                >
                  12
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                >
                  Leave Days
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? '#2A242E' : '#E5E7EB',
                }}
              />
              <View className="items-center flex-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.text }}
                >
                  3
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                >
                  Projects
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modules Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4 px-5">
            <Text
              className="text-xl font-bold"
              style={{ color: theme.colors.text }}
            >
              Modules
            </Text>
            <Pressable onPress={() => router.push('/(dashboard)/modules')}>
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.primary, fontSize: 14 }}
              >
                See All
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 25 }}
          >
            {MODULES.slice(0, 4).map((module, index) => (
              <View
                key={module.id}
                style={{
                  width: '25%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 7,
                  marginBottom: 16,
                }}
              >
                <Pressable
                  onPress={() => router.push(module.route as any)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View
                    className="rounded-2xl p-3 items-center justify-center"
                    style={{
                      height: 110,
                      backgroundColor: theme.colors.surface,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {/* Icon Container */}
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                      style={{
                        backgroundColor: isDark
                          ? `${module.color}25`
                          : module.bgColor,
                      }}
                    >
                      <Ionicons name={module.icon} size={24} color={module.color} />
                    </View>

                    {/* Module Title */}
                    <Text
                      className="text-base font-bold text-center"
                      style={{ 
                        color: theme.colors.text, 
                        fontSize: 13,
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {module.title}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-xl font-bold"
              style={{ color: theme.colors.text }}
            >
              Recent Activity
            </Text>
          </View>

          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {[
              {
                title: 'Leave Request Approved',
                description: 'Your leave request for Dec 25-27 has been approved',
                time: '2 hours ago',
                icon: 'checkmark-circle' as const,
                color: '#10B981',
              },
              {
                title: 'New Task Assigned',
                description: 'Design System Update - Priority: High',
                time: '5 hours ago',
                icon: 'briefcase' as const,
                color: '#3B82F6',
              },
              {
                title: 'Attendance Marked',
                description: 'Check-in at 9:00 AM',
                time: '1 day ago',
                icon: 'finger-print' as const,
                color: '#8B5CF6',
              },
            ].map((activity, index, arr) => (
              <Pressable
                key={index}
                onPress={() => console.log('Activity:', activity.title)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  className="flex-row items-start p-4"
                  style={{
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? '#2A242E' : '#E5E7EB',
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: `${activity.color}15`,
                    }}
                  >
                    <Ionicons name={activity.icon} size={22} color={activity.color} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-base font-semibold mb-1"
                      style={{ color: theme.colors.text, fontSize: 15 }}
                    >
                      {activity.title}
                    </Text>
                    <Text
                      className="text-sm mb-1"
                      style={{ color: theme.colors.textSecondary, fontSize: 13 }}
                    >
                      {activity.description}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textSecondary, fontSize: 12, opacity: 0.7 }}
                    >
                      {activity.time}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.5 }}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
