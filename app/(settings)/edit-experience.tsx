import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useUserProjects, useMyProfile } from '@/hooks/useHRQueries'; // Note: Assuming useUserExperience exists or needs to be added to hooks
import hrService from '@/services/hr.service';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function EditExperienceScreen() {
    const { theme } = useTheme();
    // Using direct query since the hook might not be exported yet in useHRQueries
    const { data: user } = useMyProfile();
    const userId = user?.id;

    const { data: experience, isLoading, refetch } = useQuery({
        queryKey: ['hr', 'userProfile', 'experience', userId],
        queryFn: () => hrService.getUserExperience(userId!),
        enabled: !!userId,
    });

    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newExp, setNewExp] = useState({
        company: '',
        role: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false,
    });

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Experience',
            'Are you sure you want to delete this experience?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await hrService.deleteExperience(id);
                            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'experience'] });
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete experience');
                        }
                    }
                }
            ]
        );
    };

    const handleAdd = async () => {
        if (!newExp.company || !newExp.role || !newExp.start_date) {
            Alert.alert('Error', 'Please fill in required fields (Company, Role, Start Date)');
            return;
        }

        try {
            setIsSubmitting(true);
            await hrService.createExperience({
                company: newExp.company,
                role: newExp.role,
                start_date: newExp.start_date, // Ensuring YYYY-MM-DD format from input
                end_date: newExp.is_current ? null : newExp.end_date,
                description: newExp.description,
                is_current: newExp.is_current,
            });

            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'experience'] });
            refetch();
            setIsAdding(false);
            setNewExp({ company: '', role: '', start_date: '', end_date: '', description: '', is_current: false });
            Alert.alert('Success', 'Experience added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add experience. Ensure dates are YYYY-MM-DD.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ExperienceItem = ({ item }: { item: any }) => (
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
                        {item.role}
                    </Text>
                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.primary, marginTop: 2 }}>
                        {item.company}
                    </Text>
                    <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, marginTop: 4 }}>
                        {item.start_date} - {item.is_current ? 'Present' : item.end_date}
                    </Text>
                    {item.description ? (
                        <Text style={{ ...getTypographyStyle('sm'), color: theme.text, marginTop: 8 }}>
                            {item.description}
                        </Text>
                    ) : null}
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
            <ModuleHeader title="Edit Experience" showBack />

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {experience?.map((item: any) => (
                            <ExperienceItem key={item.id} item={item} />
                        ))}

                        {experience?.length === 0 && (
                            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                                No experience added yet.
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
                        Add New Experience
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
                        <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Add Experience</Text>
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
                                Role / Title
                            </Text>
                            <TextInput
                                value={newExp.role}
                                onChangeText={(text) => setNewExp({ ...newExp, role: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Senior Developer"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Company
                            </Text>
                            <TextInput
                                value={newExp.company}
                                onChangeText={(text) => setNewExp({ ...newExp, company: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Acme Corp"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                    Start Date
                                </Text>
                                <TextInput
                                    value={newExp.start_date}
                                    onChangeText={(text) => setNewExp({ ...newExp, start_date: text })}
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
                                    End Date
                                </Text>
                                <TextInput
                                    value={newExp.end_date}
                                    onChangeText={(text) => setNewExp({ ...newExp, end_date: text })}
                                    editable={!newExp.is_current}
                                    style={{
                                        backgroundColor: newExp.is_current ? theme.background : theme.surface,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        borderRadius: 8,
                                        padding: 12,
                                        color: newExp.is_current ? theme.textSecondary : theme.text,
                                        ...getTypographyStyle('base'),
                                    }}
                                    placeholder={newExp.is_current ? "Present" : "YYYY-MM-DD"}
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <Switch
                                value={newExp.is_current}
                                onValueChange={(val) => setNewExp({ ...newExp, is_current: val, end_date: val ? '' : newExp.end_date })}
                                trackColor={{ false: theme.border, true: theme.primary }}
                            />
                            <Text style={{ marginLeft: 10, ...getTypographyStyle('base'), color: theme.text }}>
                                I currently work here
                            </Text>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Description
                            </Text>
                            <TextInput
                                value={newExp.description}
                                onChangeText={(text) => setNewExp({ ...newExp, description: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    height: 100,
                                    textAlignVertical: 'top',
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="Describe your role and achievements..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
