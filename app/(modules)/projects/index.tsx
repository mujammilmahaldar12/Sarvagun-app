import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { ModuleHeader } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import type { TaskSection, TaskProject, Task } from '@/types/project';
import { 
  useMyProjects, 
  useSectionsByProject,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
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
  
  // Inline Task Editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [newTaskForSection, setNewTaskForSection] = useState<{[sectionId: number]: boolean}>({});
  const [tempTasks, setTempTasks] = useState<{[sectionId: number]: any[]}>({});

  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useMyProjects();
  const { data: sectionsData, refetch: refetchSections } = useSectionsByProject(
    selectedProject?.id || 0,
    !!selectedProject
  );
  const { data: priorities } = usePriorities();
  const user = useAuthStore((state) => state.user);

  const projectsList = Array.isArray(projects) ? projects : [];
  const sectionsList = Array.isArray(sectionsData) ? sectionsData : [];
  const prioritiesList = Array.isArray(priorities) ? priorities : [];

  const createSectionMutation = useCreateSection();
  const deleteSectionMutation = useDeleteSection();
  const createTaskMutation = useCreateTask();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const rateTaskMutation = useRateTask();
  
  const isLeadOrAdmin = user?.category === 'admin' || user?.category === 'manager';

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

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${selectedProject.project_name}"? This will delete all sections and tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProjectMutation.mutate(selectedProject.id, {
              onSuccess: () => {
                setSelectedProject(null);
                setShowProjectDropdown(false);
                refetchProjects();
                Alert.alert('Success', 'Project deleted successfully');
              },
              onError: () => {
                Alert.alert('Error', 'Failed to delete project');
              }
            });
          }
        }
      ]
    );
  };

  const handleRateTask = (task: any) => {
    setSelectedTaskForRating(task);
    setRatingValue('5');
    setRatingFeedback('');
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
      comments: '',
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
      // Update existing task via API
      const updateData = { [field]: value };
      if (field === 'status' && value === 'Completed') {
        updateData.completed_date = new Date().toISOString();
      }
      
      // Optimistic update would go here
      // For now, just refetch after a delay
      setTimeout(() => refetchSections(), 500);
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

    createTaskMutation.mutate({
      task_title: task.task_title.trim(),
      section: sectionId,
      due_date: task.due_date,
      comments: task.comments || '',
      priority: prioritiesList.find(p => p.level === task.priority_level)?.id || null,
      starred: false
    }, {
      onSuccess: () => {
        setTempTasks(prev => ({
          ...prev,
          [sectionId]: prev[sectionId]?.filter(t => t.id !== task.id) || []
        }));
        setNewTaskForSection(prev => ({ ...prev, [sectionId]: false }));
        refetchSections();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to create task');
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
            onPress={() => router.push('/projects/create-project')}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Task Tracker" />
      
      <ScrollView style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
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
                    {/* Add Task Button */}
                    <TouchableOpacity
                      onPress={() => handleAddTask(section.id)}
                      style={{
                        backgroundColor: theme.primary + '20',
                        padding: spacing.xs,
                        borderRadius: borderRadius.md
                      }}
                    >
                      <Ionicons name="add-circle" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    
                    {/* Delete Section Button */}
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Delete Section',
                          'Are you sure you want to delete this section?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteSectionMutation.mutate(section.id, {
                                onSuccess: () => refetchSections()
                              })
                            }
                          ]
                        );
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
                    {/* Table Header */}
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: theme.surface,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      borderRadius: borderRadius.sm
                    }}>
                      <View style={{width: 30, alignItems: 'center'}}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={theme.textSecondary} />
                      </View>
                      <Text style={{flex: 2, fontSize: typography.sizes.xs, color: theme.textSecondary, fontWeight: '600'}}>Task</Text>
                      <Text style={{width: 80, fontSize: typography.sizes.xs, color: theme.textSecondary, fontWeight: '600'}}>Due Date</Text>
                      <Text style={{width: 50, fontSize: typography.sizes.xs, color: theme.textSecondary, fontWeight: '600'}}>Priority</Text>
                      <Text style={{width: 70, fontSize: typography.sizes.xs, color: theme.textSecondary, fontWeight: '600'}}>Status</Text>
                      <View style={{width: 40}} />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{minWidth: 400}}>
                        {/* Existing Tasks */}
                        {section.tasks && section.tasks.map((task: any) => (
                          <View
                            key={task.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: spacing.xs,
                              paddingHorizontal: spacing.xs,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.border + '30',
                              backgroundColor: task.status === 'Completed' ? theme.success + '10' : 'transparent'
                            }}
                          >
                            {/* Completion Checkbox */}
                            <TouchableOpacity
                              style={{width: 30, alignItems: 'center'}}
                              onPress={() => handleTaskChange(section.id, task.id, 'status', task.status === 'Completed' ? 'In Progress' : 'Completed')}
                            >
                              <Ionicons 
                                name={task.status === 'Completed' ? 'checkmark-circle' : 'ellipse-outline'} 
                                size={20} 
                                color={task.status === 'Completed' ? theme.success : theme.textSecondary} 
                              />
                            </TouchableOpacity>

                            {/* Task Title - Editable */}
                            <TextInput
                              style={{
                                flex: 2,
                                fontSize: typography.sizes.sm,
                                color: theme.text,
                                paddingVertical: spacing.xs,
                                paddingHorizontal: spacing.sm,
                                textDecorationLine: task.status === 'Completed' ? 'line-through' : 'none',
                                opacity: task.status === 'Completed' ? 0.7 : 1
                              }}
                              value={task.task_title}
                              onChangeText={(text) => handleTaskChange(section.id, task.id, 'task_title', text)}
                              placeholder="Enter task..."
                              placeholderTextColor={theme.textTertiary}
                            />

                            {/* Due Date - Editable */}
                            <TextInput
                              style={{
                                width: 80,
                                fontSize: typography.sizes.xs,
                                color: theme.textSecondary,
                                paddingVertical: spacing.xs,
                                paddingHorizontal: spacing.xs,
                                textAlign: 'center'
                              }}
                              value={task.due_date}
                              onChangeText={(text) => handleTaskChange(section.id, task.id, 'due_date', text)}
                              placeholder="MM/DD"
                              placeholderTextColor={theme.textTertiary}
                            />

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

                            {/* Rating Button */}
                            <View style={{width: 40, alignItems: 'center'}}>
                              {isLeadOrAdmin && task.status === 'Completed' && (
                                <TouchableOpacity onPress={() => handleRateTask(task)}>
                                  <Ionicons name="star-outline" size={16} color={theme.warning} />
                                </TouchableOpacity>
                              )}
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
                              paddingVertical: spacing.xs,
                              paddingHorizontal: spacing.xs,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.border + '30',
                              backgroundColor: theme.primary + '05'
                            }}
                          >
                            <View style={{width: 30, alignItems: 'center'}}>
                              <Ionicons name="ellipse-outline" size={20} color={theme.textTertiary} />
                            </View>

                            <TextInput
                              style={{
                                flex: 2,
                                fontSize: typography.sizes.sm,
                                color: theme.text,
                                paddingVertical: spacing.xs,
                                paddingHorizontal: spacing.sm,
                                borderWidth: 1,
                                borderColor: theme.primary + '50',
                                borderRadius: 4,
                                backgroundColor: theme.background
                              }}
                              value={task.task_title}
                              onChangeText={(text) => handleTaskChange(section.id, task.id, 'task_title', text)}
                              placeholder="Enter task title..."
                              placeholderTextColor={theme.textTertiary}
                              autoFocus
                              onBlur={() => handleSaveNewTask(section.id, task)}
                              onSubmitEditing={() => handleSaveNewTask(section.id, task)}
                            />

                            <TextInput
                              style={{
                                width: 80,
                                fontSize: typography.sizes.xs,
                                color: theme.textSecondary,
                                paddingVertical: spacing.xs,
                                paddingHorizontal: spacing.xs,
                                textAlign: 'center',
                                borderWidth: 1,
                                borderColor: theme.border,
                                borderRadius: 4,
                                backgroundColor: theme.background
                              }}
                              value={task.due_date}
                              onChangeText={(text) => handleTaskChange(section.id, task.id, 'due_date', text)}
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor={theme.textTertiary}
                            />

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
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.xs,
                              opacity: 0.6
                            }}
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
              value={newSectionName}
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
                value={newTaskTitle}
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
                value={newTaskDueDate}
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
                value={newTaskComments}
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
          onPress={() => router.push('/projects/create-project')}
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
              value={editProjectName}
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
              value={editProjectDescription}
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
              Rate Task
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
              value={ratingFeedback}
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
    </SafeAreaView>
  );
}