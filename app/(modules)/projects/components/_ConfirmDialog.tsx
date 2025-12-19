/**
 * ConfirmDialog Component
 * Custom confirmation dialog that works properly on Android
 * Replacement for Alert.alert which has callback issues
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
    icon?: any;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    confirmColor,
    onConfirm,
    onCancel,
    icon = 'trash-outline',
}) => {
    const { theme } = useTheme();
    const buttonColor = confirmColor || theme.error;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: theme.surface }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: buttonColor + '20' }]}>
                        <Ionicons name={icon} size={32} color={buttonColor} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: theme.textSecondary }]}>
                        {message}
                    </Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={[styles.button, styles.cancelButton, { backgroundColor: theme.border }]}
                        >
                            <Text style={[styles.buttonText, { color: theme.text }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                onConfirm();
                                onCancel(); // Close dialog after confirm
                            }}
                            style={[styles.button, styles.confirmButton, { backgroundColor: buttonColor }]}
                        >
                            <Text style={[styles.buttonText, styles.confirmButtonText]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    dialog: {
        width: '100%',
        maxWidth: 400,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        fontSize: typography.sizes.base,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        // Styled via backgroundColor prop
    },
    confirmButton: {
        // Styled via backgroundColor prop
    },
    buttonText: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
    },
});

export default ConfirmDialog;
