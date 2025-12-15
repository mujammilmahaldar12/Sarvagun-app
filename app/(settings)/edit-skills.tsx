import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useUserSkills, useMyProfile } from '@/hooks/useHRQueries';
import hrService from '@/services/hr.service';
import { useQueryClient } from '@tanstack/react-query';

export default function EditSkillsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: user } = useMyProfile();
    const { data: skills, isLoading, refetch } = useUserSkills(user?.id || 0);

    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newSkill, setNewSkill] = useState({
        name: '',
        category: 'technical',
        level: 3,
    });

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Skill',
            'Are you sure you want to delete this skill?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await hrService.deleteSkill(id);
                            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'skills'] });
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete skill');
                        }
                    }
                }
            ]
        );
    };

    const handleAdd = async () => {
        if (!newSkill.name.trim()) {
            Alert.alert('Error', 'Please enter a skill name');
            return;
        }

        try {
            setIsSubmitting(true);
            await hrService.createSkill({
                name: newSkill.name,
                category: newSkill.category as any,
                level: newSkill.level as any,
            });

            queryClient.invalidateQueries({ queryKey: ['hr', 'userProfile', 'skills'] });
            refetch();
            setIsAdding(false);
            setNewSkill({ name: '', category: 'technical', level: 3 });
            Alert.alert('Success', 'Skill added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add skill');
        } finally {
            setIsSubmitting(false);
        }
    };

    const SkillItem = ({ skill }: { skill: any }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: theme.surface,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.primary + '10',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}
            >
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.primary }}>
                    {skill.level}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
                    {skill.name}
                </Text>
                <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, textTransform: 'capitalize' }}>
                    {skill.category}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDelete(skill.id)}
                style={{ padding: 8 }}
            >
                <Ionicons name="trash-outline" size={20} color={theme.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Edit Skills" showBack />

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {skills?.map((skill: any) => (
                            <SkillItem key={skill.id} skill={skill} />
                        ))}

                        {skills?.length === 0 && (
                            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                                No skills added yet.
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
                        Add New Skill
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
                        <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Add Skill</Text>
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
                                Skill Name
                            </Text>
                            <TextInput
                                value={newSkill.name}
                                onChangeText={(text) => setNewSkill({ ...newSkill, name: text })}
                                style={{
                                    backgroundColor: theme.surface,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: theme.text,
                                    ...getTypographyStyle('base'),
                                }}
                                placeholder="e.g. React Native"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Category
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {['technical', 'soft', 'domain'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setNewSkill({ ...newSkill, category: cat })}
                                        style={{
                                            flex: 1,
                                            padding: 12,
                                            alignItems: 'center',
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: newSkill.category === cat ? theme.primary : theme.border,
                                            backgroundColor: newSkill.category === cat ? theme.primary + '10' : theme.surface,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: newSkill.category === cat ? theme.primary : theme.textSecondary,
                                                textTransform: 'capitalize',
                                                fontWeight: newSkill.category === cat ? '600' : '400',
                                            }}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
                                Level (1-5)
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                    <TouchableOpacity
                                        key={lvl}
                                        onPress={() => setNewSkill({ ...newSkill, level: lvl })}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: newSkill.level === lvl ? theme.primary : theme.border,
                                            backgroundColor: newSkill.level === lvl ? theme.primary : theme.surface,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: newSkill.level === lvl ? theme.textInverse : theme.text,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {lvl}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ textAlign: 'center', marginTop: 10, color: theme.textSecondary, ...getTypographyStyle('sm') }}>
                                {newSkill.level === 1 ? 'Beginner' : newSkill.level === 3 ? 'Intermediate' : newSkill.level === 5 ? 'Expert' : ''}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
