/**
 * New User Verification Screen
 * Step 1: Verify candidate identity before OTP
 */
import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { hireService } from '@/services/hire.service';

export default function NewUserScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fadeAnim = useSharedValue(1);

    const handleVerify = async () => {
        if (!fullName.trim() || !email.trim() || !phone.trim()) {
            Alert.alert('Required', 'Please fill in all fields');
            return;
        }

        // Basic email validation
        if (!email.includes('@') || !email.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        // Phone validation (at least 10 digits)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid phone number');
            return;
        }

        setIsLoading(true);

        try {
            const response = await hireService.verifyCandidate({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
            });

            if (response.success) {
                // Navigate to OTP screen with verification token
                router.push({
                    pathname: '/verify-otp',
                    params: {
                        verification_token: response.verification_token,
                        email_masked: response.email_masked,
                        job_title: response.job_title,
                        job_type: response.job_type,
                    },
                });
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            const errorMessage = error.response?.data?.email?.[0]
                || error.response?.data?.full_name?.[0]
                || error.response?.data?.phone?.[0]
                || error.response?.data?.error
                || 'Verification failed. Please check your details.';
            Alert.alert('Verification Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
    }));

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
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View style={[styles.content, containerStyle]}>
                            {/* Header */}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>

                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['#6D376D', '#8B5CF6']}
                                    style={styles.iconGradient}
                                >
                                    <Ionicons name="person-add" size={40} color="#fff" />
                                </LinearGradient>
                            </View>

                            {/* Title */}
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Welcome New User!</Text>
                                <Text style={styles.subtitle}>
                                    Verify your identity to complete onboarding
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.formContainer}>
                                {/* Full Name */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color="#9CA3AF"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name (as in application)"
                                        placeholderTextColor="#6B7280"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />
                                </View>

                                {/* Email */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color="#9CA3AF"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor="#6B7280"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        editable={!isLoading}
                                    />
                                </View>

                                {/* Phone */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="call-outline"
                                        size={20}
                                        color="#9CA3AF"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Phone Number"
                                        placeholderTextColor="#6B7280"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        editable={!isLoading}
                                    />
                                </View>

                                {/* Info Text */}
                                <Text style={styles.infoText}>
                                    Enter the same details you used in your job application.
                                    We'll verify your identity before proceeding.
                                </Text>

                                {/* Verify Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        (isLoading || !fullName || !email || !phone) && styles.buttonDisabled,
                                    ]}
                                    onPress={handleVerify}
                                    disabled={isLoading || !fullName || !email || !phone}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#6D376D', '#8B5CF6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        {isLoading ? (
                                            <View style={styles.buttonContent}>
                                                <Ionicons name="sync" size={18} color="#fff" />
                                                <Text style={styles.buttonText}>Verifying...</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.buttonContent}>
                                                <Text style={styles.buttonText}>Verify & Continue</Text>
                                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Back to Login */}
                                <TouchableOpacity
                                    style={styles.loginLink}
                                    onPress={() => router.replace('/login')}
                                >
                                    <Text style={styles.loginLinkText}>
                                        Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(109, 55, 109, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    infoText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 10,
        marginTop: 8,
    },
    button: {
        marginTop: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    loginLinkText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    loginLinkBold: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
});
