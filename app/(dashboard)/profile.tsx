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
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAIStore } from '@/store/aiStore';
import { Avatar, ListItem, AnimatedPressable } from '@/components';
import { spacing, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle } from '@/utils/styleHelpers';
import { useMyInternship, useMyExtensions } from '@/hooks/useInternshipQueries';
import { JourneyTimeline } from '@/components/ui/JourneyTimeline';
import type { JourneyEvent } from '@/components/ui/JourneyTimeline';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { isAIModeEnabled, toggleAIMode } = useAIStore();
  const [shouldLogout, setShouldLogout] = useState(false);

  // Internship and extensions data
  const { data: internshipData, isLoading: internshipLoading } = useMyInternship();
  const { data: extensionsData = [], isLoading: extensionsLoading } = useMyExtensions();

  // Debug logging to see what data we actually have
  React.useEffect(() => {
    console.log('=== PROFILE DEBUG ===');
    console.log('User object:', user);
    console.log('User joiningdate:', user?.joiningdate);
    console.log('User joining_date:', user?.joining_date);
    console.log('Internship data:', internshipData);
    console.log('Internship start_date:', internshipData?.start_date);
    console.log('Internship end_date:', internshipData?.end_date);
    console.log('===================');
  }, [user, internshipData]);

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

  // Quantum Leap Premium Design - hooks MUST be before early return
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: scrollY.value * 0.5 }, // Parallax effect
        { scale: Math.max(0.8, 1 - scrollY.value * 0.001) }
      ],
      opacity: Math.max(0, 1 - scrollY.value * 0.003),
    };
  });

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

      {/* Animated Gradient Background Mesh - Simplified simulation */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.gradientBlob, {
          backgroundColor: theme.primary,
          top: -100,
          left: -50,
          opacity: 0.08
        }]} />
        <View style={[styles.gradientBlob, {
          backgroundColor: '#3B82F6',
          top: 100,
          right: -80,
          opacity: 0.06
        }]} />
        <View style={[styles.gradientBlob, {
          backgroundColor: '#F59E0B',
          bottom: -150,
          left: 50,
          opacity: 0.05
        }]} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Parallax Hero Header */}
        <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
          <View style={styles.avatarWrapper}>
            {/* Double Ring Gradient Effect */}
            <View style={[styles.ringOuter, { borderColor: theme.primary + '40' }]}>
              <View style={[styles.ringInner, { borderColor: theme.primary + '80' }]}>
                <Avatar
                  size={110}
                  source={user?.photo ? { uri: user.photo } : undefined}
                  name={user?.full_name}
                  onlineStatus={true}
                />
              </View>
            </View>
            <View style={[styles.proBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="star" size={10} color="#FFF" />
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.full_name || user?.first_name || user?.username}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
        </Animated.View>

        {/* Hero Stats - Glassmorphism */}
        <View style={styles.section}>
          <View style={[styles.heroStatsContainer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
          }]}>
            <View style={[styles.heroStatItem, { flex: 0.8 }]}>
              <View style={[styles.heroStatIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name={user?.category === 'intern' ? "hourglass-outline" : "ribbon-outline"} size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroStatValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {user?.category === 'intern'
                    ? (internshipData?.days_remaining ?? '--')
                    : `${Math.floor((Date.now() - new Date(user?.joiningdate || 0).getTime()) / (1000 * 60 * 60 * 24 * 30))} Mo`
                  }
                </Text>
                <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user?.category === 'intern' ? 'Days Left' : 'Tenure'}
                </Text>
              </View>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />

            <View style={[styles.heroStatItem, { flex: 1.2 }]}>
              <View style={[styles.heroStatIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="briefcase-outline" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.heroStatValue, { color: theme.text, fontSize: 15, lineHeight: 20 }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.85}
                >
                  {user?.designation || 'Member'}
                </Text>
                <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  Current Role
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid - Enhanced */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUICK ACCESS</Text>
          <View style={styles.gridContainer}>
            {[
              { title: 'My Profile', icon: 'person', route: '/(dashboard)/my-profile', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
              { title: 'Settings', icon: 'settings', route: '/(settings)/account', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
              { title: 'Alerts', icon: 'notifications', route: '/(dashboard)/notifications', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
              { title: 'Rankings', icon: 'trophy', route: '/(dashboard)/leaderboard', color: '#10B981', gradient: ['#10B981', '#059669'] },
            ].map((item, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(100 + index * 50).duration(600).springify()}
                style={styles.gridItemWrapper}
              >
                <AnimatedPressable
                  onPress={() => router.push(item.route as any)}
                  style={[styles.gridCard, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)'
                  }]}
                >
                  <View style={[styles.gridIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <View>
                    <Text style={[styles.gridTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.gridSubtitle, { color: theme.textSecondary }]}>Tap to view</Text>
                  </View>
                  <View style={[styles.actionArrow, { backgroundColor: theme.surface }]}>
                    <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} />
                  </View>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* AI Assistant - Glassmorphism Premium */}
        <View style={styles.section}>
          <AnimatedPressable
            onPress={isAIModeEnabled ? () => router.push('/(dashboard)/ai-chat') : toggleAIMode}
            style={[
              styles.aiCard,
              {
                backgroundColor: isDark ? 'rgba(109, 55, 109, 0.15)' : 'rgba(109, 55, 109, 0.04)',
                borderColor: theme.primary + '30'
              }
            ]}
          >
            <View style={styles.aiContent}>
              <View style={[styles.aiIconBox, { backgroundColor: theme.primary }]}>
                <Ionicons name="sparkles" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: theme.text }]}>Sarvagun AI</Text>
                <Text style={[styles.aiDesc, { color: theme.textSecondary }]}>
                  {isAIModeEnabled ? 'Your personal assistant is active' : 'Unlock smart assistance'}
                </Text>
              </View>
              <Switch
                value={isAIModeEnabled}
                onValueChange={toggleAIMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isAIModeEnabled ? '#FFF' : '#F4F4F5'}
              />
            </View>
          </AnimatedPressable>
        </View>

        {/* Settings List - Clean */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.settingsContainer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)'
          }]}>
            {[
              { title: 'Education', icon: 'school-outline', route: '/(settings)/edit-education' },
              { title: 'Experience', icon: 'briefcase-outline', route: '/(settings)/edit-experience' },
              { title: 'Skills', icon: 'ribbon-outline', route: '/(settings)/edit-skills' },
              { title: 'Appearance', icon: 'color-palette-outline', route: '/(settings)/appearance' },
            ].map((item, index) => (
              <AnimatedPressable
                key={index}
                onPress={() => router.push(item.route as any)}
                style={[styles.settingRow, index < 3 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}]}
              >
                <View style={styles.settingIconRow}>
                  <View style={[styles.miniIcon, { backgroundColor: theme.surface }]}>
                    <Ionicons name={item.icon as any} size={18} color={theme.text} />
                  </View>
                  <Text style={[styles.settingText, { color: theme.text }]}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary + '60'} />
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Logout - Glowing Slide */}
        <View style={styles.section}>
          <View style={[styles.sliderContainer, { shadowColor: baseColors.error[500] }]}>
            <View style={[styles.sliderTrack, { backgroundColor: baseColors.error[500] + '15', borderColor: baseColors.error[500] + '30', borderWidth: 1 }]}>
              <Animated.Text style={[styles.sliderText, textOpacity, { color: baseColors.error[500] }]}>
                Slide to Logout
              </Animated.Text>
            </View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.sliderButton, logoutAnimatedStyle, { shadowColor: baseColors.error[600] }]}>
                <View style={styles.sliderButtonInner}>
                  <Ionicons name="log-out-outline" size={24} color="#FFF" />
                </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  gradientBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  ringOuter: {
    padding: 4,
    borderRadius: 75,
    borderWidth: 1,
  },
  ringInner: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 1,
  },
  proBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  proText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
    opacity: 0.6,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
    opacity: 0.5,
  },
  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItemWrapper: {
    width: '48%',
  },
  gridCard: {
    padding: 14,
    borderRadius: 20,
    minHeight: 120, // Reduced from 160
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  gridIcon: {
    width: 44, // Reduced from 52
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 0,
  },
  gridSubtitle: {
    fontSize: 11,
  },
  actionArrow: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6D376D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiDesc: {
    fontSize: 12,
  },
  settingsContainer: {
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    position: 'relative',
    height: 56,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 30, // Extra margin at bottom
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sliderButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: baseColors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderButtonInner: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
