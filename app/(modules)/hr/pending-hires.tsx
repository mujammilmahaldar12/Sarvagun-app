/**
 * Pending Hires List Screen
 * Admin/HR/Team Lead view for pending registration approvals
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { hireService, PendingApproval } from '@/services/hire.service';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';

export default function PendingHiresScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadApprovals = async () => {
        try {
            const response = await hireService.getPendingApprovals('pending');
            setApprovals(response.results);
        } catch (error: any) {
            console.error('Failed to load pending approvals:', error);
            if (error.response?.status === 403) {
                Alert.alert('Access Denied', 'You do not have permission to view pending approvals.');
                router.back();
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadApprovals();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadApprovals();
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        loadApprovals();
    };

    const renderApprovalItem = ({ item }: { item: PendingApproval }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
                pathname: '/hr/pending-hire-detail/[id]',
                params: { id: item.id.toString() }
            } as any)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {item.full_name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="briefcase-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.detailText}>{item.job_title}</Text>
                </View>
                <View style={[
                    styles.badge,
                    item.user_category === 'intern' ? styles.internBadge : styles.employeeBadge
                ]}>
                    <Text style={[
                        styles.badgeText,
                        item.user_category === 'intern' ? styles.internText : styles.employeeText
                    ]}>
                        {item.user_category === 'intern' ? 'Intern' : 'Employee'}
                    </Text>
                </View>
            </View>

            <Text style={styles.date}>
                Submitted: {new Date(item.submitted_at).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No pending approvals at the moment.</Text>
        </View>
    );

    // Check if user has permission (admin, hr, manager, or team leader)
    const canAccess = user && (
        ['admin', 'hr', 'manager'].includes(user.category || '') || user.is_team_leader
    );
    if (!canAccess) {
        return (
            <View style={styles.container}>
                <ModuleHeader title="Pending Hires" />
                <View style={styles.emptyState}>
                    <Ionicons name="lock-closed" size={64} color="#EF4444" />
                    <Text style={styles.emptyTitle}>Access Denied</Text>
                    <Text style={styles.emptyText}>
                        You don't have permission to view this page.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Pending Hires"
                rightActions={
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{approvals.length}</Text>
                    </View>
                }
            />

            <FlatList
                data={approvals}
                renderItem={renderApprovalItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[
                    styles.listContent,
                    approvals.length === 0 && styles.emptyList
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#8B5CF6']}
                        tintColor="#8B5CF6"
                    />
                }
                ListEmptyComponent={!isLoading ? renderEmptyState : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
        color: '#6B7280',
    },
    cardDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    internBadge: {
        backgroundColor: '#FEF3C7',
    },
    employeeBadge: {
        backgroundColor: '#DBEAFE',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    internText: {
        color: '#D97706',
    },
    employeeText: {
        color: '#2563EB',
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    countBadge: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});
