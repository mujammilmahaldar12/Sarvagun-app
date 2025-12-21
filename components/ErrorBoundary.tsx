import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius } = designSystem;

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('❌ Error Boundary caught an error:', error);
        console.error('Error Info:', errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // TODO: Send to error tracking service (Sentry, Crashlytics, etc.)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        {/* Error Icon */}
                        <View style={styles.iconContainer}>
                            <Ionicons name="alert-circle" size={64} color="#EF4444" />
                        </View>

                        {/* Error Title */}
                        <Text style={styles.title}>Oops! Something went wrong</Text>

                        {/* Error Message */}
                        <Text style={styles.message}>
                            {this.props.fallbackMessage ||
                                "We're sorry, but something unexpected happened. Please try again."}
                        </Text>

                        {/* Error Details (only in dev) */}
                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details:</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                                {this.state.errorInfo && (
                                    <>
                                        <Text style={styles.errorTitle}>Component Stack:</Text>
                                        <Text style={styles.errorText}>
                                            {this.state.errorInfo.componentStack}
                                        </Text>
                                    </>
                                )}
                            </ScrollView>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.primaryButton} onPress={this.handleReset}>
                                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    content: {
        maxWidth: 500,
        width: '100%',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    errorDetails: {
        maxHeight: 200,
        width: '100%',
        backgroundColor: '#FEF2F2',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    errorText: {
        fontSize: 12,
        color: '#DC2626',
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
