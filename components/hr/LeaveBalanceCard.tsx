/**
 * Leave Balance Card Component
 * Displays leave balances for all leave types with progress indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLeaveBalance } from '../../hooks/useHRQueries';
import type { LeaveBalance } from '../../types/hr';

interface LeaveBalanceCardProps {
  employeeId?: number;
  compact?: boolean;
}

interface LeaveTypeData {
  type: string;
  color: string;
  icon: string;
  total: number;
  used: number;
  planned: number;
  available: number;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  employeeId,
  compact = false,
}) => {
  const { data: balance, isLoading, error } = useLeaveBalance(employeeId);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Time off balances</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  if (error || !balance) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Time off balances</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? 'Failed to load balances' : 'No balance data available'}
          </Text>
        </View>
      </View>
    );
  }

  const leaveTypes: LeaveTypeData[] = [
    {
      type: 'Annual Leave',
      color: '#8B5CF6',
      icon: '🏖️',
      total: balance.annual_leave_total,
      used: balance.annual_leave_used,
      planned: balance.annual_leave_planned || 0,
      available: balance.annual_leave_total - balance.annual_leave_used - (balance.annual_leave_planned || 0),
    },
    {
      type: 'Sick Leave',
      color: '#EF4444',
      icon: '🏥',
      total: balance.sick_leave_total,
      used: balance.sick_leave_used,
      planned: balance.sick_leave_planned || 0,
      available: balance.sick_leave_total - balance.sick_leave_used - (balance.sick_leave_planned || 0),
    },
    {
      type: 'Casual Leave',
      color: '#10B981',
      icon: '🌴',
      total: balance.casual_leave_total,
      used: balance.casual_leave_used,
      planned: balance.casual_leave_planned || 0,
      available: balance.casual_leave_total - balance.casual_leave_used - (balance.casual_leave_planned || 0),
    },
    {
      type: 'Study Leave',
      color: '#F59E0B',
      icon: '📚',
      total: balance.study_leave_total,
      used: balance.study_leave_used,
      planned: balance.study_leave_planned || 0,
      available: balance.study_leave_total - balance.study_leave_used - (balance.study_leave_planned || 0),
    },
    {
      type: 'Optional Leave',
      color: '#6366F1',
      icon: '🎉',
      total: balance.optional_leave_total,
      used: balance.optional_leave_used,
      planned: balance.optional_leave_planned || 0,
      available: balance.optional_leave_total - balance.optional_leave_used - (balance.optional_leave_planned || 0),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time off balances</Text>
      </View>
      
      <View style={styles.balanceList}>
        {leaveTypes.map((leave) => (
          <LeaveBalanceItem
            key={leave.type}
            {...leave}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
};

interface LeaveBalanceItemProps extends LeaveTypeData {
  compact: boolean;
}

const LeaveBalanceItem: React.FC<LeaveBalanceItemProps> = ({
  type,
  color,
  icon,
  total,
  used,
  planned,
  available,
  compact,
}) => {
  const usedPercentage = total > 0 ? (used / total) * 100 : 0;
  const plannedPercentage = total > 0 ? (planned / total) * 100 : 0;
  const availablePercentage = total > 0 ? (available / total) * 100 : 0;

  return (
    <View style={styles.balanceItem}>
      <View style={styles.balanceHeader}>
        <View style={styles.balanceTypeContainer}>
          <Text style={styles.balanceIcon}>{icon}</Text>
          <Text style={[styles.balanceType, { color }]}>{type}</Text>
        </View>
        <Text style={styles.balanceValue}>{available}d</Text>
      </View>

      {!compact && (
        <>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              {/* Used */}
              {used > 0 && (
                <View
                  style={[
                    styles.progressSegment,
                    { width: `${usedPercentage}%`, backgroundColor: '#94A3B8' },
                  ]}
                />
              )}
              {/* Planned */}
              {planned > 0 && (
                <View
                  style={[
                    styles.progressSegment,
                    { width: `${plannedPercentage}%`, backgroundColor: '#CBD5E1' },
                  ]}
                />
              )}
              {/* Available */}
              {available > 0 && (
                <View
                  style={[
                    styles.progressSegment,
                    { width: `${availablePercentage}%`, backgroundColor: color },
                  ]}
                />
              )}
            </View>
          </View>

          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.balanceDetailText}>Used: {used}d</Text>
            </View>
            {planned > 0 && (
              <View style={styles.balanceDetailItem}>
                <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                <Text style={styles.balanceDetailText}>Planned: {planned}d</Text>
              </View>
            )}
            <View style={styles.balanceDetailItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.balanceDetailText}>Available: {available}d / {total}d</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  balanceList: {
    gap: 16,
  },
  balanceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceIcon: {
    fontSize: 20,
  },
  balanceType: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  balanceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  balanceDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default LeaveBalanceCard;
