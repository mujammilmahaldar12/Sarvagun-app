import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { getShadowStyle } from '@/utils/styleHelpers';
import { useTheme } from '@/hooks/useTheme';
import { useTeamMembers } from '@/hooks/useProjectQueries';

const { spacing, borderRadius, typography } = designSystem;

export default function TeamLeadDashboard() {
  const { theme } = useTheme();

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading, error: membersError } = useTeamMembers();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Team Lead Dashboard:', {
      teamMembers: Array.isArray(teamMembers) ? teamMembers.length : 'not array',
      membersError: membersError?.message,
    });
  }, [teamMembers, membersError]);

  const handleMemberSelect = (member: any) => {
    console.log('📋 Selected team member:', member.first_name, member.last_name);
    // Navigate to projects with team member context - same UI as project management
    router.push(`/(modules)/projects?teamMemberId=${member.id}&teamMemberName=${encodeURIComponent(member.first_name + ' ' + member.last_name)}&isTeamLead=true`);
  };

  const renderMemberCard = (member: any) => (
    <TouchableOpacity
      key={member.id}
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
        ...getShadowStyle('sm'),
      }}
      onPress={() => handleMemberSelect(member)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* Member Avatar */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: typography.sizes.xl,
              fontWeight: '600',
              color: theme.primary,
            }}
          >
            {member.first_name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        
        {/* Member Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: '600',
              color: theme.text,
              marginBottom: spacing[1],
            }}
          >
            {member.first_name} {member.last_name}
          </Text>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing[1],
            }}
          >
            {member.designation} • {member.category}
          </Text>
          <Text
            style={{
              fontSize: typography.sizes.xs,
              color: theme.textSecondary,
            }}
          >
            {member.email}
          </Text>
        </View>

        {/* Action Indicator */}
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="chevron-forward" size={24} color={theme.primary} />
          <Text
            style={{
              fontSize: typography.sizes.xs,
              color: theme.primary,
              marginTop: spacing[1],
              fontWeight: '600',
            }}
          >
            View Projects
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (membersLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: spacing[2] }}>
            Loading team members...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing[2] }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              color: theme.text,
              marginLeft: spacing[2],
            }}
          >
            Select Team Member
          </Text>
        </View>
      </View>

      {/* Instruction Text */}
      <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[3] }}>
        <Text
          style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            textAlign: 'center',
          }}
        >
          Choose a team member to view their projects and tasks.{'\n'}
          You'll be able to rate their tasks as a team lead.
        </Text>
      </View>

      {/* Team Members List */}
      <ScrollView 
        contentContainerStyle={{ 
          padding: spacing[4], 
          paddingBottom: spacing[8] 
        }}
        showsVerticalScrollIndicator={false}
      >
        {!Array.isArray(teamMembers) || teamMembers.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={{ 
              color: theme.textSecondary, 
              marginTop: spacing[2], 
              textAlign: 'center',
              fontSize: typography.sizes.base 
            }}>
              {membersError ? `Error: ${membersError.message}` : 'No team members found'}
              {'\n'}Your team members will appear here
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: typography.sizes.base,
                fontWeight: '600',
                color: theme.text,
                marginBottom: spacing[3],
              }}
            >
              Team Members ({teamMembers.length})
            </Text>
            {teamMembers.map(renderMemberCard)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}