import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';

type SettingSection = {
  id: string;
  title: string;
  items: SettingItem[];
};

type SettingItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  route?: string;
  action?: () => void;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  showChevron?: boolean;
  isDanger?: boolean;
};

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const sections: SettingSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'profile',
          icon: 'person-outline',
          title: 'Your account',
          subtitle: `${user?.first_name} ${user?.last_name}`,
          route: '/account',
          showChevron: true,
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          route: '/privacy',
          showChevron: true,
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: notificationsEnabled ? 'On' : 'Off',
          showToggle: true,
          toggleValue: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          id: 'email',
          icon: 'mail-outline',
          title: 'Email notifications',
          subtitle: emailNotifications ? 'Enabled' : 'Disabled',
          showToggle: true,
          toggleValue: emailNotifications,
          onToggle: setEmailNotifications,
        },
        {
          id: 'appearance',
          icon: 'moon-outline',
          title: 'Appearance',
          subtitle: isDark ? 'Dark mode' : 'Light mode',
          route: '/appearance',
          showChevron: true,
        },
      ],
    },
    {
      id: 'app',
      title: 'App settings',
      items: [
        {
          id: 'language',
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English (US)',
          showChevron: true,
        },
        {
          id: 'data',
          icon: 'cellular-outline',
          title: 'Data usage',
          subtitle: 'Manage your data preferences',
          showChevron: true,
        },
        {
          id: 'about',
          icon: 'information-circle-outline',
          title: 'About',
          subtitle: 'Version 1.0.0',
          route: '/about',
          showChevron: true,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          title: 'Help & feedback',
          subtitle: 'Get help or send feedback',
          showChevron: true,
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          title: 'Terms & policies',
          subtitle: 'View terms and privacy policy',
          showChevron: true,
        },
      ],
    },
    {
      id: 'actions',
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          title: 'Logout',
          action: handleLogout,
          isDanger: true,
          showChevron: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const handlePress = () => {
      if (item.action) {
        item.action();
      } else if (item.route) {
        router.push(item.route as any);
      }
    };

    return (
      <TouchableOpacity
        key={item.id}
        onPress={handlePress}
        disabled={item.showToggle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: item.isDanger 
              ? theme.colors.error + '20' 
              : theme.colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={item.icon}
            size={22}
            color={item.isDanger ? theme.colors.error : theme.colors.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: item.isDanger ? theme.colors.error : theme.colors.text,
              marginBottom: item.subtitle ? 4 : 0,
            }}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
              }}
            >
              {item.subtitle}
            </Text>
          )}
        </View>

        {item.showToggle && (
          <Switch
            value={item.toggleValue}
            onValueChange={item.onToggle}
            trackColor={{ 
              false: theme.colors.border, 
              true: theme.colors.primary 
            }}
            thumbColor={theme.colors.surface}
          />
        )}

        {item.showChevron && !item.showToggle && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader title="Settings" showBack />

      <ScrollView style={{ flex: 1 }}>
        {/* User Profile Header */}
        <View
          style={{
            padding: 20,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              >
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: 4,
                }}
              >
                {user?.first_name} {user?.last_name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                {user?.email}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                }}
              >
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/account' as any)}
              style={{
                padding: 8,
              }}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.id} style={{ marginBottom: 8 }}>
            {section.title && (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.textSecondary,
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {section.title}
              </Text>
            )}
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Sarvagun ERP v1.0.0
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            © 2025 All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
