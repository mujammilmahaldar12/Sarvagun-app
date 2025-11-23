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
import { useAuthStore } from '@/store/authStore';
import { useMyProfile, useTeamMembers } from '@/hooks/useHRQueries';
import { 
  Avatar, 
  AnimatedPressable, 
  LoadingState, 
  ErrorBoundary,
  Skeleton,
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

  // Calculate enhanced profile data
  const enhancedProfile = useMemo(() => {
    const currentUser = profileData || user;
    if (!currentUser) return null;

    // Type guard for date field
    const joinDate = 'date_joined' in currentUser ? currentUser.date_joined : 
                     ('date_of_joining' in currentUser ? currentUser.date_of_joining : undefined);
    const tenureMonths = calculateTenureMonths(joinDate);
    const attendance = generateAttendancePercentage(tenureMonths, currentUser.category);
    const skills = generateSkills(currentUser.category, tenureMonths, currentUser.designation);
    const certifications = generateCertifications(
      currentUser.category,
      tenureMonths,
      joinDate
    );

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
  }, [profileData, user, teamMembers]);

  // Mock project stats (replace with real data when available)
  const projectStats = {
    projectsCompleted: 8,
    tasksCompleted: 34,
    averageRating: 4.6,
  };

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
          <LoadingState type="card" items={1} />
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

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <AnimatedPressable onPress={() => router.back()} hapticType="light">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        <AnimatedPressable onPress={() => router.push('/(settings)/account')} hapticType="light">
          <Ionicons name="create-outline" size={24} color={theme.primary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
          <Avatar
            size={100}
            source={enhancedProfile.photo ? { uri: enhancedProfile.photo } : undefined}
            name={enhancedProfile.full_name}
            onlineStatus={'is_active' in enhancedProfile ? enhancedProfile.is_active : 
                        ('status' in enhancedProfile && enhancedProfile.status === 'active')}
          />
          
          <Text style={[styles.profileName, { color: theme.text }]}>
            {enhancedProfile.full_name || 'User Name'}
          </Text>
          
          <Text style={[styles.profileDesignation, { color: theme.textSecondary }]}>
            {enhancedProfile.designation || 'Team Member'}
          </Text>
          
          <View style={styles.profileBadges}>
            {enhancedProfile.department && (
              <Badge label={enhancedProfile.department} variant="filled" status="info" />
            )}
            {enhancedProfile.category && (
              <Badge
                label={enhancedProfile.category.toUpperCase()}
                variant="filled"
                status={
                  enhancedProfile.category === 'manager' || enhancedProfile.category === 'hr'
                    ? 'success'
                    : 'info'
                }
              />
            )}
            {enhancedProfile.team_size > 0 && (
              <Badge
                label={`Team Lead (${enhancedProfile.team_size})`}
                variant="filled"
                status="warning"
              />
            )}
          </View>

          {/* Bio */}
          {enhancedProfile.bio && (
            <Text style={[styles.profileBio, { color: theme.textSecondary }]}>
              {enhancedProfile.bio}
            </Text>
          )}

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: theme.text }]}>
                {formatTenure(enhancedProfile.tenureMonths)}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>
                Tenure
              </Text>
            </View>
            <View style={[styles.quickStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: theme.text }]}>
                {projectStats.projectsCompleted}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>
                Projects
              </Text>
            </View>
            <View style={[styles.quickStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: theme.text }]}>
                {enhancedProfile.attendance_percentage.toFixed(0)}%
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>
                Attendance
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  profileName: {
    ...getTypographyStyle('2xl', 'bold'),
    marginTop: spacing.base,
    textAlign: 'center',
  },
  profileDesignation: {
    ...getTypographyStyle('base', 'medium'),
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.base,
    justifyContent: 'center',
  },
  profileBio: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    marginTop: spacing.base,
    lineHeight: 20,
    paddingHorizontal: spacing.base,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    ...getTypographyStyle('xl', 'bold'),
  },
  quickStatLabel: {
    ...getTypographyStyle('xs', 'medium'),
    marginTop: spacing.xs,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
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
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.base,
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
