import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useMyLeaves } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { getStatusColor, shadows, spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function LeaveHistoryScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { data: leavesData, isLoading, refetch, isRefetching } = useMyLeaves();
  const leaves = Array.isArray(leavesData) ? leavesData : leavesData?.results || [];

  const filteredLeaves = selectedFilter === 'all' ? leaves : leaves.filter((leave: any) => leave.status === selectedFilter);

  const filterCounts = {
    all: leaves.length,
    pending: leaves.filter((l: any) => l.status === 'pending').length,
    approved: leaves.filter((l: any) => l.status === 'approved').length,
    rejected: leaves.filter((l: any) => l.status === 'rejected').length,
    cancelled: leaves.filter((l: any) => l.status === 'cancelled').length,
  };

  const renderFilterChip = (type: FilterType, label: string, count: number) => {
    const isSelected = selectedFilter === type;
    const statusColorObj = getStatusColor(type, isDark);

    return (
      <TouchableOpacity
        onPress={() => setSelectedFilter(type)}
        accessibilityLabel={`${label} - ${count} leaves`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.full,
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderWidth: 1.5,
          borderColor: isSelected ? theme.primary : theme.border,
          marginRight: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          ...shadows.sm,
        }}
      >
        <Text style={[getTypographyStyle('sm', isSelected ? 'semibold' : 'medium'), { color: isSelected ? '#FFFFFF' : theme.text }]}>
          {label}
        </Text>
        <View style={{ backgroundColor: isSelected ? getOpacityColor('#FFFFFF', 0.3) : theme.border, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.full }}>
          <Text style={[getTypographyStyle('xs', 'bold'), { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLeaveCard = (leave: any) => {
    const statusColorObj = getStatusColor(leave.status, isDark);
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);

    return (
      <TouchableOpacity
        key={leave.id}
        onPress={() => router.push(`/(modules)/leave/${leave.id}` as any)}
        accessibilityLabel={`${leave.leave_type} - ${leave.status}`}
        accessibilityRole="button"
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1.5,
          borderColor: statusColorObj.border,
          ...shadows.sm,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: getOpacityColor(statusColorObj.bg, 0.3), borderWidth: 1.5, borderColor: statusColorObj.border, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-outline" size={iconSizes.sm} color={statusColorObj.icon} accessibilityLabel={leave.leave_type} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>{leave.leave_type}</Text>
              <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                {leave.total_days || 0} {(leave.total_days || 0) === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg, backgroundColor: getOpacityColor(statusColorObj.bg, 0.2), borderWidth: 1, borderColor: statusColorObj.border }}>
            <Text style={[getTypographyStyle('xs', 'bold'), { color: statusColorObj.text }]}>
              {leave.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md }}>
          <View style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }}>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary, marginBottom: spacing.xs }]}>FROM</Text>
            <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>{format(fromDate, 'MMM dd')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={iconSizes.sm} color={theme.textSecondary} accessibilityLabel="to" />
          <View style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }}>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary, marginBottom: spacing.xs }]}>TO</Text>
            <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>{format(toDate, 'MMM dd')}</Text>
          </View>
        </View>

        {leave.reason && (
          <View style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, marginBottom: spacing.md }}>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary, marginBottom: spacing.xs }]}>REASON</Text>
            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.text, lineHeight: 16 }]} numberOfLines={2}>
              {leave.reason}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name="calendar-outline" size={iconSizes.xs} color={theme.textSecondary} />
          <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
            Applied on {format(new Date(leave.created_at), 'MMM dd, yyyy')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Leave History" showBack showNotifications={false} />

      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg }}>
          {renderFilterChip('all', 'All', filterCounts.all)}
          {renderFilterChip('pending', 'Pending', filterCounts.pending)}
          {renderFilterChip('approved', 'Approved', filterCounts.approved)}
          {renderFilterChip('rejected', 'Rejected', filterCounts.rejected)}
          {renderFilterChip('cancelled', 'Cancelled', filterCounts.cancelled)}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[getTypographyStyle('sm', 'medium'), { marginTop: spacing.md, color: theme.textSecondary }]}>Loading history...</Text>
          </View>
        ) : filteredLeaves.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title={selectedFilter === 'all' ? 'No Leave History' : `No ${selectedFilter} leaves`}
            description={selectedFilter === 'all' ? 'Your leave applications will appear here' : `You don't have any ${selectedFilter} leave applications`}
          />
        ) : (
          <View>{filteredLeaves.map(renderLeaveCard)}</View>
        )}
      </ScrollView>
    </View>
  );
}
