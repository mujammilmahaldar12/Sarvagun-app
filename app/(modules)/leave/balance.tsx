/**
 * Leave Balance Screen - Revamped
 * Shows detailed leave balance breakdown per leave type
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeaveBalancesList } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components';
import { useTheme } from '@/hooks/useTheme';

// Leave type configurations with icons and colors
const LEAVE_TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  annual: { icon: 'calendar-outline', color: '#3B82F6' },
  sick: { icon: 'medical-outline', color: '#EF4444' },
  casual: { icon: 'cafe-outline', color: '#10B981' },
  study: { icon: 'book-outline', color: '#8B5CF6' },
  optional: { icon: 'options-outline', color: '#F59E0B' },
  earned: { icon: 'star-outline', color: '#06B6D4' },
  maternity: { icon: 'heart-outline', color: '#EC4899' },
  paternity: { icon: 'person-outline', color: '#14B8A6' },
  default: { icon: 'calendar', color: '#6366F1' },
};

const getLeaveConfig = (leaveType: string) => {
  const key = leaveType?.toLowerCase().replace(/\s+leave$/i, '').replace(/\s+/g, '_') || 'default';
  return LEAVE_TYPE_CONFIG[key] || LEAVE_TYPE_CONFIG.default;
};

interface LeaveBalanceItem {
  id: number;
  leave_type: string;
  total_days: number;
  used_days: number;
  available_days: number;
  pending_days?: number;
  year?: number;
  carry_forward?: number;
}

export default function LeaveBalanceScreen() {
  const { theme, isDark } = useTheme();
  const { data: balances = [], isLoading, refetch, isRefetching } = useLeaveBalancesList();

  // Calculate totals
  const totalAvailable = balances.reduce((sum: number, b: LeaveBalanceItem) => sum + (b.available_days || 0), 0);
  const totalUsed = balances.reduce((sum: number, b: LeaveBalanceItem) => sum + (b.used_days || 0), 0);
  const totalAllocated = balances.reduce((sum: number, b: LeaveBalanceItem) => sum + (b.total_days || 0), 0);

  const renderBalanceCard = (balance: LeaveBalanceItem, index: number) => {
    const config = getLeaveConfig(balance.leave_type);
    const percentage = balance.total_days > 0 ? (balance.used_days / balance.total_days) * 100 : 0;

    return (
      <View
        key={balance.id || index}
        style={[
          styles.balanceCard,
          {
            backgroundColor: theme.surface,
            borderColor: config.color,
          },
        ]}
      >
        {/* Header with Icon and Available */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: config.color + '20', borderColor: config.color }]}>
              <Ionicons name={config.icon} size={24} color={config.color} />
            </View>
            <View>
              <Text style={[styles.leaveTypeName, { color: theme.text }]}>
                {balance.leave_type}
              </Text>
              <Text style={[styles.yearLabel, { color: theme.textSecondary }]}>
                Year {balance.year || new Date().getFullYear()}
              </Text>
            </View>
          </View>
          <View style={styles.availableContainer}>
            <Text style={[styles.availableNumber, { color: config.color }]}>
              {balance.available_days}
            </Text>
            <Text style={[styles.availableLabel, { color: theme.textSecondary }]}>
              Available
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: config.color,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
              {balance.used_days} used
            </Text>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
              {balance.total_days} total
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surfaceElevated || theme.background, borderColor: theme.border }]}>
            <View style={styles.statIconRow}>
              <Ionicons name="checkmark-circle" size={14} color={config.color} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>USED</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{balance.used_days}</Text>
            <Text style={[styles.statUnit, { color: theme.textSecondary }]}>days</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceElevated || theme.background, borderColor: theme.border }]}>
            <View style={styles.statIconRow}>
              <Ionicons name="time" size={14} color={config.color} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>PENDING</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{balance.pending_days || 0}</Text>
            <Text style={[styles.statUnit, { color: theme.textSecondary }]}>days</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: config.color + '20', borderColor: config.color }]}>
            <View style={styles.statIconRow}>
              <Ionicons name="gift" size={14} color={config.color} />
              <Text style={[styles.statLabel, { color: config.color }]}>LEFT</Text>
            </View>
            <Text style={[styles.statValue, { color: config.color }]}>{balance.available_days}</Text>
            <Text style={[styles.statUnit, { color: theme.textSecondary }]}>days</Text>
          </View>
        </View>

        {/* Carry Forward Note */}
        {balance.carry_forward && balance.carry_forward > 0 && (
          <View style={[styles.carryForwardNote, { backgroundColor: config.color + '15', borderColor: config.color }]}>
            <Ionicons name="information-circle" size={18} color={config.color} />
            <Text style={[styles.carryForwardText, { color: theme.text }]}>
              {balance.carry_forward} days carried forward from previous year
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ModuleHeader title="Leave Balance" showBack showNotifications={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading balances...
            </Text>
          </View>
        ) : balances.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No Balance Data"
            description="Your leave balance information will appear here"
          />
        ) : (
          <>
            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
              <Text style={styles.summaryTitle}>Leave Balance Overview</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryNumber}>{totalAvailable}</Text>
                  <Text style={styles.summaryLabel}>Available</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryNumber}>{totalUsed}</Text>
                  <Text style={styles.summaryLabel}>Used</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryNumber}>{totalAllocated}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Individual Balance Cards */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>By Leave Type</Text>
            {balances.map((balance: LeaveBalanceItem, index: number) => renderBalanceCard(balance, index))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Summary Card
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Balance Card
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  leaveTypeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  availableContainer: {
    alignItems: 'flex-end',
  },
  availableNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Progress
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Carry Forward
  carryForwardNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  carryForwardText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
});
