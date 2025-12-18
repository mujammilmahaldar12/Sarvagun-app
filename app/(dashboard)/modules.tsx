import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, StyleSheet, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Chip, AnimatedPressable, GlassCard } from '@/components';
import { spacing, borderRadius, iconSizes, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

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
    description: 'Manage & rate team members tasks',
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

export default function ModulesScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredModules = MODULES.filter((module) => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Minimal Header with Inline Search */}
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        style={[styles.header, { backgroundColor: theme.surface }]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Modules</Text>

          <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              placeholder="Search modules..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <AnimatedPressable onPress={() => setSearchQuery('')} hapticType="light">
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </AnimatedPressable>
            )}
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modules Grid - Quick Actions Style */}
        <View style={styles.modulesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {filteredModules.length} {filteredModules.length === 1 ? 'MODULE' : 'MODULES'} AVAILABLE
          </Text>

          <View style={styles.modulesGrid}>
            {filteredModules.map((module, index) => (
              <Animated.View
                key={module.id}
                entering={FadeInUp.delay(100 + index * 50).duration(500).springify()}
              >
                <AnimatedPressable
                  onPress={() => router.push(module.route as any)}
                  hapticType="medium"
                  springConfig="gentle"
                  animateOnMount={true}
                  style={[
                    styles.moduleCard,
                    getCardStyle(theme.surface, 'md', 'xl'),
                    { width: CARD_WIDTH },
                  ]}
                >
                  {/* Gradient Background */}
                  <View style={styles.cardGradient}>
                    <LinearGradient
                      colors={[`${module.color}08`, `${module.color}00`]}
                      style={styles.gradientOverlay}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </View>

                  {/* Icon Container */}
                  <View style={[styles.iconContainer, { backgroundColor: `${module.color}15` }]}>
                    <Ionicons name={module.icon} size={iconSizes.xl + 6} color={module.color} />
                  </View>

                  {/* Module Details */}
                  <View style={styles.moduleDetails}>
                    <Text style={[styles.moduleName, { color: theme.text }]} numberOfLines={2}>
                      {module.name}
                    </Text>
                    <Text style={[styles.moduleDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                      {module.description}
                    </Text>
                  </View>

                  {/* Category/Badge Tag */}
                  {module.badge ? (
                    <View style={[styles.categoryTag, { backgroundColor: `${module.color}20` }]}>
                      <Text style={[styles.categoryTagText, { color: module.color }]}>
                        {module.badge}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.categoryTag, { backgroundColor: theme.background }]}>
                      <Text style={[styles.categoryTagText, { color: theme.textSecondary }]}>
                        {module.category}
                      </Text>
                    </View>
                  )}

                  {/* Arrow Icon */}
                  <View style={styles.arrowIcon}>
                    <Ionicons name="arrow-forward" size={iconSizes.sm} color={module.color} />
                  </View>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>

          {filteredModules.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={iconSizes['2xl']} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No modules found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['2xl'],
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerContent: {
    gap: spacing.md,
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    height: 46,
  },
  searchInput: {
    flex: 1,
    ...getTypographyStyle('base', 'regular'),
    padding: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  sectionTitle: {
    ...getTypographyStyle('xs', 'bold'),
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  modulesSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moduleCard: {
    minHeight: 200,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  moduleDetails: {
    flex: 1,
    paddingRight: spacing['2xl'] + spacing.sm, // Prevent overlap with categoryTag
    paddingBottom: spacing.lg, // Prevent overlap with arrowIcon
  },
  moduleName: {
    ...getTypographyStyle('base', 'bold'),
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  moduleDescription: {
    ...getTypographyStyle('xs', 'regular'),
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  categoryTag: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryTagText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  arrowIcon: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyText: {
    ...getTypographyStyle('xl', 'semibold'),
    marginTop: spacing.base,
  },
  emptySubtext: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: spacing.xs,
  },
});
