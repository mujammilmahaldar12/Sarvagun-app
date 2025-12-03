import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

interface AddProjectModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, description: string) => void;
    isEdit?: boolean;
    initialName?: string;
    initialDescription?: string;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
    visible,
    onClose,
    onAdd,
    isEdit = false,
    initialName = '',
    initialDescription = ''
}) => {
    const { theme } = useTheme();
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);

    // Update state when props change
    React.useEffect(() => {
        if (visible) {
            setName(initialName);
            setDescription(initialDescription);
        }
    }, [visible, initialName, initialDescription]);

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('Validation', 'Please enter project name');
            return;
        }
        onAdd(name, description);
        setName('');
        setDescription('');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {isEdit ? 'Edit Project' : 'Create New Project'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Project Name</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: theme.border
                                }]}
                                placeholder="Enter project name"
                                placeholderTextColor={theme.textTertiary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: theme.border,
                                    minHeight: 80,
                                    textAlignVertical: 'top'
                                }]}
                                placeholder="Enter project description"
                                placeholderTextColor={theme.textTertiary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>
                                {isEdit ? 'Update Project' : 'Create Project'}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg
    },
    modalContent: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        maxHeight: '80%'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1
    },
    title: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold'
    },
    body: {
        padding: spacing.lg
    },
    inputGroup: {
        marginBottom: spacing.lg
    },
    label: {
        fontSize: typography.sizes.sm,
        marginBottom: spacing.xs,
        fontWeight: '500'
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.sizes.base
    },
    submitButton: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.sm
    },
    submitButtonText: {
        color: '#fff',
        fontSize: typography.sizes.base,
        fontWeight: '600'
    }
});
