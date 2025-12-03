/**
 * ReimbursementsList Component
 * Tabular layout for managing reimbursements
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components';
import Table, { TableColumn } from '@/components/core/Table';
import { useTheme } from '@/hooks/useTheme';
import { useReimbursements, useUpdateReimbursementStatus } from '@/hooks/useHRQueries';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/store/permissionStore';
import { designSystem } from '@/constants/designSystem';
import type { Reimbursement } from '@/types/hr';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface ReimbursementsListProps {
    searchQuery?: string;
    selectedStatus?: string;
    refreshing?: boolean;
    onRefresh?: () => void;
}

const ReimbursementsList: React.FC<ReimbursementsListProps> = ({
    searchQuery = '',
    selectedStatus = 'all',
    refreshing = false,
    onRefresh,
}) => {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();
    const permissions = usePermissions();

    const canApprove = permissions.hasPermission('leave:approve') || user?.category === 'hr' || user?.category === 'admin';

    const { data: reimbursementsData, isLoading, refetch } = useReimbursements();
    const updateReimbursementStatus = useUpdateReimbursementStatus();

    const handleDetails = (id: number) => {
        router.push(`/(modules)/hr/${id}?type=reimbursement` as any);
    };

    const handleApprove = (itemId: number) => {
        Alert.alert(
            'Approve',
            'Are you sure you want to approve this reimbursement?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await updateReimbursementStatus.mutateAsync({
                                id: itemId,
                                status: 'approved',
                                reason: 'Approved by admin/HR',
                            });
                            Alert.alert('Success', 'Reimbursement approved successfully');
                            refetch();
                        } catch (error) {
                            console.error('Error approving reimbursement:', error);
                            Alert.alert('Error', 'Failed to approve reimbursement');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = (itemId: number) => {
        Alert.alert(
            'Reject',
            'Are you sure you want to reject this reimbursement?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateReimbursementStatus.mutateAsync({
                                id: itemId,
                                status: 'rejected',
                                reason: 'Rejected by admin/HR',
                            });
                            Alert.alert('Success', 'Reimbursement rejected');
                            refetch();
                        } catch (error) {
                            console.error('Error rejecting reimbursement:', error);
                            Alert.alert('Error', 'Failed to reject reimbursement');
                        }
                    },
                },
            ]
        );
    };

    // Transform data
    const reimbursementData = useMemo(() => {
        const reimbursements = reimbursementsData?.results || [];

        let data = reimbursements.map((item: Reimbursement) => ({
            id: item.id,
            employee: item.requested_by_name || `User ${item.requested_by}`,
            employeeId: item.requested_by,
            type: item.expense_details?.particulars || 'Expense',
            amount: Number(item.reimbursement_amount) || 0,
            date: item.submitted_at ? new Date(item.submitted_at).toISOString().split('T')[0] : 'N/A',
            status: (item.latest_status?.status || item.status || 'pending').charAt(0).toUpperCase() +
                (item.latest_status?.status || item.status || 'pending').slice(1),
            description: item.details || 'No description',
            bill_evidence: item.bill_evidence,
        }));

        // Filter by user role
        if (user) {
            if (user.category === 'intern' || user.category === 'employee') {
                data = data.filter((item: any) => item.employeeId === user.id);
            }
            // Manager logic can be added here
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter((item: any) =>
                item.employee.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (selectedStatus && selectedStatus !== 'all') {
            data = data.filter((item: any) =>
                item.status.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        return data;
    }, [reimbursementsData, user, searchQuery, selectedStatus]);

    const columns: TableColumn<any>[] = useMemo(() => [
        {
            key: 'employee',
            title: 'Employee',
            width: 150,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'type',
            title: 'Type',
            width: 120,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'amount',
            title: 'Amount',
            width: 100,
            sortable: true,
            align: 'right',
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '500', fontSize: designSystem.typography.sizes.sm }}>
                    ₹{value.toLocaleString()}
                </Text>
            ),
        },
        {
            key: 'date',
            title: 'Date',
            width: 100,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            width: 100,
            render: (value) => (
                <Badge
                    label={value}
                    status={value}
                    size="sm"
                />
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 140,
            align: 'center',
            render: (_, item) => (
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                    {canApprove && item.status.toLowerCase() === 'pending' && (
                        <>
                            <TouchableOpacity onPress={() => handleApprove(item.id)}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReject(item.id)}>
                                <Ionicons name="close-circle" size={20} color={theme.error} />
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity onPress={() => handleDetails(item.id)}>
                        <Ionicons name="eye-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            ),
        },
    ], [theme, canApprove]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Table
                data={reimbursementData}
                columns={columns}
                keyExtractor={(item) => item.id.toString()}
                loading={isLoading && !refreshing}
                searchable={false}
                sortable={true}
                stickyHeader={true}
                paginated={true}
                pageSize={15}
                emptyMessage="No reimbursements found"
                onRowPress={(item) => handleDetails(item.id)}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            />
        </View>
    );
};

export default ReimbursementsList;
