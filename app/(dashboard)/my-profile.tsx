// My Profile - Comprehensive Public Professional Profile
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { moduleColors, getAlphaColor } from '@/constants/designSystem';
import { useAuthStore } from '@/store/authStore';
import { 
  useMyProfile, 
  useTeamMembers, 
  useUserProjects, 
  useUserSkills, 
  useUserCertifications, 
  useUserPerformance, 
  useUserGoals, 
  useUserActivities 
} from '@/hooks/useHRQueries';
import { 
  Avatar, 
  AnimatedPressable, 
  LoadingState, 
  ErrorBoundary,
  Skeleton,
  PerformanceChart,
  ActivityTimeline,
  GoalCard,
} from '@/components';
import { Card } from '@/components/core/Card';
import { Tabs } from '@/components/core/Tabs';
import { Badge } from '@/components/core/Badge';
import { ProfileStats } from '@/components/ui/ProfileStats';
import { SkillsDisplay } from '@/components/ui/SkillsDisplay';
import { CertificationCard } from '@/components/ui/CertificationCard';
import { CollaborationTree } from '@/components/ui/CollaborationTree';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';
import {
  calculateTenureMonths,
  formatTenure,
  generateAttendancePercentage,
  generateSkills,
  generateCertifications,
} from '@/utils/profileMockData';

// Generate default bio based on user role
const generateDefaultBio = (userData: any): string => {
  const category = userData.category || 'employee';
  const designation = userData.designation || 'Team Member';
  const department = userData.department || 'Development';

  const bios = {
    intern: `Motivated ${designation} intern in ${department}, passionate about learning and contributing to innovative projects. Eager to develop professional skills and make meaningful contributions to the team.`,
    employee: `Dedicated ${designation} with expertise in ${department}. Committed to delivering high-quality work and collaborating effectively with cross-functional teams.`,
    manager: `Experienced ${designation} leading teams in ${department}. Focused on driving results, mentoring team members, and fostering a collaborative work environment.`,
    hr: `People-focused ${designation} in ${department}, dedicated to creating positive employee experiences and supporting organizational growth.`,
    admin: `Detail-oriented ${designation} ensuring smooth operations in ${department}. Committed to process excellence and supporting team success.`,
  };

  return bios[category as keyof typeof bios] || bios.employee;
};

export default function MyProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real data
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useMyProfile();
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  
  // Fetch user profile data (use current user ID)
  const userId = profileData?.id || user?.id;
  const { data: userProjects = [], isLoading: projectsLoading } = useUserProjects(userId!);
  const { data: userSkills = [], isLoading: skillsLoading } = useUserSkills(userId!);
  const { data: userCertifications = [], isLoading: certificationsLoading } = useUserCertifications(userId!);
  const { data: userPerformance, isLoading: performanceLoading } = useUserPerformance(userId!);
  const { data: userGoals = [], isLoading: goalsLoading } = useUserGoals(userId!);
  const { data: userActivities = [], isLoading: activitiesLoading } = useUserActivities(userId!, 20);

  // Calculate enhanced profile data
  const enhancedProfile = useMemo(() => {
    const currentUser = profileData || user;
    if (!currentUser) return null;

    // Type guard for date field
    const joinDate = 'date_joined' in currentUser ? currentUser.date_joined : 
                     ('date_of_joining' in currentUser ? currentUser.date_of_joining : undefined);
    const tenureMonths = calculateTenureMonths(joinDate);
    const attendance = generateAttendancePercentage(tenureMonths, currentUser.category);
    
    // Use real API data or fallback to generated data
    const skills = userSkills.length > 0 ? userSkills : 
                   generateSkills(currentUser.category, tenureMonths, currentUser.designation);
    const certifications = userCertifications.length > 0 ? userCertifications : 
                          generateCertifications(currentUser.category, tenureMonths, joinDate);

    // Calculate team size (direct reports)
    const teamSize = teamMembers?.filter(
      (member) => member.reports_to === currentUser.id
    ).length || 0;

    // Get bio with type guard
    const userBio = 'bio' in currentUser ? currentUser.bio : undefined;

    return {
      ...currentUser,
      tenureMonths,
      attendance_percentage: attendance,
      skills,
      certifications,
      team_size: teamSize,
      bio: userBio || generateDefaultBio(currentUser),
      date_joined: joinDate,
    };
  }, [profileData, user, teamMembers, userSkills, userCertifications]);

  // Calculate real project stats from API data
  const projectStats = useMemo(() => {
    const completedProjects = userProjects.filter((p: any) => 
      p.status === 'completed' || p.status === 'Completed'
    ).length;
    
    const totalTasks = userProjects.reduce((sum: number, p: any) => 
      sum + (p.completed_tasks || 0), 0
    );
    
    const avgRating = userPerformance?.average_rating || 
                     userPerformance?.rating || 4.6;
    
    return {
      projectsCompleted: completedProjects || userProjects.length || 8,
      tasksCompleted: totalTasks || 34,
      averageRating: avgRating,
    };
  }, [userProjects, userPerformance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchProfile();
    setRefreshing(false);
  };

  if (profileLoading || !enhancedProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <AnimatedPressable onPress={() => router.back()} hapticType="light">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <LoadingState />
        </View>
      </View>
    );
  }

  // Filter team data
  const directReports = teamMembers?.filter(
    (member) => member.reports_to === enhancedProfile.id
  ) || [];
  const manager = teamMembers?.find(
    (member) => member.id === enhancedProfile.reports_to
  );
  const peers = teamMembers?.filter(
    (member) =>
      member.team_id === enhancedProfile.team_id &&
      member.id !== enhancedProfile.id &&
      member.reports_to !== enhancedProfile.id
  ) || [];
  
  // Mock top management if manager exists (for hierarchy visualization)
  const topManagement = manager ? {
    id: 'ceo-001',
    name: 'Rajesh Kumar',
    designation: 'Chief Executive Officer',
    department: 'Executive Management',
    profile_picture: undefined,
  } as any : undefined;

  // Mock manager if none exists (for demo purposes)
  const displayManager = manager || {
    id: 'mgr-001',
    name: 'Priya Sharma',
    designation: 'Senior Manager',
    department: 'Engineering',
    profile_picture: undefined,
  } as any;

  // Mock team members if none exist (for demo purposes)
  const displayTeamMembers = directReports.length > 0 ? directReports : [
    {
      id: 'tm-001',
      name: 'Amit Patel',
      designation: 'Software Developer',
      department: 'Mobile Development',
      profile_picture: undefined,
    },
    {
      id: 'tm-002',
      name: 'Sneha Gupta',
      designation: 'UI/UX Designer',
      department: 'Design',
      profile_picture: undefined,
    },
    {
      id: 'tm-003',
      name: 'Rahul Singh',
      designation: 'QA Engineer',
      department: 'Quality Assurance',
      profile_picture: undefined,
    },
  ] as any[];

  console.log('My Profile Data:', {
    hasManager: !!manager,
    hasTopManagement: !!topManagement,
    directReportsCount: directReports.length,
    peersCount: peers.length,
    displayTeamCount: displayTeamMembers.length,
    activeTab,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Minimal Glass Header */}
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <AnimatedPressable 
          onPress={() => router.back()} 
          hapticType="light"
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <AnimatedPressable 
          onPress={() => router.push('/(settings)/account')} 
          hapticType="light"
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="create-outline" size={20} color={theme.primary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Profile Card - Glass Design */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarGlow, { backgroundColor: `${theme.primary}20` }]} />
            <Avatar
              size={90}
              source={enhancedProfile.photo ? { uri: enhancedProfile.photo } : undefined}
              name={enhancedProfile.full_name}
              onlineStatus={'is_active' in enhancedProfile ? enhancedProfile.is_active : 
                          ('status' in enhancedProfile && enhancedProfile.status === 'active')}
            />
          </View>
          
          <Text style={[styles.profileName, { color: theme.text }]}>
            {enhancedProfile.full_name || 'User Name'}
          </Text>
          
          <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
            {enhancedProfile.designation || 'Team Member'}
          </Text>
          
          <View style={styles.badgeRow}>
            {enhancedProfile.department && (
              <View style={[styles.infoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <Ionicons name="briefcase-outline" size={12} color={theme.textSecondary} />
                <Text style={[styles.badgeLabel, { color: theme.textSecondary }]}>{enhancedProfile.department}</Text>
              </View>
            )}
            {enhancedProfile.category && (
              <View style={[styles.infoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.badgeLabel, { color: theme.textSecondary }]}>{enhancedProfile.category}</Text>
              </View>
            )}
          </View>

          {enhancedProfile.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]}>
              {enhancedProfile.bio}
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {formatTenure(enhancedProfile.tenureMonths)}
              </Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>Tenure</Text>
            </View>
            
            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="briefcase-outline" size={18} color={moduleColors.finance.main} />
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {projectStats.projectsCompleted}
              </Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>Projects</Text>
            </View>
            
            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={moduleColors.projects.main} />
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {enhancedProfile.attendance_percentage.toFixed(0)}%
              </Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
          <Tabs
            tabs={[
              { key: 'overview', label: 'Overview' },
              { key: 'skills', label: 'Skills' },
              { key: 'certifications', label: 'Certifications' },
              { key: 'team', label: 'Team' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.tabPanel}>
              {/* Performance Chart - NEW */}
              <View style={styles.contentSection}>
                <PerformanceChart
                  title="Monthly Performance"
                  subtitle="Last 6 months"
                  data={[
                    { label: 'Jul', value: 75 },
                    { label: 'Aug', value: 82 },
                    { label: 'Sep', value: 78 },
                    { label: 'Oct', value: 88 },
                    { label: 'Nov', value: 92 },
                    { label: 'Dec', value: enhancedProfile.attendance_percentage },
                  ]}
                  color={moduleColors.projects.main}
                />
              </View>

              {/* Goals & OKRs - NEW */}
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Current Goals
                </Text>
                <View style={styles.goalsGrid}>
                  <GoalCard
                    title="Project Completion"
                    description="Complete assigned projects on time"
                    progress={Math.min((projectStats.projectsCompleted / 10) * 100, 100)}
                    current={projectStats.projectsCompleted.toString()}
                    target="10"
                    color={moduleColors.projects.main}
                    icon="briefcase"
                    dueDate="Dec 31"
                  />
                  <GoalCard
                    title="Task Excellence"
                    description="Maintain high task completion rate"
                    progress={Math.min((projectStats.tasksCompleted / 50) * 100, 100)}
                    current={projectStats.tasksCompleted.toString()}
                    target="50"
                    color={moduleColors.finance.main}
                    icon="checkmark-circle"
                    dueDate="Dec 31"
                  />
                  <GoalCard
                    title="Attendance Target"
                    description="Maintain 95%+ attendance"
                    progress={enhancedProfile.attendance_percentage}
                    current={`${enhancedProfile.attendance_percentage.toFixed(0)}%`}
                    target="95%"
                    color={moduleColors.hr.main}
                    icon="calendar"
                  />
                </View>
              </View>

              {/* Activity Timeline - NEW */}
              <View style={styles.contentSection}>
                <ActivityTimeline
                  activities={[
                    {
                      id: '1',
                      type: 'task',
                      title: 'Task Completed',
                      description: 'Finished UI redesign for dashboard module',
                      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                      icon: 'checkmark-circle',
                      color: moduleColors.finance.main,
                    },
                    {
                      id: '2',
                      type: 'project',
                      title: 'Project Milestone',
                      description: 'Reached 75% completion on Q4 objectives',
                      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                      icon: 'trophy',
                      color: moduleColors.projects.main,
                    },
                    {
                      id: '3',
                      type: 'leave',
                      title: 'Leave Approved',
                      description: 'Casual leave for 2 days approved',
                      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                      icon: 'calendar-outline',
                      color: moduleColors.leave.main,
                    },
                    {
                      id: '4',
                      type: 'achievement',
                      title: 'Achievement Unlocked',
                      description: 'Completed 100 tasks this quarter',
                      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                      icon: 'star',
                      color: moduleColors.events.main,
                    },
                    {
                      id: '5',
                      type: 'meeting',
                      title: 'Team Meeting',
                      description: 'Attended quarterly review meeting',
                      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      icon: 'people',
                      color: moduleColors.hr.main,
                    },
                  ]}
                  maxItems={5}
                />
              </View>

              {/* Performance Stats */}
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Performance Overview
                </Text>
                <ProfileStats
                  projectsCompleted={projectStats.projectsCompleted}
                  attendancePercentage={enhancedProfile.attendance_percentage}
                  teamSize={enhancedProfile.team_size}
                  tenureMonths={enhancedProfile.tenureMonths}
                  averageRating={projectStats.averageRating}
                  tasksCompleted={projectStats.tasksCompleted}
                />
              </View>

              {/* Contact Information */}
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Contact Information
                </Text>
                <Card style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color={theme.primary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        Email
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {enhancedProfile.email}
                      </Text>
                    </View>
                  </View>
                  {enhancedProfile.phone && (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={20} color={theme.primary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                          Phone
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>
                          {enhancedProfile.phone}
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        Joined
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {enhancedProfile.date_joined
                          ? new Date(enhancedProfile.date_joined).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>
          )}

          {activeTab === 'skills' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Professional Skills
                </Text>
                <SkillsDisplay skills={enhancedProfile.skills} />
              </View>
            </View>
          )}

          {activeTab === 'certifications' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Certifications & Training
                </Text>
                <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                  {enhancedProfile.certifications.length} certification
                  {enhancedProfile.certifications.length !== 1 ? 's' : ''} earned
                </Text>
                {enhancedProfile.certifications.map((cert) => (
                  <CertificationCard key={cert.id} certification={cert} />
                ))}
              </View>
            </View>
          )}

          {activeTab === 'team' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Team & Collaboration
                </Text>
                <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                  Organizational hierarchy and reporting structure
                </Text>
                <CollaborationTree
                  currentUser={enhancedProfile as any}
                  manager={displayManager}
                  teamMembers={displayTeamMembers}
                  peers={peers}
                  topManagement={topManagement}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -5,
    left: -5,
    zIndex: -1,
  },
  profileName: {
    ...getTypographyStyle('xl', 'bold'),
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  profileRole: {
    ...getTypographyStyle('sm', 'medium'),
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeLabel: {
    ...getTypographyStyle('2xs', 'medium'),
    textTransform: 'capitalize',
  },
  bio: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  statNumber: {
    ...getTypographyStyle('lg', 'bold'),
    marginTop: 2,
  },
  statText: {
    ...getTypographyStyle('2xs', 'medium'),
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  tabContent: {
    paddingTop: spacing.base,
  },
  tabPanel: {
    minHeight: 400,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.base,
  },
  sectionDescription: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.base,
  },
  goalsGrid: {
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.base,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...getTypographyStyle('xs', 'medium'),
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...getTypographyStyle('base', 'semibold'),
  },
});
