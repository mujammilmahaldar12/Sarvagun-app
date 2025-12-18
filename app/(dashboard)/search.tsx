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
import { useGlobalSearch } from '@/hooks/useSearchQueries';
import type { SearchPerson, SearchProject, SearchTask, SearchDocument, SearchEvent, SearchClient, SearchVendor } from '@/services/search.service';

const { spacing, borderRadius, iconSizes } = designSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'people' | 'projects' | 'tasks' | 'documents' | 'events' | 'clients' | 'vendors'>('all');

  // State for expanded sections - initially all collapsed (showing limited items)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const ITEMS_PER_SECTION = 3; // Show only 3 items initially per section

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Real API search with React Query
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(searchQuery, {
    category: selectedCategory,
    limit: 20,
  });

  // Quick search categories
  const categories = [
    { id: 'people', label: 'People', icon: 'people-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'clients', label: 'Clients', icon: 'person-outline' },
    { id: 'vendors', label: 'Vendors', icon: 'construct-outline' },
    { id: 'projects', label: 'Projects', icon: 'briefcase-outline' },
    { id: 'tasks', label: 'Tasks', icon: 'checkmark-circle-outline' },
  ];

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId as any);
    if (searchQuery.length > 0) {
      // React Query will automatically refetch with new category
    }
  };

  // Get all results flattened for display
  const allResults = searchResults ? [
    ...searchResults.people,
    ...searchResults.projects,
    ...searchResults.tasks,
    ...searchResults.documents,
    ...(searchResults.events || []),
    ...(searchResults.clients || []),
    ...(searchResults.vendors || []),
  ] : [];

  const totalResults = searchResults?.total_count || 0;

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
                      onPress={() => handleCategoryPress(category.id)}
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
                {isSearching ? 'Searching...' : `${totalResults} results for "${searchQuery}"`}
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
              ) : allResults.length > 0 ? (
                // Render results based on type
                <>
                  {/* People Results */}
                  {searchResults?.people && searchResults.people.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>People ({searchResults.people.length})</Text>
                      </View>
                      {(expandedSections.has('people') ? searchResults.people : searchResults.people.slice(0, ITEMS_PER_SECTION)).map((person: SearchPerson, index) => (
                        <Animated.View
                          key={`person-${person.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push(`/(dashboard)/profile?id=${person.id}`)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <Avatar
                                  size={56}
                                  source={person.avatar ? { uri: person.avatar } : undefined}
                                  name={person.name}
                                  onlineStatus={person.isOnline}
                                />
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {person.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]}>
                                    {person.designation || 'N/A'}
                                  </Text>
                                  {person.department && (
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
                                  )}
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.people.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('people')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: `${theme.primary}10` }]}
                        >
                          <Text style={[styles.showMoreText, { color: theme.primary }]}>
                            {expandedSections.has('people') ? 'Show Less' : `Show ${searchResults.people.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('people') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.primary}
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Projects Results */}
                  {searchResults?.projects && searchResults.projects.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Projects ({searchResults.projects.length})</Text>
                      </View>
                      {(expandedSections.has('projects') ? searchResults.projects : searchResults.projects.slice(0, ITEMS_PER_SECTION)).map((project: SearchProject, index) => (
                        <Animated.View
                          key={`project-${project.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push(`/(modules)/projects/${project.id}`)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.projectIcon, { backgroundColor: `${theme.primary}15` }]}>
                                  <Ionicons name="briefcase" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {project.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                                    {project.description || 'No description'}
                                  </Text>
                                  <View style={styles.resultMeta}>
                                    <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                      {project.status || 'Active'} • Progress: {project.progress || 0}%
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.projects.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('projects')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: `${theme.primary}10` }]}
                        >
                          <Text style={[styles.showMoreText, { color: theme.primary }]}>
                            {expandedSections.has('projects') ? 'Show Less' : `Show ${searchResults.projects.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('projects') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.primary}
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Tasks Results */}
                  {searchResults?.tasks && searchResults.tasks.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Tasks ({searchResults.tasks.length})</Text>
                      </View>
                      {(expandedSections.has('tasks') ? searchResults.tasks : searchResults.tasks.slice(0, ITEMS_PER_SECTION)).map((task: SearchTask, index) => (
                        <Animated.View
                          key={`task-${task.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push('/(modules)/projects' as any)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.taskIcon, { backgroundColor: `${theme.primary}15` }]}>
                                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {task.title}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                                    {task.project_name || 'No project'}
                                  </Text>
                                  <View style={styles.resultMeta}>
                                    <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                      {task.status || 'Pending'} • {task.priority || 'Normal'} Priority
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.tasks.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('tasks')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: `${theme.primary}10` }]}
                        >
                          <Text style={[styles.showMoreText, { color: theme.primary }]}>
                            {expandedSections.has('tasks') ? 'Show Less' : `Show ${searchResults.tasks.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('tasks') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.primary}
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Documents Results */}
                  {searchResults?.documents && searchResults.documents.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Documents ({searchResults.documents.length})</Text>
                      </View>
                      {(expandedSections.has('documents') ? searchResults.documents : searchResults.documents.slice(0, ITEMS_PER_SECTION)).map((doc: SearchDocument, index) => (
                        <Animated.View
                          key={`doc-${doc.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => console.log('Document:', doc.name)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.docIcon, { backgroundColor: `${theme.primary}15` }]}>
                                  <Ionicons name="document-text" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {doc.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]}>
                                    {doc.type || 'File'} • {doc.module || 'General'}
                                  </Text>
                                  {doc.uploaded_by && (
                                    <View style={styles.resultMeta}>
                                      <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                        Uploaded by {doc.uploaded_by}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.documents.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('documents')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: `${theme.primary}10` }]}
                        >
                          <Text style={[styles.showMoreText, { color: theme.primary }]}>
                            {expandedSections.has('documents') ? 'Show Less' : `Show ${searchResults.documents.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('documents') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.primary}
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Events Results */}
                  {searchResults?.events && searchResults.events.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Events ({searchResults.events.length})</Text>
                      </View>
                      {(expandedSections.has('events') ? searchResults.events : searchResults.events.slice(0, ITEMS_PER_SECTION)).map((event: SearchEvent, index) => (
                        <Animated.View
                          key={`event-${event.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push(`/(modules)/events/${event.id}` as any)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.projectIcon, { backgroundColor: '#F59E0B15' }]}>
                                  <Ionicons name="calendar" size={24} color="#F59E0B" />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {event.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                                    {event.event_type || 'Event'} • {event.client_name || 'No client'}
                                  </Text>
                                  <View style={styles.resultMeta}>
                                    <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                      {event.status || 'Planned'} {event.venue ? `• ${event.venue}` : ''}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.events.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('events')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: '#F59E0B10' }]}
                        >
                          <Text style={[styles.showMoreText, { color: '#F59E0B' }]}>
                            {expandedSections.has('events') ? 'Show Less' : `Show ${searchResults.events.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('events') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#F59E0B"
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Clients Results */}
                  {searchResults?.clients && searchResults.clients.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Clients ({searchResults.clients.length})</Text>
                      </View>
                      {(expandedSections.has('clients') ? searchResults.clients : searchResults.clients.slice(0, ITEMS_PER_SECTION)).map((client: SearchClient, index) => (
                        <Animated.View
                          key={`client-${client.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push(`/(modules)/events` as any)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.projectIcon, { backgroundColor: '#10B98115' }]}>
                                  <Ionicons name="person" size={24} color="#10B981" />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {client.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]}>
                                    {client.company || client.email || 'Client'}
                                  </Text>
                                  <View style={styles.resultMeta}>
                                    <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                      {client.category || 'General'} • {client.phone || 'No phone'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.clients.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('clients')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: '#10B98110' }]}
                        >
                          <Text style={[styles.showMoreText, { color: '#10B981' }]}>
                            {expandedSections.has('clients') ? 'Show Less' : `Show ${searchResults.clients.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('clients') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#10B981"
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}

                  {/* Vendors Results */}
                  {searchResults?.vendors && searchResults.vendors.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>Vendors ({searchResults.vendors.length})</Text>
                      </View>
                      {(expandedSections.has('vendors') ? searchResults.vendors : searchResults.vendors.slice(0, ITEMS_PER_SECTION)).map((vendor: SearchVendor, index) => (
                        <Animated.View
                          key={`vendor-${vendor.id}`}
                          entering={FadeInUp.delay(200 + index * 50).duration(400)}
                        >
                          <AnimatedPressable
                            onPress={() => router.push(`/(modules)/finance/add-vendor?id=${vendor.id}` as any)}
                            hapticType="light"
                          >
                            <GlassCard
                              variant="default"
                              intensity="light"
                              style={styles.resultCard}
                            >
                              <View style={styles.resultContent}>
                                <View style={[styles.projectIcon, { backgroundColor: '#8B5CF615' }]}>
                                  <Ionicons name="construct" size={24} color="#8B5CF6" />
                                </View>
                                <View style={styles.resultInfo}>
                                  <Text style={[styles.resultName, { color: theme.text }]}>
                                    {vendor.name}
                                  </Text>
                                  <Text style={[styles.resultDetails, { color: theme.textSecondary }]}>
                                    {(typeof vendor.category === 'object' && vendor.category !== null)
                                      ? (vendor.category as any).name
                                      : vendor.category || 'Vendor'} • {vendor.contact_person || 'No contact'}
                                  </Text>
                                  {vendor.phone && (
                                    <View style={styles.resultMeta}>
                                      <Text style={[styles.resultMetaText, { color: theme.textSecondary }]}>
                                        {vendor.phone} {vendor.email ? `• ${vendor.email}` : ''}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </GlassCard>
                          </AnimatedPressable>
                        </Animated.View>
                      ))}
                      {searchResults.vendors.length > ITEMS_PER_SECTION && (
                        <AnimatedPressable
                          onPress={() => toggleSection('vendors')}
                          hapticType="light"
                          style={[styles.showMoreBtn, { backgroundColor: '#8B5CF610' }]}
                        >
                          <Text style={[styles.showMoreText, { color: '#8B5CF6' }]}>
                            {expandedSections.has('vendors') ? 'Show Less' : `Show ${searchResults.vendors.length - ITEMS_PER_SECTION} More`}
                          </Text>
                          <Ionicons
                            name={expandedSections.has('vendors') ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#8B5CF6"
                          />
                        </AnimatedPressable>
                      )}
                    </View>
                  )}
                </>
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
  categoryTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  projectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  showMoreText: {
    ...getTypographyStyle('sm', 'semibold'),
  },
});
