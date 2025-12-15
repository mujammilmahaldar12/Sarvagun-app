import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import eventsService from '@/services/events.service';
import { useTheme } from '@/hooks/useTheme';
import { KPICard, EmptyState, LoadingState, ActionSheet } from '@/components';
import type { Lead } from '@/types/events';
import { formatDate, formatCurrency } from '@/utils/formatters';

export default function LeadDetailScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ leadId: string }>();
  const leadId = parseInt(params.leadId);
  const queryClient = useQueryClient();

  const [showActionSheet, setShowActionSheet] = useState(false);

  // Fetch lead details
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => eventsService.getLeadById(leadId),
    enabled: !!leadId && !isNaN(leadId),
  });

  // Reject lead mutation with optimistic update
  const rejectMutation = useMutation({
    mutationFn: () => eventsService.rejectLead(leadId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lead', leadId] });
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      // Snapshot previous values
      const previousLead = queryClient.getQueryData(['lead', leadId]);
      const previousLeads = queryClient.getQueryData(['leads']);

      // Optimistically update lead status
      queryClient.setQueryData(['lead', leadId], (old: any) => ({
        ...old,
        status: 'rejected',
        reject: true,
      }));

      // Return context for rollback
      return { previousLead, previousLeads };
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStatistics'] });
      Alert.alert('Success', 'Lead rejected successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousLead) {
        queryClient.setQueryData(['lead', leadId], context.previousLead);
      }
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      Alert.alert('Error', error.message || 'Failed to reject lead');
    },
  });

  // Delete lead mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: () => eventsService.deleteLead(leadId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lead', leadId] });
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      // Snapshot previous values
      const previousLead = queryClient.getQueryData(['lead', leadId]);
      const previousLeads = queryClient.getQueryData(['leads']);

      // Optimistically remove from list
      queryClient.setQueryData(['leads'], (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((l: any) => l.id !== leadId);
        }
        return old;
      });

      // Return context for rollback
      return { previousLead, previousLeads };
    },
    onSuccess: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStatistics'] });
      Alert.alert('Success', 'Lead deleted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousLead) {
        queryClient.setQueryData(['lead', leadId], context.previousLead);
      }
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      Alert.alert('Error', error.message || 'Failed to delete lead');
    },
  });

  const handleConvert = () => {
    router.push(`/(modules)/events/convert-lead?leadId=${leadId}` as any);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(modules)/events/leads/add',
      params: { leadId: leadId }
    } as any);
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Lead',
      'Are you sure you want to reject this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectMutation.mutate(),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'converted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  const getSourceBadgeColor = (source?: string) => {
    return source === 'online' ? '#3b82f6' : '#8b5cf6';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingState variant="skeleton" skeletonCount={8} />
      </SafeAreaView>
    );
  }

  if (error || !lead) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Lead Not Found"
          subtitle="The lead you're looking for doesn't exist or has been deleted"
          action={{
            label: 'Go Back',
            icon: 'arrow-back',
            onPress: () => router.back(),
          }}
        />
      </SafeAreaView>
    );
  }

  const actionSheetActions = [
    ...(lead.status === 'pending'
      ? [
        {
          label: 'Convert to Event',
          icon: 'checkmark-circle' as const,
          onPress: handleConvert,
          destructive: false,
        },
        {
          label: 'Reject Lead',
          icon: 'close-circle' as const,
          onPress: handleReject,
          destructive: true,
        },
      ]
      : []),
    {
      label: 'Edit Lead',
      icon: 'create' as const,
      onPress: handleEdit,
    },
    {
      label: 'Delete Lead',
      icon: 'trash' as const,
      onPress: handleDelete,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Lead Details</Text>
          <View style={styles.headerBadges}>
            {lead.source && (
              <View
                style={[
                  styles.sourceBadge,
                  { backgroundColor: getSourceBadgeColor(lead.source) + '20' },
                ]}
              >
                <Ionicons
                  name={lead.source === 'online' ? 'globe' : 'storefront'}
                  size={12}
                  color={getSourceBadgeColor(lead.source)}
                />
                <Text
                  style={[
                    styles.sourceBadgeText,
                    { color: getSourceBadgeColor(lead.source) },
                  ]}
                >
                  {lead.source}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(lead.status) + '20' },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: getStatusColor(lead.status) }]}>
                {lead.status}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowActionSheet(true)}
          style={[styles.menuButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Information */}
        <Animated.View
          entering={FadeIn}
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Client Information</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={18} color={theme.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {lead.client?.name || 'N/A'}
                </Text>
              </View>
            </View>

            {lead.client?.number && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {lead.client.number}
                  </Text>
                </View>
              </View>
            )}

            {lead.client?.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {lead.client.email}
                  </Text>
                </View>
              </View>
            )}

            {lead.client?.alternate_number && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Alternate Phone
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {lead.client.alternate_number}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Lead Details */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lead Details</Text>
          </View>
          <View style={styles.sectionContent}>
            {lead.message && (
              <View style={styles.infoRow}>
                <Ionicons name="chatbubble-ellipses" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Message</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{lead.message}</Text>
                </View>
              </View>
            )}

            {lead.referral && (
              <View style={styles.infoRow}>
                <Ionicons name="ribbon" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Referral Source
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{lead.referral}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={18} color={theme.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Created Date</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {formatDate(lead.created_at)}
                </Text>
              </View>
            </View>

            {lead.updated_at && lead.updated_at !== lead.created_at && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {formatDate(lead.updated_at)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Conversion Info (if converted) */}
        {lead.status === 'converted' && lead.event_id && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Conversion Info</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-sharp" size={18} color={theme.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Converted Event ID
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>#{lead.event_id}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.viewEventButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push(`/(modules)/events/${lead.event_id}` as any)}
              >
                <Ionicons name="eye" size={18} color="#fff" />
                <Text style={styles.viewEventButtonText}>View Event</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        {lead.status === 'pending' && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.quickActions}>
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={handleEdit}
              >
                <Ionicons name="create" size={18} color={theme.text} />
                <Text style={[styles.secondaryActionButtonText, { color: theme.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  { backgroundColor: '#ef4444' + '20', borderColor: '#ef4444' },
                ]}
                onPress={handleReject}
              >
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={[styles.secondaryActionButtonText, { color: '#ef4444' }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Action Sheet */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        actions={actionSheetActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  viewEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewEventButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  quickActions: {
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
