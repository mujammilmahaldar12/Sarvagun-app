import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuditLogs } from '@/hooks/useAdminQueries';
import { ModuleHeader, Table, Badge } from '@/components';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';

export default function AuditLogsScreen() {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading } = useAuditLogs({ search: searchQuery });

    const columns = [
        { key: 'table_name', title: 'Table', width: 120, sortable: true },
        {
            key: 'action_type',
            title: 'Action',
            width: 100,
            render: (value: string) => (
                <Badge
                    label={value}
                    status={value === 'INSERT' ? 'success' : value === 'DELETE' ? 'error' : 'warning'}
                    size="sm"
                />
            )
        },
        { key: 'action_taken_by_name', title: 'User', width: 120 },
        { key: 'action_timestamp', title: 'Time', width: 150 },
    ];

    const formattedData = data?.results.map(log => ({
        ...log,
        action_timestamp: new Date(log.action_timestamp).toLocaleString(),
    })) || [];

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Audit Logs" showBack />

            <View style={{ flex: 1, padding: spacing.md }}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: spacing.xl }} />
                ) : (
                    <Table
                        data={formattedData}
                        columns={columns}
                        keyExtractor={(item) => item.id.toString()}
                        searchable
                        searchPlaceholder="Search logs..."
                        onSearch={setSearchQuery}
                    />
                )}
            </View>
        </View>
    );
}
