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

export default function LeaveDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const leaveId = Number(id);

  const { data: leave, isLoading } = useLeave(leaveId);
  const deleteMutation = useDeleteLeave();

  // Mock data fallback
  const mockLeave = {
    id: Number(id),
    leave_type: 'Annual Leave',
    from_date: '2025-11-25',
    to_date: '2025-11-29',
    days: 5,
    shift_type: 'full_shift',
    status: 'pending',
    reason: 'Family vacation to Goa. Need to attend family function and spend time with relatives.',
    created_at: '2025-11-20T10:30:00Z',
    updated_at: '2025-11-20T10:30:00Z',
    applied_to: 'John Manager',
    documents: [],
  };

  const leaveData = leave || mockLeave;
  const statusColor = getStatusColor(leaveData.status, isDark);

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Leave Details" showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Status Card */}
        <View
          style={{
            backgroundColor: getOpacityColor(statusColor.bg, 0.2),
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderWidth: 2,
            borderColor: statusColor.border,
            ...shadows.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.surface,
                  borderWidth: 2,
                  borderColor: statusColor.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={iconSizes.lg} color={statusColor.border} accessibilityLabel={leaveData.status} />
              </View>
              <View>
                <Text style={[getTypographyStyle('xl', 'bold'), { color: statusColor.text }]}>
                  {leaveData.status.toUpperCase()}
                </Text>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: statusColor.text, opacity: 0.7, marginTop: spacing.xs }]}>
                  Leave Request #{leaveData.id}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leave Type Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
            ...shadows.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            <Ionicons name="calendar-outline" size={iconSizes.md} color={theme.primary} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
              Leave Information
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>Type</Text>
              <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>
                {leaveData.leave_type}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: theme.border }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>Duration</Text>
              <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>
                {(leaveData as any).total_days || (leaveData as any).days || 0} {((leaveData as any).total_days || (leaveData as any).days || 0) === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: theme.border }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>Shift Type</Text>
              <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>
                {leaveData.shift_type === 'full_shift' ? 'Full Day' : 
                 leaveData.shift_type === 'first_half' ? 'First Half' : 'Second Half'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dates Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
            ...shadows.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
            <Ionicons name="time-outline" size={iconSizes.md} color={theme.info} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
              Leave Period
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: getOpacityColor(theme.info, 0.1), borderWidth: 1, borderColor: theme.info }}>
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.info, marginBottom: spacing.sm }]}>
                FROM DATE
              </Text>
              <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.info }]}>
                {format(new Date(leaveData.from_date), 'MMM dd')}
              </Text>
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.info, marginTop: spacing.xs }]}>
                {format(new Date(leaveData.from_date), 'yyyy')}
              </Text>
            </View>

            <View style={{ justifyContent: 'center' }}>
              <Ionicons name="arrow-forward" size={iconSizes.md} color={theme.textSecondary} />
            </View>

            <View style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: getOpacityColor(theme.info, 0.1), borderWidth: 1, borderColor: theme.info }}>
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.info, marginBottom: spacing.sm }]}>
                TO DATE
              </Text>
              <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.info }]}>
                {format(new Date(leaveData.to_date), 'MMM dd')}
              </Text>
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.info, marginTop: spacing.xs }]}>
                {format(new Date(leaveData.to_date), 'yyyy')}
              </Text>
            </View>
          </View>
        </View>

        {/* Reason Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
            ...shadows.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            <Ionicons name="document-text-outline" size={iconSizes.md} color={theme.warning} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
              Reason
            </Text>
          </View>
          <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, lineHeight: 22 }]}>
            {leaveData.reason}
          </Text>
        </View>

        {/* Applied To Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
            ...shadows.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={iconSizes.sm} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
                APPLIED TO
              </Text>
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
                {(leaveData as any).reports_to_name || (leaveData as any).applied_to || 'Manager'}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline Card */}
        <View
          style={{
            backgroundColor: getOpacityColor(theme.background, 0.5),
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: theme.border,
            ...shadows.sm,
          }}
        >
          <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, marginBottom: spacing.md }]}>
            Timeline
          </Text>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="checkmark-circle" size={iconSizes.xs} color={theme.success} />
              <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                Applied on {format(new Date((leaveData as any).applied_date || leaveData.created_at || new Date()), 'MMM dd, yyyy · hh:mm a')}
              </Text>
            </View>
            {leaveData.updated_at && leaveData.updated_at !== leaveData.created_at && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="refresh-circle" size={iconSizes.xs} color={theme.info} />
                <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                  Updated on {format(new Date(leaveData.updated_at), 'MMM dd, yyyy · hh:mm a')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {leaveData.status === 'pending' && (
          <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
              accessibilityLabel="Edit Leave Request"
              accessibilityRole="button"
              style={{
                backgroundColor: theme.primary,
                paddingVertical: spacing.lg,
                borderRadius: borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.md,
                ...shadows.md,
              }}
            >
              <Ionicons name="create-outline" size={iconSizes.md} color="#FFFFFF" />
              <Text style={[getTypographyStyle('base', 'bold'), { color: '#FFFFFF' }]}>
                Edit Leave Request
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
              accessibilityLabel="Cancel Leave Request"
              accessibilityRole="button"
              style={{
                backgroundColor: theme.surface,
                paddingVertical: spacing.lg,
                borderRadius: borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.md,
                borderWidth: 2,
                borderColor: theme.error,
                ...shadows.sm,
              }}
            >
              <Ionicons name="close-circle-outline" size={iconSizes.md} color={theme.error} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.error }]}>
                Cancel Leave Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
