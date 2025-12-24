/**
 * SuccessDialog Component
 * Custom success dialog that works properly on Android
 * Replacement for Alert.alert which has callback issues
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

interface SuccessDialogProps {
    visible: boolean;
    title: string;
    message: string;
    buttonText?: string;
    onConfirm: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
    visible,
    title,
    message,
    buttonText = 'Done',
    onConfirm,
    icon = 'checkmark-circle',
}) => {
    const { theme } = useTheme();
    const successColor = '#10B981'; // Green color for success

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onConfirm}
        >
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: theme.surface }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: successColor + '20' }]}>
                        <Ionicons name={icon} size={48} color={successColor} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: theme.textSecondary }]}>
                        {message}
                    </Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={onConfirm}
                        style={[styles.button, { backgroundColor: successColor }]}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
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
        maxWidth: 340,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
    button: {
        width: '100%',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
        color: '#fff',
    },
});

export default SuccessDialog;
