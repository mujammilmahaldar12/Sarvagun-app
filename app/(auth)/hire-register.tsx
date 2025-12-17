/**
 * Hire Registration Form Screen
 * Step 3: Complete user registration after OTP verification
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
    StatusBar,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { hireService } from '@/services/hire.service';
import { Picker } from '@react-native-picker/picker';

const DOCUMENT_TYPES = [
    { label: 'Select Document Type', value: '' },
    { label: 'Aadhaar Card', value: 'aadhaar' },
    { label: 'PAN Card', value: 'pan' },
    { label: 'Voter ID', value: 'voter_id' },
    { label: 'Passport', value: 'passport' },
    { label: 'Student ID Card', value: 'student_id' },
    { label: 'Other', value: 'other' },
];

export default function HireRegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        verification_token: string;
        email: string;
        phone: string;
        designation: string;
        job_type: string;
    }>();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [dob, setDob] = useState<Date | null>(null);
    const [joiningDate, setJoiningDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState(params.phone || '');

    // Document state
    const [photo, setPhoto] = useState<any>(null);
    const [document1, setDocument1] = useState<any>(null);
    const [document1Type, setDocument1Type] = useState('');
    const [document1OtherName, setDocument1OtherName] = useState('');
    const [document2, setDocument2] = useState<any>(null);
    const [document2Type, setDocument2Type] = useState('');
    const [document2OtherName, setDocument2OtherName] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [showJoiningPicker, setShowJoiningPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isIntern = params.job_type === 'Internship';

    const pickPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhoto(result.assets[0]);
        }
    };

    const pickDocument = async (docNum: 1 | 2) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                if (docNum === 1) {
                    setDocument1(result.assets[0]);
                } else {
                    setDocument2(result.assets[0]);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-GB');
    };

    const validateForm = () => {
        if (!firstName.trim()) return 'First name is required';
        if (!lastName.trim()) return 'Last name is required';
        if (!username.trim()) return 'Username is required';
        if (username.length < 4) return 'Username must be at least 4 characters';
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password !== confirmPassword) return 'Passwords do not match';
        if (!gender) return 'Gender is required';
        if (!dob) return 'Date of birth is required';
        if (!joiningDate) return 'Joining date is required';
        if (isIntern && !endDate) return 'End date is required for internship';
        if (!address.trim()) return 'Address is required';
        if (!mobile.trim()) return 'Mobile number is required';
        if (!document1Type) return 'Document 1 type is required';
        if (!document1) return 'Document 1 file is required';
        if (document1Type === 'other' && !document1OtherName.trim()) return 'Please specify Document 1 type';
        if (!document2Type) return 'Document 2 type is required';
        if (!document2) return 'Document 2 file is required';
        if (document2Type === 'other' && !document2OtherName.trim()) return 'Please specify Document 2 type';
        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('verification_token', params.verification_token!);
            formData.append('first_name', firstName.trim());
            formData.append('last_name', lastName.trim());
            formData.append('username', username.trim());
            formData.append('password', password);
            formData.append('confirm_password', confirmPassword);
            formData.append('gender', gender);
            formData.append('dob', dob!.toISOString().split('T')[0]);
            formData.append('joining_date', joiningDate!.toISOString().split('T')[0]);
            if (endDate) {
                formData.append('end_date', endDate.toISOString().split('T')[0]);
            }
            formData.append('address', address.trim());
            formData.append('mobile', mobile.trim());
            formData.append('document1_type', document1Type);
            if (document1OtherName) {
                formData.append('document1_other_name', document1OtherName.trim());
            }
            formData.append('document2_type', document2Type);
            if (document2OtherName) {
                formData.append('document2_other_name', document2OtherName.trim());
            }

            // Add files
            if (photo) {
                formData.append('photo', {
                    uri: photo.uri,
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            formData.append('document1', {
                uri: document1.uri,
                name: document1.name || 'document1.pdf',
                type: document1.mimeType || 'application/pdf',
            } as any);

            formData.append('document2', {
                uri: document2.uri,
                name: document2.name || 'document2.pdf',
                type: document2.mimeType || 'application/pdf',
            } as any);

            const response = await hireService.submitRegistration(formData);

            if (response.success) {
                router.replace({
                    pathname: '/hire-pending',
                    params: { verification_token: response.verification_token },
                });
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error
                || error.response?.data?.username?.[0]
                || 'Registration failed. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#1A0B2E" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <LinearGradient
                    colors={['#1A0B2E', '#2D1545', '#3E1F5C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradient}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Complete Registration</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Job Info */}
                        <View style={styles.jobInfoCard}>
                            <Text style={styles.jobTitle}>{params.designation}</Text>
                            <View style={styles.jobTypeBadge}>
                                <Text style={styles.jobTypeText}>{params.job_type}</Text>
                            </View>
                        </View>

                        {/* Photo Upload */}
                        <Text style={styles.sectionTitle}>Profile Photo</Text>
                        <TouchableOpacity style={styles.photoUpload} onPress={pickPhoto}>
                            {photo ? (
                                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#8B5CF6" />
                                    <Text style={styles.photoText}>Upload Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Personal Details */}
                        <Text style={styles.sectionTitle}>Personal Details</Text>

                        <View style={styles.row}>
                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="First Name *"
                                    placeholderTextColor="#6B7280"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Last Name *"
                                    placeholderTextColor="#6B7280"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Username *"
                                placeholderTextColor="#6B7280"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password * (min 8 characters)"
                                placeholderTextColor="#6B7280"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password *"
                                placeholderTextColor="#6B7280"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Email (prefilled, disabled) */}
                        <View style={[styles.inputWrapper, styles.disabledInput]}>
                            <Ionicons name="mail" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                value={params.email}
                                editable={false}
                            />
                        </View>

                        {/* Gender */}
                        <View style={styles.genderContainer}>
                            <Text style={styles.label}>Gender *</Text>
                            <View style={styles.genderButtons}>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                                    onPress={() => setGender('male')}
                                >
                                    <Ionicons name="male" size={20} color={gender === 'male' ? '#fff' : '#8B5CF6'} />
                                    <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                                    onPress={() => setGender('female')}
                                >
                                    <Ionicons name="female" size={20} color={gender === 'female' ? '#fff' : '#8B5CF6'} />
                                    <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date Fields */}
                        <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDobPicker(true)}>
                            <Ionicons name="calendar" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                            <Text style={dob ? styles.inputText : styles.placeholderText}>
                                {dob ? formatDate(dob) : 'Date of Birth *'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowJoiningPicker(true)}>
                            <Ionicons name="calendar" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                            <Text style={joiningDate ? styles.inputText : styles.placeholderText}>
                                {joiningDate ? formatDate(joiningDate) : 'Joining Date *'}
                            </Text>
                        </TouchableOpacity>

                        {isIntern && (
                            <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowEndPicker(true)}>
                                <Ionicons name="calendar" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                                <Text style={endDate ? styles.inputText : styles.placeholderText}>
                                    {endDate ? formatDate(endDate) : 'Internship End Date *'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Address *"
                                placeholderTextColor="#6B7280"
                                value={address}
                                onChangeText={setAddress}
                                multiline
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="call" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mobile Number *"
                                placeholderTextColor="#6B7280"
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Documents */}
                        <Text style={styles.sectionTitle}>Documents (Required)</Text>

                        {/* Document 1 */}
                        <View style={styles.documentSection}>
                            <Text style={styles.label}>Document 1 *</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={document1Type}
                                    onValueChange={(value: string) => setDocument1Type(value)}
                                    style={styles.picker}
                                    dropdownIconColor="#8B5CF6"
                                >
                                    {DOCUMENT_TYPES.map((type) => (
                                        <Picker.Item key={type.value} label={type.label} value={type.value} color="#fff" />
                                    ))}
                                </Picker>
                            </View>
                            {document1Type === 'other' && (
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Specify document type *"
                                        placeholderTextColor="#6B7280"
                                        value={document1OtherName}
                                        onChangeText={setDocument1OtherName}
                                    />
                                </View>
                            )}
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(1)}>
                                <Ionicons name="cloud-upload" size={20} color="#8B5CF6" />
                                <Text style={styles.uploadButtonText}>
                                    {document1 ? document1.name : 'Upload Document 1'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Document 2 */}
                        <View style={styles.documentSection}>
                            <Text style={styles.label}>Document 2 *</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={document2Type}
                                    onValueChange={(value: string) => setDocument2Type(value)}
                                    style={styles.picker}
                                    dropdownIconColor="#8B5CF6"
                                >
                                    {DOCUMENT_TYPES.map((type) => (
                                        <Picker.Item key={type.value} label={type.label} value={type.value} color="#fff" />
                                    ))}
                                </Picker>
                            </View>
                            {document2Type === 'other' && (
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Specify document type *"
                                        placeholderTextColor="#6B7280"
                                        value={document2OtherName}
                                        onChangeText={setDocument2OtherName}
                                    />
                                </View>
                            )}
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(2)}>
                                <Ionicons name="cloud-upload" size={20} color="#8B5CF6" />
                                <Text style={styles.uploadButtonText}>
                                    {document2 ? document2.name : 'Upload Document 2'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#6D376D', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>
                                    {isLoading ? 'Submitting...' : 'Submit Registration'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Date Pickers */}
                    {showDobPicker && (
                        <DateTimePicker
                            value={dob || new Date(2000, 0, 1)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                                setShowDobPicker(false);
                                if (date) setDob(date);
                            }}
                        />
                    )}
                    {showJoiningPicker && (
                        <DateTimePicker
                            value={joiningDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowJoiningPicker(false);
                                if (date) setJoiningDate(date);
                            }}
                        />
                    )}
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display="default"
                            minimumDate={joiningDate || new Date()}
                            onChange={(event, date) => {
                                setShowEndPicker(false);
                                if (date) setEndDate(date);
                            }}
                        />
                    )}
                </LinearGradient>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    jobInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    jobTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
    jobTypeBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    jobTypeText: { fontSize: 12, color: '#8B5CF6', fontWeight: '500' },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
        marginTop: 8,
    },
    photoUpload: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    photoPreview: { width: 100, height: 100, borderRadius: 50 },
    photoPlaceholder: { alignItems: 'center' },
    photoText: { fontSize: 12, color: '#8B5CF6', marginTop: 4 },
    row: { flexDirection: 'row', gap: 12 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(109, 55, 109, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        marginBottom: 12,
    },
    disabledInput: { opacity: 0.6 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
    inputText: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
    placeholderText: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#6B7280' },
    label: { fontSize: 14, color: '#9CA3AF', marginBottom: 8 },
    genderContainer: { marginBottom: 12 },
    genderButtons: { flexDirection: 'row', gap: 12 },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    genderButtonActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    genderText: { fontSize: 15, color: '#8B5CF6', fontWeight: '500' },
    genderTextActive: { color: '#fff' },
    documentSection: { marginBottom: 16 },
    pickerWrapper: {
        backgroundColor: 'rgba(109, 55, 109, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        marginBottom: 8,
        overflow: 'hidden',
    },
    picker: { color: '#fff', height: 50 },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    uploadButtonText: { color: '#8B5CF6', fontSize: 14, fontWeight: '500' },
    submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
    buttonDisabled: { opacity: 0.5 },
    submitGradient: { paddingVertical: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
