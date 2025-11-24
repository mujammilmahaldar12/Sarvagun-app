/**
 * Leave Balance Card Component
 * Displays leave balances for all leave types with progress indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLeaveBalance } from '../../hooks/useHRQueries';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, shadows, getOpacityColor, iconSizes } from '../../constants/designSystem';
import { getTypographyStyle } from '../../utils/styleHelpers';
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
  const { theme, isDark } = useTheme();
  const { data: balance, isLoading, error } = useLeaveBalance(employeeId);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Time off balances</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary, marginTop: spacing.md }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error || !balance) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Time off balances</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
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
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Time off balances</Text>
      </View>
      
      <View style={styles.balanceList}>
        {leaveTypes.map((leave) => (
          <LeaveBalanceItem
            key={leave.type}
            {...leave}
            compact={compact}
            theme={theme}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

interface LeaveBalanceItemProps extends LeaveTypeData {
  compact: boolean;
  theme?: any;
  isDark?: boolean;
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
  theme,
  isDark,
}) => {
  const usedPercentage = total > 0 ? (used / total) * 100 : 0;
  const plannedPercentage = total > 0 ? (planned / total) * 100 : 0;
  const availablePercentage = total > 0 ? (available / total) * 100 : 0;

  const usedColor = isDark ? '#94A3B8' : '#6B7280';
  const plannedColor = isDark ? '#CBD5E1' : '#D1D5DB';
  const progressBgColor = isDark ? '#374151' : '#F3F4F6';
  const textColor = theme?.text || '#1F2937';
  const secondaryTextColor = theme?.textSecondary || '#6B7280';

  return (
    <View style={[styles.balanceItem, { borderBottomColor: theme?.border || '#F3F4F6' }]}>
      <View style={styles.balanceHeader}>
        <View style={styles.balanceTypeContainer}>
          <Text style={styles.balanceIcon}>{icon}</Text>
          <Text style={[styles.balanceType, { color }]}>{type}</Text>
        </View>
        <Text style={[styles.balanceValue, { color: textColor }]}>{available}d</Text>
      </View>

      {!compact && (
        <>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: progressBgColor }]}>
              {/* Used */}
              {used > 0 && (
                <View
                  style={[
                    styles.progressSegment,
                    { width: `${usedPercentage}%`, backgroundColor: usedColor },
                  ]}
                />
              )}
              {/* Planned */}
              {planned > 0 && (
                <View
                  style={[
                    styles.progressSegment,
                    { width: `${plannedPercentage}%`, backgroundColor: plannedColor },
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
              <View style={[styles.legendDot, { backgroundColor: usedColor }]} />
              <Text style={[styles.balanceDetailText, { color: secondaryTextColor }]}>Used: {used}d</Text>
            </View>
            {planned > 0 && (
              <View style={styles.balanceDetailItem}>
                <View style={[styles.legendDot, { backgroundColor: plannedColor }]} />
                <Text style={[styles.balanceDetailText, { color: secondaryTextColor }]}>Planned: {planned}d</Text>
              </View>
            )}
            <View style={styles.balanceDetailItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.balanceDetailText, { color: secondaryTextColor }]}>Available: {available}d / {total}d</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
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
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  balanceList: {
    gap: 16,
  },
  balanceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
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
  },
});

export default LeaveBalanceCard;
