/**
 * Invite Hire Screen
 * HR/Admin form to manually invite a new hire
 */
import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hireService, InviteHireRequest } from '@/services/hire.service';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Picker } from '@react-native-picker/picker';

const JOB_TYPES = [
    { label: 'Select Job Type', value: '' },
    { label: 'Internship', value: 'Internship' },
    { label: 'Full Time', value: 'Full Time' },
    { label: 'Part Time', value: 'Part Time' },
    { label: 'Contract', value: 'Contract' },
];

export default function InviteHireScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobType, setJobType] = useState('');
    const [jobLocation, setJobLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check permission (admin, hr, manager, or team leader)
    const canAccess = user && (
        ['admin', 'hr', 'manager'].includes(user.category || '') || user.is_team_leader
    );
    if (!canAccess) {
        return (
            <View style={styles.container}>
                <ModuleHeader title="Invite Hire" />
                <View style={styles.accessDenied}>
                    <Ionicons name="lock-closed" size={64} color="#EF4444" />
                    <Text style={styles.accessDeniedTitle}>Access Denied</Text>
                    <Text style={styles.accessDeniedText}>
                        Only HR, Admin, Manager, or Team Leads can invite new hires.
                    </Text>
                </View>
            </View>
        );
    }

    const validateForm = () => {
        if (!fullName.trim()) return 'Full name is required';
        if (!email.trim()) return 'Email is required';
        if (!email.includes('@')) return 'Please enter a valid email';
        if (!phone.trim()) return 'Phone number is required';
        if (!jobTitle.trim()) return 'Job title is required';
        if (!jobType) return 'Please select a job type';
        return null;
    };

    const handleInvite = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setIsLoading(true);
        try {
            const data: InviteHireRequest = {
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                job_title: jobTitle.trim(),
                job_type: jobType as InviteHireRequest['job_type'],
                job_location: jobLocation.trim() || 'Remote',
            };

            const response = await hireService.inviteHire(data);

            if (response.success) {
                Alert.alert(
                    'Invitation Sent! 🎉',
                    response.message,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            console.error('Invite error:', error);
            console.log('Error response data:', error.response?.data);

            // Extract error message from various response formats
            let errorMessage = 'Failed to send invitation';
            const responseData = error.response?.data;

            if (responseData) {
                if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (responseData.email) {
                    errorMessage = Array.isArray(responseData.email)
                        ? responseData.email[0]
                        : responseData.email;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.detail) {
                    errorMessage = responseData.detail;
                } else if (responseData.non_field_errors) {
                    errorMessage = Array.isArray(responseData.non_field_errors)
                        ? responseData.non_field_errors[0]
                        : responseData.non_field_errors;
                }
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ModuleHeader title="Invite Hire" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color="#8B5CF6" />
                        <Text style={styles.infoText}>
                            Send an invitation to someone who hasn't gone through the
                            job application process. They'll receive an email with
                            instructions to complete their onboarding.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.sectionTitle}>Candidate Details</Text>

                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#9CA3AF"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Job Details</Text>

                        {/* Job Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Job Title / Position *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Software Developer"
                                    placeholderTextColor="#9CA3AF"
                                    value={jobTitle}
                                    onChangeText={setJobTitle}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Job Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Job Type *</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={jobType}
                                    onValueChange={(value: string) => setJobType(value)}
                                    style={styles.picker}
                                >
                                    {JOB_TYPES.map((type) => (
                                        <Picker.Item
                                            key={type.value}
                                            label={type.label}
                                            value={type.value}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Job Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Mumbai or Remote"
                                    placeholderTextColor="#9CA3AF"
                                    value={jobLocation}
                                    onChangeText={setJobLocation}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                            onPress={handleInvite}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#6D28D9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitText}>
                                    {isLoading ? 'Sending...' : 'Send Invitation'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#6D28D9',
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    pickerWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    submitButton: {
        marginTop: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    accessDenied: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    accessDeniedTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    accessDeniedText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});
