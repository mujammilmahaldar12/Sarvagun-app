/**
 * Leave Approvals Screen
 * Admin/HR/Team Lead UI for approving or rejecting leave requests
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { usePendingLeaves, useApproveLeave, useRejectLeave } from '@/hooks/useHRQueries';
import { EmptyState, Badge, Button, Card } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { spacing, borderRadius, getOpacityColor } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { format } from 'date-fns';
import type { LeaveRequest } from '@/types/hr';

// Leave type configuration
const LEAVE_TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
    'Annual Leave': { emoji: '🏖️', color: '#8B5CF6' },
    'Sick Leave': { emoji: '🏥', color: '#EF4444' },
    'Casual Leave': { emoji: '🌴', color: '#10B981' },
    'Study Leave': { emoji: '📚', color: '#F59E0B' },
    'Optional Leave': { emoji: '🎉', color: '#6366F1' },
};

export default function LeaveApprovalsScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user } = useAuthStore();

    // State
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // API hooks
    const { data: pendingLeaves, isLoading, refetch } = usePendingLeaves();
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();

    // Check permission
    const canApprove = user?.category === 'hr' || user?.category === 'admin' || user?.category === 'manager';

    if (!canApprove) {
        return (
            <Animated.View
                entering={FadeIn.duration(300)}
                style={[styles.container, { backgroundColor: theme.background }]}
            >
                <ModuleHeader title="Leave Approvals" showBack />
                <View style={styles.centerContent}>
                    <Ionicons name="lock-closed" size={64} color={theme.textSecondary} />
                    <Text style={[getTypographyStyle('lg', 'semibold'), { color: theme.text, marginTop: spacing.md }]}>
                        Access Restricted
                    </Text>
                    <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
                        You don't have permission to approve leaves.
                    </Text>
                </View>
            </Animated.View>
        );
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleApprove = (leave: LeaveRequest) => {
        Alert.alert(
            '✅ Approve Leave',
            `Approve ${leave.employee_name || 'Employee'}'s ${leave.leave_type} request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await approveMutation.mutateAsync(leave.id);
                            Alert.alert('Success', 'Leave approved successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve leave. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleRejectClick = (leave: LeaveRequest) => {
        setSelectedLeave(leave);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedLeave) return;

        try {
            await rejectMutation.mutateAsync({
                id: selectedLeave.id,
                reason: rejectReason
            });
            setShowRejectModal(false);
            setSelectedLeave(null);
            Alert.alert('Success', 'Leave rejected successfully.');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject leave. Please try again.');
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'MMM dd');
        } catch {
            return dateStr;
        }
    };

    const getLeaveConfig = (leaveType: string) => {
        return LEAVE_TYPE_CONFIG[leaveType] || { emoji: '📅', color: theme.primary };
    };

    const renderLeaveCard = (leave: LeaveRequest, index: number) => {
        const config = getLeaveConfig(leave.leave_type);
        const isProcessing = approveMutation.isPending || rejectMutation.isPending;

        return (
            <Animated.View
                key={leave.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
            >
                <Card
                    variant="elevated"
                    shadow="sm"
                    padding="md"
                    style={[styles.leaveCard, { borderLeftColor: config.color }]}
                >
                    {/* Header - Employee Info */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatarContainer, { backgroundColor: getOpacityColor(config.color, 0.15) }]}>
                            <Text style={{ fontSize: 24 }}>{config.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[getTypographyStyle('base', 'semibold'), { color: theme.text }]}>
                                {leave.employee_name || 'Employee'}
                            </Text>
                            <Text style={[getTypographyStyle('sm', 'medium'), { color: config.color }]}>
                                {leave.leave_type}
                            </Text>
                        </View>
                        <Badge label="Pending" status="pending" size="sm" />
                    </View>

                    {/* Date Range */}
                    <View style={[styles.dateRow, { backgroundColor: getOpacityColor(theme.primary, 0.05) }]}>
                        <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text, marginLeft: spacing.sm }]}>
                            {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                        </Text>
                        <Text style={[getTypographyStyle('sm', 'bold'), { color: config.color, marginLeft: 'auto' }]}>
                            {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                        </Text>
                    </View>

                    {/* Reason */}
                    {leave.reason && (
                        <View style={styles.reasonContainer}>
                            <Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} />
                            <Text
                                style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, marginLeft: spacing.xs, flex: 1 }]}
                                numberOfLines={2}
                            >
                                "{leave.reason}"
                            </Text>
                        </View>
                    )}

                    {/* Applied Date */}
                    <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, marginTop: spacing.sm }]}>
                        Applied: {leave.created_at ? formatDate(leave.created_at) : 'N/A'}
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => handleRejectClick(leave)}
                            disabled={isProcessing}
                            style={[styles.actionButton, styles.rejectButton, { borderColor: '#EF4444' }]}
                            activeOpacity={0.7}
                        >
                            {rejectMutation.isPending && selectedLeave?.id === leave.id ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                                    <Text style={[getTypographyStyle('sm', 'semibold'), { color: '#EF4444', marginLeft: 6 }]}>
                                        Reject
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleApprove(leave)}
                            disabled={isProcessing}
                            style={[styles.actionButton, styles.approveButton, { backgroundColor: '#10B981' }]}
                            activeOpacity={0.7}
                        >
                            {approveMutation.isPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                    <Text style={[getTypographyStyle('sm', 'semibold'), { color: '#FFFFFF', marginLeft: 6 }]}>
                                        Approve
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>
            </Animated.View>
        );
    };

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ModuleHeader
                title="Leave Approvals"
                showBack
                subtitle={pendingLeaves?.length ? `${pendingLeaves.length} pending` : undefined}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {isLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginTop: spacing.md }]}>
                            Loading pending requests...
                        </Text>
                    </View>
                ) : !pendingLeaves || pendingLeaves.length === 0 ? (
                    <EmptyState
                        icon="checkmark-done-circle-outline"
                        title="All Caught Up!"
                        subtitle="No pending leave requests to review"
                    />
                ) : (
                    <View style={styles.cardList}>
                        {pendingLeaves.map((leave, index) => renderLeaveCard(leave, index))}
                    </View>
                )}
            </ScrollView>

            {/* Reject Modal */}
            <Modal
                visible={showRejectModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRejectModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>
                            ❌ Reject Leave
                        </Text>
                        <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, marginTop: spacing.sm }]}>
                            Rejecting {selectedLeave?.employee_name}'s {selectedLeave?.leave_type} request
                        </Text>

                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text, marginTop: spacing.lg }]}>
                            Reason (optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.reasonInput,
                                {
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: theme.border,
                                }
                            ]}
                            placeholder="Enter reason for rejection..."
                            placeholderTextColor={theme.textSecondary}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalButtons}>
                            <Button
                                variant="outline"
                                size="md"
                                onPress={() => setShowRejectModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </Button>
                            <View style={{ width: spacing.sm }} />
                            <Button
                                variant="filled"
                                size="md"
                                onPress={handleRejectConfirm}
                                loading={rejectMutation.isPending}
                                style={{ flex: 1, backgroundColor: '#EF4444' }}
                            >
                                Reject
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View>
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
        padding: spacing.md,
        paddingBottom: spacing['4xl'],
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['4xl'],
    },
    cardList: {
        gap: spacing.md,
    },
    leaveCard: {
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: spacing.xs,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
    },
    rejectButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    approveButton: {
        borderWidth: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    reasonInput: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: spacing.lg,
    },
});
