import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Chip, AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designTokens';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';

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
    color: '#3B82F6',
    category: 'Management',
    badge: 'Active',
  },
  {
    id: 'events',
    name: 'Event Management',
    description: 'Plan & organize company events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: '#8B5CF6',
    category: 'Operations',
    badge: 'Active',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Track expenses & financial records',
    icon: 'cash',
    route: '/(modules)/finance',
    color: '#10B981',
    category: 'Finance',
    badge: 'Updated',
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Monitor projects & tasks',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: '#F59E0B',
    category: 'Management',
    badge: 'Active',
  },
  {
    id: 'leave',
    name: 'Leave Management',
    description: 'Apply & approve leave requests',
    icon: 'time',
    route: '/(modules)/leave',
    color: '#EF4444',
    category: 'Management',
    badge: 'Pending',
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
    const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Modules
          </Text>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { 
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }]}>
            <Ionicons name="search" size={iconSizes.sm} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Search modules..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={iconSizes.sm} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <AnimatedPressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                hapticType="selection"
                springConfig="bouncy"
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.text,
                    },
                  ]}
                >
                  {category}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Modules Grid */}
        <View style={styles.modulesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {filteredModules.length} {filteredModules.length === 1 ? 'Module' : 'Modules'} Available
          </Text>

          <View style={styles.modulesGrid}>
            {filteredModules.map((module) => {
              const isActive = module.badge === 'Active';
              
              return (
                <AnimatedPressable
                  key={module.id}
                  onPress={() => router.push(module.route as any)}
                  style={[
                    styles.moduleCard,
                    getCardStyle(theme.colors.surface, 'md', 'lg'),
                  ]}
                  hapticType="medium"
                  springConfig="gentle"
                  animateOnMount={true}
                >
                  <View style={styles.moduleContent}>
                    {/* Icon Container */}
                    <View style={[styles.moduleIconContainer, { backgroundColor: module.color + '15' }]}>
                      <Ionicons name={module.icon} size={iconSizes.lg} color={module.color} />
                    </View>

                    {/* Module Info */}
                    <View style={styles.moduleInfo}>
                      <View style={styles.moduleTitleRow}>
                        <Text style={[styles.moduleName, { color: theme.colors.text }]}>
                          {module.name}
                        </Text>
                        {/* Badge - Active = Purple bg + white text, Others = White bg + primary border */}
                        {module.badge && (
                          <View style={[
                            styles.moduleBadge,
                            isActive 
                              ? { backgroundColor: '#8B5CF6' }
                              : { backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.primary }
                          ]}>
                            <Text style={[
                              styles.badgeText,
                              { color: isActive ? '#FFFFFF' : theme.colors.primary }
                            ]}>
                              {module.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {module.description}
                      </Text>
                    </View>

                    {/* Arrow Icon */}
                    <Ionicons name="chevron-forward" size={iconSizes.sm} color={theme.colors.textSecondary} />
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>

          {filteredModules.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={iconSizes['2xl']} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No modules found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    gap: spacing.base,
  },
  headerTitle: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    ...getTypographyStyle('base', 'regular'),
    padding: 0,
  },
  scrollContent: {
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  categoryText: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  modulesSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
  },
  sectionTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.base,
  },
  modulesGrid: {
    gap: spacing.md,
  },
  moduleCard: {
    overflow: 'hidden',
  },
  moduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.base,
  },
  moduleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  moduleName: {
    ...getTypographyStyle('base', 'bold'),
    flex: 1,
  },
  moduleDescription: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 20,
  },
  moduleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...getTypographyStyle('xs', 'bold'),
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
