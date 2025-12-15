import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import { useLeave, useDeleteLeave } from '@/hooks/useHRQueries';
import { getStatusColor, shadows, spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { isValid, parseISO } from 'date-fns';

const safeFormat = (dateInput: string | Date | null | undefined, formatStr: string) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
  } catch (e) {
    return 'Invalid Date';
  }
};

export default function LeaveDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const leaveId = Number(id);

  const { data: leave, isLoading } = useLeave(leaveId);
  const deleteMutation = useDeleteLeave();

  // Remove mock fallback to ensure real data is used
  const leaveData = leave;
  // const statusColor = getStatusColor(leaveData.status, isDark); // Moved down

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Leave Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[getTypographyStyle('sm', 'medium'), { marginTop: spacing.md, color: theme.textSecondary }]}>
            Loading details...
          </Text>
        </View>
      </View>
    );
  }



  if (!leaveData) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Leave Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[getTypographyStyle('base', 'medium'), { color: theme.textSecondary }]}>
            Leave request not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Leave Details" showBack />
      {(() => {
        const statusColor = getStatusColor(leaveData.status, isDark);
        return (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
            {/* Status & Key Info Compact Card */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: statusColor.border,
                borderLeftWidth: 4,
                borderLeftColor: statusColor.text,
                ...shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>
                    {leaveData.leave_type}
                  </Text>
                  <Text style={[getTypographyStyle('sm', 'medium'), { color: statusColor.text, marginTop: 4 }]}>
                    {leaveData.status.toUpperCase()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                    Total Days
                  </Text>
                  <Text style={[getTypographyStyle('xl', 'bold'), { color: theme.text }]}>
                    {(leaveData as any).total_days || (leaveData as any).days || 0}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                    <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>
                      {safeFormat(leaveData.from_date, 'MMM dd, yyyy')} - {safeFormat(leaveData.to_date, 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                    <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>
                      {leaveData.shift_type === 'full_shift' ? 'Full Day' :
                        leaveData.shift_type === 'first_half' ? 'First Half' : 'Second Half'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Specific Dates Details */}
            {leaveData.dates && leaveData.dates.length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.textSecondary, marginBottom: spacing.xs, marginLeft: spacing.xs }]}>
                  Selected Dates ({leaveData.dates.length})
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {leaveData.dates.map((dateStr, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: theme.surface,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 6,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.text }]}>
                        {safeFormat(dateStr, 'MMM dd')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}


            {/* Reason & People */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
              <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, ...shadows.sm }}>
                <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary, marginBottom: 4 }]}>REASON</Text>
                <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text, lineHeight: 20 }]} numberOfLines={4}>
                  {leaveData.reason}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, ...shadows.sm }}>
                <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary, marginBottom: 4 }]}>APPLIED TO</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>
                      {((leaveData as any).reports_to_name || (leaveData as any).applied_to || 'M').charAt(0)}
                    </Text>
                  </View>
                  <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, flex: 1 }]} numberOfLines={2}>
                    {(leaveData as any).reports_to_name || (leaveData as any).applied_to || 'Manager'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, marginBottom: spacing.lg, ...shadows.sm }}>
              <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, marginBottom: spacing.sm }]}>Timeline</Text>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ marginTop: 2 }}>
                    <Ionicons name="ellipse" size={8} color={theme.success} />
                    <View style={{ width: 1, flex: 1, backgroundColor: theme.border, marginLeft: 3.5, marginVertical: 2 }} />
                  </View>
                  <View style={{ paddingBottom: spacing.sm }}>
                    <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>Applied</Text>
                    <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                      {safeFormat((leaveData as any).applied_date || leaveData.created_at, 'MMM dd, hh:mm a')}
                    </Text>
                  </View>
                </View>

                {leaveData.updated_at && (
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ marginTop: 2 }}>
                      <Ionicons name="ellipse" size={8} color={theme.info} />
                    </View>
                    <View>
                      <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>Last Updated</Text>
                      <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                        {safeFormat(leaveData.updated_at, 'MMM dd, hh:mm a')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            {leaveData.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
                <TouchableOpacity
                  onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
                  style={{
                    flex: 1,
                    backgroundColor: theme.surface,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                >
                  <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.primary }]}>
                    Edit Request
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Cancel Leave',
                      'Are you sure you want to cancel this leave request?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deleteMutation.mutateAsync(leaveId);
                              Alert.alert('Success', 'Leave request cancelled');
                              router.back();
                            } catch (error) {
                              Alert.alert('Error', 'Failed to cancel leave request');
                            }
                          },
                        },
                      ]
                    );
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: getOpacityColor(theme.error, 0.1),
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.error,
                  }}
                >
                  <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.error }]}>
                    Cancel Request
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );
      })()}
    </View>
  );
}
