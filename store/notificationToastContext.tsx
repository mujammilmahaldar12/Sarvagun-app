/**
 * Global Notification Toast Context
 * Shows in-app popup notifications when push notifications arrive while app is in foreground
 * Works like Swiggy/Uber - shows banner at top of screen
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle } from '@/utils/styleHelpers';
import { useRouter } from 'expo-router';

// Import push notification context to observe foreground notifications
// Use a dynamic check to avoid circular dependencies
let usePushNotificationsFromContext: (() => { foregroundNotification: any; clearForegroundNotification: () => void }) | null = null;
try {
    const pushContext = require('@/store/pushNotificationContext');
    usePushNotificationsFromContext = pushContext.usePushNotifications;
} catch {
    // Ignore if not available - this prevents circular dependency issues
}
export type NotificationToastType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'event' | 'leave' | 'announcement';

interface NotificationToast {
    id: string;
    title: string;
    message: string;
    type: NotificationToastType;
    actionUrl?: string;
    data?: Record<string, any>;
}

interface NotificationToastContextType {
    showNotification: (toast: Omit<NotificationToast, 'id'>) => void;
    hideNotification: () => void;
}

const NotificationToastContext = createContext<NotificationToastContextType | undefined>(undefined);

// Get icon based on notification type
const getNotificationIcon = (type: NotificationToastType): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<NotificationToastType, keyof typeof Ionicons.glyphMap> = {
        info: 'information-circle',
        success: 'checkmark-circle',
        warning: 'warning',
        error: 'close-circle',
        task: 'checkbox',
        event: 'calendar',
        leave: 'calendar-outline',
        announcement: 'megaphone',
    };
    return iconMap[type] || 'notifications';
};

// Get color based on notification type
const getNotificationColor = (type: NotificationToastType): string => {
    const colorMap: Record<NotificationToastType, string> = {
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        task: '#8B5CF6',
        event: '#6366F1',
        leave: '#14B8A6',
        announcement: '#EC4899',
    };
    return colorMap[type] || '#3B82F6';
};

interface NotificationToastProviderProps {
    children: ReactNode;
}

export function NotificationToastProvider({ children }: NotificationToastProviderProps) {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const [toast, setToast] = useState<NotificationToast | null>(null);

    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showNotification = useCallback((notification: Omit<NotificationToast, 'id'>) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Create new toast with unique id
        const newToast: NotificationToast = {
            ...notification,
            id: Date.now().toString(),
        };

        setToast(newToast);

        // Animate in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-hide after 5 seconds
        timeoutRef.current = setTimeout(() => {
            hideNotification();
        }, 5000);
    }, []);

    const hideNotification = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setToast(null);
        });

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handlePress = useCallback(() => {
        if (toast?.actionUrl) {
            hideNotification();
            router.push(toast.actionUrl as any);
        }
    }, [toast, router, hideNotification]);

    const handleDismiss = useCallback(() => {
        hideNotification();
    }, [hideNotification]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const color = toast ? getNotificationColor(toast.type) : '#3B82F6';
    const icon = toast ? getNotificationIcon(toast.type) : 'notifications';

    return (
        <NotificationToastContext.Provider value={{ showNotification, hideNotification }}>
            {children}

            {/* Toast Overlay */}
            {toast && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                            borderLeftColor: color,
                            transform: [{ translateY }],
                            opacity,
                            ...getShadowStyle('xl'),
                        },
                    ]}
                    pointerEvents="box-none"
                >
                    <Pressable
                        style={styles.content}
                        onPress={handlePress}
                    >
                        {/* Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                            <Ionicons name={icon} size={24} color={color} />
                        </View>

                        {/* Text Content */}
                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.title,
                                    getTypographyStyle('sm', 'bold'),
                                    { color: theme.text }
                                ]}
                                numberOfLines={1}
                            >
                                {toast.title}
                            </Text>
                            <Text
                                style={[
                                    styles.message,
                                    getTypographyStyle('xs', 'regular'),
                                    { color: theme.textSecondary }
                                ]}
                                numberOfLines={2}
                            >
                                {toast.message}
                            </Text>
                        </View>

                        {/* Dismiss Button */}
                        <Pressable
                            style={styles.dismissButton}
                            onPress={handleDismiss}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={18} color={theme.textSecondary} />
                        </Pressable>
                    </Pressable>

                    {/* Tap to view indicator */}
                    {toast.actionUrl && (
                        <View style={styles.actionHint}>
                            <Text style={[styles.actionText, { color: color }]}>
                                Tap to view
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </NotificationToastContext.Provider>
    );
}

/**
 * Hook to show in-app notification toasts
 */
export function useNotificationToast(): NotificationToastContextType {
    const context = useContext(NotificationToastContext);

    if (context === undefined) {
        throw new Error('useNotificationToast must be used within a NotificationToastProvider');
    }

    return context;
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: spacing.md,
        right: spacing.md,
        borderRadius: borderRadius.lg,
        borderLeftWidth: 4,
        zIndex: 99999,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        gap: spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 14,
    },
    message: {
        fontSize: 12,
        lineHeight: 16,
    },
    dismissButton: {
        padding: spacing.xs,
    },
    actionHint: {
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.xs,
        alignItems: 'flex-end',
    },
    actionText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default NotificationToastContext;
