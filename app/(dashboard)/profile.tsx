import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, Alert, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Avatar, ListItem, AnimatedPressable, AnimatedButton } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designTokens';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header Card */}
        <View style={styles.section}>
          <View style={[styles.profileCard, getCardStyle(theme.colors.surface, 'md', 'xl')]}>
            <View style={styles.profileHeader}>
              <Avatar
                size={72}
                source={user?.photo ? { uri: user.photo } : undefined}
                name={user?.full_name}
                onlineStatus={true}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user?.full_name || 'User Name'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {user?.email || 'user@example.com'}
                </Text>
                <Text style={[styles.userRole, { color: theme.colors.textSecondary }]}>
                  {user?.designation || 'Employee'} • {user?.category || 'Staff'}
                </Text>
              </View>
            </View>

            <AnimatedPressable
              onPress={() => router.push('/(settings)/account')}
              style={[
                styles.editProfileButton,
                { 
                  backgroundColor: theme.colors.primary,
                  borderWidth: 0,
                },
                getShadowStyle('sm'),
              ]}
              hapticType="medium"
              springConfig="bouncy"
            >
              <Ionicons name="create-outline" size={iconSizes.sm} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.colors.surface, 'md', 'lg')]}>
            <ListItem
              title="Your Account"
              description={`${user?.first_name} ${user?.last_name}`}
              leftIcon="person-outline"
              onPress={() => router.push('/(settings)/account')}
            />
            <ListItem
              title="Privacy & Security"
              description="Manage your privacy settings"
              leftIcon="shield-checkmark-outline"
              onPress={() => console.log('Privacy')}
            />
            <ListItem
              title="Language"
              description="English"
              leftIcon="language-outline"
              showDivider={false}
              onPress={() => console.log('Language')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.colors.surface, 'md', 'lg')]}>
            <ListItem
              title="Push Notifications"
              description={notificationsEnabled ? 'Enabled' : 'Disabled'}
              leftIcon="notifications-outline"
              rightContent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                  thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
                />
              }
            />
            <ListItem
              title="Email Notifications"
              description={emailNotifications ? 'Enabled' : 'Disabled'}
              leftIcon="mail-outline"
              rightContent={
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                  thumbColor={emailNotifications ? theme.colors.primary : '#f4f3f4'}
                />
              }
            />
            <ListItem
              title="Dark Mode"
              description={isDark ? 'On' : 'Off'}
              leftIcon="moon-outline"
              showDivider={false}
              rightContent={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                  thumbColor={isDark ? theme.colors.primary : '#f4f3f4'}
                />
              }
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>APP SETTINGS</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.colors.surface, 'md', 'lg')]}>
            <ListItem
              title="Appearance"
              description="Customize app theme"
              leftIcon="color-palette-outline"
              onPress={() => router.push('/(settings)/appearance')}
            />
            <ListItem
              title="Storage"
              description="Manage app data"
              leftIcon="cloud-outline"
              onPress={() => console.log('Storage')}
            />
            <ListItem
              title="Data & Privacy"
              description="Control your data"
              leftIcon="lock-closed-outline"
              showDivider={false}
              onPress={() => console.log('Data')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SUPPORT</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.colors.surface, 'md', 'lg')]}>
            <ListItem
              title="Help Center"
              description="Get help and support"
              leftIcon="help-circle-outline"
              onPress={() => console.log('Help')}
            />
            <ListItem
              title="Report a Problem"
              description="Let us know about issues"
              leftIcon="alert-circle-outline"
              onPress={() => console.log('Report')}
            />
            <ListItem
              title="About"
              description="App version and info"
              leftIcon="information-circle-outline"
              showDivider={false}
              onPress={() => router.push('/(settings)/about')}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <AnimatedPressable
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              getCardStyle(theme.colors.surface, 'md', 'lg'),
              { 
                borderWidth: 1.5,
                borderColor: '#EF4444',
              },
            ]}
            hapticType="heavy"
            springConfig="gentle"
          >
            <View style={[styles.logoutIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={iconSizes.sm} color="#EF4444" />
            </View>
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={iconSizes.sm} color="#EF4444" />
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    padding: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.xs,
  },
  userRole: {
    ...getTypographyStyle('sm', 'medium'),
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  editButtonText: {
    ...getTypographyStyle('base', 'semibold'),
    color: '#FFFFFF',
  },
  sectionTitle: {
    ...getTypographyStyle('xs', 'bold'),
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...getTypographyStyle('base', 'semibold'),
    flex: 1,
  },
});
