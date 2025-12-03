import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable, Avatar, GlassCard, Skeleton } from '@/components';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem, baseColors } from '@/constants/designSystem';

const { spacing, borderRadius, iconSizes } = designSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Mock search results - replace with real API call
  const results = searchQuery.length > 0 ? [
    {
      id: '1',
      name: 'John Doe',
      designation: 'Senior Developer',
      department: 'Engineering',
      avatar: null,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      designation: 'HR Manager',
      department: 'Human Resources',
      avatar: null,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      designation: 'Project Manager',
      department: 'Projects',
      avatar: null,
      isOnline: true,
    },
  ] : [];

  // Quick search categories
  const categories = [
    { id: '1', label: 'People', icon: 'people-outline' },
    { id: '2', label: 'Projects', icon: 'briefcase-outline' },
    { id: '3', label: 'Documents', icon: 'document-text-outline' },
    { id: '4', label: 'Tasks', icon: 'checkmark-circle-outline' },
  ];

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Simulate API call
    if (text.length > 0) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Glass Morphism Header */}
      <Animated.View 
        entering={FadeInDown.duration(400).springify()}
        style={styles.header}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.headerBlur, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              {/* Back Button */}
              <AnimatedPressable
                onPress={() => router.back()}
                style={styles.backButton}
                hapticType="light"
                springConfig="snappy"
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </AnimatedPressable>

              {/* YouTube-Style Search Bar */}
              <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={theme.textSecondary}
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholder="Search..."
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                    style={[
                      styles.searchInput,
                      { 
                        ...getTypographyStyle('sm', 'regular'), 
                        color: theme.text
                      }
                    ]}
                  />
                  {searchQuery.length > 0 && (
                    <AnimatedPressable 
                      onPress={() => handleSearch('')}
                      hapticType="light"
                    >
                      <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </AnimatedPressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Search Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searchQuery.length === 0 ? (
          <>
            {/* Quick Categories */}
            <Animated.View 
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Quick Search
              </Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <Animated.View
                    key={category.id}
                    entering={FadeInUp.delay(200 + index * 50).duration(400)}
                  >
                    <AnimatedPressable
                      onPress={() => console.log('Category:', category.label)}
                      hapticType="light"
                    >
                      <GlassCard 
                        variant="default" 
                        intensity="light"
                        style={styles.categoryCard}
                      >
                        <View style={styles.categoryContent}>
                          <View style={[styles.categoryIcon, { backgroundColor: `${theme.primary}15` }]}>
                            <Ionicons 
                              name={category.icon as any} 
                              size={24} 
                              color={theme.primary} 
                            />
                          </View>
                          <Text style={[styles.categoryLabel, { color: theme.text }]}>
                            {category.label}
                          </Text>
                        </View>
                      </GlassCard>
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Empty State */}
            <Animated.View 
              entering={FadeInUp.delay(400).duration(400)}
              style={styles.emptyState}
            >
              <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.primary}10` }]}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Start Searching
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Find colleagues, projects, documents{'\n'}and more across Sarvagun
              </Text>
            </Animated.View>
          </>
        ) : (
          <>
            {/* Search Results */}
            <Animated.View 
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.section}
            >
              <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
                {isSearching ? 'Searching...' : `${results.length} results for "${searchQuery}"`}
              </Text>

              {isSearching ? (
                // Loading Skeletons
                <>
                  {[1, 2, 3].map((i) => (
                    <GlassCard key={i} variant="default" intensity="light" style={styles.resultCard}>
                      <View style={styles.resultContent}>
                        <Skeleton width={56} height={56} borderRadius={28} />
                        <View style={styles.resultInfo}>
                          <Skeleton width={150} height={18} style={{ marginBottom: spacing.xs }} />
                          <Skeleton width={200} height={14} />
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </>
              ) : results.length > 0 ? (
                // Results
                results.map((person, index) => (
                  <Animated.View
                    key={person.id}
                    entering={FadeInUp.delay(200 + index * 50).duration(400)}
                  >
                    <AnimatedPressable
                      onPress={() => console.log('Person:', person.name)}
                      hapticType="light"
                    >
                      <GlassCard 
                        variant="default" 
                        intensity="light"
                        style={styles.resultCard}
                      >
                        <View style={styles.resultContent}>
                          {/* Avatar */}
                          <Avatar
                            size={56}
                            source={person.avatar ? { uri: person.avatar } : undefined}
                            name={person.name}
                            onlineStatus={person.isOnline}
                          />

                          {/* Person Info */}
                          <View style={styles.resultInfo}>
                            <Text style={[styles.resultName, { color: theme.text }]}>
                              {person.name}
                            </Text>
                            <Text style={[styles.resultDetails, { color: theme.textSecondary }]}>
                              {person.designation}
                            </Text>
                            <View style={styles.resultMeta}>
                              <Ionicons 
                                name="business-outline" 
                                size={14} 
                                color={theme.textSecondary} 
                              />
                              <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                {person.department}
                              </Text>
                            </View>
                          </View>

                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.textSecondary}
                          />
                        </View>
                      </GlassCard>
                    </AnimatedPressable>
                  </Animated.View>
                ))
              ) : (
                // No Results
                <Animated.View 
                  entering={FadeInUp.duration(400)}
                  style={styles.noResults}
                >
                  <Ionicons
                    name="sad-outline"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.noResultsText, { color: theme.text }]}>
                    No results found
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: theme.textSecondary }]}>
                    Try searching with different keywords
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerContent: {
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    paddingVertical: 2,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 140 : 160,
    paddingBottom: spacing['2xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    height: 100,
  },
  categoryContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: '100%',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing['4xl'],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...getTypographyStyle('base', 'regular'),
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsCount: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: 4,
  },
  resultDetails: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultMetaText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  noResultsText: {
    ...getTypographyStyle('lg', 'semibold'),
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noResultsSubtext: {
    ...getTypographyStyle('sm', 'regular'),
  },
});
