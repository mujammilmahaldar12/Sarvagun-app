import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { ModuleHeader } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useCreateProject } from '@/hooks/useProjectQueries';
import { Toast, useToast } from '@/components/ui/Toast';

const { spacing, borderRadius, typography } = designSystem;

export default function CreateProjectScreen() {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed'>('On Track');
  const [starred, setStarred] = useState(false);

  const createProjectMutation = useCreateProject();

  const statusOptions: ('On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed')[] = [
    'On Track',
    'At Risk',
    'Off Track',
    'On Hold',
    'Completed'
  ];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'On Track': return theme.success;
      case 'At Risk': return theme.warning;
      case 'Off Track': return theme.error;
      case 'On Hold': return theme.textSecondary;
      case 'Completed': return theme.primary;
      default: return theme.textSecondary;
    }
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Please enter a project name');
      return;
    }

    try {
      const newProject = await createProjectMutation.mutateAsync({
        project_name: projectName.trim(),
        description: description.trim(),
        status,
        starred
      });

      // Show success toast
      showToast('Project created successfully! 🎉', 'success');

      // Navigate back to projects screen after a short delay
      setTimeout(() => {
        router.replace('/projects');
      }, 500);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create project');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ModuleHeader title="Create Project" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {/* Project Name */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: '600',
            color: theme.text,
            marginBottom: spacing.sm
          }}>
            Project Name *
          </Text>
          <TextInput
            placeholder="Enter project name"
            value={projectName}
            onChangeText={setProjectName}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              fontSize: typography.sizes.base,
              color: theme.text,
              backgroundColor: theme.surface
            }}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Description */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: '600',
            color: theme.text,
            marginBottom: spacing.sm
          }}>
            Description
          </Text>
          <TextInput
            placeholder="Enter project description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              fontSize: typography.sizes.base,
              color: theme.text,
              backgroundColor: theme.surface,
              textAlignVertical: 'top'
            }}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Status */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: '600',
            color: theme.text,
            marginBottom: spacing.sm
          }}>
            Status
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.md,
                  backgroundColor: status === s ? getStatusColor(s) : theme.surface,
                  borderWidth: 1,
                  borderColor: getStatusColor(s)
                }}
              >
                <Text style={{
                  fontSize: typography.sizes.sm,
                  color: status === s ? '#fff' : getStatusColor(s),
                  fontWeight: status === s ? '600' : '400'
                }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Starred */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          backgroundColor: theme.surface,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: spacing.xl
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="star-outline" size={20} color={theme.text} />
            <Text style={{ fontSize: typography.sizes.base, color: theme.text }}>
              Mark as Important
            </Text>
          </View>
          <TouchableOpacity onPress={() => setStarred(!starred)}>
            <Ionicons
              name={starred ? 'star' : 'star-outline'}
              size={28}
              color={starred ? '#F59E0B' : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createProjectMutation.isPending || !projectName.trim()}
          style={{
            backgroundColor: (!createProjectMutation.isPending && projectName.trim())
              ? theme.primary
              : theme.border,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center'
          }}
        >
          <Text style={{
            color: (!createProjectMutation.isPending && projectName.trim())
              ? '#fff'
              : theme.textSecondary,
            fontSize: typography.sizes.base,
            fontWeight: '600'
          }}>
            {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginTop: spacing.lg,
          borderWidth: 1,
          borderColor: theme.border
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: '600',
              color: theme.text
            }}>
              Project Tips
            </Text>
          </View>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20
          }}>
            • After creating a project, you can add sections to organize tasks{'\n'}
            • Each section can contain multiple tasks{'\n'}
            • Projects help you track progress across different work areas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
