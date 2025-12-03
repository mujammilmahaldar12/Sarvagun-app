/**
 * StaffList Component
 * Tabular layout for managing employees
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components';
import Table, { TableColumn } from '@/components/core/Table';
import { useTheme } from '@/hooks/useTheme';
import { useAllUsers, useSearchEmployees } from '@/hooks/useHRQueries';
import { designSystem } from '@/constants/designSystem';

interface StaffListProps {
    searchQuery?: string;
    selectedStatus?: string;
    refreshing?: boolean;
    onRefresh?: () => void;
}

const StaffList: React.FC<StaffListProps> = ({
    searchQuery = '',
    selectedStatus = 'all',
    refreshing = false,
    onRefresh,
}) => {
    const { theme } = useTheme();
    const router = useRouter();

    // Fetch all users from API
    const { data: usersData, isLoading: usersLoading } = useAllUsers({
        search: searchQuery || undefined,
    });

    // Search users when query is present (if API handles it, we might not need separate search hook if useAllUsers handles it)
    // In original code, there was debouncing and separate search hook. 
    // Here we assume searchQuery passed is already debounced or we use the same pattern.
    // For simplicity and consistency with EventsList, we'll rely on useAllUsers with search param if supported, 
    // or client-side filtering if not.
    // Looking at original code: useAllUsers takes search param.

    const handleStaffDetails = (id: number) => {
        router.push(`/(modules)/hr/${id}?type=staff` as any);
    };

    // Transform data
    const staffData = useMemo(() => {
        const users = usersData || [];

        let data = users.map((user: any) => ({
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            designation: user.designation || 'N/A',
            department: user.department || 'N/A',
            status: user.is_active ? 'Active' : 'Inactive',
            email: user.email || 'N/A',
            category: user.category || 'employee',
            phone: user.mobileno || 'N/A',
            photo: user.photo,
        }));

        // Client-side filtering if needed (e.g. status)
        if (selectedStatus && selectedStatus !== 'all') {
            data = data.filter((user: any) =>
                user.status.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        return data;
    }, [usersData, selectedStatus]);

    const columns: TableColumn<any>[] = useMemo(() => [
        {
            key: 'name',
            title: 'Name',
            width: 180,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'designation',
            title: 'Designation',
            width: 150,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'department',
            title: 'Department',
            width: 120,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }}>
                    {value || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            width: 100,
            sortable: true,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm, textTransform: 'capitalize' }}>
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
                    status={value === 'Active' ? 'active' : 'inactive'}
                    size="sm"
                />
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 80,
            align: 'center',
            render: (_, item) => (
                <TouchableOpacity onPress={() => handleStaffDetails(item.id)}>
                    <Ionicons name="eye-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
            ),
        },
    ], [theme]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Table
                data={staffData}
                columns={columns}
                keyExtractor={(item) => item.id.toString()}
                loading={usersLoading && !refreshing}
                searchable={false}
                sortable={true}
                stickyHeader={true}
                paginated={true}
                pageSize={15}
                emptyMessage="No staff found"
                onRowPress={(item) => handleStaffDetails(item.id)}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            />
        </View>
    );
};

export default StaffList;
