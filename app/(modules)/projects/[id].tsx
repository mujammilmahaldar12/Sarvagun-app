import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, AnimatedPressable, StatusBadge, KPICard } from '@/components';
import { Project } from '@/types/project.d';
import { useTheme } from '@/hooks/useTheme';

const spacing = {
  xs: 4, sm: 8, base: 16, md: 20, lg: 24, xl: 32, '2xl': 48
};
const borderRadius = { sm: 4, md: 8, lg: 12 };
const typography = { sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20 } };
const getShadowStyle = () => ({ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 });

const ProjectDetailScreen = () => {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const mockProject: Project = {
        id: projectId, title: 'Sample Project', description: 'This is a sample project for demonstration',
        start_date: '2024-11-01', end_date: '2024-12-31', status: 'in_progress', priority: 'high', progress_percentage: 65,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', full_name: 'Admin User', role: 'admin' },
        team_lead: { id: 1, username: 'admin', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', full_name: 'Admin User', role: 'admin' },
        assigned_to: [], sections: []
      };
      setProject(mockProject);
    } catch (error) {
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Project Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: spacing.base, fontSize: typography.sizes.base }}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Project Not Found" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title={project.title} showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing['2xl'] }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.base, ...getShadowStyle() }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.base }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sizes.xl, fontWeight: 'bold', color: theme.text, marginBottom: spacing.xs }}>{project.title}</Text>
              {project.description && (
                <Text style={{ fontSize: typography.sizes.base, color: theme.textSecondary, marginBottom: spacing.base }}>{project.description}</Text>
              )}
            </View>
            <StatusBadge status={project.status} />
          </View>
          <View style={{ marginBottom: spacing.base }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
              <Text style={{ marginLeft: spacing.xs, fontSize: typography.sizes.sm, color: theme.textSecondary }}>Start: {project.start_date}</Text>
            </View>
            {project.end_date && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text style={{ marginLeft: spacing.xs, fontSize: typography.sizes.sm, color: theme.textSecondary }}>End: {project.end_date}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.base }}>
            <AnimatedPressable onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')} style={{ flex: 1, backgroundColor: theme.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.base, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={{ color: theme.textInverse, fontWeight: 'bold', fontSize: typography.sizes.sm }}>Edit Project</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => Alert.alert('Coming Soon', 'Section management will be available soon')} style={{ flex: 1, backgroundColor: `${theme.primary}15`, paddingVertical: spacing.md, paddingHorizontal: spacing.base, borderRadius: borderRadius.md, borderWidth: 1, borderColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
              <Ionicons name="add-outline" size={16} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: typography.sizes.sm }}>Add Section</Text>
            </AnimatedPressable>
          </View>
        </View>
        <View style={{ marginBottom: spacing.base }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: 'bold', color: theme.text, marginBottom: spacing.base }}>Project Overview</Text>
          <View style={{ flexDirection: 'row', gap: spacing.base }}>
            <View style={{ flex: 1 }}>
              <KPICard title="Progress" value={`${project.progress_percentage}%`} icon="trending-up-outline" gradientColors={['#3B82F6', '#1D4ED8']} />
            </View>
            <View style={{ flex: 1 }}>
              <KPICard title="Priority" value={project.priority} icon="flag-outline" gradientColors={['#EF4444', '#DC2626']} />
            </View>
          </View>
        </View>
        <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.base, ...getShadowStyle() }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: 'bold', color: theme.text, marginBottom: spacing.base }}>Project Sections</Text>
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Ionicons name="folder-outline" size={48} color={theme.textSecondary} />
            <Text style={{ fontSize: typography.sizes.base, color: theme.textSecondary, textAlign: 'center', marginTop: spacing.base }}>No sections yet. Add a section to organize your project tasks.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProjectDetailScreen;


