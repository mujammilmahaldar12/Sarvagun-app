/**
 * Pending Hire Detail Screen
 * View details and approve/reject pending registration
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
    Linking,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hireService, PendingApprovalDetail } from '@/services/hire.service';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/src/lib/api';

interface Team {
    id: number;
    name: string;
}

export default function PendingHireDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [approval, setApproval] = useState<PendingApprovalDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Team selection state
    const [teams, setTeams] = useState<Team[]>([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

    useEffect(() => {
        loadApprovalDetail();
        loadTeams();
    }, [id]);

    const loadApprovalDetail = async () => {
        if (!id) return;

        try {
            const response = await hireService.getPendingApprovalDetail(parseInt(id));
            setApproval(response);
        } catch (error: any) {
            console.error('Failed to load approval detail:', error);
            Alert.alert('Error', 'Failed to load details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const loadTeams = async () => {
        try {
            const response = await api.get('/hr/teams/');
            if (response.data.results) {
                setTeams(response.data.results);
            } else if (Array.isArray(response.data)) {
                setTeams(response.data);
            }
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    };

    const handleApprove = () => {
        // Show team selection modal first
        setShowTeamModal(true);
    };

    const confirmApprove = async (teamId?: number) => {
        if (!id) return;

        setIsApproving(true);
        setShowTeamModal(false);
        try {
            const response = await hireService.approveRegistration(parseInt(id), teamId || undefined);
            const teamMessage = response.team_name ? ` and assigned to ${response.team_name}` : '';
            Alert.alert('Success', response.message + teamMessage, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Approval failed');
        } finally {
            setIsApproving(false);
        }
    };

    const handleEdit = () => {
        router.push({
            pathname: '/hr/edit-pending-hire/[id]',
            params: { id: id }
        } as any);
    };

    const handleReject = () => {
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!id || !rejectReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        setIsRejecting(true);
        try {
            const response = await hireService.rejectRegistration(parseInt(id), rejectReason);
            setShowRejectModal(false);
            Alert.alert('Success', response.message, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Rejection failed');
        } finally {
            setIsRejecting(false);
        }
    };

    const openDocument = (url: string | undefined | null) => {
        if (url) {
            Linking.openURL(url);
        }
    };

    const getDocTypeName = (type: string, otherName?: string | null) => {
        const types: Record<string, string> = {
            aadhaar: 'Aadhaar Card',
            pan: 'PAN Card',
            voter_id: 'Voter ID',
            passport: 'Passport',
            student_id: 'Student ID',
            other: otherName || 'Other',
        };
        return types[type] || type;
    };

    if (isLoading || !approval) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registration Details</Text>
                {approval.status === 'pending' ? (
                    <TouchableOpacity onPress={handleEdit}>
                        <Ionicons name="create-outline" size={24} color="#8B5CF6" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    {approval.photo_url ? (
                        <Image source={{ uri: approval.photo_url }} style={styles.profilePhoto} />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.profileInitial}>
                                {approval.first_name.charAt(0)}{approval.last_name.charAt(0)}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.profileName}>{approval.first_name} {approval.last_name}</Text>
                    <Text style={styles.profileEmail}>{approval.email}</Text>

                    <View style={styles.badges}>
                        <View style={[
                            styles.badge,
                            approval.user_category === 'intern' ? styles.internBadge : styles.employeeBadge
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                approval.user_category === 'intern' ? styles.internText : styles.employeeText
                            ]}>
                                {approval.user_category === 'intern' ? 'Intern' : 'Employee'}
                            </Text>
                        </View>
                        <View style={styles.jobBadge}>
                            <Text style={styles.jobBadgeText}>{approval.job_type}</Text>
                        </View>
                    </View>
                </View>

                {/* Info Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Job Details</Text>
                    <InfoRow icon="briefcase" label="Position" value={approval.job_title} />
                    <InfoRow icon="location" label="Location" value={approval.job_location} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <InfoRow icon="person" label="Username" value={approval.username} />
                    <InfoRow icon="male-female" label="Gender" value={approval.gender === 'male' ? 'Male' : 'Female'} />
                    <InfoRow icon="calendar" label="Date of Birth" value={new Date(approval.dob).toLocaleDateString()} />
                    <InfoRow icon="call" label="Mobile" value={approval.mobile} />
                    <InfoRow icon="home" label="Address" value={approval.address} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Employment Dates</Text>
                    <InfoRow icon="calendar" label="Joining Date" value={new Date(approval.joining_date).toLocaleDateString()} />
                    {approval.end_date && (
                        <InfoRow icon="calendar" label="End Date" value={new Date(approval.end_date).toLocaleDateString()} />
                    )}
                </View>

                {/* Documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents</Text>

                    <TouchableOpacity
                        style={styles.documentCard}
                        onPress={() => openDocument(approval.document1_url)}
                    >
                        <Ionicons name="document-text" size={24} color="#8B5CF6" />
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentType}>
                                {getDocTypeName(approval.document1_type, approval.document1_other_name)}
                            </Text>
                            <Text style={styles.documentAction}>Tap to view</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.documentCard}
                        onPress={() => openDocument(approval.document2_url)}
                    >
                        <Ionicons name="document-text" size={24} color="#8B5CF6" />
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentType}>
                                {getDocTypeName(approval.document2_type, approval.document2_other_name)}
                            </Text>
                            <Text style={styles.documentAction}>Tap to view</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Submission Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Submission Details</Text>
                    <InfoRow icon="time" label="Submitted At" value={new Date(approval.submitted_at).toLocaleString()} />
                    <InfoRow icon="hourglass" label="Status" value={approval.status.charAt(0).toUpperCase() + approval.status.slice(1)} />
                </View>

                {/* Action Buttons (only for pending) */}
                {approval.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.rejectButton, isRejecting && styles.buttonDisabled]}
                            onPress={handleReject}
                            disabled={isApproving || isRejecting}
                        >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.approveButton, isApproving && styles.buttonDisabled]}
                            onPress={handleApprove}
                            disabled={isApproving || isRejecting}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.approveGradient}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.approveButtonText}>
                                    {isApproving ? 'Approving...' : 'Approve'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Registration</Text>
                        <Text style={styles.modalSubtitle}>
                            Please provide a reason for rejecting this registration.
                        </Text>

                        <TextInput
                            style={styles.rejectInput}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor="#9CA3AF"
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowRejectModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalRejectButton, isRejecting && styles.buttonDisabled]}
                                onPress={confirmReject}
                                disabled={isRejecting}
                            >
                                <Text style={styles.modalRejectText}>
                                    {isRejecting ? 'Rejecting...' : 'Reject'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Team Selection Modal */}
            <Modal
                visible={showTeamModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTeamModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <Text style={styles.modalTitle}>Assign to Team</Text>
                        <Text style={styles.modalSubtitle}>
                            Select a team for {approval?.first_name} (optional)
                        </Text>

                        <FlatList
                            data={teams}
                            keyExtractor={(item) => item.id.toString()}
                            style={{ maxHeight: 300, marginBottom: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.teamItem,
                                        selectedTeamId === item.id && styles.teamItemSelected
                                    ]}
                                    onPress={() => setSelectedTeamId(
                                        selectedTeamId === item.id ? null : item.id
                                    )}
                                >
                                    <Text style={[
                                        styles.teamItemText,
                                        selectedTeamId === item.id && styles.teamItemTextSelected
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {selectedTeamId === item.id && (
                                        <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyTeamText}>No teams available</Text>
                            }
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowTeamModal(false);
                                    setSelectedTeamId(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.teamConfirmButton, isApproving && styles.buttonDisabled]}
                                onPress={() => confirmApprove(selectedTeamId || undefined)}
                                disabled={isApproving}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.teamConfirmGradient}
                                >
                                    <Text style={styles.teamConfirmText}>
                                        {isApproving ? 'Approving...' : 'Approve'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
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
    badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    internBadge: { backgroundColor: '#FEF3C7' },
    employeeBadge: { backgroundColor: '#DBEAFE' },
    badgeText: { fontSize: 12, fontWeight: '500' },
    internText: { color: '#D97706' },
    employeeText: { color: '#2563EB' },
    jobBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    jobBadgeText: { fontSize: 12, fontWeight: '500', color: '#7C3AED' },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: { flex: 1, fontSize: 14, color: '#6B7280', marginLeft: 12 },
    infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '500', flexShrink: 1, textAlign: 'right' },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 8,
    },
    documentInfo: { flex: 1, marginLeft: 12 },
    documentType: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
    documentAction: { fontSize: 12, color: '#8B5CF6', marginTop: 2 },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },
    rejectButtonText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
    approveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    approveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    approveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    buttonDisabled: { opacity: 0.5 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
    rejectInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#1F2937',
        minHeight: 100,
        marginBottom: 16,
    },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
    modalRejectButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    modalRejectText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    // Team selection styles
    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 8,
    },
    teamItemSelected: {
        backgroundColor: '#EDE9FE',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    teamItemText: { fontSize: 15, color: '#1F2937' },
    teamItemTextSelected: { color: '#7C3AED', fontWeight: '600' },
    emptyTeamText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 20 },
    teamConfirmButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    teamConfirmGradient: {
        padding: 14,
        alignItems: 'center',
    },
    teamConfirmText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
