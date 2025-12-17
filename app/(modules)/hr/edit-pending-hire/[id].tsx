/**
 * Edit Pending Hire Screen
 * Edit pending registration details before approval
 */
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hireService, PendingApprovalDetail } from '@/services/hire.service';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';

export default function EditPendingHireScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [original, setOriginal] = useState<PendingApprovalDetail | null>(null);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [designation, setDesignation] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [joiningDate, setJoiningDate] = useState('');

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        if (!id) return;

        try {
            const response = await hireService.getPendingApprovalDetail(parseInt(id));
            setOriginal(response);
            setFirstName(response.first_name);
            setLastName(response.last_name);
            setUsername(response.username);
            setDesignation(response.designation || '');
            setMobile(response.mobile);
            setAddress(response.address);
            setJoiningDate(response.joining_date);
        } catch (error: any) {
            console.error('Failed to load details:', error);
            Alert.alert('Error', 'Failed to load details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;

        // Validation
        if (!firstName.trim() || !lastName.trim() || !username.trim()) {
            Alert.alert('Error', 'Name and username are required');
            return;
        }

        setIsSaving(true);
        try {
            const updateData: any = {};

            if (firstName !== original?.first_name) updateData.first_name = firstName;
            if (lastName !== original?.last_name) updateData.last_name = lastName;
            if (username !== original?.username) updateData.username = username;
            if (designation !== (original?.designation || '')) updateData.designation = designation;
            if (mobile !== original?.mobile) updateData.mobile = mobile;
            if (address !== original?.address) updateData.address = address;
            if (joiningDate !== original?.joining_date) updateData.joining_date = joiningDate;

            if (Object.keys(updateData).length === 0) {
                Alert.alert('Info', 'No changes to save');
                return;
            }

            const response = await hireService.updatePendingApproval(parseInt(id), updateData);
            Alert.alert('Success', response.message, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader title="Edit Registration" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username *</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Username"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact & Role</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Designation</Text>
                            <TextInput
                                style={styles.input}
                                value={designation}
                                onChangeText={setDesignation}
                                placeholder="Job title / Designation"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile</Text>
                            <TextInput
                                style={styles.input}
                                value={mobile}
                                onChangeText={setMobile}
                                placeholder="Mobile number"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Address"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Dates</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Joining Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                value={joiningDate}
                                onChangeText={setJoiningDate}
                                placeholder="2025-01-15"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveGradient}
                        >
                            <Ionicons name="save" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: '#6B7280' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    saveButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    buttonDisabled: { opacity: 0.5 },
});
