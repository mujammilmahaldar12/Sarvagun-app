import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/designSystem';
import { getShadowStyle } from '@/utils/styleHelpers';
import { AnimatedPressable, ThemedDatePicker, Button } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useMyProjects, useSectionsByProject, useCreateTask } from '@/hooks/useProjectQueries';
import type { CreateTaskDTO, Priority } from '@/types/project';


const CreateTaskScreen = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<CreateTaskDTO>({
    task_title: '',
    due_date: '',
    priority_level: 'P3',
    comments: '',
    starred: false,
    project_id: 0,
    section_id: 0,
  });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Fetch projects and sections
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();
  const { data: sections = [], isLoading: sectionsLoading } = useSectionsByProject(
    selectedProjectId || 0,
    !!selectedProjectId
  );
  
  const createTaskMutation = useCreateTask();

  // Safe array handling
  const projectsList = Array.isArray(projects) ? projects : [];
  const sectionsList = Array.isArray(sections) ? sections : [];

  const priorityOptions: { label: string; value: Priority; color: string }[] = [
    { label: 'P1 - Critical', value: 'P1', color: '#EF4444' },
    { label: 'P2 - High', value: 'P2', color: '#F59E0B' },
    { label: 'P3 - Medium', value: 'P3', color: '#3B82F6' },
    { label: 'P4 - Low', value: 'P4', color: '#10B981' },
  ];

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setFormData({ ...formData, project_id: projectId, section_id: 0 });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.task_title.trim()) {
      Alert.alert('Validation', 'Please enter a task title');
      return;
    }
    if (!formData.project_id) {
      Alert.alert('Validation', 'Please select a project');
      return;
    }
    if (!formData.section_id) {
      Alert.alert('Validation', 'Please select a section');
      return;
    }
    if (!dueDate) {
      Alert.alert('Validation', 'Please select a due date');
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        ...formData,
        task_title: formData.task_title.trim(),
        due_date: dueDate.toISOString().split('T')[0],
        comments: formData.comments?.trim() || undefined,
      });

      Alert.alert('Success', 'Task created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleInputChange = (field: keyof CreateTaskDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <AnimatedPressable onPress={() => router.back()} style={{ marginRight: spacing.base }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </AnimatedPressable>
        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: 'bold',
          color: theme.text,
          flex: 1,
        }}>
          Create Task
        </Text>
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={createTaskMutation.isPending || !formData.task_title?.trim() || !dueDate}
          style={{
            backgroundColor: (!createTaskMutation.isPending && formData.task_title?.trim() && dueDate) 
              ? theme.primary 
              : theme.border,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
          }}
        >
          <Text style={{
            color: (!createTaskMutation.isPending && formData.task_title?.trim() && dueDate) 
              ? '#FFFFFF' 
              : theme.textSecondary,
            fontSize: typography.sizes.sm,
            fontWeight: 'bold',
          }}>
            {createTaskMutation.isPending ? "Creating..." : "Create"}
          </Text>
        </AnimatedPressable>
      </View>
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: spacing['2xl']
        }}
      >
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.base,
          marginTop: spacing.base,
          ...getShadowStyle('sm')
        }}>
          <Text style={{
            fontSize: typography.sizes.xl,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: spacing.base
          }}>
            Task Information
          </Text>

          {/* Task Title */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Task Title *
            </Text>
            <TextInput
              placeholder="Enter task title"
              value={formData.task_title}
              onChangeText={(value: string) => handleInputChange('task_title', value)}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                fontSize: typography.sizes.base,
                color: theme.text,
                backgroundColor: theme.background,
              }}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Project Selection */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Project *
            </Text>
            {projectsLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ flexDirection: 'row' }}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {projectsList.map((project) => (
                  <AnimatedPressable
                    key={project.id}
                    onPress={() => handleProjectSelect(project.id)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: borderRadius.md,
                      backgroundColor: selectedProjectId === project.id ? theme.primary : theme.background,
                      borderWidth: 1,
                      borderColor: selectedProjectId === project.id ? theme.primary : theme.border,
                    }}
                  >
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      color: selectedProjectId === project.id ? '#FFFFFF' : theme.text,
                      fontWeight: selectedProjectId === project.id ? 'bold' : 'normal'
                    }}>
                      {project.project_name}
                    </Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            )}
            {projectsList.length === 0 && !projectsLoading && (
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>
                No projects available. Please create a project first.
              </Text>
            )}
          </View>

          {/* Section Selection */}
          {selectedProjectId && (
            <View style={{ marginBottom: spacing.base }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: 'bold',
                color: theme.text,
                marginBottom: spacing.sm
              }}>
                Section *
              </Text>
              {sectionsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ flexDirection: 'row' }}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {sectionsList.map((section) => (
                    <AnimatedPressable
                      key={section.id}
                      onPress={() => handleInputChange('section_id', section.id)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.md,
                        backgroundColor: formData.section_id === section.id ? theme.primary : theme.background,
                        borderWidth: 1,
                        borderColor: formData.section_id === section.id ? theme.primary : theme.border,
                      }}
                    >
                      <Text style={{
                        fontSize: typography.sizes.sm,
                        color: formData.section_id === section.id ? '#FFFFFF' : theme.text,
                        fontWeight: formData.section_id === section.id ? 'bold' : 'normal'
                      }}>
                        {section.section_name}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              )}
              {sectionsList.length === 0 && !sectionsLoading && (
                <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>
                  No sections available in this project.
                </Text>
              )}
            </View>
          )}

          {/* Due Date */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Due Date *
            </Text>
            <ThemedDatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
              required
              minimumDate={new Date()}
            />
          </View>

          {/* Priority */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Priority
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm
            }}>
              {priorityOptions.map((priority) => (
                <AnimatedPressable
                  key={priority.value}
                  onPress={() => handleInputChange('priority_level', priority.value)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: formData.priority_level === priority.value 
                      ? priority.color 
                      : theme.background,
                    borderWidth: 1,
                    borderColor: priority.color,
                  }}
                >
                  <Text style={{
                    fontSize: typography.sizes.sm,
                    color: formData.priority_level === priority.value ? '#FFFFFF' : priority.color,
                    fontWeight: formData.priority_level === priority.value ? 'bold' : 'normal'
                  }}>
                    {priority.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Comments */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Comments
            </Text>
            <TextInput
              placeholder="Add any additional details or notes..."
              value={formData.comments}
              onChangeText={(value: string) => handleInputChange('comments', value)}
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
                backgroundColor: theme.background,
                textAlignVertical: 'top'
              }}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Starred Toggle */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.base,
            padding: spacing.md,
            backgroundColor: theme.background,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="star-outline" size={20} color={theme.text} />
              <Text style={{ fontSize: typography.sizes.base, color: theme.text }}>
                Mark as Important
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => handleInputChange('starred', !formData.starred)}
              style={{
                padding: spacing.sm,
              }}
            >
              <Ionicons 
                name={formData.starred ? 'star' : 'star-outline'} 
                size={24} 
                color={formData.starred ? '#F59E0B' : theme.textSecondary} 
              />
            </AnimatedPressable>
          </View>
        </View>

        {/* Help Text */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.base,
          marginTop: spacing.base,
          ...getShadowStyle('sm')
        }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: spacing.sm
          }}>
            Task Creation Tips
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.sm
          }}>
            • Choose a descriptive task title that clearly indicates what needs to be done
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.sm
          }}>
            • Set a realistic due date to manage expectations
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20
          }}>
            • Use comments to provide additional context or requirements
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateTaskScreen;