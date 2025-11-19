import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  color?: string;
  showArrow?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const PROFILE_MENU: MenuItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      route: '/profile/edit',
      showArrow: true,
    },
    {
      id: 'theme',
      title: `Theme: ${isDark ? 'Dark' : 'Light'}`,
      icon: isDark ? 'moon' : 'sunny',
      action: toggleTheme,
      showArrow: false,
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: 'notifications-outline',
      route: '/settings/notifications',
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'shield-checkmark-outline',
      route: '/settings/privacy',
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      route: '/settings/help',
      showArrow: true,
    },
    {
      id: 'about',
      title: 'About Sarvagun',
      icon: 'information-circle-outline',
      route: '/settings/about',
      showArrow: true,
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      // router.push(item.route);
      console.log('Navigate to:', item.route);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header */}
        <View
          className="px-6 pt-12 pb-8 items-center"
          style={{
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 24 : 56,
            backgroundColor: theme.colors.surface,
          }}
        >
          {/* Avatar */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="text-3xl font-bold text-white">
              {getInitials(user?.full_name)}
            </Text>
          </View>

          {/* User Info */}
          <Text
            className="text-2xl font-bold mb-1"
            style={{ color: theme.colors.text }}
          >
            {user?.full_name || 'User'}
          </Text>
          <Text
            className="text-base mb-1"
            style={{ color: theme.colors.textSecondary, fontSize: 15 }}
          >
            {user?.email || 'user@example.com'}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.primary }}
              >
                {user?.designation || 'Employee'}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.primary }}
              >
                {user?.category || 'Staff'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6 mt-6">
          <Text
            className="text-sm font-semibold mb-3 uppercase"
            style={{ color: theme.colors.textSecondary, fontSize: 12 }}
          >
            Settings
          </Text>
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {PROFILE_MENU.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => handleMenuPress(item)}
                className="px-5 py-4 flex-row items-center"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? isDark
                      ? '#37415120'
                      : '#F3F4F620'
                    : 'transparent',
                  borderBottomWidth: index < PROFILE_MENU.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                })}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.color || theme.colors.text}
                  style={{ marginRight: 16 }}
                />
                <Text
                  className="text-base font-medium flex-1"
                  style={{ color: item.color || theme.colors.text, fontSize: 15 }}
                >
                  {item.title}
                </Text>
                {item.showArrow && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-8">
          <Pressable
            onPress={handleLogout}
            className="rounded-2xl px-6 py-4 flex-row items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#DC2626' : '#EF4444',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text className="text-base font-bold text-white ml-2">
              Logout
            </Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View className="items-center mt-8">
          <Text
            className="text-xs"
            style={{ color: theme.colors.textSecondary, fontSize: 12, opacity: 0.7 }}
          >
            Sarvagun ERP v2.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
