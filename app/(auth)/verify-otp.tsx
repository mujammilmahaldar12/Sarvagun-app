/**
 * OTP Verification Screen
 * Step 2: Verify OTP sent to candidate's email
 */
import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { hireService } from '@/services/hire.service';

export default function VerifyOTPScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        verification_token: string;
        email_masked: string;
        job_title: string;
        job_type: string;
    }>();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const shakeAnim = useSharedValue(0);

    // Send OTP on mount
    useEffect(() => {
        sendOTP();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendOTP = async () => {
        if (!params.verification_token) return;

        setIsSending(true);
        try {
            const response = await hireService.sendOTP(params.verification_token);
            if (response.success) {
                setCountdown(60);
                Alert.alert('OTP Sent', response.message);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to send OTP';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pastedOtp = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedOtp.forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await hireService.verifyOTP(params.verification_token!, otpValue);

            if (response.success) {
                // Navigate to registration form
                router.push({
                    pathname: '/hire-register',
                    params: {
                        verification_token: response.verification_token,
                        email: response.prefill_data.email,
                        phone: response.prefill_data.phone,
                        designation: response.prefill_data.designation,
                        job_type: response.prefill_data.job_type,
                    },
                });
            }
        } catch (error: any) {
            console.error('OTP verification error:', error);
            const errorMessage = error.response?.data?.error || 'Invalid OTP';
            Alert.alert('Verification Failed', errorMessage);

            // Shake animation on error
            shakeAnim.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        } finally {
            setIsLoading(false);
        }
    };

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeAnim.value }],
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
                    <View style={styles.content}>
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
                                <Ionicons name="shield-checkmark" size={40} color="#fff" />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Verify Your Email</Text>
                            <Text style={styles.subtitle}>
                                Enter the 6-digit code sent to{'\n'}
                                <Text style={styles.emailText}>{params.email_masked}</Text>
                            </Text>
                        </View>

                        {/* Job Info */}
                        <View style={styles.jobInfo}>
                            <Text style={styles.jobTitle}>{params.job_title}</Text>
                            <View style={styles.jobTypeBadge}>
                                <Text style={styles.jobTypeText}>{params.job_type}</Text>
                            </View>
                        </View>

                        {/* OTP Input */}
                        <Animated.View style={[styles.otpContainer, shakeStyle]}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={[
                                        styles.otpInput,
                                        digit && styles.otpInputFilled,
                                    ]}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    editable={!isLoading}
                                />
                            ))}
                        </Animated.View>

                        {/* Resend */}
                        <View style={styles.resendContainer}>
                            {countdown > 0 ? (
                                <Text style={styles.countdownText}>
                                    Resend code in {countdown}s
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    onPress={sendOTP}
                                    disabled={isSending}
                                >
                                    <Text style={styles.resendText}>
                                        {isSending ? 'Sending...' : "Didn't receive code? Resend"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                (isLoading || otp.join('').length !== 6) && styles.buttonDisabled,
                            ]}
                            onPress={handleVerify}
                            disabled={isLoading || otp.join('').length !== 6}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6D376D', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
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
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
    emailText: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
    jobInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
    },
    jobTitle: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    jobTypeBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    jobTypeText: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '500',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 56,
        backgroundColor: 'rgba(109, 55, 109, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    otpInputFilled: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    countdownText: {
        fontSize: 14,
        color: '#6B7280',
    },
    resendText: {
        fontSize: 14,
        color: '#8B5CF6',
        fontWeight: '500',
    },
    button: {
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
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
