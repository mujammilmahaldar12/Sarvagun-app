/**
 * HR Certificate Management
 * Centralized interface for admins/HR/team leads to upload certificates for users
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useModule } from '@/hooks/useModule';
import { DatePicker } from '@/components/core/DatePicker';
import {
    useSearchEmployees,
    useUserCertifications,
    useCreateCertification,
    useDeleteCertification,
} from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { CertificationCard } from '@/components/ui/CertificationCard';
import { EmptyState, GlassCard } from '@/components';
import type { Certification } from '@/types/user';

export default function CertificateManagementScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const { canManage } = useModule('hr.employees');

    // Permission check
    const canUploadCertificates =
        user?.category === 'admin' ||
        user?.category === 'hr' ||
        user?.category === 'team_lead' ||
        user?.category === 'manager';

    if (!canUploadCertificates) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
                ]}
            >
                <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
                <Text style={{ marginTop: 16, fontSize: 18, color: theme.textSecondary }}>
                    Access Denied
                </Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: theme.textSecondary }}>
                    Only admins, HR, and team leads can upload certificates
                </Text>
            </View>
        );
    }

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        issued_by: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
        certificate_file: null as any,
    });

    // Date picker state
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

    // API hooks
    const { data: searchResults, isLoading: isSearching } = useSearchEmployees(
        searchQuery,
        {},
        searchQuery.length > 2
    );
    const { data: userCertifications, isLoading: isLoadingCerts, refetch: refetchCerts } =
        useUserCertifications(selectedUser?.id || 0);
    const createCertification = useCreateCertification();
    const deleteCertification = useDeleteCertification();

    // Filtered users
    const filteredUsers = useMemo(() => {
        return searchResults?.results || [];
    }, [searchResults]);

    // Handlers
    const handleSelectUser = (selectedUser: any) => {
        setSelectedUser(selectedUser);
        setShowUserDropdown(false);
        setSearchQuery('');
        setShowUploadForm(false);
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setFormData({ ...formData, certificate_file: file });
            }
        } catch (error) {
            console.error('File picker error:', error);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedUser) {
            Alert.alert('Error', 'Please select a user first');
            return;
        }
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter certificate title');
            return;
        }
        if (!formData.certificate_file) {
            Alert.alert('Error', 'Please select a certificate file');
            return;
        }

        try {
            // Create FormData
            const uploadData = new FormData();
            uploadData.append('user', selectedUser.id.toString());
            uploadData.append('title', formData.title);
            uploadData.append('certificate_type', 'external');

            if (formData.issued_by) uploadData.append('issued_by', formData.issued_by);
            if (formData.issue_date) uploadData.append('issue_date', formData.issue_date);
            if (formData.expiry_date) uploadData.append('expiry_date', formData.expiry_date);
            if (formData.credential_id) uploadData.append('credential_id', formData.credential_id);
            if (formData.credential_url) uploadData.append('credential_url', formData.credential_url);

            // Append file
            const file = formData.certificate_file;
            uploadData.append('certificate_file', {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name || 'certificate.pdf',
            } as any);

            await createCertification.mutateAsync(uploadData);

            Alert.alert('Success', 'Certificate uploaded successfully!');

            // Reset form
            setFormData({
                title: '',
                issued_by: '',
                issue_date: '',
                expiry_date: '',
                credential_id: '',
                credential_url: '',
                certificate_file: null,
            });
            setShowUploadForm(false);
            refetchCerts();
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload certificate');
        }
    };

    const handleDeleteCertificate = (certId: number) => {
        Alert.alert(
            'Delete Certificate',
            'Are you sure you want to delete this certificate?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCertification.mutateAsync(certId);
                            refetchCerts();
                            Alert.alert('Success', 'Certificate deleted');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete certificate');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ModuleHeader title="Certificate Management" showNotifications={false} />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* User Search Section */}
                <GlassCard variant="default" style={styles.searchCard}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Select User</Text>

                    {selectedUser ? (
                        <View style={[styles.selectedUserCard, { backgroundColor: theme.surface }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.selectedUserName, { color: theme.text }]}>
                                    {selectedUser.first_name} {selectedUser.last_name}
                                </Text>
                                <Text style={[styles.selectedUserDetails, { color: theme.textSecondary }]}>
                                    {selectedUser.designation || 'N/A'} • {selectedUser.department || 'N/A'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedUser(null);
                                    setShowUploadForm(false);
                                }}
                                style={[styles.changeUserBtn, { backgroundColor: theme.primary + '15' }]}
                            >
                                <Ionicons name="swap-horizontal" size={16} color={theme.primary} />
                                <Text style={[styles.changeUserText, { color: theme.primary }]}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Ionicons name="search" size={20} color={theme.textSecondary} />
                                <TextInput
                                    placeholder="Search for a user by name..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={searchQuery}
                                    onChangeText={(text) => {
                                        setSearchQuery(text);
                                        setShowUserDropdown(text.length > 2);
                                    }}
                                    style={[styles.searchInput, { color: theme.text }]}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => { setSearchQuery(''); setShowUserDropdown(false); }}>
                                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* User Dropdown */}
                            {showUserDropdown && (
                                <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    {isSearching ? (
                                        <View style={styles.dropdownLoading}>
                                            <ActivityIndicator size="small" color={theme.primary} />
                                            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Searching...</Text>
                                        </View>
                                    ) : filteredUsers.length > 0 ? (
                                        <ScrollView style={{ maxHeight: 200 }}>
                                            {filteredUsers.map((selectedUser: any) => (
                                                <TouchableOpacity
                                                    key={selectedUser.id}
                                                    onPress={() => handleSelectUser(selectedUser)}
                                                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                                                >
                                                    <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                                                        <Text style={{ color: theme.primary, fontWeight: '600' }}>
                                                            {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.dropdownUserName, { color: theme.text }]}>
                                                            {selectedUser.first_name} {selectedUser.last_name}
                                                        </Text>
                                                        <Text style={[styles.dropdownUserDetails, { color: theme.textSecondary }]}>
                                                            {selectedUser.designation || 'N/A'}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        <View style={styles.dropdownEmpty}>
                                            <Ionicons name="person-outline" size={32} color={theme.textSecondary} />
                                            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>
                                                No users found
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </GlassCard>

                {/* User's Certificates Section */}
                {selectedUser && (
                    <>
                        <View style={styles.certificatesHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Certificates ({userCertifications?.length || 0})
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowUploadForm(!showUploadForm)}
                                style={[styles.addBtn, { backgroundColor: showUploadForm ? theme.surface : theme.primary }]}
                            >
                                <Ionicons
                                    name={showUploadForm ? 'close' : 'add'}
                                    size={20}
                                    color={showUploadForm ? theme.text : '#fff'}
                                />
                                <Text
                                    style={[
                                        styles.addBtnText,
                                        { color: showUploadForm ? theme.text : '#fff' },
                                    ]}
                                >
                                    {showUploadForm ? 'Cancel' : 'Add Certificate'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Form */}
                        {showUploadForm && (
                            <GlassCard variant="default" style={styles.uploadForm}>
                                <Text style={[styles.formTitle, { color: theme.text }]}>Upload New Certificate</Text>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>
                                        Title <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="e.g., AWS Solutions Architect"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.title}
                                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Issued By</Text>
                                    <TextInput
                                        placeholder="e.g., Amazon Web Services"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.issued_by}
                                        onChangeText={(text) => setFormData({ ...formData, issued_by: text })}
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    />
                                </View>

                                <View style={styles.formRow}>
                                    <View style={[styles.formGroup, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: theme.text }]}>Issue Date</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowIssueDatePicker(true)}
                                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]}
                                        >
                                            <Text style={{ color: formData.issue_date ? theme.text : theme.textSecondary, fontSize: 14 }}>
                                                {formData.issue_date || 'Select date'}
                                            </Text>
                                        </TouchableOpacity>
                                        <DatePicker
                                            visible={showIssueDatePicker}
                                            mode="single"
                                            onClose={() => setShowIssueDatePicker(false)}
                                            onConfirm={(date) => {
                                                setFormData({ ...formData, issue_date: date as string });
                                                setShowIssueDatePicker(false);
                                            }}
                                            selectedDate={formData.issue_date || undefined}
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: theme.text }]}>Expiry Date</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowExpiryDatePicker(true)}
                                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]}
                                        >
                                            <Text style={{ color: formData.expiry_date ? theme.text : theme.textSecondary, fontSize: 14 }}>
                                                {formData.expiry_date || 'Select date (optional)'}
                                            </Text>
                                        </TouchableOpacity>
                                        <DatePicker
                                            visible={showExpiryDatePicker}
                                            mode="single"
                                            onClose={() => setShowExpiryDatePicker(false)}
                                            onConfirm={(date) => {
                                                setFormData({ ...formData, expiry_date: date as string });
                                                setShowExpiryDatePicker(false);
                                            }}
                                            selectedDate={formData.expiry_date || undefined}
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Credential ID</Text>
                                    <TextInput
                                        placeholder="Optional verification ID"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.credential_id}
                                        onChangeText={(text) => setFormData({ ...formData, credential_id: text })}
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Credential URL</Text>
                                    <TextInput
                                        placeholder="https://verify.example.com"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.credential_url}
                                        onChangeText={(text) => setFormData({ ...formData, credential_url: text })}
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>
                                        Certificate File <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handlePickFile}
                                        style={[styles.filePickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    >
                                        <Ionicons name="document-attach" size={20} color={theme.primary} />
                                        <Text style={[styles.filePickerText, { color: theme.text }]}>
                                            {formData.certificate_file ? formData.certificate_file.name : 'Choose File (PDF or Image)'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={createCertification.isPending}
                                    style={[
                                        styles.submitBtn,
                                        {
                                            backgroundColor: createCertification.isPending ? theme.textSecondary : theme.primary,
                                        },
                                    ]}
                                >
                                    {createCertification.isPending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload" size={20} color="#fff" />
                                            <Text style={styles.submitBtnText}>Upload Certificate</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </GlassCard>
                        )}

                        {/* Certificates List */}
                        {isLoadingCerts ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>
                                    Loading certificates...
                                </Text>
                            </View>
                        ) : userCertifications && userCertifications.length > 0 ? (
                            <View style={styles.certificatesList}>
                                {userCertifications.map((cert: Certification) => (
                                    <View key={cert.id} style={styles.certCardWrapper}>
                                        <CertificationCard certification={cert} />
                                        {(user?.category === 'admin' ||
                                            user?.category === 'hr' ||
                                            cert.issued_by_admin?.id === user?.id) && (
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteCertificate(cert.id)}
                                                    style={[styles.deleteBtn, { backgroundColor: '#ef4444' }]}
                                                >
                                                    <Ionicons name="trash" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <EmptyState
                                icon="ribbon-outline"
                                title="No Certificates Yet"
                                subtitle={`${selectedUser.first_name} doesn't have any certificates. Click "Add Certificate" to upload one.`}
                            />
                        )}
                    </>
                )}

                {/* Initial Empty State */}
                {!selectedUser && (
                    <EmptyState
                        icon="person-outline"
                        title="Select a User"
                        subtitle="Search for a user above to view and manage their certificates"
                    />
                )}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    searchCard: { marginBottom: 16, padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14 },
    dropdown: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dropdownLoading: {
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownUserName: { fontSize: 14, fontWeight: '600' },
    dropdownUserDetails: { fontSize: 12, marginTop: 2 },
    dropdownEmpty: {
        padding: 32,
        alignItems: 'center',
    },
    selectedUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    selectedUserName: { fontSize: 16, fontWeight: '600' },
    selectedUserDetails: { fontSize: 13, marginTop: 4 },
    changeUserBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    changeUserText: { fontSize: 13, fontWeight: '600' },
    certificatesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addBtnText: { fontSize: 14, fontWeight: '600' },
    uploadForm: { marginBottom: 16, padding: 16 },
    formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    formGroup: { marginBottom: 16 },
    formRow: { flexDirection: 'row', gap: 12 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    filePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    filePickerText: { fontSize: 14, flex: 1 },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 8,
        marginTop: 8,
    },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    certificatesList: { gap: 12 },
    certCardWrapper: { position: 'relative' },
    deleteBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});
