import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { getShadowStyle } from '@/utils/styleHelpers';
import { AnimatedPressable } from '@/components';
import projectService from '@/services/project.service';
import { Project, TeamMember, ProjectStats } from '@/types/project.d';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const ProjectsScreen = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Projects: User authenticated, loading projects...');
      loadProjects();
    } else {
      console.log('⚠️ Projects: User not authenticated, skipping project load');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadProjects = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Projects: Not authenticated, skipping project load');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Projects: Fetching projects...');
      setLoading(true);
      const allProjects = await projectService.getProjects();
      setProjects(allProjects);
      console.log(`✅ Projects: Loaded ${allProjects.length} projects successfully`);
    } catch (error) {
      console.error('❌ Projects: Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
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
        paddingHorizontal: designSystem.spacing[4],
        paddingVertical: designSystem.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <AnimatedPressable onPress={() => router.back()} style={{ marginRight: designSystem.spacing[4] }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </AnimatedPressable>
        <Text style={{
          fontSize: designSystem.typography.sizes.lg,
          fontWeight: designSystem.typography.weights.bold,
          color: theme.text,
          flex: 1,
        }}>
          Projects
        </Text>
        <AnimatedPressable
          onPress={handleCreateProject}
          style={{
            backgroundColor: theme.primary,
            paddingHorizontal: designSystem.spacing[4],
            paddingVertical: designSystem.spacing[2],
            borderRadius: designSystem.borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: designSystem.spacing[1]
          }}
        >
          <Ionicons name="add" size={20} color={theme.textInverse} />
          <Text style={{
            color: theme.textInverse,
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.bold,
          }}>
            New
          </Text>
        </AnimatedPressable>
      </View>
      
      <View style={{ flex: 1, paddingHorizontal: designSystem.spacing[4] }}>
        {/* Search Bar */}
        <View style={{ marginVertical: designSystem.spacing[4] }}>
          <TextInput
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: designSystem.borderRadius.md,
              paddingHorizontal: designSystem.spacing[3],
              paddingVertical: designSystem.spacing[3],
              fontSize: designSystem.typography.sizes.base,
              color: theme.text,
              backgroundColor: theme.surface,
            }}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Projects List */}
        <Text style={{
          fontSize: designSystem.typography.sizes.lg,
          fontWeight: designSystem.typography.weights.bold,
          color: theme.text,
          marginBottom: designSystem.spacing[3]
        }}>
          Projects ({filteredProjects.length})
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: designSystem.spacing[3], paddingBottom: designSystem.spacing[6] }}
        >
          {filteredProjects.map((project) => (
            <AnimatedPressable
              key={project.id}
              onPress={() => handleProjectPress(project)}
              style={{
                backgroundColor: theme.surface,
                borderRadius: designSystem.borderRadius.lg,
                padding: designSystem.spacing[4],
                borderWidth: 1,
                borderColor: theme.border,
                ...getShadowStyle('md')
              }}
            >
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: designSystem.spacing[2]
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.bold,
                    color: theme.text,
                    marginBottom: designSystem.spacing[1]
                  }}>
                    {project.title}
                  </Text>
                  
                  {project.description && (
                    <Text style={{
                      fontSize: designSystem.typography.sizes.sm,
                      color: theme.textSecondary,
                      marginBottom: designSystem.spacing[2]
                    }}>
                      {project.description}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: designSystem.spacing[1] }}>
                  {/* Priority Badge */}
                  <View style={{
                    backgroundColor: getPriorityColor(project.priority),
                    paddingHorizontal: designSystem.spacing[2],
                    paddingVertical: 2,
                    borderRadius: designSystem.borderRadius.md,
                  }}>
                    <Text style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: theme.textInverse,
                      fontWeight: designSystem.typography.weights.bold,
                      textTransform: 'uppercase'
                    }}>
                      {project.priority}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    backgroundColor: getStatusColor(project.status),
                    paddingHorizontal: designSystem.spacing[2],
                    paddingVertical: 2,
                    borderRadius: designSystem.borderRadius.md,
                  }}>
                    <Text style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: theme.textInverse,
                      fontWeight: designSystem.typography.weights.bold,
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
                  gap: designSystem.spacing[2]
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: designSystem.spacing[1] }}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={theme.textSecondary}
                    />
                    <Text style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: theme.textSecondary
                    }}>
                      {project.start_date ? formatDate(project.start_date) : 'No start date'}
                    </Text>
                  </View>

                  {project.end_date && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: designSystem.spacing[1] }}>
                      <Ionicons
                        name="flag-outline"
                        size={16}
                        color={theme.textSecondary}
                      />
                      <Text style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: theme.textSecondary
                      }}>
                        Due {formatDate(project.end_date)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: designSystem.spacing[1] }}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text style={{
                    fontSize: designSystem.typography.sizes.xs,
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
              paddingVertical: designSystem.spacing[8]
            }}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color={theme.textSecondary}
                style={{ marginBottom: designSystem.spacing[4] }}
              />
              <Text style={{
                fontSize: designSystem.typography.sizes.lg,
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: designSystem.spacing[2]
              }}>
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </Text>
              <Text style={{
                fontSize: designSystem.typography.sizes.sm,
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: designSystem.spacing[4]
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
                    paddingHorizontal: designSystem.spacing[4],
                    paddingVertical: designSystem.spacing[2],
                    borderRadius: designSystem.borderRadius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: designSystem.spacing[1]
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.textInverse} />
                  <Text style={{
                    color: theme.textInverse,
                    fontSize: designSystem.typography.sizes.sm,
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