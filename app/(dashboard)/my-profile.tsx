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
  Pressable, // Added Pressable
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
  useUserActivities,
  useUserEducation,
  useUserExperience,
  useUserSocialLinks,
  useAttendancePercentage
} from '@/hooks/useHRQueries';
import { useMyInternship, useMyExtensions } from '@/hooks/useInternshipQueries';
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
import { EducationCard } from '@/components/ui/EducationCard';
import { ExperienceCard } from '@/components/ui/ExperienceCard';
import { CollaborationTree } from '@/components/ui/CollaborationTree';
import { JourneyTimeline } from '@/components/ui/JourneyTimeline';
import type { JourneyEvent } from '@/components/ui/JourneyTimeline';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle, getCardStyle } from '@/utils/styleHelpers';
import {
  calculateTenureMonths,
  formatTenure,
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

// Build journey events from profile, internship, and extensions data
const buildJourneyEvents = (
  profile: any,
  internship: any,
  extensions: any[]
): JourneyEvent[] => {
  const events: JourneyEvent[] = [];

  // For interns with internship data
  if (profile?.category === 'intern' && internship) {
    // Start event
    events.push({
      id: 'start',
      type: 'start',
      title: 'Started Internship',
      subtitle: `Position: ${profile.designation || 'Intern'}`,
      date: internship.start_date,
      details: `Joined as an intern in the ${profile.department || 'team'}`,
      durationLabel: internship.is_active ? undefined : 'Completed',
    });

    // Extension events (sorted by date)
    if (extensions && extensions.length > 0) {
      const sortedExtensions = [...extensions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedExtensions.forEach((ext, index) => {
        events.push({
          id: `extension-${ext.id}`,
          type: 'extension',
          title: `Extension ${ext.status === 'approved' ? 'Approved' : ext.status === 'pending' ? 'Requested' : 'Rejected'}`,
          subtitle: `Duration: ${ext.duration_months} month${ext.duration_months > 1 ? 's' : ''}`,
          date: ext.original_end_date,
          endDate: ext.new_end_date,
          status: ext.status as 'approved' | 'pending' | 'rejected',
          details: ext.reason || undefined,
          durationLabel: `+${ext.duration_months} month${ext.duration_months > 1 ? 's' : ''}`,
        });
      });
    }

    // Current status
    if (internship.is_active && internship.end_date) {
      const daysRemaining = internship.days_remaining;
      events.push({
        id: 'current',
        type: 'current',
        title: 'Current Status',
        subtitle: daysRemaining && daysRemaining > 0
          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
          : daysRemaining && daysRemaining < 0
            ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
            : 'Ending soon',
        date: internship.end_date,
        details: 'Your current internship end date',
      });
    }
  } else {
    // For non-interns (employees, managers, etc.)
    const joinDate = profile?.date_joined || profile?.joiningdate || profile?.joining_date;

    if (joinDate) {
      events.push({
        id: 'start',
        type: 'start',
        title: `Joined as ${profile.designation || 'Team Member'}`,
        subtitle: `Department: ${profile.department || 'N/A'}`,
        date: joinDate,
        details: `Started your journey with the company`,
      });

      // Calculate tenure and add current milestone
      const tenureMonths = Math.floor(
        (new Date().getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      events.push({
        id: 'current',
        type: 'current',
        title: 'Current Position',
        subtitle: profile.designation || 'Team Member',
        date: new Date().toISOString().split('T')[0],
        details: tenureMonths >= 12
          ? `${Math.floor(tenureMonths / 12)} year${Math.floor(tenureMonths / 12) > 1 ? 's' : ''} ${tenureMonths % 12} month${tenureMonths % 12 !== 1 ? 's' : ''} tenure`
          : `${tenureMonths} month${tenureMonths !== 1 ? 's' : ''} tenure`,
        durationLabel: `${tenureMonths} months`,
      });
    }
  }

  return events;
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

  // Safe userId - don't force non-null assertion
  const userId = profileData?.id || user?.id;

  // Fetch user profile data - only when userId is available
  // Using ?? 0 provides a safe fallback that won't break hooks but will be disabled
  const safeUserId = userId ?? 0;
  const { data: userProjects = [], isLoading: projectsLoading } = useUserProjects(safeUserId);
  const { data: userSkills = [], isLoading: skillsLoading } = useUserSkills(safeUserId);
  const { data: userCertifications = [], isLoading: certificationsLoading } = useUserCertifications(safeUserId);
  const { data: userEducation = [], isLoading: educationLoading } = useUserEducation(safeUserId || undefined);
  const { data: userExperience = [], isLoading: experienceLoading } = useUserExperience(safeUserId || undefined);
  const { data: userSocialLinks, isLoading: socialLinksLoading } = useUserSocialLinks(safeUserId || undefined);
  const { data: userPerformance, isLoading: performanceLoading } = useUserPerformance(safeUserId);
  const { data: userGoals = [], isLoading: goalsLoading } = useUserGoals(safeUserId);
  const { data: userActivities = [], isLoading: activitiesLoading } = useUserActivities(safeUserId, 20);
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendancePercentage();

  // Internship and extensions data for journey
  const { data: internshipData, isLoading: internshipLoading } = useMyInternship();
  const { data: extensionsData = [], isLoading: extensionsLoading } = useMyExtensions();

  // Calculate enhanced profile data
  const enhancedProfile = useMemo(() => {
    const currentUser = profileData || user;
    if (!currentUser) return null;

    // Type guard for date field
    const joinDate = 'date_joined' in currentUser ? currentUser.date_joined :
      ('date_of_joining' in currentUser ? currentUser.date_of_joining : undefined);
    const tenureMonths = calculateTenureMonths(joinDate);

    // Use real API data only
    const skills = userSkills;
    const certifications = userCertifications;
    const attendance = attendanceData?.percentage || 0;

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
  }, [profileData, user, teamMembers, userSkills, userCertifications, attendanceData]);

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

  // Filter real team data only
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

  // Check if we have any team data to display
  const hasTeamData = !!manager || directReports.length > 0 || peers.length > 0;

  console.log('My Profile Data:', {
    hasManager: !!manager,
    directReportsCount: directReports.length,
    peersCount: peers.length,
    hasTeamData,
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

          {'headline' in enhancedProfile && enhancedProfile.headline ? (
            <Text style={[styles.profileHeadline, { color: theme.primary }]}>
              {enhancedProfile.headline}
            </Text>
          ) : (
            <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
              {enhancedProfile.designation || 'Team Member'}
            </Text>
          )}

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
              { key: 'education', label: 'Education' },
              { key: 'experience', label: 'Experience' },
              { key: 'journey', label: 'Journey' },
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
              {/* Performance Metrics */}
              <View style={styles.contentSection}>
                {performanceLoading ? (
                  <LoadingState />
                ) : userPerformance ? (
                  <Card style={styles.performanceCard}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing.md }]}>
                      Performance Metrics
                    </Text>
                    <View style={styles.performanceGrid}>
                      {userPerformance.productivity_score !== undefined && (
                        <View style={styles.metricBox}>
                          <Ionicons name="trending-up" size={24} color={moduleColors.projects.main} />
                          <Text style={[styles.metricValue, { color: theme.text }]}>
                            {userPerformance.productivity_score}%
                          </Text>
                          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                            Productivity
                          </Text>
                        </View>
                      )}
                      {userPerformance.average_rating !== undefined && (
                        <View style={styles.metricBox}>
                          <Ionicons name="star" size={24} color={moduleColors.events.main} />
                          <Text style={[styles.metricValue, { color: theme.text }]}>
                            {userPerformance.average_rating.toFixed(1)}
                          </Text>
                          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                            Avg Rating
                          </Text>
                        </View>
                      )}
                      {attendanceData?.percentage !== undefined && (
                        <View style={styles.metricBox}>
                          <Ionicons name="calendar-outline" size={24} color={moduleColors.hr.main} />
                          <Text style={[styles.metricValue, { color: theme.text }]}>
                            {attendanceData.percentage.toFixed(0)}%
                          </Text>
                          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                            Attendance
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                ) : null}
              </View>

              {/* Goals & OKRs - Real API Data */}
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Current Goals
                </Text>
                {goalsLoading ? (
                  <LoadingState />
                ) : userGoals.length > 0 ? (
                  <View style={styles.goalsGrid}>
                    {userGoals.slice(0, 6).map((goal: any) => (
                      <GoalCard
                        key={goal.id}
                        title={goal.title}
                        description={goal.description || ''}
                        progress={goal.progress || 0}
                        current={goal.current_value?.toString() || '0'}
                        target={goal.target_value?.toString() || '100'}
                        color={goal.category === 'personal' ? moduleColors.projects.main :
                          goal.category === 'quarterly' ? moduleColors.finance.main :
                            goal.category === 'team' ? moduleColors.events.main :
                              moduleColors.hr.main}
                        icon={goal.category === 'personal' ? 'person' :
                          goal.category === 'quarterly' ? 'calendar' :
                            goal.category === 'team' ? 'people' : 'briefcase'}
                        dueDate={goal.target_date ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined}
                      />
                    ))}
                  </View>
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="flag-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No goals set yet. Set goals to track your progress!
                    </Text>
                  </Card>
                )}
              </View>

              {/* Activity Timeline - Real API Data */}
              <View style={styles.contentSection}>
                {activitiesLoading ? (
                  <LoadingState />
                ) : userActivities.length > 0 ? (
                  <ActivityTimeline
                    activities={userActivities.map((activity: any) => ({
                      id: activity.id?.toString() || Math.random().toString(),
                      type: activity.type || activity.activity_type || 'task',
                      title: activity.title || activity.action || 'Activity',
                      description: activity.description || activity.message || '',
                      timestamp: activity.timestamp || activity.created_at || new Date(),
                      icon: activity.icon || (activity.type === 'task' ? 'checkmark-circle' :
                        activity.type === 'project' ? 'briefcase' :
                          activity.type === 'leave' ? 'calendar-outline' :
                            activity.type === 'event' ? 'calendar' :
                              activity.type === 'achievement' ? 'star' : 'flash'),
                      color: activity.color || (activity.type === 'task' ? moduleColors.finance.main :
                        activity.type === 'project' ? moduleColors.projects.main :
                          activity.type === 'leave' ? moduleColors.leave.main :
                            activity.type === 'event' ? moduleColors.events.main :
                              moduleColors.hr.main),
                    }))}
                    maxItems={10}
                  />
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No recent activities to display
                    </Text>
                  </Card>
                )}
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
                {certificationsLoading ? (
                  <LoadingState />
                ) : enhancedProfile.certifications.length > 0 ? (
                  enhancedProfile.certifications.map((cert) => (
                    <CertificationCard key={cert.id} certification={cert} />
                  ))
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="ribbon-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No certifications added yet
                    </Text>
                  </Card>
                )}
              </View>
            </View>
          )}

          {activeTab === 'education' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Education & Academic Background
                </Text>
                <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                  {userEducation.length} education record{userEducation.length !== 1 ? 's' : ''}
                </Text>
                {educationLoading ? (
                  <LoadingState />
                ) : userEducation.length > 0 ? (
                  userEducation.map((edu: any) => (
                    <EducationCard key={edu.id} education={edu} />
                  ))
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="school-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No education records added yet
                    </Text>
                  </Card>
                )}
              </View>
            </View>
          )}

          {activeTab === 'experience' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Work Experience & Career History
                </Text>
                <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                  {userExperience.length} work experience record{userExperience.length !== 1 ? 's' : ''}
                </Text>
                {experienceLoading ? (
                  <LoadingState />
                ) : userExperience.length > 0 ? (
                  userExperience.map((exp: any) => (
                    <ExperienceCard key={exp.id} experience={exp} />
                  ))
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="briefcase-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No work experience added yet
                    </Text>
                  </Card>
                )}
              </View>

              {/* Social Links Section */}
              {userSocialLinks && Object.keys(userSocialLinks).some(key =>
                key !== 'id' && key !== 'user' && userSocialLinks[key as keyof typeof userSocialLinks]
              ) && (
                  <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Professional Links
                    </Text>
                    <Card style={styles.socialLinksCard}>
                      {userSocialLinks.linkedin && (
                        <Pressable
                          style={styles.socialLinkRow}
                          onPress={() => console.log('Open LinkedIn:', userSocialLinks.linkedin)}
                        >
                          <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
                          <Text style={[styles.socialLinkText, { color: theme.text }]}>
                            LinkedIn
                          </Text>
                          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                      {userSocialLinks.github && (
                        <Pressable
                          style={styles.socialLinkRow}
                          onPress={() => console.log('Open GitHub:', userSocialLinks.github)}
                        >
                          <Ionicons name="logo-github" size={24} color={isDark ? '#FFF' : '#000'} />
                          <Text style={[styles.socialLinkText, { color: theme.text }]}>
                            GitHub
                          </Text>
                          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                      {userSocialLinks.portfolio && (
                        <Pressable
                          style={styles.socialLinkRow}
                          onPress={() => console.log('Open Portfolio:', userSocialLinks.portfolio)}
                        >
                          <Ionicons name="briefcase-outline" size={24} color={theme.primary} />
                          <Text style={[styles.socialLinkText, { color: theme.text }]}>
                            Portfolio
                          </Text>
                          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                      {userSocialLinks.twitter && (
                        <Pressable
                          style={styles.socialLinkRow}
                          onPress={() => console.log('Open Twitter:', userSocialLinks.twitter)}
                        >
                          <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                          <Text style={[styles.socialLinkText, { color: theme.text }]}>
                            Twitter
                          </Text>
                          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                      {userSocialLinks.website && (
                        <Pressable
                          style={styles.socialLinkRow}
                          onPress={() => console.log('Open Website:', userSocialLinks.website)}
                        >
                          <Ionicons name="globe-outline" size={24} color={theme.primary} />
                          <Text style={[styles.socialLinkText, { color: theme.text }]}>
                            Website
                          </Text>
                          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                    </Card>
                  </View>
                )}
            </View>
          )}

          {activeTab === 'journey' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Career Journey
                </Text>
                <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                  Your professional timeline and milestones
                </Text>
                {(internshipLoading || extensionsLoading) ? (
                  <LoadingState />
                ) : (
                  <JourneyTimeline
                    events={buildJourneyEvents(enhancedProfile, internshipData, extensionsData)}
                    currentPosition={enhancedProfile.designation}
                  />
                )}
              </View>
            </View>
          )}

          {activeTab === 'team' && (
            <View style={styles.tabPanel}>
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Team & Collaboration
                </Text>
                {teamLoading ? (
                  <LoadingState />
                ) : hasTeamData ? (
                  <>
                    <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                      Organizational hierarchy and reporting structure
                    </Text>
                    <CollaborationTree
                      currentUser={enhancedProfile as any}
                      manager={manager}
                      teamMembers={directReports}
                      peers={peers}
                      topManagement={undefined}
                    />
                  </>
                ) : (
                  <Card style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No team hierarchy data available
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                      Team relationships will appear here when configured
                    </Text>
                  </Card>
                )}
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileHeadline: {
    ...getTypographyStyle('sm', 'semibold'),
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
    ...getTypographyStyle('xs', 'medium'),
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
    ...getTypographyStyle('xs', 'medium'),
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
  emptyState: {
    padding: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyStateText: {
    ...getTypographyStyle('base', 'medium'),
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  performanceCard: {
    padding: spacing.lg,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-around',
  },
  metricBox: {
    alignItems: 'center',
    minWidth: 100,
    gap: spacing.xs,
  },
  metricValue: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  metricLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  socialLinksCard: {
    padding: spacing.sm,
  },
  socialLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  socialLinkText: {
    ...getTypographyStyle('base', 'medium'),
    flex: 1,
  },
});
