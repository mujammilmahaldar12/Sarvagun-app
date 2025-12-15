/**
 * Compact Leave Balance Component
 * Horizontal scrollable view showing all leave type balances in a single row
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLeaveBalance } from '@/hooks/useHRQueries';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, getOpacityColor } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { LeaveType } from '@/types/hr';

interface CompactLeaveBalanceProps {
    onViewAll?: () => void;
    selectedType?: LeaveType | '';
    showViewAll?: boolean;
}

// Leave type configuration
const LEAVE_CONFIG: Record<LeaveType, { emoji: string; color: string; shortLabel: string }> = {
    'Annual Leave': { emoji: '🏖️', color: '#8B5CF6', shortLabel: 'Annual' },
    'Sick Leave': { emoji: '🏥', color: '#EF4444', shortLabel: 'Sick' },
    'Casual Leave': { emoji: '🌴', color: '#10B981', shortLabel: 'Casual' },
    'Study Leave': { emoji: '📚', color: '#F59E0B', shortLabel: 'Study' },
    'Optional Leave': { emoji: '🎉', color: '#6366F1', shortLabel: 'Optional' },
};

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Study Leave', 'Optional Leave'];

export const CompactLeaveBalance: React.FC<CompactLeaveBalanceProps> = ({
    onViewAll,
    selectedType,
    showViewAll = true,
}) => {
    const { theme } = useTheme();
    const router = useRouter();
    const { data: balance, isLoading } = useLeaveBalance();

    // Get available balance for a leave type
    const getAvailableBalance = (type: LeaveType): number => {
        if (!balance) return 0;

        const typeKey = type.toLowerCase().replace(' ', '_');
        const totalKey = `${typeKey}_total` as keyof typeof balance;
        const usedKey = `${typeKey}_used` as keyof typeof balance;
        const plannedKey = `${typeKey}_planned` as keyof typeof balance;

        const total = (balance[totalKey] as number) || 0;
        const used = (balance[usedKey] as number) || 0;
        const planned = (balance[plannedKey] as number) || 0;

        return total - used - planned;
    };

    const handleViewAll = () => {
        if (onViewAll) {
            onViewAll();
        } else {
            router.push('/(modules)/leave/balance' as any);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary, marginLeft: spacing.sm }]}>
                    Loading balance...
                </Text>
            </View>
        );
    }

    if (!balance) {
        return (
            <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="wallet-outline" size={18} color={theme.textSecondary} />
                <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginLeft: spacing.sm }]}>
                    Balance data unavailable
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {LEAVE_TYPES.map((type, index) => {
                    const config = LEAVE_CONFIG[type];
                    const available = getAvailableBalance(type);
                    const isSelected = selectedType === type;

                    return (
                        <View
                            key={type}
                            style={[
                                styles.balanceChip,
                                {
                                    backgroundColor: isSelected
                                        ? getOpacityColor(config.color, 0.2)
                                        : getOpacityColor(config.color, 0.08),
                                    borderColor: isSelected ? config.color : 'transparent',
                                    borderWidth: isSelected ? 2 : 0,
                                },
                                index === 0 && { marginLeft: 0 },
                            ]}
                        >
                            <Text style={styles.emoji}>{config.emoji}</Text>
                            <Text style={[styles.balanceCount, { color: config.color }]}>
                                {available}
                            </Text>
                            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                                {config.shortLabel}
                            </Text>
                        </View>
                    );
                })}

                {/* View All Button */}
                {showViewAll && (
                    <TouchableOpacity
                        onPress={handleViewAll}
                        style={[styles.viewAllButton, { backgroundColor: getOpacityColor(theme.primary, 0.1) }]}
                        activeOpacity={0.7}
                    >
                        <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.primary }]}>
                            View
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        paddingVertical: spacing.sm,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.md,
        minHeight: 60,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
    },
    balanceChip: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        minWidth: 60,
    },
    emoji: {
        fontSize: 18,
        marginBottom: 2,
    },
    balanceCount: {
        fontSize: 18,
        fontWeight: '700',
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        gap: 2,
    },
});

export default CompactLeaveBalance;
