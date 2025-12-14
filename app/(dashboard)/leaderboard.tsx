import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  withTiming,
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useInternLeaderboard, useTeamLeaderboard, useLeadersLeaderboard, useIndividualInternRanking } from '@/hooks/useDashboardQueries';
import { Avatar, AnimatedPressable, Skeleton, DatePicker } from '@/components';
import { Select } from '@/components/core/Select';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'individual' | 'team' | 'leaders';
type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// Option type for Select
const FILTER_OPTIONS = [
  { label: 'Individual', value: 'individual' },
  { label: 'Teams', value: 'team' },
  { label: 'Leaders', value: 'leaders' },
];

const TIME_OPTIONS = [
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Year', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
];

// Filter Tab removed

// Active Status Indicator
const ActiveStatusBadge = ({ isActive, lastActivity }: { isActive: boolean; lastActivity?: string }) => {
  const { theme } = useTheme();

  const getStatusColor = () => {
    if (isActive) return '#22C55E'; // Green
    return '#EF4444'; // Red
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
};

// Animated Podium Item Component for Top 3
const AnimatedPodiumItem = ({ leader, rank, delay }: any) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const scale = useSharedValue(0);
  const translateY = useSharedValue(100);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 120 })
    );

    if (rank === 1) {
      glowOpacity.value = withDelay(
        delay + 500,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getRankColor = () => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return theme.primary;
  };

  const getRankIcon = (): keyof typeof Ionicons.glyphMap => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'ribbon';
    return 'star';
  };

  const rankColor = getRankColor();
  const podiumHeight = rank === 1 ? 160 : rank === 2 ? 130 : 120;

  return (
    <AnimatedPressable
      onPress={() => router.push(`/(dashboard)/my-profile?userId=${leader.id}` as any)}
      style={[styles.podiumItemContainer, animatedStyle]}
      hapticType="light"
      springConfig="gentle"
    >
      <View style={[
        styles.podiumContentWrapper,
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }
      ]}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Ionicons
            name={getRankIcon()}
            size={rank === 1 ? 20 : 16}
            color="#FFFFFF"
          />
        </View>

        {/* Avatar with glow effect for winner */}
        <View style={styles.avatarContainer}>
          {rank === 1 && (
            <Animated.View style={[styles.glowRing, glowStyle, { borderColor: rankColor }]} />
          )}
          <Avatar
            size={rank === 1 ? 68 : rank === 2 ? 56 : 52}
            source={leader.photo ? { uri: leader.photo } : undefined}
            name={leader.name}
            onlineStatus={leader.is_active}
          />
        </View>

        {/* Active Status */}
        <ActiveStatusBadge isActive={leader.is_active} lastActivity={leader.last_activity} />

        {/* Name */}
        <Text
          style={[
            styles.podiumNameNew,
            { color: theme.text },
            rank === 1 && styles.podiumNameFirst
          ]}
          numberOfLines={1}
        >
          {leader.name}
        </Text>

        {/* Team Name */}
        {leader.team_name && (
          <View style={styles.teamBadge}>
            <Ionicons name="people" size={10} color={theme.textSecondary} />
            <Text style={[styles.teamBadgeText, { color: theme.textSecondary }]} numberOfLines={1}>
              {leader.team_name}
            </Text>
          </View>
        )}

        {/* Score */}
        <LinearGradient
          colors={[rankColor + '20', rankColor + '10']}
          style={styles.scoreContainer}
        >
          <Text style={[styles.scoreValue, { color: rankColor }]}>
            {leader.score}
          </Text>
        </LinearGradient>

        {/* Task Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.text }]}>{leader.completed_tasks || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Done</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.text }]}>{leader.in_progress_tasks || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active</Text>
          </View>
        </View>
      </View>

      {/* Podium Base */}
      <LinearGradient
        colors={[rankColor + '40', rankColor + '20', rankColor + '10']}
        style={[
          styles.podiumBase,
          {
            height: podiumHeight,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)'
          }
        ]}
      >
        <Text style={[styles.podiumRankText, { color: rankColor }]}>#{rank}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

// Individual Intern Row Component
const InternRow = ({ leader, index }: { leader: any; index: number }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const getRankColor = (rank: number) => {
    if (rank <= 3) return theme.primary;
    return theme.textSecondary;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <AnimatedPressable
        onPress={() => router.push(`/(dashboard)/my-profile?userId=${leader.id}` as any)}
        style={[
          styles.internRow,
          getCardStyle(theme.surface, 'md', 'xl'),
          { marginBottom: spacing.sm },
        ]}
        hapticType="light"
        springConfig="bouncy"
      >
        {/* Rank */}
        <View style={[styles.rankCircle, { backgroundColor: getRankColor(leader.rank) + '15' }]}>
          <Text style={[styles.rankNumber, { color: getRankColor(leader.rank) }]}>
            {leader.rank}
          </Text>
        </View>

        {/* Avatar */}
        <Avatar
          size={48}
          source={leader.photo ? { uri: leader.photo } : undefined}
          name={leader.name}
          onlineStatus={leader.is_active}
        />

        {/* Info */}
        <View style={styles.internInfo}>
          <View style={styles.internNameRow}>
            <Text style={[styles.internName, { color: theme.text }]} numberOfLines={1}>
              {leader.name}
            </Text>
            <ActiveStatusBadge isActive={leader.is_active} />
          </View>

          {leader.team_name && (
            <View style={styles.teamIndicator}>
              <Ionicons name="people" size={12} color={theme.textSecondary} />
              <Text style={[styles.teamText, { color: theme.textSecondary }]} numberOfLines={1}>
                {leader.team_name}
              </Text>
            </View>
          )}

          <View style={styles.taskStats}>
            <View style={styles.taskStatItem}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={[styles.taskStatText, { color: theme.textSecondary }]}>
                {leader.completed_tasks || 0} done
              </Text>
            </View>
            <View style={styles.taskStatItem}>
              <Ionicons name="time" size={12} color="#F59E0B" />
              <Text style={[styles.taskStatText, { color: theme.textSecondary }]}>
                {leader.in_progress_tasks || 0} active
              </Text>
            </View>
          </View>
        </View>

        {/* Score */}
        <View style={[styles.scoreBadge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.scoreBadgeValue, { color: theme.primary }]}>
            {leader.score}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </AnimatedPressable>
    </Animated.View>
  );
};

// Leader Row Component
const LeaderRow = ({ leader, index }: { leader: any; index: number }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const getRankColor = (rank: number) => {
    if (rank <= 3) return theme.primary;
    return theme.textSecondary;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <AnimatedPressable
        onPress={() => router.push(`/(dashboard)/my-profile?userId=${leader.id}` as any)}
        style={[
          styles.internRow,
          getCardStyle(theme.surface, 'md', 'xl'),
          { marginBottom: spacing.sm },
        ]}
        hapticType="light"
        springConfig="bouncy"
      >
        {/* Leader Rank */}
        <View style={[styles.rankCircle, { backgroundColor: getRankColor(leader.leader_rank) + '15' }]}>
          <Text style={[styles.rankNumber, { color: getRankColor(leader.leader_rank) }]}>
            {leader.leader_rank}
          </Text>
        </View>

        {/* Avatar */}
        <Avatar
          size={48}
          source={leader.photo ? { uri: leader.photo } : undefined}
          name={leader.name}
        />

        {/* Info */}
        <View style={styles.internInfo}>
          <View style={styles.internNameRow}>
            <Text style={[styles.internName, { color: theme.text }]} numberOfLines={1}>
              {leader.name}
            </Text>
            <View style={[styles.leaderBadge, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={10} color={theme.primary} />
              <Text style={[styles.leaderBadgeText, { color: theme.primary }]}>Leader</Text>
            </View>
          </View>

          {leader.team_name && (
            <View style={styles.teamIndicator}>
              <Ionicons name="people" size={12} color={theme.textSecondary} />
              <Text style={[styles.teamText, { color: theme.textSecondary }]} numberOfLines={1}>
                {leader.team_name}
              </Text>
            </View>
          )}

          <View style={styles.taskStats}>
            <View style={styles.taskStatItem}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={[styles.taskStatText, { color: theme.textSecondary }]}>
                {leader.completed_tasks || 0} done
              </Text>
            </View>
            <View style={styles.taskStatItem}>
              <Ionicons name="time" size={12} color="#F59E0B" />
              <Text style={[styles.taskStatText, { color: theme.textSecondary }]}>
                {leader.in_progress_tasks || 0} active
              </Text>
            </View>
          </View>
        </View>

        {/* Stars */}
        <View style={[styles.scoreBadge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.scoreBadgeValue, { color: theme.primary }]}>
            ★ {leader.total_stars_received || 0}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </AnimatedPressable>
    </Animated.View>
  );
};

// Team Card Component
const TeamCard = ({ team, index }: { team: any; index: number }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return theme.primary;
  };

  const rankColor = getRankColor(team.rank);

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <AnimatedPressable
        style={[
          styles.teamCard,
          getCardStyle(theme.surface, 'md', 'xl'),
          { marginBottom: spacing.md },
        ]}
        hapticType="light"
        springConfig="bouncy"
      >
        {/* Rank Badge */}
        <View style={[styles.teamRankBadge, { backgroundColor: rankColor }]}>
          <Text style={styles.teamRankText}>#{team.rank}</Text>
        </View>

        {/* Team Header */}
        <View style={styles.teamHeader}>
          <View style={[styles.teamIconWrapper, { backgroundColor: rankColor + '20' }]}>
            <Ionicons name="people" size={28} color={rankColor} />
          </View>
          <View style={styles.teamHeaderInfo}>
            <Text style={[styles.teamName, { color: theme.text }]}>{team.team_name}</Text>
            <View style={styles.teamMeta}>
              <Ionicons name="person" size={12} color={theme.textSecondary} />
              <Text style={[styles.teamMetaText, { color: theme.textSecondary }]}>
                {team.total_members} members
              </Text>
            </View>
          </View>
          <View style={[styles.teamScoreBadge, { backgroundColor: rankColor + '15' }]}>
            <Text style={[styles.teamScoreValue, { color: rankColor }]}>{Math.round(team.avg_score)}</Text>
            <Text style={[styles.teamScoreLabel, { color: rankColor }]}>avg</Text>
          </View>
        </View>

        {/* Team Stats */}
        <View style={styles.teamStats}>
          <View style={[styles.teamStatItem, { backgroundColor: '#22C55E' + '10' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.teamStatValue, { color: theme.text }]}>{team.total_completed_tasks || 0}</Text>
            <Text style={[styles.teamStatLabel, { color: theme.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.teamStatItem, { backgroundColor: '#F59E0B' + '10' }]}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={[styles.teamStatValue, { color: theme.text }]}>{team.total_in_progress_tasks || 0}</Text>
            <Text style={[styles.teamStatLabel, { color: theme.textSecondary }]}>In Progress</Text>
          </View>
          <View style={[styles.teamStatItem, { backgroundColor: '#8B5CF6' + '10' }]}>
            <Ionicons name="star" size={20} color="#8B5CF6" />
            <Text style={[styles.teamStatValue, { color: theme.text }]}>{team.total_score || 0}</Text>
            <Text style={[styles.teamStatLabel, { color: theme.textSecondary }]}>Score</Text>
          </View>
        </View>

        {/* Active Members */}
        <View style={[styles.activeMembers, { borderTopColor: theme.border }]}>
          <View style={styles.activeMembersBadge}>
            <View style={[styles.activeDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.activeMembersText, { color: theme.textSecondary }]}>
              {team.active_members || 0} active now
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType | 'leaders'>('individual');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Fetch data based on filter and time range
  const {
    data: internData = [],
    isLoading: internLoading,
    refetch: refetchInterns
  } = useInternLeaderboard(timeRange);

  const {
    data: teamData = [],
    isLoading: teamLoading,
    refetch: refetchTeams
  } = useTeamLeaderboard(timeRange);

  const {
    data: leadersData = [],
    isLoading: leadersLoading,
    refetch: refetchLeaders
  } = useLeadersLeaderboard(timeRange);

  const {
    data: currentUserRank
  } = useIndividualInternRanking(user?.id || 0, timeRange);

  const isLoading = filter === 'individual' ? internLoading : (filter === 'team' ? teamLoading : leadersLoading);
  const data = filter === 'individual' ? internData : (filter === 'team' ? teamData : leadersData);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    if (filter === 'individual') {
      await refetchInterns();
    } else if (filter === 'team') {
      await refetchTeams();
    } else {
      await refetchLeaders();
    }
    setIsRefreshing(false);
  }, [filter, timeRange, refetchInterns, refetchTeams]);

  const getTimeRangeLabel = () => {
    const labels: Record<TimeRange, string> = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      yearly: 'This Year',
    };
    return labels[timeRange];
  };

  const topThree = filter === 'individual' ? internData.slice(0, 3) : [];
  const remaining = filter === 'individual' ? internData.slice(3) : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [theme.primary + '15', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>🏆 Leadership Board</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Top performers - {getTimeRangeLabel()}
            </Text>
          </View>
        </View>

        {/* Filters Row */}
        <View style={{
          flexDirection: 'row',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.lg
        }}>
          <View style={{ flex: 1 }}>
            <Select
              options={FILTER_OPTIONS}
              value={filter}
              onChange={(value) => setFilter(value as FilterType | 'leaders')}
              placeholder="Type"
              searchable={false}
              multiple={false}
              leadingIcon="filter"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              options={TIME_OPTIONS}
              value={timeRange}
              onChange={(value) => {
                setTimeRange(value as TimeRange);
                if (value === 'custom') {
                  setShowDatePicker(true);
                }
              }}
              placeholder="Time"
              searchable={false}
              multiple={false}
              leadingIcon="calendar"
            />
          </View>
        </View>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <View style={{ padding: spacing.lg, backgroundColor: theme.surface, borderRadius: borderRadius.lg, marginHorizontal: spacing.lg, marginTop: spacing.base }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing.md }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                maxDate={endDate || undefined}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                minDate={startDate || undefined}
              />
              <TouchableOpacity
                onPress={() => {
                  if (startDate && endDate) {
                    setShowDatePicker(false);
                    // Refetch with custom date range
                    onRefresh();
                  }
                }}
                style={[
                  styles.applyButton,
                  { backgroundColor: theme.primary, opacity: (startDate && endDate) ? 1 : 0.5 }
                ]}
                disabled={!startDate || !endDate}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Apply Date Range</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Current User Rank Card - Only for interns */}
        {!isLoading && currentUserRank && filter === 'individual' && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.currentUserSection}>
            <View style={[styles.currentUserCard, getCardStyle(theme.surface, 'md', 'xl')]}>
              <LinearGradient
                colors={[theme.primary + '15', theme.primary + '05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.currentUserContent}>
                <View style={styles.currentUserLeft}>
                  <Text style={[styles.currentUserLabel, { color: theme.textSecondary }]}>Your Rank</Text>
                  <View style={styles.currentUserRankBadge}>
                    <Ionicons name="trophy" size={24} color={theme.primary} />
                    <Text style={[styles.currentUserRankText, { color: theme.primary }]}>
                      #{currentUserRank.rank || '—'}
                    </Text>
                  </View>
                </View>
                <View style={styles.currentUserStats}>
                  <View style={styles.currentUserStatItem}>
                    <Text style={[styles.currentUserStatValue, { color: theme.text }]}>
                      {currentUserRank.score || 0}
                    </Text>
                    <Text style={[styles.currentUserStatLabel, { color: theme.textSecondary }]}>Points</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.currentUserStatItem}>
                    <Text style={[styles.currentUserStatValue, { color: theme.text }]}>
                      {currentUserRank.completed_tasks || 0}
                    </Text>
                    <Text style={[styles.currentUserStatLabel, { color: theme.textSecondary }]}>Done</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.currentUserStatItem}>
                    <Text style={[styles.currentUserStatValue, { color: theme.text }]}>
                      {currentUserRank.avg_rating?.toFixed(1) || '—'}
                    </Text>
                    <Text style={[styles.currentUserStatLabel, { color: theme.textSecondary }]}>Rating</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {filter === 'individual' ? (
              <>
                <View style={styles.podiumSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 Top Champions</Text>
                  <View style={styles.podiumStage}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={{ flex: 1, maxWidth: 120, alignItems: 'center' }}>
                        <Skeleton width={70} height={70} borderRadius={35} style={{ marginBottom: spacing.sm }} />
                        <Skeleton width={90} height={14} style={{ marginBottom: spacing.xs }} />
                        <Skeleton width={60} height={90} borderRadius={borderRadius.lg} />
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.rankingsSection}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.internRow, getCardStyle(theme.surface, 'md', 'xl'), { marginBottom: spacing.sm }]}>
                      <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: spacing.sm }} />
                      <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: spacing.sm }} />
                      <View style={{ flex: 1 }}>
                        <Skeleton width={140} height={16} style={{ marginBottom: spacing.xs }} />
                        <Skeleton width={100} height={12} />
                      </View>
                      <Skeleton width={50} height={36} borderRadius={borderRadius.lg} />
                    </View>
                  ))}
                </View>
              </>
            ) : filter === 'team' ? (
              <View style={styles.teamListSection}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.teamCard, getCardStyle(theme.surface, 'md', 'xl'), { marginBottom: spacing.md }]}>
                    <View style={styles.teamHeader}>
                      <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: spacing.md }} />
                      <View style={{ flex: 1 }}>
                        <Skeleton width={150} height={18} style={{ marginBottom: spacing.xs }} />
                        <Skeleton width={100} height={14} />
                      </View>
                    </View>
                    <View style={styles.teamStats}>
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} width={90} height={70} borderRadius={borderRadius.lg} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.rankingsSection}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.internRow, getCardStyle(theme.surface, 'md', 'xl'), { marginBottom: spacing.sm }]}>
                    <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: spacing.sm }} />
                    <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: spacing.sm }} />
                    <View style={{ flex: 1 }}>
                      <Skeleton width={140} height={16} style={{ marginBottom: spacing.xs }} />
                      <Skeleton width={100} height={12} />
                    </View>
                    <Skeleton width={50} height={36} borderRadius={borderRadius.lg} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (data.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={filter === 'individual' ? 'school-outline' : (filter === 'team' ? 'people-outline' : 'shield-checkmark-outline')}
              size={64}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {filter === 'individual' ? 'No Interns Yet' : (filter === 'team' ? 'No Teams Yet' : 'No Leaders Yet')}
            </Text>
            <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
              {filter === 'individual'
                ? 'Intern rankings will appear here once tasks are assigned'
                : (filter === 'team'
                  ? 'Team rankings will appear once teams have active interns'
                  : 'Leader rankings will appear once teams are created and led by leaders')}
            </Text>
          </View>
        ) : (
          <>
            {/* Individual Leaderboard */}
            {filter === 'individual' && (
              <>
                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                  <View style={styles.podiumSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 Top Champions</Text>

                    <View style={styles.podiumStage}>
                      {/* 2nd Place - Left */}
                      {topThree[1] && (
                        <View style={styles.secondPlaceWrapper}>
                          <AnimatedPodiumItem leader={topThree[1]} rank={2} delay={200} />
                        </View>
                      )}

                      {/* 1st Place - Center */}
                      {topThree[0] && (
                        <View style={styles.firstPlaceWrapper}>
                          <AnimatedPodiumItem leader={topThree[0]} rank={1} delay={400} />
                        </View>
                      )}

                      {/* 3rd Place - Right */}
                      {topThree[2] && (
                        <View style={styles.thirdPlaceWrapper}>
                          <AnimatedPodiumItem leader={topThree[2]} rank={3} delay={600} />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Remaining Rankings */}
                {remaining.length > 0 && (
                  <View style={styles.rankingsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 All Rankings</Text>
                    {remaining.map((leader: any, index: number) => (
                      <InternRow key={leader.id} leader={leader} index={index} />
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Team Leaderboard */}
            {filter === 'team' && (
              <View style={styles.teamListSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🏅 Team Rankings</Text>
                {teamData.map((team: any, index: number) => (
                  <TeamCard key={team.team_name || index} team={{ ...team, rank: index + 1 }} index={index} />
                ))}
              </View>
            )}

            {/* Leaders Leaderboard */}
            {filter === 'leaders' && (
              <View style={styles.rankingsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>👑 Team Leaders</Text>
                {leadersData.map((leader: any, index: number) => (
                  <LeaderRow key={leader.id} leader={leader} index={index} />
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterTabText: {
    ...getTypographyStyle('sm', 'semibold'),
  },

  // Time Range Tabs
  timeRangeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  timeRangeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  timeRangeText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  applyButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...getTypographyStyle('xs', 'semibold'),
  },

  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // Loading
  loadingContainer: {
    paddingHorizontal: spacing.base,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
  },

  // Current User
  currentUserSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  currentUserCard: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  currentUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentUserLeft: {
    gap: spacing.xs,
  },
  currentUserLabel: {
    ...getTypographyStyle('xs', 'semibold'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentUserRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentUserRankText: {
    ...getTypographyStyle('3xl', 'bold'),
  },
  currentUserStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currentUserStatItem: {
    alignItems: 'center',
  },
  currentUserStatValue: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: 2,
  },
  currentUserStatLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  statDivider: {
    width: 1,
    height: 16,
  },

  // Podium Section
  podiumSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  podiumStage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: spacing.base,
  },
  firstPlaceWrapper: {
    flex: 1,
    maxWidth: 125,
    alignItems: 'center',
    zIndex: 3,
  },
  secondPlaceWrapper: {
    flex: 1,
    maxWidth: 115,
    alignItems: 'center',
    zIndex: 2,
    marginTop: 25,
  },
  thirdPlaceWrapper: {
    flex: 1,
    maxWidth: 115,
    alignItems: 'center',
    zIndex: 1,
    marginTop: 35,
  },

  // Podium Item
  podiumItemContainer: {
    width: '100%',
    alignItems: 'center',
  },
  podiumContentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    gap: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: -14,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    opacity: 0.5,
  },
  podiumNameNew: {
    ...getTypographyStyle('sm', 'bold'),
    textAlign: 'center',
    marginTop: 2,
  },
  podiumNameFirst: {
    ...getTypographyStyle('base', 'bold'),
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  teamBadgeText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  scoreContainer: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreValue: {
    ...getTypographyStyle('base', 'bold'),
  },
  scoreLabel: {
    ...getTypographyStyle('xs', 'semibold'),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 4,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...getTypographyStyle('sm', 'bold'),
  },
  statLabel: {
    ...getTypographyStyle('xs', 'regular'),
  },
  podiumBase: {
    width: '100%',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 0,
  },
  podiumRankText: {
    ...getTypographyStyle('3xl', 'bold'),
    opacity: 0.25,
  },

  // Rankings Section
  rankingsSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },

  // Intern Row
  internRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    ...getTypographyStyle('base', 'bold'),
  },
  internInfo: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  internNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  internName: {
    ...getTypographyStyle('base', 'bold'),
    flex: 1,
  },
  teamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  teamText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  taskStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  taskStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskStatText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  scoreBadge: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 55,
  },
  scoreBadgeValue: {
    ...getTypographyStyle('base', 'bold'),
  },
  scoreBadgeLabel: {
    ...getTypographyStyle('xs', 'semibold'),
  },

  // Team List Section
  teamListSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },

  // Team Card
  teamCard: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  teamRankBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  teamRankText: {
    ...getTypographyStyle('sm', 'bold'),
    color: '#FFFFFF',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  teamIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  teamHeaderInfo: {
    flex: 1,
  },
  teamName: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: 2,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamMetaText: {
    ...getTypographyStyle('sm', 'regular'),
  },
  teamScoreBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  teamScoreValue: {
    ...getTypographyStyle('xl', 'bold'),
  },
  teamScoreLabel: {
    ...getTypographyStyle('xs', 'semibold'),
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teamStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  teamStatValue: {
    ...getTypographyStyle('lg', 'bold'),
  },
  teamStatLabel: {
    ...getTypographyStyle('xs', 'regular'),
  },
  activeMembers: {
    marginTop: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  activeMembersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeMembersText: {
    ...getTypographyStyle('sm', 'medium'),
  },

  // Leader Badge
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  leaderBadgeText: {
    ...getTypographyStyle('xs', 'semibold'),
  },
});
