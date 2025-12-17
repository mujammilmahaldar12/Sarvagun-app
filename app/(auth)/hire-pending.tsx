/**
 * Hire Pending Screen
 * Confirmation screen after registration - waiting for approval
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { hireService, StatusCheckResponse } from '@/services/hire.service';

export default function HirePendingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ verification_token: string }>();

    const [status, setStatus] = useState<StatusCheckResponse | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const checkStatus = async () => {
        if (!params.verification_token) return;

        try {
            const response = await hireService.checkStatus(params.verification_token);
            setStatus(response);

            // If approved, redirect to login
            if (response.status === 'approved') {
                router.replace('/login');
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    // Auto-refresh every 30 seconds
    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(checkStatus, 30000);
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = async () => {
        setIsRefreshing(true);
        await checkStatus();
        setIsRefreshing(false);
    };

    const getStatusContent = () => {
        switch (status?.status) {
            case 'pending':
                return {
                    icon: 'hourglass',
                    title: 'Registration Submitted!',
                    subtitle: 'Your registration is under review. We will notify you once it\'s approved.',
                    color: '#F59E0B',
                };
            case 'approved':
                return {
                    icon: 'checkmark-circle',
                    title: 'Congratulations!',
                    subtitle: 'Your account has been approved. You can now login.',
                    color: '#10B981',
                };
            case 'rejected':
                return {
                    icon: 'close-circle',
                    title: 'Registration Not Approved',
                    subtitle: status.rejection_reason || 'Please contact HR for more information.',
                    color: '#EF4444',
                };
            default:
                return {
                    icon: 'information-circle',
                    title: 'Checking Status...',
                    subtitle: 'Please wait while we check your registration status.',
                    color: '#8B5CF6',
                };
        }
    };

    const content = getStatusContent();

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#1A0B2E" />
            <LinearGradient
                colors={['#1A0B2E', '#2D1545', '#3E1F5C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor="#8B5CF6"
                        />
                    }
                >
                    <View style={styles.content}>
                        {/* Status Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: `${content.color}20` }]}>
                            <Ionicons name={content.icon as any} size={80} color={content.color} />
                        </View>

                        {/* Status Title */}
                        <Text style={styles.title}>{content.title}</Text>
                        <Text style={styles.subtitle}>{content.subtitle}</Text>

                        {/* Status Details */}
                        {status?.status === 'pending' && (
                            <View style={styles.infoCard}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="time" size={20} color="#8B5CF6" />
                                    <Text style={styles.infoText}>
                                        Submitted: {status.submitted_at ? new Date(status.submitted_at).toLocaleDateString() : 'Just now'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="notifications" size={20} color="#8B5CF6" />
                                    <Text style={styles.infoText}>
                                        You'll receive a notification when approved
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="refresh" size={20} color="#8B5CF6" />
                                    <Text style={styles.infoText}>
                                        Pull down to refresh status
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Actions */}
                        {status?.status === 'approved' && (
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => router.replace('/login')}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>Go to Login</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {status?.status === 'rejected' && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => router.replace('/new-user')}
                            >
                                <Text style={styles.retryText}>Try Again</Text>
                            </TouchableOpacity>
                        )}

                        {/* Back to Login Link */}
                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => router.replace('/login')}
                        >
                            <Text style={styles.backLinkText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    infoCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#D1D5DB',
    },
    loginButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 16,
    },
    retryText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    backLink: {
        marginTop: 16,
    },
    backLinkText: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '500',
    },
});
