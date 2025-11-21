import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/designTokens';
import { getShadowStyle } from '@/utils/styleHelpers';
import { AnimatedPressable, ThemedDatePicker } from '@/components';
import projectService from '@/services/project.service';
import { CreateProjectRequest, Project } from '@/types/project.d';
import { useTheme } from '@/hooks/useTheme';

const CreateProjectScreen = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assigned_to: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      Alert.alert('Validation Error', 'Please enter a project title');
      return;
    }

    if (!startDate) {
      Alert.alert('Validation Error', 'Please select a start date');
      return;
    }

    try {
      setLoading(true);
      
      const projectData: CreateProjectRequest = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
        priority: formData.priority,
        assigned_to: formData.assigned_to
      };

      const newProject = await projectService.createProject(projectData);
      
      Alert.alert(
        'Success',
        'Project created successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create project. Please try again.');
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          Create Project
        </Text>
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading || !formData.title?.trim() || !startDate}
          style={{
            backgroundColor: (!loading && formData.title?.trim() && startDate) ? theme.primary : theme.border,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
          }}
        >
          <Text style={{
            color: (!loading && formData.title?.trim() && startDate) ? '#FFFFFF' : theme.textSecondary,
            fontSize: typography.sizes.sm,
            fontWeight: 'bold',
          }}>
            {loading ? "Creating..." : "Create"}
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
            Project Information
          </Text>

          {/* Project Title */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Project Title *
            </Text>
            <TextInput
              placeholder="Enter project title"
              value={formData.title}
              onChangeText={(value: string) => handleInputChange('title', value)}
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

          {/* Project Description */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Description
            </Text>
            <TextInput
              placeholder="Enter project description"
              value={formData.description}
              onChangeText={(value: string) => handleInputChange('description', value)}
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

          {/* Start Date */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              Start Date *
            </Text>
            <ThemedDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
              required
              minimumDate={new Date()}
            />
          </View>

          {/* End Date */}
          <View style={{ marginBottom: spacing.base }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              End Date (Optional)
            </Text>
            <ThemedDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date"
              minimumDate={startDate || new Date()}
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
              Priority *
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm
            }}>
              {[
                { value: 'low', label: 'Low', color: '#22C55E' },
                { value: 'medium', label: 'Medium', color: '#F59E0B' },
                { value: 'high', label: 'High', color: '#EF4444' },
                { value: 'urgent', label: 'Urgent', color: '#8B5CF6' }
              ].map((priority) => (
                <AnimatedPressable
                  key={priority.value}
                  onPress={() => handleInputChange('priority', priority.value)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: formData.priority === priority.value 
                      ? priority.color 
                      : theme.background,
                    borderWidth: 1,
                    borderColor: priority.color,
                  }}
                >
                  <Text style={{
                    fontSize: typography.sizes.sm,
                    color: formData.priority === priority.value ? '#FFFFFF' : priority.color,
                    fontWeight: formData.priority === priority.value ? 'bold' : 'normal'
                  }}>
                    {priority.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
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
            Project Creation Tips
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.sm
          }}>
            • Choose a clear, descriptive title that reflects the project's purpose
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.sm
          }}>
            • Set realistic start and end dates to keep the project on track
          </Text>
          
          <Text style={{
            fontSize: typography.sizes.sm,
            color: theme.textSecondary,
            lineHeight: 20
          }}>
            • You can add sections and tasks after creating the project
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateProjectScreen;