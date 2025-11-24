import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, StatusBar, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  category: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-project',
    title: 'Create Project',
    description: 'Start new project',
    icon: 'briefcase-outline',
    route: '/(modules)/projects/create',
    color: moduleColors.projects.main,
    category: 'Projects',
  },
  {
    id: 'add-lead',
    title: 'Add Lead',
    description: 'Register new lead',
    icon: 'person-add-outline',
    route: '/(modules)/events/add-lead',
    color: moduleColors.events.main,
    category: 'Events',
  },
  {
    id: 'apply-leave',
    title: 'Apply Leave',
    description: 'Submit leave request',
    icon: 'time-outline',
    route: '/(modules)/hr/apply-leave',
    color: moduleColors.leave.main,
    category: 'HR',
  },
  {
    id: 'add-employee',
    title: 'Add Employee',
    description: 'Register new employee',
    icon: 'people-outline',
    route: '/(modules)/hr/add-employee',
    color: moduleColors.hr.main,
    category: 'HR',
  },
  {
    id: 'add-client',
    title: 'Add Client',
    description: 'Register new client',
    icon: 'business-outline',
    route: '/(modules)/events/add-client',
    color: moduleColors.clients.main,
    category: 'Events',
  },
  {
    id: 'add-venue',
    title: 'Add Venue',
    description: 'Register event venue',
    icon: 'location-outline',
    route: '/(modules)/events/add-venue',
    color: moduleColors.events.main,
    category: 'Events',
  },
  {
    id: 'add-reimbursement',
    title: 'Add Reimbursement',
    description: 'Submit expense claim',
    icon: 'receipt-outline',
    route: '/(modules)/hr/add-reimbursement',
    color: moduleColors.finance.main,
    category: 'HR',
  },
  {
    id: 'add-event',
    title: 'Add Event',
    description: 'View lead list',
    icon: 'calendar-outline',
    route: '/(modules)/events',
    color: moduleColors.events.main,
    category: 'Events',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

export default function QuickAddScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(QUICK_ACTIONS.map(a => a.category)))];

  const filteredActions = selectedCategory === 'All' 
    ? QUICK_ACTIONS 
    : QUICK_ACTIONS.filter(a => a.category === selectedCategory);

  const handleActionPress = (action: QuickAction) => {
    router.push(action.route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Professional Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Perform common tasks instantly
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <AnimatedPressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderWidth: 1.5,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                hapticType="selection"
                springConfig="bouncy"
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? theme.textInverse : theme.text,
                    },
                  ]}
                >
                  {category}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {filteredActions.length} {filteredActions.length === 1 ? 'ACTION' : 'ACTIONS'} AVAILABLE
          </Text>

          <View style={styles.actionsGrid}>
            {filteredActions.map((action, index) => (
              <AnimatedPressable
                key={action.id}
                onPress={() => handleActionPress(action)}
                style={[
                  styles.actionCard,
                  getCardStyle(theme.surface, 'md', 'xl'),
                  { width: CARD_WIDTH },
                ]}
                hapticType="medium"
                springConfig="gentle"
                animateOnMount={true}
                delay={index * 50}
              >
                {/* Gradient Background */}
                <View style={styles.cardGradient}>
                  <LinearGradient
                    colors={[`${action.color}08`, `${action.color}00`]}
                    style={styles.gradientOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </View>

                {/* Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={iconSizes.xl + 6} color={action.color} />
                </View>

                {/* Action Details */}
                <View style={styles.actionDetails}>
                  <Text style={[styles.actionTitle, { color: theme.text }]} numberOfLines={1}>
                    {action.title}
                  </Text>
                  <Text style={[styles.actionDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {action.description}
                  </Text>
                </View>

                {/* Category Tag */}
                <View style={[styles.categoryTag, { backgroundColor: theme.background }]}>
                  <Text style={[styles.categoryTagText, { color: theme.textSecondary }]}>
                    {action.category}
                  </Text>
                </View>

                {/* Arrow Icon */}
                <View style={styles.arrowIcon}>
                  <Ionicons name="arrow-forward" size={iconSizes.sm} color={action.color} />
                </View>
              </AnimatedPressable>
            ))}
          </View>

          {filteredActions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={iconSizes['3xl']} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No actions found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Try selecting a different category
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    gap: spacing.xs,
  },
  headerTitle: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
  },
  scrollContent: {
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  categoryText: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  actionsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
  },
  sectionTitle: {
    ...getTypographyStyle('xs', 'bold'),
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    minHeight: 180,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
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
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    ...getTypographyStyle('base', 'bold'),
    marginBottom: spacing.xs,
  },
  actionDescription: {
    ...getTypographyStyle('xs', 'regular'),
    lineHeight: 18,
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
