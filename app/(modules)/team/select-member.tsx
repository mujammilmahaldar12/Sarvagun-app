import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { EmptyState, LoadingState, Card } from '@/components';
import { spacing, borderRadius, getOpacityColor } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useTheme } from '@/hooks/useTheme';
import { useTeamMembers } from '@/hooks/useProjectQueries';

export default function TeamLeadDashboard() {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading, error: membersError } = useTeamMembers();

  // Filter team members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;

    const query = searchQuery.toLowerCase();
    return teamMembers.filter((member: any) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const designation = (member.designation || '').toLowerCase();
      const email = (member.email || '').toLowerCase();

      return fullName.includes(query) || designation.includes(query) || email.includes(query);
    });
  }, [teamMembers, searchQuery]);

  const handleMemberSelect = (member: any) => {
    console.log('📋 Selected team member:', member.first_name, member.last_name);
    router.push(`/(modules)/projects?teamMemberId=${member.id}&teamMemberName=${encodeURIComponent(member.first_name + ' ' + member.last_name)}&isTeamLead=true`);
  };

  const renderMemberCard = (member: any, index: number) => (
    <Animated.View key={member.id} entering={FadeIn.delay(index * 50)}>
      <TouchableOpacity
        onPress={() => handleMemberSelect(member)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" shadow="sm" padding="lg" style={styles.memberCard}>
          <View style={styles.memberCardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: getOpacityColor(theme.primary, 0.15) }]}>
              <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.primary }]}>
                {member.first_name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>

            {/* Member Info */}
            <View style={styles.memberInfo}>
              <Text style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}>
                {member.first_name} {member.last_name}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="briefcase-outline" size={14} color={theme.textSecondary} />
                <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginLeft: 4 }]}>
                  {member.designation}
                </Text>
                {member.category && (
                  <>
                    <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
                    <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>
                      {member.category}
                    </Text>
                  </>
                )}
              </View>
              {member.email && (
                <View style={styles.metaRow}>
                  <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
                  <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, marginLeft: 4 }]}>
                    {member.email}
                  </Text>
                </View>
              )}
            </View>

            {/* Action */}
            <View style={styles.actionContainer}>
              <Ionicons name="chevron-forward" size={24} color={theme.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  if (membersLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ModuleHeader title="Team Members" showBack showNotifications={false} />
        <LoadingState message="Loading team members..." />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ModuleHeader title="Team Members" showBack showNotifications={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: getOpacityColor(theme.primary, 0.1), borderColor: getOpacityColor(theme.primary, 0.3) }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text, marginLeft: spacing.sm, flex: 1 }]}>
            Select a team member to review and rate their performance
          </Text>
        </View>

        {/* Team Stats */}
        {teamMembers.length > 0 && (
          <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color={theme.primary} />
              <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.text, marginTop: 4 }]}>
                {teamMembers.length}
              </Text>
              <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                Team {teamMembers.length === 1 ? 'Member' : 'Members'}
              </Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        {teamMembers.length > 0 && (
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by name, designation, or email..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginBottom: spacing.sm }]}>
            {filteredMembers.length} {filteredMembers.length === 1 ? 'result' : 'results'} found
          </Text>
        )}

        {/* Team Members List */}
        {!Array.isArray(teamMembers) || teamMembers.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Team Members"
            subtitle={membersError ? `Error: ${membersError.message}` : "Your team members will appear here"}
          />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No Results"
            subtitle="Try adjusting your search query"
          />
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map(renderMemberCard)}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  statsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
  },
  membersList: {
    gap: spacing.md,
  },
  memberCard: {
    marginBottom: 0,
  },
  memberCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: spacing.xs,
  },
  actionContainer: {
    marginLeft: spacing.sm,
  },
});