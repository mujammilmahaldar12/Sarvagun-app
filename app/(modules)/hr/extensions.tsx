/**
 * Extensions Page
 * Shows interns ending soon AND expired interns (overdue)
 * HR/Admin can: Send extension emails, Extend period, Promote to employee, Ignore/Deactivate
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { DatePicker } from '@/components/core/DatePicker';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/src/lib/api';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Badge, EmptyState, Skeleton } from '@/components';

interface InternEndingSoon {
    id: number;
    intern_id: number;
    intern_name: string;
    email: string;
    designation: string;
    end_date: string;
    days_remaining: number;
    teams: { id: number; name: string }[];
    has_pending_extension: boolean;
}

interface ExpiredIntern {
    id: number;
    intern_id: number;
    intern_name: string;
    email: string;
    designation: string;
    end_date: string;
    start_date: string;
    days_overdue: number;
    total_duration_days: number;
    teams: { id: number; name: string }[];
}

interface PendingRequest {
    id: number;
    intern_id: number;
    intern_name: string;
    email: string;
    designation: string;
    original_end_date: string;
    new_end_date: string;
    duration_months: number;
    reason: string;
    status: string;
    requested_by_name: string;
    created_at: string;
}

export default function ExtensionsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuthStore();

    const [activeSection, setActiveSection] = useState<'ending' | 'expired' | 'pending'>('ending');
    const [interns, setInterns] = useState<InternEndingSoon[]>([]);
    const [expiredInterns, setExpiredInterns] = useState<ExpiredIntern[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showIgnoreModal, setShowIgnoreModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<ExpiredIntern | InternEndingSoon | null>(null);

    // Form fields
    const [newDesignation, setNewDesignation] = useState('');
    const [newCategory, setNewCategory] = useState('employee');
    const [newEndDate, setNewEndDate] = useState(new Date());

    const canManage = user?.category === 'admin' || user?.category === 'hr';

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [endingSoonRes, expiredRes, pendingRes] = await Promise.all([
                api.get('/hr/extensions/ending_soon/'),
                canManage ? api.get('/hr/extensions/expired/') : Promise.resolve({ data: [] }),
                canManage ? api.get('/hr/extensions/pending_requests/') : Promise.resolve({ data: [] })
            ]);
            setInterns(endingSoonRes.data);
            setExpiredInterns(expiredRes.data);
            setPendingRequests(pendingRes.data);
        } catch (error: any) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

    // Send Extension Email
    const handleSendEmail = (intern: InternEndingSoon) => {
        setSelectedIntern(intern);
        // Set default date to 3 months from current end date
        const currentEnd = new Date(intern.end_date);
        currentEnd.setMonth(currentEnd.getMonth() + 3);
        setNewEndDate(currentEnd);
        setShowExtendModal(true);
    };

    const confirmSendEmail = async () => {
        if (!selectedIntern) return;
        setActionLoading('email');
        try {
            await api.post(`/hr/extensions/send-email/${selectedIntern.intern_id}/`, {
                proposed_end_date: newEndDate.toISOString().split('T')[0]
            });
            Alert.alert('Success', 'Extension email sent!');
            setShowExtendModal(false);
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to send email');
        } finally {
            setActionLoading(null);
        }
    };

    // Extend Period
    const handleExtend = (intern: ExpiredIntern) => {
        setSelectedIntern(intern);
        setNewDesignation(intern.designation || '');
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        setNewEndDate(futureDate);
        setShowExtendModal(true);
    };

    const confirmExtend = async () => {
        if (!selectedIntern) return;
        setActionLoading('extend');
        try {
            await api.post(`/hr/extensions/extend/${selectedIntern.intern_id}/`, {
                new_end_date: newEndDate.toISOString().split('T')[0],
                designation: newDesignation || undefined
            });
            Alert.alert('Success', 'Internship extended!');
            setShowExtendModal(false);
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to extend');
        } finally {
            setActionLoading(null);
        }
    };

    // Promote to Employee
    const handlePromote = (intern: ExpiredIntern) => {
        setSelectedIntern(intern);
        setNewDesignation(intern.designation || '');
        setNewCategory('employee');
        setShowPromoteModal(true);
    };

    const confirmPromote = async () => {
        if (!selectedIntern || !newDesignation.trim()) {
            Alert.alert('Error', 'Please enter a designation');
            return;
        }
        setActionLoading('promote');
        try {
            await api.post(`/hr/extensions/promote/${selectedIntern.intern_id}/`, {
                designation: newDesignation,
                category: newCategory
            });
            Alert.alert('🎉 Success', 'Intern promoted to employee!');
            setShowPromoteModal(false);
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to promote');
        } finally {
            setActionLoading(null);
        }
    };

    // Ignore/Deactivate
    const handleIgnore = (intern: ExpiredIntern) => {
        setSelectedIntern(intern);
        setShowIgnoreModal(true);
    };

    const confirmIgnore = async () => {
        if (!selectedIntern) return;
        setShowIgnoreModal(false);
        setActionLoading(`ignore-${selectedIntern.intern_id}`);
        try {
            await api.post(`/hr/extensions/ignore/${selectedIntern.intern_id}/`, { action: 'deactivate' });
            console.log('✅ Account deactivated');
            loadData();
        } catch (e: any) {
            console.error('Error:', e.response?.data?.error || 'Failed');
        } finally {
            setActionLoading(null);
        }
    };

    // Approve Extension Request
    const handleApprove = async (req: PendingRequest) => {
        Alert.alert('Approve Extension', `Approve ${req.intern_name}'s extension request?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve',
                onPress: async () => {
                    setActionLoading(`approve-${req.id}`);
                    try {
                        await api.post(`/hr/extensions/${req.id}/approve/`);
                        Alert.alert('Success', 'Extension approved!');
                        loadData();
                    } catch (e: any) {
                        Alert.alert('Error', e.response?.data?.error || 'Failed to approve');
                    } finally {
                        setActionLoading(null);
                    }
                }
            }
        ]);
    };

    // Reject Extension Request
    const handleReject = async (req: PendingRequest) => {
        Alert.alert('Reject Extension', `Reject ${req.intern_name}'s extension request?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    setActionLoading(`reject-${req.id}`);
                    try {
                        await api.post(`/hr/extensions/${req.id}/reject/`, { reason: 'Rejected by HR' });
                        Alert.alert('Done', 'Extension rejected');
                        loadData();
                    } catch (e: any) {
                        Alert.alert('Error', e.response?.data?.error || 'Failed to reject');
                    } finally {
                        setActionLoading(null);
                    }
                }
            }
        ]);
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const getDaysColor = (days: number) => days <= 7 ? '#EF4444' : days <= 14 ? '#F59E0B' : '#10B981';

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ModuleHeader title="Extensions" />
                <View style={{ padding: 16 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height={120} style={{ marginBottom: 12, borderRadius: 16 }} />)}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ModuleHeader title="Intern Extensions" />

            {/* Tabs - Fixed height */}
            <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeSection === 'ending' && { borderBottomColor: theme.primary }]}
                    onPress={() => setActiveSection('ending')}
                >
                    <Ionicons name="time-outline" size={16} color={activeSection === 'ending' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.tabText, { color: activeSection === 'ending' ? theme.primary : theme.text }]} numberOfLines={1}>
                        Soon ({interns.length})
                    </Text>
                </TouchableOpacity>
                {canManage && (
                    <>
                        <TouchableOpacity
                            style={[styles.tab, activeSection === 'expired' && { borderBottomColor: '#EF4444' }]}
                            onPress={() => setActiveSection('expired')}
                        >
                            <Ionicons name="alert-circle" size={16} color={activeSection === 'expired' ? '#EF4444' : theme.textSecondary} />
                            <Text style={[styles.tabText, { color: activeSection === 'expired' ? '#EF4444' : theme.text }]} numberOfLines={1}>
                                Overdue ({expiredInterns.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeSection === 'pending' && { borderBottomColor: '#F59E0B' }]}
                            onPress={() => setActiveSection('pending')}
                        >
                            <Ionicons name="hourglass" size={16} color={activeSection === 'pending' ? '#F59E0B' : theme.textSecondary} />
                            <Text style={[styles.tabText, { color: activeSection === 'pending' ? '#F59E0B' : theme.text }]} numberOfLines={1}>
                                Pending ({pendingRequests.length})
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {activeSection === 'ending' ? (
                    interns.length === 0 ? (
                        <EmptyState icon="checkmark-circle" title="All Clear" subtitle="No interns ending within 45 days" />
                    ) : (
                        interns.map(intern => (
                            <View key={intern.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.avatarText}>{intern.intern_name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.name, { color: theme.text }]}>{intern.intern_name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{intern.designation || 'Intern'}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: getDaysColor(intern.days_remaining) + '20' }]}>
                                        <Text style={{ color: getDaysColor(intern.days_remaining), fontWeight: '700', fontSize: 16 }}>{intern.days_remaining}</Text>
                                        <Text style={{ color: getDaysColor(intern.days_remaining), fontSize: 10 }}>days</Text>
                                    </View>
                                </View>
                                <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13 }}>Ends: {formatDate(intern.end_date)}</Text>
                                {canManage && (
                                    <View style={styles.actions}>
                                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => handleExtend(intern as any)}>
                                            <Ionicons name="calendar" size={14} color="#fff" />
                                            <Text style={styles.smallBtnText}>Extend</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#10B981' }]} onPress={() => handlePromote(intern as any)}>
                                            <Ionicons name="rocket" size={14} color="#fff" />
                                            <Text style={styles.smallBtnText}>Promote</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#6B7280' }]} onPress={() => handleIgnore(intern as any)}>
                                            <Ionicons name="close-circle" size={14} color="#fff" />
                                            <Text style={styles.smallBtnText}>Ignore</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )
                ) : activeSection === 'expired' ? (
                    expiredInterns.length === 0 ? (
                        <EmptyState icon="checkmark-circle" title="All Clear" subtitle="No overdue interns" />
                    ) : (
                        expiredInterns.map(intern => (
                            <View key={intern.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: '#FCA5A5', borderWidth: 2 }]}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.avatar, { backgroundColor: '#EF4444' }]}>
                                        <Text style={styles.avatarText}>{intern.intern_name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.name, { color: theme.text }]}>{intern.intern_name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{intern.designation || 'Intern'}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                                        <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 16 }}>+{intern.days_overdue}</Text>
                                        <Text style={{ color: '#DC2626', fontSize: 10 }}>overdue</Text>
                                    </View>
                                </View>
                                <Text style={{ color: '#DC2626', marginTop: 8, fontSize: 12 }}>
                                    Was: {formatDate(intern.start_date)} → {formatDate(intern.end_date)} ({intern.total_duration_days} days)
                                </Text>
                                {/* Action Buttons */}
                                <View style={styles.actions}>
                                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => handleExtend(intern)}>
                                        <Ionicons name="calendar" size={14} color="#fff" />
                                        <Text style={styles.smallBtnText}>Extend</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#10B981' }]} onPress={() => handlePromote(intern)}>
                                        <Ionicons name="rocket" size={14} color="#fff" />
                                        <Text style={styles.smallBtnText}>Promote</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#6B7280' }]} onPress={() => handleIgnore(intern)}>
                                        <Ionicons name="close-circle" size={14} color="#fff" />
                                        <Text style={styles.smallBtnText}>Ignore</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )
                ) : activeSection === 'pending' ? (
                    /* Pending Requests Section */
                    pendingRequests.length === 0 ? (
                        <EmptyState icon="checkmark-circle" title="All Clear" subtitle="No pending extension requests" />
                    ) : (
                        pendingRequests.map(req => (
                            <View key={req.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: '#FCD34D', borderWidth: 2 }]}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}>
                                        <Text style={styles.avatarText}>{req.intern_name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.name, { color: theme.text }]}>{req.intern_name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{req.designation || 'Intern'}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                                        <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 14 }}>+{req.duration_months}m</Text>
                                    </View>
                                </View>
                                <View style={{ marginTop: 10, padding: 10, backgroundColor: theme.background, borderRadius: 8 }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Extension Request</Text>
                                    <Text style={{ color: theme.text, fontSize: 13, marginTop: 4 }}>
                                        {formatDate(req.original_end_date)} → {formatDate(req.new_end_date)}
                                    </Text>
                                    {req.reason && (
                                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                                            "{req.reason}"
                                        </Text>
                                    )}
                                </View>
                                {/* Approve/Reject Buttons */}
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[styles.smallBtn, { backgroundColor: '#10B981', flex: 1 }]}
                                        onPress={() => handleApprove(req)}
                                    >
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                        <Text style={styles.smallBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.smallBtn, { backgroundColor: '#EF4444', flex: 1 }]}
                                        onPress={() => handleReject(req)}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                        <Text style={styles.smallBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )
                ) : null}
            </ScrollView>

            {/* Extend Modal - 2 inputs: Date + Designation */}
            <Modal visible={showExtendModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>📅 Extend Internship</Text>
                        <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                            Set new end date and designation for {selectedIntern?.intern_name}
                        </Text>

                        {/* New End Date */}
                        <DatePicker
                            label="New End Date *"
                            value={newEndDate}
                            onChange={(date) => { if (date) setNewEndDate(date); }}
                            minDate={new Date()}
                            placeholder="Select new end date"
                            format="long"
                        />

                        {/* New Designation */}
                        <Text style={{ color: theme.text, marginBottom: 4, marginTop: 12 }}>New Designation</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                            value={newDesignation}
                            onChangeText={setNewDesignation}
                            placeholder="e.g., Junior Developer (optional)"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExtendModal(false)}>
                                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, actionLoading && { opacity: 0.5 }]}
                                onPress={confirmExtend}
                                disabled={!!actionLoading}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>{actionLoading ? 'Extending...' : 'Extend'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Promote Modal */}
            <Modal visible={showPromoteModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>🎉 Promote to Employee</Text>

                        <Text style={{ color: theme.text, marginBottom: 4 }}>New Designation *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                            value={newDesignation}
                            onChangeText={setNewDesignation}
                            placeholder="e.g., Junior Developer"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <Text style={{ color: theme.text, marginBottom: 4, marginTop: 12 }}>Category</Text>
                        <View style={[styles.pickerWrap, { backgroundColor: theme.background }]}>
                            <Picker selectedValue={newCategory} onValueChange={setNewCategory} style={{ color: theme.text }}>
                                <Picker.Item label="Employee" value="employee" />
                                <Picker.Item label="Manager" value="manager" />
                            </Picker>
                        </View>

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPromoteModal(false)}>
                                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: '#10B981' }, actionLoading && { opacity: 0.5 }]}
                                onPress={confirmPromote}
                                disabled={!!actionLoading}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>{actionLoading ? 'Promoting...' : 'Promote'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Ignore Confirmation Modal */}
            <Modal visible={showIgnoreModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>⚠️ Deactivate Account</Text>
                        <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                            Are you sure you want to deactivate {selectedIntern?.intern_name}'s account? This will prevent them from logging in.
                        </Text>

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowIgnoreModal(false)}>
                                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: '#EF4444' }, actionLoading && { opacity: 0.5 }]}
                                onPress={confirmIgnore}
                                disabled={!!actionLoading}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>{actionLoading ? 'Processing...' : 'Deactivate'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 12, fontWeight: '600' },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    name: { fontSize: 16, fontWeight: '600' },
    badge: { padding: 8, borderRadius: 10, alignItems: 'center', minWidth: 55 },
    actionBtn: { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
    gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    smallBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8 },
    smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    modalSub: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
    dateInput: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12 },
    input: { padding: 14, borderRadius: 12, fontSize: 15 },
    pickerWrap: { borderRadius: 12, overflow: 'hidden' },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
    confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#8B5CF6' },
});
