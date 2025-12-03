import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, Alert, Switch, StyleSheet, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAIStore } from '@/store/aiStore';
import { Avatar, ListItem, AnimatedPressable } from '@/components';
import { spacing, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle } from '@/utils/styleHelpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { isAIModeEnabled, toggleAIMode } = useAIStore();
  const [shouldLogout, setShouldLogout] = useState(false);

  // Swipe to logout animation
  const translateX = useSharedValue(0);
  const containerWidth = 300;
  const SWIPE_THRESHOLD = containerWidth - 70;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, SWIPE_THRESHOLD));
    })
    .onEnd((event) => {
      if (translateX.value > SWIPE_THRESHOLD * 0.85) {
        translateX.value = withTiming(SWIPE_THRESHOLD, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(setShouldLogout)(true);
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const logoutAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(translateX.value > 50 ? 0 : 1, { duration: 150 }),
  }));

  // Handle logout when state changes
  React.useEffect(() => {
    if (shouldLogout) {
      performLogout();
      setShouldLogout(false);
    }
  }, [shouldLogout]);

  const performLogout = async () => {
    try {
      // Perform logout
      await useAuthStore.getState().logout();
      
      // Navigate to login after a brief delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if there's an error
      router.replace('/(auth)/login');
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
          onPress: () => {
            performLogout();
            translateX.value = withSpring(0);
          },
        },
      ]
    );
  };

  // Don't render if not authenticated - placed AFTER all hooks
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Minimal Glass Header */}
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <AnimatedPressable
            onPress={() => router.push('/(settings)/account')}
            hapticType="light"
            style={[styles.profileHeader, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}
          >
            <Avatar
              size={64}
              source={user?.photo ? { uri: user.photo } : undefined}
              name={user?.full_name}
              onlineStatus={true}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.full_name || user?.first_name || user?.username}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </AnimatedPressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={[styles.listCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <ListItem
              title="My Public Profile"
              leftIcon="person-circle-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(dashboard)/my-profile')}
            />
            <ListItem
              title="Edit Account"
              leftIcon="create-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(settings)/account')}
            />
            <ListItem
              title="Notifications"
              leftIcon="notifications-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(dashboard)/notifications')}
            />
            <ListItem
              title="Leaderboard"
              leftIcon="trophy-outline"
              rightIcon="chevron-forward-outline"
              showDivider={false}
              onPress={() => router.push('/(dashboard)/leaderboard')}
            />
          </View>
        </View>

        {/* AI Assistant */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>AI ASSISTANT</Text>
          <View style={[styles.listCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <View style={styles.aiToggleRow}>
              <View style={styles.aiToggleLeft}>
                <View style={[styles.aiIconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="sparkles" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.aiToggleTitle, { color: theme.text }]}>AI Mode</Text>
              </View>
              <Switch
                value={isAIModeEnabled}
                onValueChange={toggleAIMode}
                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                thumbColor={isAIModeEnabled ? theme.primary : theme.surface}
                ios_backgroundColor={theme.border}
              />
            </View>

            {isAIModeEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <ListItem
                  title="Chat with AI"
                  leftIcon="chatbubble-ellipses-outline"
                  rightIcon="chevron-forward-outline"
                  showDivider={false}
                  onPress={() => router.push('/(dashboard)/ai-chat')}
                />
              </>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SETTINGS</Text>
          <View style={[styles.listCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }]}>
            <ListItem
              title="Appearance"
              leftIcon="color-palette-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(settings)/appearance')}
            />
            <ListItem
              title="Help & Support"
              leftIcon="help-circle-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(settings)/help-center')}
            />
            <ListItem
              title="Report a Problem"
              leftIcon="alert-circle-outline"
              rightIcon="chevron-forward-outline"
              onPress={() => router.push('/(settings)/report-problem')}
            />
            <ListItem
              title="About"
              leftIcon="information-circle-outline"
              rightIcon="chevron-forward-outline"
              showDivider={false}
              onPress={() => router.push('/(settings)/about')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: baseColors.error[600] }]}>
              <Animated.Text style={[styles.sliderText, textOpacity]}>
                Slide to Logout →
              </Animated.Text>
            </View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.sliderButton, logoutAnimatedStyle]}>
                <View style={styles.sliderButtonInner}>
                  <Ionicons name="log-out-outline" size={24} color={baseColors.neutral[0]} />
                </View>
              </Animated.View>
            </GestureDetector>
          </View>

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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  profileSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: 2,
  },
  userEmail: {
    ...getTypographyStyle('sm', 'regular'),
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  listCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...getTypographyStyle('xs', 'bold'),
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actionCard: {
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  aiToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  aiToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiToggleTitle: {
    ...getTypographyStyle('base', 'semibold'),
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.base,
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
    color: baseColors.neutral[0],
    letterSpacing: 0.5,
  },
  sliderButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: baseColors.neutral[0],
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
    backgroundColor: baseColors.error[600],
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
