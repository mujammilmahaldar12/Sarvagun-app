import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useUserCertifications, useMyProfile } from '@/hooks/useHRQueries';
import hrService from '@/services/hr.service';
import { useQueryClient } from '@tanstack/react-query';

export default function EditCertificationsScreen() {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const { data: user } = useMyProfile();
    const { data: certifications, isLoading, refetch } = useUserCertifications(user?.id || 0);

    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCert, setNewCert] = useState({
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiration_date: '',
        credential_id: '',
        credential_url: '',
    });

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Certification',
            'Are you sure you want to delete this certification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await hrService.deleteCertification(id);
                            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'certifications'] });
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete certification');
                        }
                    }
                }
            ]
        );
    };

    const handleAdd = async () => {
        if (!newCert.name || !newCert.issuing_organization || !newCert.issue_date) {
            Alert.alert('Error', 'Please fill in required fields (Name, Org, Issue Date)');
            return;
        }

        try {
            setIsSubmitting(true);
            await hrService.createCertification({
                title: newCert.name, // Maps to 'title' in backend model usually, adjusted based on typical schema
                issuing_organization: newCert.issuing_organization,
                issue_date: newCert.issue_date,
                expiration_date: newCert.expiration_date || null,
                credential_id: newCert.credential_id,
                credential_url: newCert.credential_url,
            });

            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'certifications'] });
            refetch();
            setIsAdding(false);
            setNewCert({ name: '', issuing_organization: '', issue_date: '', expiration_date: '', credential_id: '', credential_url: '' });
            Alert.alert('Success', 'Certification added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add certification. Ensure dates are YYYY-MM-DD.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const CertItem = ({ item }: { item: any }) => (
        <View
            style={{
                padding: 16,
                backgroundColor: theme.surface,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>
                        {item.title}
                    </Text>
                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.primary, marginTop: 2 }}>
                        {item.issuing_organization}
                    </Text>
                    <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, marginTop: 4 }}>
                        Issued: {item.issue_date} {item.expiration_date ? `• Expires: ${item.expiration_date}` : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Edit Certifications" showBack />

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {certifications?.map((item: any) => (
                            <CertItem key={item.id} item={item} />
                        ))}

                        {certifications?.length === 0 && (
                            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                                No certifications added yet.
                            </Text>
                        )}
                    </>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface }}>
                <TouchableOpacity
                    onPress={() => setIsAdding(true)}
                    style={{
                        backgroundColor: theme.primary,
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.textInverse }}>
                        Add New Certification
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={isAdding}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAdding(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.border,
                            backgroundColor: theme.surface,
                        }}
                    >
                        <TouchableOpacity onPress={() => setIsAdding(false)}>
                            <Text style={{ color: theme.textSecondary, ...getTypographyStyle('base') }}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Add Certification</Text>
                        <TouchableOpacity onPress={handleAdd} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator color={theme.primary} />
                            ) : (
                                <Text style={{ color: theme.primary, ...getTypographyStyle('base', 'semibold') }}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Certification Name
                            </Text>
                            <TextInput
                                value={newCert.name}
                                onChangeText={(text) => setNewCert({ ...newCert, name: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. AWS Certified Solutions Architect"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Issuing Organization
                            </Text>
                            <TextInput
                                value={newCert.issuing_organization}
                                onChangeText={(text) => setNewCert({ ...newCert, issuing_organization: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Amazon Web Services"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                    Issue Date
                                </Text>
                                <TextInput
                                    value={newCert.issue_date}
                                    onChangeText={(text) => setNewCert({ ...newCert, issue_date: text })}
                                    style={{
                                        backgroundColor: theme.surface,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        borderRadius: 8,
                                        padding: 12,
                                        color: theme.text,
                                        ...getTypographyStyle('base'),
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                    Expiration Date
                                </Text>
                                <TextInput
                                    value={newCert.expiration_date}
                                    onChangeText={(text) => setNewCert({ ...newCert, expiration_date: text })}
                                    style={{
                                        backgroundColor: theme.surface,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        borderRadius: 8,
                                        padding: 12,
                                        color: theme.text,
                                        ...getTypographyStyle('base'),
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Credential ID (Optional)
                            </Text>
                            <TextInput
                                value={newCert.credential_id}
                                onChangeText={(text) => setNewCert({ ...newCert, credential_id: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="Certificate ID"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Credential URL (Optional)
                            </Text>
                            <TextInput
                                value={newCert.credential_url}
                                onChangeText={(text) => setNewCert({ ...newCert, credential_url: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="https://"
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
