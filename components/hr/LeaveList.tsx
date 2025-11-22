/**
 * Leave List Component
 * Displays leave requests with filtering, status badges, and role-based access
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeaves, useMyLeaves } from '../../hooks/useHRQueries';
import { usePermissions } from '../../store/permissionStore';
import StatusBadge from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import type { LeaveRequest, LeaveFilters } from '../../types/hr';

interface LeaveListProps {
  filters?: LeaveFilters;
  showMyLeaves?: boolean;
  compact?: boolean;
}

export const LeaveList: React.FC<LeaveListProps> = ({
  filters: externalFilters,
  showMyLeaves = false,
  compact = false,
}) => {
  const router = useRouter();
  const permissions = usePermissions();
  const [localFilters, setLocalFilters] = useState<LeaveFilters>(externalFilters || {});

  // Use appropriate hook based on permissions
  const shouldShowMyLeaves = showMyLeaves || (!permissions.hasPermission('leave:view_all') && !permissions.hasPermission('leave:view_team'));
  
  const { data: leavesData, isLoading, error, refetch } = shouldShowMyLeaves
    ? useMyLeaves(localFilters)
    : useLeaves(localFilters);

  const leaves = leavesData?.results || [];

  const handleLeavePress = (leave: LeaveRequest) => {
    router.push(`/(modules)/hr/${leave.id}?type=leave`);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && leaves.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading leaves...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load leaves</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (leaves.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="No leave requests"
        description={showMyLeaves ? "You haven't applied for any leaves yet" : "No leave requests found"}
      />
    );
  }

  return (
    <FlatList
      data={leaves}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <LeaveListItem
          leave={item}
          onPress={() => handleLeavePress(item)}
          compact={compact}
          showEmployee={!showMyLeaves}
        />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshing={isLoading}
      onRefresh={handleRefresh}
    />
  );
};

interface LeaveListItemProps {
  leave: LeaveRequest;
  onPress: () => void;
  compact: boolean;
  showEmployee: boolean;
}

const LeaveListItem: React.FC<LeaveListItemProps> = ({
  leave,
  onPress,
  compact,
  showEmployee,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    if (type.includes('Annual')) return '🏖️';
    if (type.includes('Sick')) return '🏥';
    if (type.includes('Casual')) return '🌴';
    if (type.includes('Study')) return '📚';
    if (type.includes('Optional')) return '🎉';
    return '📅';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.leaveItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leaveItemHeader}>
        <View style={styles.leaveTypeContainer}>
          <Text style={styles.leaveIcon}>{getLeaveTypeIcon(leave.leave_type)}</Text>
          <View style={styles.leaveInfo}>
            <Text style={styles.leaveType}>{leave.leave_type}</Text>
            {showEmployee && leave.employee_name && (
              <Text style={styles.employeeName}>{leave.employee_name}</Text>
            )}
          </View>
        </View>
        <StatusBadge
          status={leave.status}
          type={leave.status === 'approved' ? 'approved' : leave.status === 'rejected' ? 'rejected' : 'pending'}
        />
      </View>

      <View style={styles.leaveDates}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
          </Text>
        </View>
        <Text style={styles.daysText}>{leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}</Text>
      </View>

      {!compact && leave.reason && (
        <Text style={styles.reasonText} numberOfLines={2}>
          {leave.reason}
        </Text>
      )}

      {leave.approved_by_name && (
        <View style={styles.approvalInfo}>
          <Ionicons name="checkmark-circle" size={14} color={getStatusColor(leave.status)} />
          <Text style={styles.approvalText}>
            {leave.status === 'approved' ? 'Approved' : 'Reviewed'} by {leave.approved_by_name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  leaveItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leaveItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leaveIcon: {
    fontSize: 24,
  },
  leaveInfo: {
    flex: 1,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  employeeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  leaveDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  reasonText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  approvalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  approvalText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default LeaveList;
