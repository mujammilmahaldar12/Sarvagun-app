import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { ModuleHeader } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { Select } from '@/components/core/Select';
import { DatePicker } from '@/components/core/DatePicker';
import { Calendar } from '@/components/core/Calendar';
import type { TaskSection, TaskProject, Task } from '@/types/project';
import { 
  useMyProjects, 
  useTeamMemberProjects,
  useSectionsByProject,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
  useCreateSection,
  useDeleteSection,
  useUpdateProject,
  useDeleteProject,
  usePriorities,
  useRateTask,
  useTaskRatings
} from '@/hooks/useProjectQueries';
import { useAuthStore } from '@/store/authStore';

const { spacing, borderRadius, typography } = designSystem;

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Team lead context from navigation params
  const teamMemberId = params.teamMemberId as string;
  const teamMemberName = params.teamMemberName as string;
  const isTeamLead = params.isTeamLead === 'true';
  
  const [selectedProject, setSelectedProject] = useState<TaskProject | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedSectionForTask, setSelectedSectionForTask] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<number | null>(null);
  const [newTaskComments, setNewTaskComments] = useState('');
  
  // Project Edit/Delete
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  
  // Rating
  const [showRating, setShowRating] = useState(false);
  const [selectedTaskForRating, setSelectedTaskForRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<'1' | '2' | '3' | '4' | '5'>('5');
  const [ratingFeedback, setRatingFeedback] = useState('');
  
  // Task Management States
  const [editingTask, setEditingTask] = useState<{sectionId: number, taskId: number} | null>(null);
  const [tempTasks, setTempTasks] = useState<{[sectionId: number]: any[]}>({});
  const [newTaskForSection, setNewTaskForSection] = useState<{[sectionId: number]: boolean}>({});
  const [showDatePicker, setShowDatePicker] = useState<{taskId: string | number, sectionId: number, currentDate?: string} | null>(null);
  const [showPriorityPicker, setShowPriorityPicker] = useState<{taskId: string | number, sectionId: number, currentPriority?: string} | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);

  // Use team member projects if in team lead mode, otherwise use my projects
  const { data: myProjects, isLoading: myProjectsLoading, refetch: refetchMyProjects } = useMyProjects();
  const { data: teamMemberProjects, isLoading: teamMemberProjectsLoading, refetch: refetchTeamMemberProjects } = useTeamMemberProjects(teamMemberId);
  
  const projects = isTeamLead && teamMemberId ? teamMemberProjects : myProjects;
  const projectsLoading = isTeamLead && teamMemberId ? teamMemberProjectsLoading : myProjectsLoading;
  const refetchProjects = isTeamLead && teamMemberId ? refetchTeamMemberProjects : refetchMyProjects;
  const { data: sectionsData, refetch: refetchSections } = useSectionsByProject(
    selectedProject?.id || 0,
    !!selectedProject
  );
  const { data: priorities } = usePriorities();
  const user = useAuthStore((state) => state.user);

  // Debug logging for projects data
  console.log('🔍 Projects Debug:', {
    projects,
    projectsType: typeof projects,
    isArray: Array.isArray(projects),
    projectsLength: Array.isArray(projects) ? projects.length : 'not array',
    isLoading: projectsLoading,
  });

  // Debug logging for sections data
  console.log('🔍 Sections Debug:', {
    sectionsData,
    sectionsType: typeof sectionsData,
    isArray: Array.isArray(sectionsData),
    sectionsLength: Array.isArray(sectionsData) ? sectionsData.length : 'not array',
    selectedProject: selectedProject?.id,
    selectedProjectName: (selectedProject as any)?.name || (selectedProject as any)?.project_name,
  });

  const projectsList = Array.isArray(projects) ? projects : [];
  const sectionsList = Array.isArray(sectionsData) ? sectionsData : [];
  const prioritiesList = Array.isArray(priorities) ? priorities : [];

  const createSectionMutation = useCreateSection();
  const deleteSectionMutation = useDeleteSection();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  const updateTaskMutation = useUpdateTask();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const rateTaskMutation = useRateTask();
  
  // Check if user can rate tasks (admin, manager, or team lead viewing team member tasks)
  const isLeadOrAdmin = user?.category === 'admin' || user?.category === 'manager';
  const canRateTasks = isLeadOrAdmin || (isTeamLead && teamMemberId);

  // Auto-select first project
  useEffect(() => {
    if (projectsList.length > 0 && !selectedProject) {
      setSelectedProject(projectsList[0]);
    }
  }, [projectsList]);



  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAddSection = () => {
    setShowAddSection(true);
  };

  const handleCreateSection = () => {
    if (!newSectionName.trim()) {
      Alert.alert('Validation', 'Please enter a section name');
      return;
    }
    
    if (!selectedProject) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    createSectionMutation.mutate({
      section_name: newSectionName.trim(),
      project: selectedProject.id
    }, {
      onSuccess: () => {
        setNewSectionName('');
        setShowAddSection(false);
        refetchSections();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to create section');
      }
    });
  };

  const handleAddTask = (sectionId: number) => {
    setSelectedSectionForTask(sectionId);
    setShowAddTask(true);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Validation', 'Please enter task title');
      return;
    }

    if (!selectedSectionForTask) {
      Alert.alert('Error', 'No section selected');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    createTaskMutation.mutate({
      task_title: newTaskTitle.trim(),
      section: selectedSectionForTask,
      due_date: newTaskDueDate || today,
      comments: newTaskComments.trim(),
      priority: newTaskPriority || undefined,
      starred: false
    }, {
      onSuccess: () => {
        setNewTaskTitle('');
        setNewTaskDueDate('');
        setNewTaskPriority(null);
        setNewTaskComments('');
        setShowAddTask(false);
        setSelectedSectionForTask(null);
        refetchSections();
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.message || 'Failed to create task');
      }
    });
  };

  const handleEditProject = () => {
    if (!selectedProject) return;
    setEditProjectName(selectedProject.project_name);
    setEditProjectDescription(selectedProject.description || '');
    setShowEditProject(true);
  };

  const handleUpdateProject = () => {
    if (!editProjectName.trim()) {
      Alert.alert('Validation', 'Please enter project name');
      return;
    }

    if (!selectedProject) return;

    updateProjectMutation.mutate({
      projectId: selectedProject.id,
      data: {
        project_name: editProjectName.trim(),
        description: editProjectDescription.trim()
      }
    }, {
      onSuccess: () => {
        setShowEditProject(false);
        setEditProjectName('');
        setEditProjectDescription('');
        refetchProjects();
        Alert.alert('Success', 'Project updated successfully');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to update project');
      }
    });
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;

    console.log('🗑️ Attempting to delete project:', selectedProject.id, selectedProject.project_name);
    console.log('🗑️ DIRECTLY CALLING DELETE MUTATION');
    
    deleteProjectMutation.mutate(selectedProject.id, {
      onSuccess: () => {
        console.log('✅ Project deleted successfully');
        // Clear selected project and update UI
        const remainingProjects = projectsList.filter(p => p.id !== selectedProject.id);
        setSelectedProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
        setShowProjectDropdown(false);
        refetchProjects();
      },
      onError: (error) => {
        console.error('❌ Delete project error:', error);
        console.error('❌ Error details:', JSON.stringify(error));
      }
    });
  };

  const handleRateTask = (task: any) => {
    setSelectedTaskForRating(task);
    // Pre-fill with existing rating if available
    if (task.user_rating) {
      setRatingValue(task.user_rating.rating.toString());
      setRatingFeedback(task.user_rating.feedback || '');
    } else {
      setRatingValue('5');
      setRatingFeedback('');
    }
    setShowRating(true);
  };

  const handleSubmitRating = () => {
    if (!selectedTaskForRating) return;

    rateTaskMutation.mutate({
      task_id: selectedTaskForRating.id,
      rating: ratingValue,
      feedback: ratingFeedback.trim()
    }, {
      onSuccess: () => {
        setShowRating(false);
        setSelectedTaskForRating(null);
        setRatingValue('5');
        setRatingFeedback('');
        refetchSections();
        Alert.alert('Success', 'Rating submitted successfully');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to submit rating');
      }
    });
  };

  const handleAddTaskToSection = (sectionId: number) => {
    setNewTaskForSection(prev => ({ ...prev, [sectionId]: true }));
    const newTask = {
      id: `temp-${Date.now()}`,
      task_title: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      priority_level: 'P3',
      comments: 'No additional comments', // Ensure non-empty default
      isNew: true
    };
    setTempTasks(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), newTask]
    }));
  };

  const handleTaskChange = (sectionId: number, taskId: string | number, field: string, value: any) => {
    if (typeof taskId === 'string' && taskId.startsWith('temp-')) {
      // Update temp task
      setTempTasks(prev => ({
        ...prev,
        [sectionId]: prev[sectionId]?.map(task => 
          task.id === taskId ? { ...task, [field]: value } : task
        ) || []
      }));
    } else {
      // Update existing task immediately
      const updateData: any = {};
      
      if (field === 'status' && value === 'Completed') {
        updateData.status = value;
        updateData.completed_date = new Date().toISOString();
      } else if (field === 'due_date') {
        updateData.due_date = typeof value === 'string' ? value : new Date().toISOString().split('T')[0];
      } else if (field === 'priority_level') {
        // Convert priority_level (P1, P2, P3) to priority ID
        console.log('🔄 Converting priority_level to priority ID:', value);
        const priorityObj = prioritiesList.find(p => p.level === value);
        if (priorityObj) {
          console.log('✅ Found priority:', priorityObj);
          updateData.priority = priorityObj.id;
        } else {
          console.error('❌ Priority not found:', value);
          return;
        }
      } else if (field === 'task_title' || field === 'title') {
        updateData.task_title = value;
      } else if (field === 'comments') {
        updateData.comments = value;
      } else {
        updateData[field] = value;
      }
      
      console.log('📤 Sending update to backend:', { taskId, updateData });
      
      updateTaskMutation.mutate({
        taskId: typeof taskId === 'number' ? taskId : parseInt(taskId),
        data: updateData
      }, {
        onSuccess: () => {
          refetchSections();
          console.log('✅ Task updated successfully:', field, value);
        },
        onError: (error) => {
          console.error('❌ Update task error:', error);
          console.error('Failed to update field:', field, 'with value:', value);
          Alert.alert('Update Failed', 'Could not update task. Please try again.');
        }
      });
    }
  };

  const handleTaskTitleUpdate = (sectionId: number, taskId: number, title: string) => {
    if (!title.trim()) return;
    
    updateTaskMutation.mutate({
      taskId: taskId,
      data: { task_title: title.trim() }
    }, {
      onSuccess: () => {
        setEditingTask(null);
        refetchSections();
        console.log('✅ Task title updated');
      },
      onError: (error) => {
        console.error('Update task error:', error);
        Alert.alert('Update Failed', 'Could not update task title.');
      }
    });
  };

  const handleTaskSaveByField = async (task: any) => {
    if (!task.title?.trim() && !task.task_title?.trim()) return;
    
    try {
      if (task.isNew) {
        const taskData = {
          task_title: task.title || task.task_title,
          section: task.section,
          due_date: task.due_date || new Date().toISOString().split('T')[0],
          comments: task.comments || 'No additional comments',
          starred: false
        };
        
        createTaskMutation.mutate(taskData, {
          onSuccess: () => {
            // Remove from temp tasks
            setTempTasks(prev => ({
              ...prev,
              [task.section]: prev[task.section]?.filter(t => t.id !== task.id) || []
            }));
            
            // Reset new task flag for section
            setNewTaskForSection(prev => ({ ...prev, [task.section]: false }));
            refetchSections();
          },
          onError: (error) => {
            console.error('Failed to save task:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleSaveNewTask = (sectionId: number, task: any) => {
    if (!task.task_title.trim()) {
      // Remove empty task
      setTempTasks(prev => ({
        ...prev,
        [sectionId]: prev[sectionId]?.filter(t => t.id !== task.id) || []
      }));
      return;
    }

    // Find the priority ID properly
    const priorityId = prioritiesList.find(p => p.level === task.priority_level)?.id || 
                      prioritiesList.find(p => p.level === 'P3')?.id || 
                      1; // Default fallback

    const taskData = {
      task_title: task.task_title.trim(),
      section: sectionId,
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      comments: task.comments || 'No additional comments',
      priority: priorityId,
      starred: false
    };

    console.log('📝 Creating task with data:', taskData);
    console.log('📝 Available priorities:', prioritiesList);

    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setTempTasks(prev => ({
          ...prev,
          [sectionId]: prev[sectionId]?.filter(t => t.id !== task.id) || []
        }));
        setNewTaskForSection(prev => ({ ...prev, [sectionId]: false }));
        console.log('✅ Task created successfully');
        refetchSections();
      },
      onError: (error) => {
        console.error('Create task error:', error);
        // Remove the failed temp task
        setTempTasks(prev => ({
          ...prev,
          [sectionId]: prev[sectionId]?.filter(t => t.id !== task.id) || []
        }));
        Alert.alert('❌ Error', 'Failed to create task. Please check all required fields.');
      }
    });
  };

  if (projectsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Task Tracker" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (projectsList.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Task Tracker" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="folder-open-outline" size={64} color={theme.textTertiary} />
          <Text style={{ 
            marginTop: spacing.md, 
            fontSize: typography.sizes.lg,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.lg
          }}>
            No projects found
          </Text>
          <TouchableOpacity
            onPress={() => {
              const createUrl = isTeamLead && teamMemberId 
                ? `/projects/create-project?teamMemberId=${teamMemberId}&teamMemberName=${encodeURIComponent(teamMemberName)}&isTeamLead=true`
                : '/projects/create-project';
              router.push(createUrl);
            }}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={{ 
              color: '#fff',
              fontSize: typography.sizes.base,
              fontWeight: '600'
            }}>
              Create Your First Project
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader 
          title={isTeamLead && teamMemberName ? `${teamMemberName}'s Tasks` : "Task Tracker"} 
        />
      
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
        contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom + 16) }}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setIsAtTop(offsetY <= 0);
        }}
        scrollEventThrottle={16}
      >
        {/* Project Dropdown Selector */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: theme.border
        }}>
          <Text style={{
            fontSize: typography.sizes.xs,
            color: theme.textSecondary,
            marginBottom: spacing.xs,
            fontWeight: '600'
          }}>
            SELECT PROJECT
          </Text>
          
          <TouchableOpacity
            onPress={() => setShowProjectDropdown(!showProjectDropdown)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.background,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: theme.border
            }}
          >
            <View style={{flex: 1}}>
              <Text style={{
                fontSize: typography.sizes.base,
                color: theme.text,
                fontWeight: '600'
              }}>
                {selectedProject?.project_name || 'Select a project'}
              </Text>
              {selectedProject && (
                <Text style={{
                  fontSize: typography.sizes.xs,
                  color: theme.textSecondary,
                  marginTop: 2
                }}>
                  {sectionsList.length} section{sectionsList.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.xs}}>
              {selectedProject && (
                <>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditProject();
                    }}
                    style={{
                      padding: spacing.xs,
                      backgroundColor: theme.primary + '20',
                      borderRadius: borderRadius.sm
                    }}
                  >
                    <Ionicons name="pencil" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteProject();
                    }}
                    style={{
                      padding: spacing.xs,
                      backgroundColor: theme.error + '20',
                      borderRadius: borderRadius.sm
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                  </TouchableOpacity>
                </>
              )}
              <Ionicons 
                name={showProjectDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.primary} 
              />
            </View>
          </TouchableOpacity>

          {/* Dropdown List */}
          {showProjectDropdown && (
            <View style={{
              marginTop: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: theme.background,
              borderWidth: 1,
              borderColor: theme.border,
              maxHeight: 300
            }}>
              <ScrollView style={{maxHeight: 300}}>
                {projectsList.map((project, index) => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() => {
                      setSelectedProject(project);
                      setShowProjectDropdown(false);
                    }}
                    style={{
                      padding: spacing.md,
                      borderBottomWidth: index < projectsList.length - 1 ? 1 : 0,
                      borderBottomColor: theme.border,
                      backgroundColor: selectedProject?.id === project.id ? theme.primary + '15' : 'transparent'
                    }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                      <View style={{flex: 1}}>
                        <Text style={{
                          fontSize: typography.sizes.sm,
                          color: selectedProject?.id === project.id ? theme.primary : theme.text,
                          fontWeight: selectedProject?.id === project.id ? '600' : '400'
                        }}>
                          {project.project_name}
                        </Text>
                        {project.description && (
                          <Text style={{
                            fontSize: typography.sizes.xs,
                            color: theme.textSecondary,
                            marginTop: 2
                          }} numberOfLines={1}>
                            {project.description}
                          </Text>
                        )}
                      </View>
                      {selectedProject?.id === project.id && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sections List */}
        {selectedProject && (
          <View style={{flex: 1}}>
            {sectionsList.map(section => (
              <View 
                key={section.id}
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border
                }}
              >
                {/* Section Header */}
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <View style={{flex: 1}}>
                    <Text style={{
                      fontSize: typography.sizes.base,
                      fontWeight: '600',
                      color: theme.text
                    }}>
                      {section.section_name}
                    </Text>
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: theme.textSecondary,
                      marginTop: 2
                    }}>
                      {section.tasks?.length || 0} tasks
                    </Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
                    {/* Delete Section Button */}
                    <TouchableOpacity
                      onPress={() => {
                        console.log('🗑️ Deleting section:', section.id, section.section_name);
                        console.log('🗑️ DIRECTLY CALLING DELETE MUTATION');
                        deleteSectionMutation.mutate(section.id, {
                          onSuccess: () => {
                            console.log('✅ Section deleted successfully:', section.id);
                            refetchSections();
                          },
                          onError: (error) => {
                            console.error('❌ Delete section error:', error);
                            console.error('❌ Error details:', JSON.stringify(error));
                          }
                        });
                      }}
                      style={{
                        backgroundColor: theme.error + '20',
                        padding: spacing.xs,
                        borderRadius: borderRadius.md
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.error} />
                    </TouchableOpacity>
                    
                    <Ionicons 
                      name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>

                {/* Excel-like Task Table */}
                {expandedSections.includes(section.id) && (
                  <View style={{marginTop: spacing.md}}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ paddingHorizontal: 4 }}
                    >
                      <View style={{ minWidth: '100%', width: 600 }}>
                        {/* Existing Tasks */}
                        {section.tasks && section.tasks.map((task: any) => (
                          <View
                            key={task.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.xs,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.border + '15',
                              backgroundColor: task.status === 'Completed' ? theme.success + '08' : theme.background,
                              marginVertical: 0.5,
                              borderRadius: 4,
                              elevation: 0.5,
                              shadowColor: theme.shadow,
                              shadowOffset: { width: 0, height: 0.5 },
                              shadowOpacity: 0.03,
                              shadowRadius: 1
                            }}
                          >
                            {/* Completion Checkbox */}
                            <TouchableOpacity
                              style={{
                                width: 30, 
                                alignItems: 'center',
                                paddingVertical: 6,
                                borderRadius: 16,
                                backgroundColor: task.status === 'Completed' ? theme.success + '12' : 'transparent'
                              }}
                              onPress={() => handleTaskChange(section.id, task.id, 'status', task.status === 'Completed' ? 'In Progress' : 'Completed')}
                              activeOpacity={0.7}
                            >
                              <Ionicons 
                                name={task.status === 'Completed' ? 'checkmark-circle' : 'ellipse-outline'} 
                                size={22} 
                                color={task.status === 'Completed' ? theme.success : theme.textTertiary} 
                              />
                            </TouchableOpacity>

                            {/* Task Title - Editable */}
                            <View style={{ flex: 1, minWidth: 200, maxWidth: 350 }}>
                              <TextInput
                                style={{
                                  width: '100%',
                                  fontSize: typography.sizes.sm,
                                  color: task.status === 'Completed' ? theme.textSecondary : theme.text,
                                  paddingVertical: spacing.sm,
                                  paddingHorizontal: spacing.sm,
                                  textDecorationLine: task.status === 'Completed' ? 'line-through' : 'none',
                                  opacity: task.status === 'Completed' ? 0.6 : 1,
                                  backgroundColor: 'transparent',
                                  borderRadius: 6,
                                  minHeight: 44,
                                  fontWeight: '400',
                                  textAlignVertical: 'top',
                                  borderWidth: 1,
                                  borderColor: 'transparent'
                                }}
                                defaultValue={task.title || task.task_title || ''}
                                onChangeText={(text) => handleTaskChange(section.id, task.id, 'title', text)}
                                onBlur={() => {
                                  // Save on blur
                                  if (task.isNew && task.title) {
                                    handleTaskSaveByField(task);
                                  }
                                }}
                                placeholder="Click to edit task title..."
                                placeholderTextColor={theme.textTertiary + '60'}
                                multiline
                                numberOfLines={2}

                              />
                            </View>

                            {/* Due Date - Editable */}
                            <View style={{
                              width: 85,
                              alignItems: 'center',
                              backgroundColor: theme.surface + '40',
                              borderRadius: 6,
                              paddingVertical: 3,
                              borderWidth: 0.5,
                              borderColor: theme.border + '30'
                            }}>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: theme.surface + '40',
                                  borderRadius: 6,
                                  paddingVertical: spacing.xs,
                                  paddingHorizontal: spacing.xs,
                                  minWidth: 70,
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onPress={() => setShowDatePicker({
                                  taskId: task.id,
                                  sectionId: section.id,
                                  currentDate: task.due_date
                                })}
                              >
                                <Text style={{
                                  fontSize: typography.sizes.xs,
                                  color: theme.textSecondary,
                                  fontWeight: '500',
                                  textAlign: 'center'
                                }}>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'Set Date'}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* Priority Picker */}
                            <TouchableOpacity
                              style={{
                                width: 50,
                                alignItems: 'center',
                                backgroundColor: task.priority_level === 'P1' ? theme.error + '20' :
                                               task.priority_level === 'P2' ? theme.warning + '20' :
                                               task.priority_level === 'P3' ? theme.success + '20' : theme.primary + '20',
                                paddingVertical: 4,
                                borderRadius: 4
                              }}
                              onPress={() => setShowPriorityPicker({
                                taskId: task.id,
                                sectionId: section.id,
                                currentPriority: task.priority_level
                              })}
                            >
                              <Text style={{
                                fontSize: typography.sizes.xs,
                                color: task.priority_level === 'P1' ? theme.error :
                                       task.priority_level === 'P2' ? theme.warning :
                                       task.priority_level === 'P3' ? theme.success : theme.primary,
                                fontWeight: '600'
                              }}>
                                {task.priority_level || 'P3'}
                              </Text>
                            </TouchableOpacity>

                            {/* Status */}
                            <View style={{width: 70, alignItems: 'center'}}>
                              <View style={{
                                backgroundColor: task.status === 'Completed' ? theme.success + '20' : theme.primary + '20',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }}>
                                <Text style={{
                                  fontSize: typography.sizes.xs,
                                  color: task.status === 'Completed' ? theme.success : theme.primary,
                                  fontWeight: '500'
                                }}>
                                  {task.status === 'Completed' ? 'Done' : 'Active'}
                                </Text>
                              </View>
                            </View>

                            {/* Delete Task Button */}
                            <View style={{width: 35, alignItems: 'center'}}>
                              <TouchableOpacity 
                                  onPress={() => {
                                    console.log('🗑️ Deleting task:', task.id, task.task_title);
                                    console.log('🗑️ DIRECTLY CALLING DELETE MUTATION');
                                    deleteTaskMutation.mutate(task.id, {
                                      onSuccess: () => {
                                        console.log('✅ Task deleted successfully:', task.id);
                                        refetchSections();
                                      },
                                      onError: (error) => {
                                        console.error('❌ Delete task error:', error);
                                        console.error('❌ Error details:', JSON.stringify(error));
                                      }
                                    });
                                  }}
                                  style={{padding: spacing.xs}}
                                >
                                  <Ionicons name="trash-outline" size={16} color={theme.error} />
                                </TouchableOpacity>
                            </View>

                            {/* Rating Button */}
                            <View style={{width: 60, alignItems: 'center'}}>
                              {task.average_rating ? (
                                <View style={{alignItems: 'center'}}>
                                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 2}}>
                                    <Ionicons name="star" size={14} color={theme.warning} />
                                    <Text style={{fontSize: typography.sizes.xs, color: theme.text, fontWeight: '600'}}>
                                      {task.average_rating.toFixed(1)}
                                    </Text>
                                  </View>
                                  {task.user_rating?.feedback && (
                                    <Ionicons name="chatbox" size={10} color={theme.primary} style={{marginBottom: 2}} />
                                  )}
                                  {canRateTasks && task.status === 'Completed' && task.user !== user?.id && (
                                    <TouchableOpacity onPress={() => handleRateTask(task)}>
                                      <Text style={{fontSize: typography.sizes.xs, color: theme.primary}}>
                                        {task.user_rating ? 'Edit' : 'Rate'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              ) : canRateTasks && task.status === 'Completed' && task.user !== user?.id ? (
                                <TouchableOpacity onPress={() => handleRateTask(task)}>
                                  <Ionicons name="star-outline" size={16} color={theme.warning} />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        ))}

                        {/* Temp New Tasks */}
                        {tempTasks[section.id]?.map((task: any) => (
                          <View
                            key={task.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.xs,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.primary + '20',
                              backgroundColor: theme.primary + '08',
                              borderRadius: 4,
                              marginVertical: 1,
                              borderLeftWidth: 3,
                              borderLeftColor: theme.primary + '60'
                            }}
                          >
                            <View style={{width: 30, alignItems: 'center'}}>
                              <Ionicons name="ellipse-outline" size={20} color={theme.textTertiary} />
                            </View>

                            <TextInput
                              style={{
                                flex: 1,
                                minWidth: 200,
                                maxWidth: 350,
                                fontSize: typography.sizes.sm,
                                color: theme.text,
                                paddingVertical: spacing.sm,
                                paddingHorizontal: spacing.sm,
                                borderWidth: 1.5,
                                borderColor: theme.primary + '50',
                                borderRadius: 8,
                                backgroundColor: theme.background,
                                fontWeight: '500',
                                minHeight: 44,
                                textAlignVertical: 'top'
                              }}
                              defaultValue={task.task_title || ''}
                              onChangeText={(text) => handleTaskChange(section.id, task.id, 'task_title', text)}
                              placeholder="Type your task here and press Enter to save..."
                              placeholderTextColor={theme.textTertiary + '60'}
                              multiline
                              numberOfLines={2}
                              autoFocus
                              onSubmitEditing={() => handleSaveNewTask(section.id, task)}
                              returnKeyType="done"
                              blurOnSubmit={true}
                            />

                            <TouchableOpacity
                              style={{
                                width: 90,
                                alignItems: 'center',
                                backgroundColor: theme.surface + '60',
                                borderRadius: 6,
                                paddingVertical: 6,
                                borderWidth: 1,
                                borderColor: theme.primary + '30'
                              }}
                              onPress={() => setShowDatePicker({ taskId: task.id, sectionId: section.id })}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                                <Text style={{
                                  fontSize: typography.sizes.xs,
                                  color: theme.textSecondary,
                                  fontWeight: '500'
                                }}>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'Set date'}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            <View style={{width: 50, alignItems: 'center'}}>
                              <Text style={{fontSize: typography.sizes.xs, color: theme.textSecondary}}>P3</Text>
                            </View>

                            <View style={{width: 70, alignItems: 'center'}}>
                              <Text style={{fontSize: typography.sizes.xs, color: theme.textSecondary}}>New</Text>
                            </View>

                            <View style={{width: 40}} />
                          </View>
                        ))}

                        {/* Add New Task Row */}
                        {!newTaskForSection[section.id] && (
                          <TouchableOpacity
                            onPress={() => handleAddTaskToSection(section.id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: spacing.sm + 4,
                              paddingHorizontal: spacing.xs,
                              backgroundColor: theme.primary + '06',
                              borderRadius: 8,
                              marginVertical: 4,
                              borderWidth: 1.5,
                              borderColor: theme.primary + '25',
                              borderStyle: 'dashed'
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={{width: 30, alignItems: 'center'}}>
                              <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                            </View>
                            <Text style={{
                              flex: 2,
                              fontSize: typography.sizes.sm,
                              color: theme.primary,
                              paddingHorizontal: spacing.sm
                            }}>
                              Add task
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </ScrollView>

                    {(section.tasks?.length === 0 && !tempTasks[section.id]?.length && !newTaskForSection[section.id]) && (
                      <TouchableOpacity
                        onPress={() => handleAddTaskToSection(section.id)}
                        style={{
                          padding: spacing.lg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderColor: theme.primary + '30',
                          borderRadius: borderRadius.md,
                          marginTop: spacing.sm
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={32} color={theme.primary} />
                        <Text style={{
                          fontSize: typography.sizes.sm,
                          color: theme.primary,
                          marginTop: spacing.xs,
                          fontWeight: '600'
                        }}>
                          Add your first task
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}

            {sectionsList.length === 0 && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Ionicons name="file-tray-outline" size={48} color={theme.textTertiary} />
                <Text style={{ 
                  color: theme.textSecondary,
                  fontSize: typography.sizes.base,
                  marginTop: spacing.md,
                  marginBottom: spacing.lg
                }}>
                  No sections yet
                </Text>
                <TouchableOpacity
                  onPress={handleAddSection}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm
                  }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Add Section</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Section Modal */}
      {showAddSection && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: '600',
              color: theme.text,
              marginBottom: spacing.md
            }}>
              Add Section
            </Text>
            <TextInput
              defaultValue={newSectionName}
              onChangeText={setNewSectionName}
              placeholder="Section name"
              placeholderTextColor={theme.textTertiary}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: typography.sizes.base,
                color: theme.text,
                backgroundColor: theme.background,
                marginBottom: spacing.md
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddSection(false);
                  setNewSectionName('');
                }}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSection}
                disabled={createSectionMutation.isPending}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.primary,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {createSectionMutation.isPending ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg
        }}>
          <ScrollView style={{width: '100%', maxWidth: 400}} contentContainerStyle={{paddingVertical: spacing.xl}}>
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              width: '100%'
            }}>
              <Text style={{
                fontSize: typography.sizes.lg,
                fontWeight: '600',
                color: theme.text,
                marginBottom: spacing.md
              }}>
                Add Task
              </Text>
              
              <TextInput
                defaultValue={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Task title *"
                placeholderTextColor={theme.textTertiary}
                autoFocus
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.sizes.base,
                  color: theme.text,
                  backgroundColor: theme.background,
                  marginBottom: spacing.md
                }}
              />
              
              <TextInput
                defaultValue={newTaskDueDate}
                onChangeText={setNewTaskDueDate}
                placeholder="Due date (YYYY-MM-DD) - Optional"
                placeholderTextColor={theme.textTertiary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.sizes.base,
                  color: theme.text,
                  backgroundColor: theme.background,
                  marginBottom: spacing.md
                }}
              />
              
              {/* Priority Selector */}
              <View style={{marginBottom: spacing.md}}>
                <Text style={{
                  fontSize: typography.sizes.sm,
                  color: theme.textSecondary,
                  marginBottom: spacing.xs
                }}>
                  Priority (Optional)
                </Text>
                <View style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.background,
                  overflow: 'hidden'
                }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{padding: spacing.xs}}>
                    <TouchableOpacity
                      onPress={() => setNewTaskPriority(null)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.sm,
                        backgroundColor: newTaskPriority === null ? theme.primary : 'transparent',
                        marginRight: spacing.xs
                      }}
                    >
                      <Text style={{
                        color: newTaskPriority === null ? '#fff' : theme.text,
                        fontSize: typography.sizes.sm,
                        fontWeight: '600'
                      }}>None</Text>
                    </TouchableOpacity>
                    {prioritiesList.map((priority) => (
                      <TouchableOpacity
                        key={priority.id}
                        onPress={() => setNewTaskPriority(priority.id)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: borderRadius.sm,
                          backgroundColor: newTaskPriority === priority.id ? 
                            (priority.level === 'P1' ? theme.error :
                             priority.level === 'P2' ? theme.warning :
                             priority.level === 'P3' ? theme.success : theme.primary) : 'transparent',
                          marginRight: spacing.xs
                        }}
                      >
                        <Text style={{
                          color: newTaskPriority === priority.id ? '#fff' : theme.text,
                          fontSize: typography.sizes.sm,
                          fontWeight: '600'
                        }}>{priority.level}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <TextInput
                defaultValue={newTaskComments}
                onChangeText={(text) => setNewTaskComments(text.slice(0, 200))}
                placeholder="Comments (max 200 characters) - Optional"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.sizes.base,
                  color: theme.text,
                  backgroundColor: theme.background,
                  marginBottom: spacing.md,
                  minHeight: 80,
                  textAlignVertical: 'top'
                }}
              />
              
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddTask(false);
                    setNewTaskTitle('');
                    setNewTaskDueDate('');
                    setNewTaskPriority(null);
                    setNewTaskComments('');
                    setSelectedSectionForTask(null);
                  }}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: theme.border,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: theme.primary,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    {createTaskMutation.isPending ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Floating Action Buttons */}
      <View style={{ 
        position: 'absolute', 
        bottom: spacing.xl, 
        right: spacing.xl,
        gap: spacing.md
      }}>
        {/* Add Section FAB */}
        {sectionsList.length > 0 && (
          <TouchableOpacity
            onPress={handleAddSection}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Create Project FAB */}
        <TouchableOpacity
          onPress={() => {
            const createUrl = isTeamLead && teamMemberId 
              ? `/projects/create-project?teamMemberId=${teamMemberId}&teamMemberName=${encodeURIComponent(teamMemberName)}&isTeamLead=true`
              : '/projects/create-project';
            router.push(createUrl);
          }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.success,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4
          }}
        >
          <Ionicons name="briefcase-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Edit Project Modal */}
      {showEditProject && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: '600',
              color: theme.text,
              marginBottom: spacing.md
            }}>
              Edit Project
            </Text>
            <TextInput
              defaultValue={editProjectName}
              onChangeText={setEditProjectName}
              placeholder="Project name *"
              placeholderTextColor={theme.textTertiary}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: typography.sizes.base,
                color: theme.text,
                backgroundColor: theme.background,
                marginBottom: spacing.md
              }}
            />
            <TextInput
              defaultValue={editProjectDescription}
              onChangeText={setEditProjectDescription}
              placeholder="Description - Optional"
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: typography.sizes.base,
                color: theme.text,
                backgroundColor: theme.background,
                marginBottom: spacing.md,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditProject(false);
                  setEditProjectName('');
                  setEditProjectDescription('');
                }}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProject}
                disabled={updateProjectMutation.isPending}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.primary,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {updateProjectMutation.isPending ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Rating Modal */}
      {showRating && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: '600',
              color: theme.text,
              marginBottom: spacing.sm
            }}>
              {selectedTaskForRating?.user_rating ? 'Edit Rating' : 'Rate Task'}
            </Text>
            <Text style={{
              fontSize: typography.sizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.md
            }}>
              {selectedTaskForRating?.task_title}
            </Text>
            
            {/* Star Rating */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.sm,
              marginBottom: spacing.md
            }}>
              {(['1', '2', '3', '4', '5'] as const).map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingValue(star)}
                  style={{padding: spacing.xs}}
                >
                  <Ionicons 
                    name={parseInt(star) <= parseInt(ratingValue) ? 'star' : 'star-outline'} 
                    size={36} 
                    color={theme.warning} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              defaultValue={ratingFeedback}
              onChangeText={setRatingFeedback}
              placeholder="Feedback (optional)"
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: typography.sizes.base,
                color: theme.text,
                backgroundColor: theme.background,
                marginBottom: spacing.md,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
            />
            
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  setShowRating(false);
                  setSelectedTaskForRating(null);
                  setRatingValue('5');
                  setRatingFeedback('');
                }}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitRating}
                disabled={rateTaskMutation.isPending}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.warning,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {rateTaskMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg
          }}>
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => setShowDatePicker(null)}
              activeOpacity={1}
            />
            <View style={{
              backgroundColor: theme.background,
              borderRadius: borderRadius.xl,
              width: '95%',
              maxWidth: 380,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.border
              }}>
                <Text style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: '600',
                  color: theme.text
                }}>
                  Select Due Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(null)}
                  style={{
                    padding: spacing.xs,
                    borderRadius: borderRadius.sm
                  }}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Calendar */}
              <View style={{ padding: spacing.md }}>
                <Calendar
                  selectedDate={showDatePicker.currentDate ? new Date(showDatePicker.currentDate) : new Date()}
                  onSelectDate={(date: Date) => {
                    const dateString = date.toISOString().split('T')[0];
                    handleTaskChange(
                      showDatePicker.sectionId,
                      showDatePicker.taskId,
                      'due_date',
                      dateString
                    );
                    setShowDatePicker(null);
                  }}
                  minDate={new Date()}
                />
              </View>
              
              {/* Quick Actions */}
              <View style={{
                flexDirection: 'row',
                padding: spacing.md,
                gap: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: theme.border
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    backgroundColor: theme.primary + '15',
                    borderRadius: borderRadius.md,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleTaskChange(
                      showDatePicker.sectionId,
                      showDatePicker.taskId,
                      'due_date',
                      today
                    );
                    setShowDatePicker(null);
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: '600', fontSize: typography.sizes.sm }}>
                    Today
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    backgroundColor: theme.warning + '15',
                    borderRadius: borderRadius.md,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dateString = tomorrow.toISOString().split('T')[0];
                    handleTaskChange(
                      showDatePicker.sectionId,
                      showDatePicker.taskId,
                      'due_date',
                      dateString
                    );
                    setShowDatePicker(null);
                  }}
                >
                  <Text style={{ color: theme.warning, fontWeight: '600', fontSize: typography.sizes.sm }}>
                    Tomorrow
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    backgroundColor: theme.success + '15',
                    borderRadius: borderRadius.md,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    const dateString = nextWeek.toISOString().split('T')[0];
                    handleTaskChange(
                      showDatePicker.sectionId,
                      showDatePicker.taskId,
                      'due_date',
                      dateString
                    );
                    setShowDatePicker(null);
                  }}
                >
                  <Text style={{ color: theme.success, fontWeight: '600', fontSize: typography.sizes.sm }}>
                    Next Week
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Priority Picker Modal */}
      {showPriorityPicker && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPriorityPicker(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg
          }}>
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => setShowPriorityPicker(null)}
              activeOpacity={1}
            />
            <View style={{
              backgroundColor: theme.background,
              borderRadius: borderRadius.xl,
              width: '90%',
              maxWidth: 350,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.border
              }}>
                <Text style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: '600',
                  color: theme.text
                }}>
                  Select Priority
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPriorityPicker(null)}
                  style={{
                    padding: spacing.xs,
                    borderRadius: borderRadius.sm
                  }}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Priority Options */}
              <View style={{ padding: spacing.lg }}>
                {[
                  { 
                    label: 'Critical', 
                    value: 'P1', 
                    color: theme.error,
                    description: 'Urgent - needs immediate attention',
                    icon: 'alert-circle'
                  },
                  { 
                    label: 'High', 
                    value: 'P2', 
                    color: theme.warning,
                    description: 'Important - complete soon',
                    icon: 'trending-up'
                  },
                  { 
                    label: 'Medium', 
                    value: 'P3', 
                    color: theme.success,
                    description: 'Normal - regular priority',
                    icon: 'remove-outline'
                  },
                  { 
                    label: 'Low', 
                    value: 'P4', 
                    color: theme.primary,
                    description: 'Optional - when time permits',
                    icon: 'trending-down'
                  }
                ].map((priority, index) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: spacing.md,
                      backgroundColor: showPriorityPicker?.currentPriority === priority.value 
                        ? priority.color + '15' 
                        : 'transparent',
                      borderRadius: borderRadius.lg,
                      marginBottom: index < 3 ? spacing.sm : 0,
                      borderWidth: showPriorityPicker?.currentPriority === priority.value ? 2 : 0,
                      borderColor: priority.color
                    }}
                    onPress={() => {
                      if (showPriorityPicker) {
                        handleTaskChange(
                          showPriorityPicker.sectionId,
                          showPriorityPicker.taskId,
                          'priority_level',
                          priority.value
                        );
                      }
                      setShowPriorityPicker(null);
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: borderRadius.lg,
                      backgroundColor: priority.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md
                    }}>
                      <Ionicons name={priority.icon as any} size={20} color={priority.color} />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{
                          fontSize: typography.sizes.base,
                          fontWeight: '600',
                          color: priority.color,
                          marginRight: spacing.xs
                        }}>
                          {priority.value}
                        </Text>
                        <Text style={{
                          fontSize: typography.sizes.base,
                          fontWeight: '500',
                          color: theme.text
                        }}>
                          {priority.label}
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: typography.sizes.xs,
                        color: theme.textSecondary,
                        lineHeight: 16
                      }}>
                        {priority.description}
                      </Text>
                    </View>
                    
                    {showPriorityPicker?.currentPriority === priority.value && (
                      <Ionicons name="checkmark-circle" size={24} color={priority.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
      </SafeAreaView>
    </Animated.View>
  );
}