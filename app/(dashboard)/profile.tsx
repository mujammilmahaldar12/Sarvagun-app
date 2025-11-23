import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, Alert, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Avatar, ListItem, AnimatedPressable, AnimatedButton } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';
import { resetOnboardingForTesting } from '@/utils/devUtils';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Swipe to logout animation
  const translateX = useSharedValue(0);
  const containerWidth = 300; // Fixed width for slider
  const SWIPE_THRESHOLD = containerWidth - 70; // Leave space for the button

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow right swipe, clamp to container bounds
      translateX.value = Math.max(0, Math.min(event.translationX, SWIPE_THRESHOLD));
    })
    .onEnd((event) => {
      if (translateX.value > SWIPE_THRESHOLD * 0.85) {
        // Swipe completed - slide to end then logout
        translateX.value = withTiming(SWIPE_THRESHOLD, { duration: 200 }, () => {
          runOnJS(performLogout)();
        });
      } else {
        // Reset position with spring
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const logoutAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(translateX.value > 50 ? 0 : 1, { duration: 150 }),
  }));

  const performLogout = async () => {
    try {
      // Let index.tsx handle navigation after state changes
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
      translateX.value = withSpring(0);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header Card */}
        <View style={styles.section}>
          <View style={[styles.profileCard, getCardStyle(theme.surface, 'md', 'xl')]}>
            <View style={styles.profileHeader}>
              <Avatar
                size={72}
                source={user?.photo ? { uri: user.photo } : undefined}
                name={user?.full_name}
                onlineStatus={true}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>
                  {user?.full_name || 'User Name'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                  {user?.email || 'user@example.com'}
                </Text>
                <Text style={[styles.userRole, { color: theme.textSecondary }]}>
                  {user?.designation || 'Employee'} • {user?.category || 'Staff'}
                </Text>
              </View>
            </View>

            <AnimatedPressable
              onPress={() => router.push('/(settings)/account')}
              style={[
                styles.editProfileButton,
                { 
                  backgroundColor: theme.primary,
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <ListItem
              title="My Public Profile"
              description="View your professional profile"
              leftIcon="person-circle-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => {
                console.log('Navigating to my-profile...');
                router.push('/(dashboard)/my-profile');
              }}
            />
            <ListItem
              title="Edit Account"
              description="Update your personal information"
              leftIcon="create-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(settings)/account')}
            />
            <ListItem
              title="Settings"
              description="Manage app preferences"
              leftIcon="settings-outline"
              rightIcon="chevron-forward-outline"
              showDivider={false}
              onPress={() => router.push('/(settings)')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <ListItem
              title="Push Notifications"
              description={notificationsEnabled ? 'Enabled' : 'Disabled'}
              leftIcon="notifications-outline"
              rightContent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={notificationsEnabled ? theme.primary : '#f4f3f4'}
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
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={emailNotifications ? theme.primary : '#f4f3f4'}
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
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={isDark ? theme.primary : '#f4f3f4'}
                />
              }
            />
          </View>
        </View>



        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUPPORT</Text>
          <View style={[styles.sectionCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <ListItem
              title="Help Center"
              description="Get help and support"
              leftIcon="help-circle-outline"
              onPress={() => router.push('/(settings)/help-center')}
            />
            <ListItem
              title="Report a Problem"
              description="Let us know about issues"
              leftIcon="alert-circle-outline"
              onPress={() => router.push('/(settings)/report-problem')}
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

        {/* Developer Tools (Testing Only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DEVELOPER TOOLS</Text>
            <View style={[styles.sectionCard, getCardStyle(theme.surface, 'md', 'lg')]}>
              <ListItem
                title="Reset Onboarding Tour"
                description="Test first-time user experience"
                leftIcon="refresh-outline"
                showDivider={false}
                onPress={resetOnboardingForTesting}
              />
            </View>
          </View>
        )}

        {/* Swipe to Logout - iPhone Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LOGOUT</Text>
          
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: '#DC2626' }]}>
              <Animated.Text style={[styles.sliderText, textOpacity]}>
                Slide to Logout →
              </Animated.Text>
            </View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.sliderButton, logoutAnimatedStyle]}>
                <View style={styles.sliderButtonInner}>
                  <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                </View>
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Alternative Tap to Logout */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.tapLogoutButton,
              { 
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.tapLogoutText, { color: theme.textSecondary }]}>
              Or tap here for confirmation
            </Text>
          </Pressable>
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
    color: '#FFFFFF', // Will be overridden inline with theme.textInverse
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
  sliderContainer: {
    position: 'relative',
    height: 60,
    width: 300,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sliderText: {
    ...getTypographyStyle('base', 'semibold'),
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sliderButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapLogoutButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tapLogoutText: {
    ...getTypographyStyle('xs', 'medium'),
  },
});
