import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/designTokens';
import { getShadowStyle } from '@/utils/styleHelpers';
import { AnimatedPressable } from '@/components';
import projectService from '@/services/project.service';
import { Project, TeamMember, ProjectStats } from '@/types/project.d';
import { useTheme } from '@/hooks/useTheme';

const ProjectsScreen = () => {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectService.getProjects();
      setProjects(allProjects);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    router.push('/(modules)/projects/create');
  };

  const handleProjectPress = (project: Project) => {
    router.push(`/(modules)/projects/${project.id}`);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return '#3B82F6';
      case 'in_progress': return '#22C55E';
      case 'completed': return '#10B981';
      case 'on_hold': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return theme.textSecondary;
    }
  };

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'high': case 'urgent': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      default: return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          Projects
        </Text>
        <AnimatedPressable
          onPress={handleCreateProject}
          style={{
            backgroundColor: theme.primary,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={{
            color: '#FFFFFF',
            fontSize: typography.sizes.sm,
            fontWeight: 'bold',
          }}>
            New
          </Text>
        </AnimatedPressable>
      </View>
      
      <View style={{ flex: 1, paddingHorizontal: spacing.base }}>
        {/* Search Bar */}
        <View style={{ marginVertical: spacing.base }}>
          <TextInput
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              fontSize: typography.sizes.base,
              color: theme.text,
              backgroundColor: theme.surface,
            }}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Projects List */}
        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: spacing.md
        }}>
          Projects ({filteredProjects.length})
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
        >
          {filteredProjects.map((project) => (
            <AnimatedPressable
              key={project.id}
              onPress={() => handleProjectPress(project)}
              style={{
                backgroundColor: theme.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.base,
                borderWidth: 1,
                borderColor: theme.border,
                ...getShadowStyle('md')
              }}
            >
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: typography.sizes.lg,
                    fontWeight: 'bold',
                    color: theme.text,
                    marginBottom: spacing.xs
                  }}>
                    {project.title}
                  </Text>
                  
                  {project.description && (
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      color: theme.textSecondary,
                      marginBottom: spacing.sm
                    }}>
                      {project.description}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  {/* Priority Badge */}
                  <View style={{
                    backgroundColor: getPriorityColor(project.priority),
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: borderRadius.md,
                  }}>
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {project.priority}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    backgroundColor: getStatusColor(project.status),
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: borderRadius.md,
                  }}>
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {project.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={theme.textSecondary}
                    />
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: theme.textSecondary
                    }}>
                      {project.start_date ? formatDate(project.start_date) : 'No start date'}
                    </Text>
                  </View>

                  {project.end_date && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Ionicons
                        name="flag-outline"
                        size={16}
                        color={theme.textSecondary}
                      />
                      <Text style={{
                        fontSize: typography.sizes.xs,
                        color: theme.textSecondary
                      }}>
                        Due {formatDate(project.end_date)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text style={{
                    fontSize: typography.sizes.xs,
                    color: theme.textSecondary
                  }}>
                    {project.created_by.first_name} {project.created_by.last_name}
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          ))}

          {filteredProjects.length === 0 && !loading && (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing['2xl'] * 2
            }}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color={theme.textSecondary}
                style={{ marginBottom: spacing.base }}
              />
              <Text style={{
                fontSize: typography.sizes.lg,
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: spacing.sm
              }}>
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </Text>
              <Text style={{
                fontSize: typography.sizes.sm,
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: spacing.base
              }}>
                {searchQuery
                  ? `Try adjusting your search for "${searchQuery}"`
                  : 'Create your first project to get started'
                }
              </Text>
              {!searchQuery && (
                <AnimatedPressable
                  onPress={handleCreateProject}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: spacing.base,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: typography.sizes.sm,
                    fontWeight: 'bold',
                  }}>
                    Create Project
                  </Text>
                </AnimatedPressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProjectsScreen;