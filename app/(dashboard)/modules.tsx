import { View, Text, ScrollView, Platform, StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';

// Removed static dimensions - now using useWindowDimensions for responsive layout

interface Module {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  category: string;
  badge?: string;
}

const MODULES: Module[] = [
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Manage employees, attendance & payroll',
    icon: 'people',
    route: '/(modules)/hr',
    color: moduleColors.hr.main,
    category: 'Management',
  },
  {
    id: 'events',
    name: 'Event Management',
    description: 'Plan & organize company events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: moduleColors.events.main,
    category: 'Operations',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Track expenses & financial records',
    icon: 'cash',
    route: '/(modules)/finance',
    color: moduleColors.finance.main,
    category: 'Finance',
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Monitor projects & tasks',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: moduleColors.projects.main,
    category: 'Management',
  },
  {
    id: 'leave',
    name: 'Leave Management',
    description: 'Apply & approve leave requests',
    icon: 'time',
    route: '/(modules)/leave',
    color: moduleColors.leave.main,
    category: 'Management',
  },
  {
    id: 'team',
    name: 'Team Lead Dashboard',
    description: 'Review & rate team performance',
    icon: 'people-circle',
    route: '/(modules)/team',
    color: moduleColors.projects.main,
    category: 'Management',
    badge: 'Lead',
  },
  {
    id: 'whatsnew',
    name: "What's New",
    description: 'Latest updates & announcements',
    icon: 'newspaper',
    route: '/(modules)/whatsnew',
    color: '#8B5CF6',
    category: 'Operations',
    badge: 'New',
  },
];

const CATEGORIES = ['All', 'Management', 'Operations', 'Finance'];

import { useModule } from '@/hooks/useModule';

export default function ModulesScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive grid: 2 columns in portrait, 3-4 in landscape
  const isLandscape = screenWidth > 600;
  const numColumns = isLandscape ? (screenWidth > 900 ? 4 : 3) : 2;
  const cardWidthPercent = isLandscape
    ? (numColumns === 4 ? '23%' : '31%')
    : '48%';

  // Permission Checks
  const { can: canViewHR } = useModule('hr.employees');
  const { can: canViewEvents } = useModule('events.events');
  const { can: canViewFinance } = useModule('finance.dashboard');
  const { can: canViewProjects } = useModule('projects.projects');
  const { can: canViewLeave } = useModule('hr.leaves');

  // Team lead dashboard access check - reusing projects or hr permission?
  // Usually team leads have 'projects.tasks.rate' or similar.
  // We'll use a broad check or assume if they can manage projects they might be leads.
  // Actually, 'team' module is specific. Let's rely on 'projects.projects' manage for now or just show it 
  // if they have 'projects.tasks.rate'.
  // Ideally we'd have 'team.dashboard.view', but let's use user.role/category for badge? 
  // For visibility: 'projects.projects'

  const filteredModules = MODULES.filter(m => {
    if (m.id === 'hr') return canViewHR('view');
    if (m.id === 'events') return canViewEvents('view');
    if (m.id === 'finance') return canViewFinance('view');
    if (m.id === 'projects') return canViewProjects('view');
    if (m.id === 'leave') return canViewLeave('view');
    if (m.id === 'team') return canViewProjects('view'); // Showing Team Dashboard if can view projects
    if (m.id === 'whatsnew') return true; // Always visible
    return true;
  });

  // Modern "Bento" Grid Design
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Modern Header Section */}
      <View style={styles.headerContainer}>
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
        >
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.title, { color: theme.text }]}>Discover</Text>
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {/* Modules Grid */}
        <View style={styles.gridContainer}>
          {filteredModules.map((module, index) => (
            <Animated.View
              key={module.id}
              entering={FadeInUp.delay(200 + index * 50).duration(500).springify()}
              style={{ width: cardWidthPercent, marginBottom: 16 }}
            >
              <AnimatedPressable
                onPress={() => router.push(module.route as any)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    shadowColor: theme.shadow,
                  }
                ]}
              >
                {/* Top Section: Icon & Arrow */}
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: module.color + '15' }]}>
                    <Ionicons name={module.icon} size={24} color={module.color} />
                  </View>
                  {module.badge ? (
                    <View style={[styles.badge, { backgroundColor: module.color + '20' }]}>
                      <Text style={[styles.badgeText, { color: module.color }]}>{module.badge}</Text>
                    </View>
                  ) : (
                    <Ionicons name="arrow-forward-circle-outline" size={24} color={theme.textSecondary + '40'} />
                  )}
                </View>

                {/* Bottom Section: Text */}
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {module.name}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {module.description}
                  </Text>
                </View>
              </AnimatedPressable>
            </Animated.View>
          ))}
        </View>

        {filteredModules.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="telescope-outline" size={48} color={theme.textSecondary + '40'} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No modules found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 24,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
