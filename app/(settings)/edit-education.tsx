import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useMyProfile } from '@/hooks/useHRQueries';
import hrService from '@/services/hr.service';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function EditEducationScreen() {
    const { theme } = useTheme();
    const { data: user } = useMyProfile();
    const userId = user?.id;

    const { data: education, isLoading, refetch } = useQuery({
        queryKey: ['hr', 'userProfile', 'education', userId],
        queryFn: () => hrService.getUserEducation(userId!),
        enabled: !!userId,
    });

    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newEdu, setNewEdu] = useState({
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        grade: '',
    });

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Education',
            'Are you sure you want to delete this education?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await hrService.deleteEducation(id);
                            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'education'] });
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete education');
                        }
                    }
                }
            ]
        );
    };

    const handleAdd = async () => {
        if (!newEdu.institution || !newEdu.degree || !newEdu.start_date) {
            Alert.alert('Error', 'Please fill in required fields (Institution, Degree, Start Date)');
            return;
        }

        try {
            setIsSubmitting(true);
            await hrService.createEducation({
                institution: newEdu.institution,
                degree: newEdu.degree,
                field_of_study: newEdu.field_of_study,
                start_date: newEdu.start_date,
                end_date: newEdu.end_date || null,
                grade: newEdu.grade,
            });

            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'education'] });
            refetch();
            setIsAdding(false);
            setNewEdu({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' });
            Alert.alert('Success', 'Education added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add education. Ensure dates are YYYY-MM-DD.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const EducationItem = ({ item }: { item: any }) => (
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
                        {item.institution}
                    </Text>
                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.primary, marginTop: 2 }}>
                        {item.degree}{item.field_of_study ? `, ${item.field_of_study}` : ''}
                    </Text>
                    <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, marginTop: 4 }}>
                        {item.start_date} - {item.end_date || 'Present'}
                    </Text>
                    {item.grade ? (
                        <Text style={{ ...getTypographyStyle('sm'), color: theme.text, marginTop: 4 }}>
                            Grade: {item.grade}
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
            <ModuleHeader title="Edit Education" showBack />

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {education?.map((item: any) => (
                            <EducationItem key={item.id} item={item} />
                        ))}

                        {education?.length === 0 && (
                            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                                No education details added yet.
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
                        Add New Education
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
                        <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Add Education</Text>
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
                                Institution / School
                            </Text>
                            <TextInput
                                value={newEdu.institution}
                                onChangeText={(text) => setNewEdu({ ...newEdu, institution: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Harvard University"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Degree
                            </Text>
                            <TextInput
                                value={newEdu.degree}
                                onChangeText={(text) => setNewEdu({ ...newEdu, degree: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Bachelor of Science"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Field of Study
                            </Text>
                            <TextInput
                                value={newEdu.field_of_study}
                                onChangeText={(text) => setNewEdu({ ...newEdu, field_of_study: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. Computer Science"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                    Start Date
                                </Text>
                                <TextInput
                                    value={newEdu.start_date}
                                    onChangeText={(text) => setNewEdu({ ...newEdu, start_date: text })}
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
                                    value={newEdu.end_date}
                                    onChangeText={(text) => setNewEdu({ ...newEdu, end_date: text })}
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
                                Grade / GPA (Optional)
                            </Text>
                            <TextInput
                                value={newEdu.grade}
                                onChangeText={(text) => setNewEdu({ ...newEdu, grade: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. 3.8/4.0 or A"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
