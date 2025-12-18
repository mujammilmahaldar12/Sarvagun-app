/**
 * FinanceAnalytics Component
 * Premium analytics dashboard with REAL DATA calculated from actual records
 * Following the same pattern as EventsAnalytics
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useSales, useExpenses, useInvoices, useVendors } from '@/hooks/useFinanceQueries';
import { LoadingState, EmptyState } from '@/components';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';
import type { Sale, Expense, Invoice, Vendor } from '@/types/finance';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const SECTION_GAP = 24;
const PADDING = 16;

// ==================== REUSABLE COMPONENTS ====================

// Insight Card with gradient accent
const InsightCard = ({
  title,
  insight,
  value,
  icon,
  color,
  subtext,
}: {
  title: string;
  insight: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtext?: string;
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 6 }}>
            {value}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color }}>
            {insight}
          </Text>
          {subtext && (
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>
              {subtext}
            </Text>
          )}
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>
    </View>
  );
};

// Comparison Row Component
const ComparisonRow = ({
  label1,
  value1,
  label2,
  value2,
  color1,
  color2,
}: {
  label1: string;
  value1: string;
  label2: string;
  value2: string;
  color1: string;
  color2: string;
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: `${color1}10`, borderRadius: 10, marginRight: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: color1 }}>{value1}</Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textSecondary, marginTop: 2 }}>{label1}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: `${color2}10`, borderRadius: 10, marginLeft: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: color2 }}>{value2}</Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textSecondary, marginTop: 2 }}>{label2}</Text>
      </View>
    </View>
  );
};

// Section Header
const SectionHeader = ({ title, icon, color }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, letterSpacing: -0.3 }}>{title}</Text>
    </View>
  );
};

// Card Container
const CardContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 }}>
      {title && <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 14 }}>{title}</Text>}
      {children}
    </View>
  );
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// ==================== MAIN COMPONENT ====================

export default function FinanceAnalytics() {
  const { theme } = useTheme();

  // Fetch ACTUAL data from hooks
  const { data: salesData, isLoading: salesLoading } = useSales();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors();

  const isLoading = salesLoading || expensesLoading || invoicesLoading || vendorsLoading;

  // Extract arrays from response (handle both paginated and direct array responses)
  const sales: Sale[] = useMemo(() => {
    if (!salesData) return [];
    return (salesData as any)?.results || (Array.isArray(salesData) ? salesData : []);
  }, [salesData]);

  const expenses: Expense[] = useMemo(() => {
    if (!expensesData) return [];
    return (expensesData as any)?.results || (Array.isArray(expensesData) ? expensesData : []);
  }, [expensesData]);

  const invoices: Invoice[] = useMemo(() => {
    if (!invoicesData) return [];
    return (invoicesData as any)?.results || (Array.isArray(invoicesData) ? invoicesData : []);
  }, [invoicesData]);

  const vendors: Vendor[] = useMemo(() => {
    if (!vendorsData) return [];
    return (vendorsData as any)?.results || (Array.isArray(vendorsData) ? vendorsData : []);
  }, [vendorsData]);

  // ==================== CALCULATE ALL INSIGHTS FROM ACTUAL DATA ====================
  const insights = useMemo(() => {
    // ============ SALES INSIGHTS ============
    const totalSales = sales.length;
    const completedSales = sales.filter((s) => s.payment_status === 'completed');
    const pendingSales = sales.filter((s) => s.payment_status === 'pending');
    const notYetSales = sales.filter((s) => s.payment_status === 'not_yet');

    // Calculate total amounts from actual records
    const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount || 0), 0);
    const netSalesAmount = totalSalesAmount - totalDiscount;

    // Calculate amounts by status
    const completedSalesAmount = completedSales.reduce((sum, s) => sum + Number(s.amount || 0) - Number(s.discount || 0), 0);
    const pendingSalesAmount = pendingSales.reduce((sum, s) => sum + Number(s.amount || 0) - Number(s.discount || 0), 0);
    const notYetSalesAmount = notYetSales.reduce((sum, s) => sum + Number(s.amount || 0) - Number(s.discount || 0), 0);

    // Calculate total received from payments
    const totalReceived = sales.reduce((sum, s) => {
      const payments = s.payments || [];
      const saleReceived = payments.reduce((pSum, p) => pSum + Number(p.payment_amount || 0), 0);
      return sum + saleReceived;
    }, 0);

    // Balance due = Total net sales - Total received
    const balanceDue = netSalesAmount - totalReceived;

    // ============ EXPENSES INSIGHTS ============
    const totalExpenses = expenses.length;
    const paidExpenses = expenses.filter((e) => e.payment_status === 'paid');
    const notPaidExpenses = expenses.filter((e) => e.payment_status === 'not_paid');
    const partialPaidExpenses = expenses.filter((e) => e.payment_status === 'partial_paid');

    // Calculate amounts from actual records
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const paidExpensesAmount = paidExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const notPaidExpensesAmount = notPaidExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const partialPaidExpensesAmount = partialPaidExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingExpensesAmount = notPaidExpensesAmount + partialPaidExpensesAmount;

    // Expenses by vendor
    const expensesByVendor: Record<string, number> = {};
    expenses.forEach((e) => {
      const vendorName = (e.vendor as any)?.name || (e as any).vendor_name || 'No Vendor';
      expensesByVendor[vendorName] = (expensesByVendor[vendorName] || 0) + Number(e.amount || 0);
    });
    const topVendors = Object.entries(expensesByVendor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // ============ INVOICE INSIGHTS ============
    const totalInvoices = invoices.length;
    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + Number(i.final_amount || 0), 0);
    const totalInvoiceDiscount = invoices.reduce((sum, i) => sum + Number(i.discount || 0), 0);

    // ============ VENDOR INSIGHTS ============
    const totalVendors = vendors.length;

    // ============ NET PROFIT ============
    const netProfit = netSalesAmount - totalExpensesAmount;
    const profitMargin = netSalesAmount > 0 ? (netProfit / netSalesAmount) * 100 : 0;

    // ============ COLLECTION RATE ============
    const collectionRate = netSalesAmount > 0 ? (totalReceived / netSalesAmount) * 100 : 0;

    return {
      // Sales
      totalSales,
      completedSalesCount: completedSales.length,
      pendingSalesCount: pendingSales.length,
      notYetSalesCount: notYetSales.length,
      totalSalesAmount,
      totalDiscount,
      netSalesAmount,
      completedSalesAmount,
      pendingSalesAmount: pendingSalesAmount + notYetSalesAmount,
      totalReceived,
      balanceDue,
      collectionRate: Math.round(collectionRate),

      // Expenses
      totalExpenses,
      paidExpensesCount: paidExpenses.length,
      notPaidExpensesCount: notPaidExpenses.length,
      partialPaidExpensesCount: partialPaidExpenses.length,
      totalExpensesAmount,
      paidExpensesAmount,
      pendingExpensesAmount,
      topVendors,

      // Invoices
      totalInvoices,
      totalInvoiceAmount,
      totalInvoiceDiscount,

      // Vendors
      totalVendors,

      // Overall
      netProfit,
      profitMargin: Math.round(profitMargin),
    };
  }, [sales, expenses, invoices, vendors]);

  if (isLoading) {
    return <LoadingState message="Loading finance analytics..." variant="skeleton" skeletonCount={8} />;
  }

  if (sales.length === 0 && expenses.length === 0 && invoices.length === 0) {
    return (
      <EmptyState
        icon="analytics-outline"
        title="No finance data available"
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ========== HERO SUMMARY ========== */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ marginTop: 20, borderRadius: 20, padding: 20, marginBottom: SECTION_GAP }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' }}>Finance Overview</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2 }}>Key Metrics</Text>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>{formatCurrency(insights.netProfit)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>Net Profit</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>{insights.collectionRate}%</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>Collection</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>{insights.profitMargin}%</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>Margin</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ========== SALES INSIGHTS ========== */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader title="Sales Insights" icon="trending-up" color="#10B981" />

        <View style={{ gap: CARD_GAP, marginBottom: CARD_GAP }}>
          <InsightCard
            title="Total Revenue"
            value={formatCurrency(insights.netSalesAmount)}
            insight={`${insights.totalSales} sales transactions`}
            icon="cash"
            color="#10B981"
            subtext={`Discount: ${formatCurrency(insights.totalDiscount)}`}
          />

          <InsightCard
            title="Amount Collected"
            value={formatCurrency(insights.totalReceived)}
            insight={`${insights.collectionRate}% collection rate`}
            icon="wallet"
            color="#3B82F6"
            subtext={`Balance due: ${formatCurrency(insights.balanceDue)}`}
          />

          <InsightCard
            title="Pending Sales"
            value={formatCurrency(insights.pendingSalesAmount)}
            insight={`${insights.pendingSalesCount + insights.notYetSalesCount} pending transactions`}
            icon="hourglass"
            color="#F59E0B"
          />
        </View>

        {/* Sales Status Breakdown */}
        <CardContainer title="Sales Status">
          <ComparisonRow
            label1="Completed"
            value1={String(insights.completedSalesCount)}
            label2="Pending"
            value2={String(insights.pendingSalesCount + insights.notYetSalesCount)}
            color1="#10B981"
            color2="#F59E0B"
          />
        </CardContainer>
      </View>

      {/* ========== EXPENSES INSIGHTS ========== */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader title="Expenses Insights" icon="wallet" color="#EF4444" />

        <View style={{ gap: CARD_GAP, marginBottom: CARD_GAP }}>
          <InsightCard
            title="Total Expenses"
            value={formatCurrency(insights.totalExpensesAmount)}
            insight={`${insights.totalExpenses} expense records`}
            icon="receipt"
            color="#EF4444"
          />

          <InsightCard
            title="Paid Expenses"
            value={formatCurrency(insights.paidExpensesAmount)}
            insight={`${insights.paidExpensesCount} paid transactions`}
            icon="checkmark-circle"
            color="#10B981"
          />

          <InsightCard
            title="Pending Expenses"
            value={formatCurrency(insights.pendingExpensesAmount)}
            insight={`${insights.notPaidExpensesCount + insights.partialPaidExpensesCount} unpaid/partial`}
            icon="alert-circle"
            color="#F59E0B"
          />
        </View>

        {/* Expenses Status Breakdown */}
        <CardContainer title="Expenses Status">
          <ComparisonRow
            label1="Paid"
            value1={String(insights.paidExpensesCount)}
            label2="Not Paid"
            value2={String(insights.notPaidExpensesCount)}
            color1="#10B981"
            color2="#EF4444"
          />
          {insights.partialPaidExpensesCount > 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 12, backgroundColor: '#F59E0B10', borderRadius: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B' }}>{insights.partialPaidExpensesCount}</Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textSecondary, marginTop: 2 }}>Partial Paid</Text>
            </View>
          )}
        </CardContainer>

        {/* Top Vendors by Expense */}
        {insights.topVendors.length > 0 && (
          <CardContainer title="Top Vendors by Expense">
            {insights.topVendors.map(([vendor, amount], index) => (
              <View key={vendor} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: index < insights.topVendors.length - 1 ? 1 : 0, borderBottomColor: theme.border }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : '#9CA3AF', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{index + 1}</Text>
                </View>
                <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '500', color: theme.text }} numberOfLines={1}>{vendor}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{formatCurrency(amount)}</Text>
              </View>
            ))}
          </CardContainer>
        )}
      </View>

      {/* ========== PROFIT/LOSS SUMMARY ========== */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader title="Profit & Loss" icon="stats-chart" color="#6366F1" />

        <CardContainer>
          {/* Revenue vs Expenses Bar */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Total Revenue</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>{formatCurrency(insights.netSalesAmount)}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: theme.border, borderRadius: 5, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(100, insights.netSalesAmount > 0 ? (insights.netSalesAmount / Math.max(insights.netSalesAmount, insights.totalExpensesAmount)) * 100 : 0)}%`,
                  backgroundColor: '#10B981',
                  borderRadius: 5,
                }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Total Expenses</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{formatCurrency(insights.totalExpensesAmount)}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: theme.border, borderRadius: 5, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(100, insights.totalExpensesAmount > 0 ? (insights.totalExpensesAmount / Math.max(insights.netSalesAmount, insights.totalExpensesAmount)) * 100 : 0)}%`,
                  backgroundColor: '#EF4444',
                  borderRadius: 5,
                }}
              />
            </View>
          </View>

          {/* Net Profit */}
          <View style={{
            backgroundColor: insights.netProfit >= 0 ? '#10B98115' : '#EF444415',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
              {insights.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: insights.netProfit >= 0 ? '#10B981' : '#EF4444' }}>
              {formatCurrency(Math.abs(insights.netProfit))}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              Profit Margin: {insights.profitMargin}%
            </Text>
          </View>
        </CardContainer>
      </View>

      {/* ========== INVOICES & VENDORS ========== */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader title="Invoices & Vendors" icon="document-text" color="#8B5CF6" />

        <View style={{ gap: CARD_GAP }}>
          <InsightCard
            title="Total Invoices"
            value={String(insights.totalInvoices)}
            insight={`Total value: ${formatCurrency(insights.totalInvoiceAmount)}`}
            icon="document-text"
            color="#8B5CF6"
            subtext={insights.totalInvoiceDiscount > 0 ? `Discounts: ${formatCurrency(insights.totalInvoiceDiscount)}` : undefined}
          />

          <InsightCard
            title="Active Vendors"
            value={String(insights.totalVendors)}
            insight="Registered vendor partners"
            icon="business"
            color="#6366F1"
          />
        </View>
      </View>
    </ScrollView>
  );
}
