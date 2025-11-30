import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceStatistics, useSalesAnalytics, useExpensesAnalytics } from '@/hooks/useFinanceQueries';
import { LoadingState, EmptyState } from '@/components';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

const { width } = Dimensions.get('window');
const cardWidth = width > 768 ? (width - 64) / 3 : (width - 48) / 2;

export default function FinanceAnalytics() {
  const { theme } = useTheme();
  
  // Fetch analytics data
  const { data: statistics, isLoading: statsLoading } = useFinanceStatistics();
  const { data: salesAnalytics, isLoading: salesLoading } = useSalesAnalytics();
  const { data: expensesAnalytics, isLoading: expensesLoading } = useExpensesAnalytics();

  const isLoading = statsLoading || salesLoading || expensesLoading;

  if (isLoading) {
    return <LoadingState type="card" items={6} />;
  }

  if (!statistics && !salesAnalytics && !expensesAnalytics) {
    return (
      <EmptyState
        icon="analytics-outline"
        title="No Analytics Data"
        description="Unable to load analytics data. Please try again later."
      />
    );
  }

  // Sample KPI cards - using data from statistics and analytics endpoints
  const kpiCards = [
    {
      title: 'Total Sales',
      value: `₹${(statistics?.sales?.total_amount || salesAnalytics?.total_amount || 0).toLocaleString('en-IN')}`,
      change: `${statistics?.sales?.total_count || 0} transactions`,
      changePositive: true,
      icon: 'trending-up' as const,
      color: '#10B981',
    },
    {
      title: 'Total Expenses',
      value: `₹${(statistics?.expenses?.total_amount || expensesAnalytics?.total_amount || 0).toLocaleString('en-IN')}`,
      change: `${statistics?.expenses?.total_count || 0} transactions`,
      changePositive: false,
      icon: 'wallet' as const,
      color: '#EF4444',
    },
    {
      title: 'Net Profit',
      value: `₹${(
        (statistics?.sales?.total_amount || salesAnalytics?.total_amount || 0) - 
        (statistics?.expenses?.total_amount || expensesAnalytics?.total_amount || 0)
      ).toLocaleString('en-IN')}`,
      change: 'Revenue - Expenses',
      changePositive: (statistics?.sales?.total_amount || 0) > (statistics?.expenses?.total_amount || 0),
      icon: 'cash' as const,
      color: '#6366F1',
    },
    {
      title: 'Pending Sales',
      value: `₹${(salesAnalytics?.balance_due || 0).toLocaleString('en-IN')}`,
      change: `${statistics?.sales?.pending_count || salesAnalytics?.pending_count || 0} pending`,
      changePositive: false,
      icon: 'hourglass' as const,
      color: '#F59E0B',
    },
    {
      title: 'Pending Expenses',
      value: `₹${(expensesAnalytics?.pending_amount || 0).toLocaleString('en-IN')}`,
      change: `${statistics?.expenses?.pending_count || expensesAnalytics?.not_paid_count || 0} unpaid`,
      changePositive: false,
      icon: 'alert-circle' as const,
      color: '#F59E0B',
    },
    {
      title: 'Total Invoices',
      value: String(statistics?.invoices?.total_count || 0),
      change: `₹${(statistics?.invoices?.total_amount || 0).toLocaleString('en-IN')}`,
      changePositive: true,
      icon: 'document-text' as const,
      color: '#8B5CF6',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: designSystem.spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={{
        ...getTypographyStyle('2xl', 'bold'),
        color: theme.text,
        marginBottom: designSystem.spacing.lg,
      }}>
        Finance Overview
      </Text>

      {/* KPI Cards Grid */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: designSystem.spacing.md,
        marginBottom: designSystem.spacing.xl,
      }}>
        {kpiCards.map((card, index) => (
          <View
            key={index}
            style={{
              width: cardWidth,
              backgroundColor: theme.surface,
              borderRadius: designSystem.borderRadius.lg,
              padding: designSystem.spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: card.color,
              ...designSystem.shadows.sm,
            }}
          >
            {/* Icon */}
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: card.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: designSystem.spacing.sm,
            }}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>

            {/* Title */}
            <Text style={{
              ...getTypographyStyle('xs', 'medium'),
              color: theme.textSecondary,
              marginBottom: 4,
            }}>
              {card.title}
            </Text>

            {/* Value */}
            <Text style={{
              ...getTypographyStyle('2xl', 'bold'),
              color: theme.text,
              marginBottom: 4,
            }}>
              {card.value}
            </Text>

            {/* Change */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name={card.changePositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={card.changePositive ? '#10B981' : '#EF4444'}
              />
              <Text style={{
                ...getTypographyStyle('xs', 'medium'),
                color: card.changePositive ? '#10B981' : '#EF4444',
              }}>
                {card.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Sales vs Expenses Summary */}
      <View style={{
        backgroundColor: theme.surface,
        borderRadius: designSystem.borderRadius.lg,
        padding: designSystem.spacing.lg,
        marginBottom: designSystem.spacing.lg,
        ...designSystem.shadows.sm,
      }}>
        <Text style={{
          ...getTypographyStyle('lg', 'bold'),
          color: theme.text,
          marginBottom: designSystem.spacing.md,
        }}>
          Sales vs Expenses
        </Text>

        <View style={{ gap: designSystem.spacing.md }}>
          {/* Sales */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Total Sales
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#10B981' }}>
                ₹{(salesAnalytics?.total_amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{
              height: 8,
              backgroundColor: theme.border,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: '75%',
                backgroundColor: '#10B981',
              }} />
            </View>
          </View>

          {/* Expenses */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Total Expenses
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#EF4444' }}>
                ₹{(expensesAnalytics?.total_amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{
              height: 8,
              backgroundColor: theme.border,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: '60%',
                backgroundColor: '#EF4444',
              }} />
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity Summary */}
      <View style={{
        backgroundColor: theme.surface,
        borderRadius: designSystem.borderRadius.lg,
        padding: designSystem.spacing.lg,
        ...designSystem.shadows.sm,
      }}>
        <Text style={{
          ...getTypographyStyle('lg', 'bold'),
          color: theme.text,
          marginBottom: designSystem.spacing.md,
        }}>
          Payment Status Breakdown
        </Text>

        <View style={{ gap: designSystem.spacing.sm }}>
          {/* Completed Sales */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
              Completed Sales
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#10B981' }}>
              {salesAnalytics?.completed_count || 0}
            </Text>
          </View>

          {/* Pending Sales */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
              Pending Sales
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#F59E0B' }}>
              {salesAnalytics?.pending_count || 0}
            </Text>
          </View>

          {/* Paid Expenses */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
              Paid Expenses
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#10B981' }}>
              {expensesAnalytics?.paid_count || 0}
            </Text>
          </View>

          {/* Unpaid Expenses */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
          }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
              Unpaid Expenses
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#EF4444' }}>
              {expensesAnalytics?.not_paid_count || 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
