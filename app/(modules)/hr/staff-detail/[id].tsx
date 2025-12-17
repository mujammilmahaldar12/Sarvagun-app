/**
 * Staff Detail Screen
 * View and edit staff member information
 */
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Switch,
    RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import hrService from '@/services/hr.service';
import ModuleHeader from '@/components/layout/ModuleHeader';

interface StaffDetails {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    category: string;
    gender: string;
    dob: string;
    mobileno: string;
    address: string;
    designation: string;
    joiningdate: string;
    active: boolean;
    photo: string | null;
    department?: string;
    internship?: {
        start_date: string;
        end_date: string | null;
        lead: boolean;
    };
    teams?: { id: number; name: string }[];
}

export default function StaffDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [staff, setStaff] = useState<StaffDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isTogglingActive, setIsTogglingActive] = useState(false);

    const canEdit = user?.category === 'admin' || user?.category === 'hr';

    useEffect(() => {
        loadStaffDetails();
    }, [id]);

    const loadStaffDetails = async () => {
        if (!id) return;

        try {
            const response = await hrService.getEmployee(parseInt(id));
            setStaff(response as unknown as StaffDetails);
        } catch (error: any) {
            console.error('Failed to load staff details:', error);
            Alert.alert('Error', 'Failed to load staff details');
            router.back();
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStaffDetails();
    };

    const handleToggleActive = async () => {
        if (!staff || !canEdit) return;

        Alert.alert(
            staff.active ? 'Deactivate User' : 'Activate User',
            `Are you sure you want to ${staff.active ? 'deactivate' : 'activate'} ${staff.first_name} ${staff.last_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: staff.active ? 'Deactivate' : 'Activate',
                    style: staff.active ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsTogglingActive(true);
                        try {
                            // API call to toggle active status
                            const response = await fetch(`/api/hr/users/${id}/`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ active: !staff.active })
                            });
                            if (response.ok) {
                                setStaff({ ...staff, active: !staff.active });
                                Alert.alert('Success', `User has been ${!staff.active ? 'activated' : 'deactivated'}`);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status');
                        } finally {
                            setIsTogglingActive(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        router.push({
            pathname: '/hr/edit-staff/[id]',
            params: { id: id }
        } as any);
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'admin': 'Administrator',
            'hr': 'HR Manager',
            'manager': 'Manager',
            'employee': 'Employee',
            'intern': 'Intern',
            'mukadam': 'Mukadam',
        };
        return labels[category] || category;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            'admin': { bg: '#FEE2E2', text: '#DC2626' },
            'hr': { bg: '#DBEAFE', text: '#2563EB' },
            'manager': { bg: '#D1FAE5', text: '#059669' },
            'employee': { bg: '#F3E8FF', text: '#7C3AED' },
            'intern': { bg: '#FEF3C7', text: '#D97706' },
        };
        return colors[category] || { bg: '#F3F4F6', text: '#374151' };
    };

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    if (isLoading || !staff) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const categoryStyle = getCategoryColor(staff.category);

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Staff Details"
                rightActions={
                    canEdit ? (
                        <TouchableOpacity onPress={handleEdit}>
                            <Ionicons name="create-outline" size={24} color="#8B5CF6" />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
                }
            >
                {/* Profile Header */}
                <View style={styles.profileSection}>
                    {staff.photo ? (
                        <Image source={{ uri: staff.photo }} style={styles.profilePhoto} />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.profileInitial}>
                                {staff.first_name?.charAt(0)}{staff.last_name?.charAt(0)}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.profileName}>{staff.first_name} {staff.last_name}</Text>
                    <Text style={styles.profileEmail}>{staff.email}</Text>

                    <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: categoryStyle.bg }]}>
                            <Text style={[styles.badgeText, { color: categoryStyle.text }]}>
                                {getCategoryLabel(staff.category)}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: staff.active ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Text style={[styles.badgeText, { color: staff.active ? '#059669' : '#DC2626' }]}>
                                {staff.active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                {canEdit && (
                    <View style={styles.actionsSection}>
                        <View style={styles.actionRow}>
                            <Text style={styles.actionLabel}>Account Status</Text>
                            <Switch
                                value={staff.active}
                                onValueChange={handleToggleActive}
                                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                                thumbColor={staff.active ? '#10B981' : '#9CA3AF'}
                                disabled={isTogglingActive}
                            />
                        </View>
                    </View>
                )}

                {/* Personal Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <InfoRow icon="person" label="Username" value={staff.username} />
                    <InfoRow icon="mail" label="Email" value={staff.email} />
                    <InfoRow icon="call" label="Mobile" value={staff.mobileno || 'N/A'} />
                    <InfoRow icon="male-female" label="Gender" value={staff.gender === 'male' ? 'Male' : 'Female'} />
                    <InfoRow icon="calendar" label="Date of Birth" value={formatDate(staff.dob)} />
                    <InfoRow icon="home" label="Address" value={staff.address || 'N/A'} />
                </View>

                {/* Work Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Work Information</Text>
                    <InfoRow icon="briefcase" label="Designation" value={staff.designation || 'N/A'} />
                    <InfoRow icon="business" label="Department" value={staff.department || 'N/A'} />
                    <InfoRow icon="calendar" label="Joining Date" value={formatDate(staff.joiningdate)} />
                    {staff.teams && staff.teams.length > 0 && (
                        <InfoRow icon="people" label="Teams" value={staff.teams.map(t => t.name).join(', ')} />
                    )}
                </View>

                {/* Internship Info (if intern) */}
                {staff.category === 'intern' && staff.internship && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Internship Details</Text>
                        <InfoRow icon="calendar" label="Start Date" value={formatDate(staff.internship.start_date)} />
                        <InfoRow icon="calendar" label="End Date" value={formatDate(staff.internship.end_date)} />
                        <InfoRow icon="star" label="Team Lead" value={staff.internship.lead ? 'Yes' : 'No'} />

                        {staff.internship.end_date && (
                            <View style={styles.extensionAlert}>
                                <Ionicons name="time-outline" size={20} color="#D97706" />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.extensionTitle}>Internship Ending</Text>
                                    <Text style={styles.extensionText}>
                                        Ends on {formatDate(staff.internship.end_date)}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.extendButton}>
                                    <Text style={styles.extendButtonText}>Extend</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// Helper component for info rows
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon as any} size={18} color="#6B7280" />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: '#6B7280' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    profileSection: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    profilePhoto: { width: 100, height: 100, borderRadius: 50 },
    profilePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: { fontSize: 32, fontWeight: '600', color: '#fff' },
    profileName: { fontSize: 22, fontWeight: '600', color: '#1F2937', marginTop: 16 },
    profileEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actionLabel: { fontSize: 15, fontWeight: '500', color: '#1F2937' },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: { flex: 1, fontSize: 14, color: '#6B7280', marginLeft: 12 },
    infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '500', flexShrink: 1, textAlign: 'right', maxWidth: '50%' },
    extensionAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
    },
    extensionTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
    extensionText: { fontSize: 12, color: '#B45309', marginTop: 2 },
    extendButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    extendButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
