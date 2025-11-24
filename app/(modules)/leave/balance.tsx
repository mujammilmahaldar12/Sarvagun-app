import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeaveBalance } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { shadows, spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

const leaveTypeConfig = {
  annual: { icon: 'calendar-outline' as const, color: '#3B82F6' },
  sick: { icon: 'medical-outline' as const, color: '#EF4444' },
  casual: { icon: 'cafe-outline' as const, color: '#10B981' },
  study: { icon: 'book-outline' as const, color: '#8B5CF6' },
  optional: { icon: 'options-outline' as const, color: '#F59E0B' },
};

export default function LeaveBalanceScreen() {
  const { theme, isDark } = useTheme();
  const { data: balanceData, isLoading, refetch, isRefetching } = useLeaveBalance();
  const balances = Array.isArray(balanceData) ? balanceData : balanceData ? [balanceData] : [];

  const renderBalanceCard = (balance: any) => {
    if (!balance?.leave_type) return null;
    const leaveType = balance.leave_type.toLowerCase().replace(' leave', '');
    const config = leaveTypeConfig[leaveType as keyof typeof leaveTypeConfig] || leaveTypeConfig.annual;
    
    const total = balance.total_days || 0;
    const used = balance.used_days || 0;
    const available = balance.available_days || 0;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return (
      <View
        key={balance.id}
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          marginBottom: spacing.lg,
          borderWidth: 2,
          borderColor: config.color,
          ...shadows.md,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: getOpacityColor(config.color, 0.2),
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: config.color,
              }}
            >
              <Ionicons name={config.icon} size={iconSizes.md} color={config.color} />
            </View>
            <View>
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
                {balance.leave_type}
              </Text>
              <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                Year {balance.year}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[getTypographyStyle('3xl', 'bold'), { color: config.color }]}>
              {available}
            </Text>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
              Available
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              height: 10,
              backgroundColor: theme.border,
              borderRadius: borderRadius.full,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: config.color,
                borderRadius: borderRadius.full,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
              {used} used
            </Text>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
              {total} total
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              backgroundColor: theme.surfaceElevated,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
              <Ionicons name="checkmark-circle" size={iconSizes.xs} color={config.color} />
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
                USED
              </Text>
            </View>
            <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.text }]}>
              {used}
            </Text>
            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
              days
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              backgroundColor: theme.surfaceElevated,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
              <Ionicons name="time" size={iconSizes.xs} color={config.color} />
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>
                PENDING
              </Text>
            </View>
            <Text style={[getTypographyStyle('2xl', 'bold'), { color: theme.text }]}>
              {balance.pending_days || 0}
            </Text>
            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
              days
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              backgroundColor: getOpacityColor(config.color, 0.2),
              borderWidth: 1,
              borderColor: config.color,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
              <Ionicons name="gift" size={iconSizes.xs} color={config.color} />
              <Text style={[getTypographyStyle('xs', 'semibold'), { color: config.color }]}>
                LEFT
              </Text>
            </View>
            <Text style={[getTypographyStyle('2xl', 'bold'), { color: config.color }]}>
              {available}
            </Text>
            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
              days
            </Text>
          </View>
        </View>

        {/* Info Note */}
        {balance.carry_forward > 0 && (
          <View
            style={{
              marginTop: spacing.md,
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: getOpacityColor(config.color, 0.15),
              borderWidth: 1,
              borderColor: config.color,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <Ionicons name="information-circle" size={iconSizes.sm} color={config.color} />
            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.text, flex: 1 }]}>
              {balance.carry_forward} days carried forward from previous year
            </Text>
          </View>
        )}
      </View>
    );
  };

  const totalAvailable = balances.reduce((sum: number, b: any) => sum + (b.available_days || 0), 0);
  const totalUsed = balances.reduce((sum: number, b: any) => sum + (b.used_days || 0), 0);
  const totalPending = balances.reduce((sum: number, b: any) => sum + (b.pending_days || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Leave Balance" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[getTypographyStyle('sm', 'medium'), { marginTop: spacing.md, color: theme.textSecondary }]}>
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
            <View
              style={{
                backgroundColor: theme.primary,
                borderRadius: borderRadius.xl,
                padding: spacing.xl,
                marginBottom: spacing.xl,
                ...shadows.lg,
              }}
            >
              <Text style={[getTypographyStyle('base', 'bold'), { color: '#FFFFFF', marginBottom: spacing.lg }]}>
                Total Leave Summary
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[getTypographyStyle('2xl', 'bold'), { color: '#FFFFFF' }]}>
                    {totalAvailable}
                  </Text>
                  <Text style={[getTypographyStyle('xs', 'semibold'), { color: 'rgba(255,255,255,0.8)' }]}>
                    Available
                  </Text>
                </View>
                <View
                  style={{
                    width: 1,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[getTypographyStyle('2xl', 'bold'), { color: '#FFFFFF' }]}>
                    {totalUsed}
                  </Text>
                  <Text style={[getTypographyStyle('xs', 'semibold'), { color: 'rgba(255,255,255,0.8)' }]}>
                    Used
                  </Text>
                </View>
                <View
                  style={{
                    width: 1,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[getTypographyStyle('2xl', 'bold'), { color: '#FFFFFF' }]}>
                    {totalPending}
                  </Text>
                  <Text style={[getTypographyStyle('xs', 'semibold'), { color: 'rgba(255,255,255,0.8)' }]}>
                    Pending
                  </Text>
                </View>
              </View>
            </View>

            {/* Individual Balance Cards */}
            {balances.map(renderBalanceCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
}
