/**
 * Edit Staff Screen
 * Edit staff member information
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
import { Picker } from '@react-native-picker/picker';
import hrService from '@/services/hr.service';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { api } from '@/src/lib/api';

export default function EditStaffScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [designation, setDesignation] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('');
    const [active, setActive] = useState(true);

    const canEdit = user?.category === 'admin' || user?.category === 'hr';

    useEffect(() => {
        if (!canEdit) {
            Alert.alert('Access Denied', 'Only Admin/HR can edit staff');
            router.back();
            return;
        }
        loadStaffDetails();
    }, [id]);

    const loadStaffDetails = async () => {
        if (!id) return;

        try {
            const response = await hrService.getEmployee(parseInt(id)) as any;
            setFirstName(response.first_name || '');
            setLastName(response.last_name || '');
            setEmail(response.email || '');
            setMobile(response.mobileno || '');
            setDesignation(response.designation || '');
            setAddress(response.address || '');
            setCategory(response.category || '');
            setActive(response.active ?? true);
        } catch (error: any) {
            console.error('Failed to load staff details:', error);
            Alert.alert('Error', 'Failed to load staff details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;

        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsSaving(true);
        try {
            await api.patch(`/hr/users/${id}/`, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                mobileno: mobile,
                designation: designation,
                address: address,
                category: category,
                active: active,
            });
            Alert.alert('Success', 'Staff details updated', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Failed to update staff:', error);
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
            <ModuleHeader title="Edit Staff" />

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
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
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
                        <Text style={styles.sectionTitle}>Work Information</Text>

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
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={category}
                                    onValueChange={(value) => setCategory(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Employee" value="employee" />
                                    <Picker.Item label="Intern" value="intern" />
                                    <Picker.Item label="Manager" value="manager" />
                                    <Picker.Item label="HR" value="hr" />
                                    <Picker.Item label="Admin" value="admin" />
                                    <Picker.Item label="Mukadam" value="mukadam" />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusRow}>
                                <TouchableOpacity
                                    style={[styles.statusButton, active && styles.statusButtonActive]}
                                    onPress={() => setActive(true)}
                                >
                                    <Text style={[styles.statusText, active && styles.statusTextActive]}>Active</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusButton, !active && styles.statusButtonInactive]}
                                    onPress={() => setActive(false)}
                                >
                                    <Text style={[styles.statusText, !active && styles.statusTextInactive]}>Inactive</Text>
                                </TouchableOpacity>
                            </View>
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
        fontSize: 13,
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
    pickerContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#1F2937',
    },
    statusRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    statusButtonActive: {
        backgroundColor: '#D1FAE5',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    statusButtonInactive: {
        backgroundColor: '#FEE2E2',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    statusText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    statusTextActive: { color: '#059669', fontWeight: '600' },
    statusTextInactive: { color: '#DC2626', fontWeight: '600' },
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
