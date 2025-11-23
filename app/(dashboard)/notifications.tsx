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
} from 'react-native';
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
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dummy Leadership Board Data - Top 10 Only
const DUMMY_LEADERBOARD_FULL = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    photo: null,
    designation: 'Senior Developer',
    rank: 1,
    score: 2450,
    projectsCompleted: 12,
    tasksCompleted: 89,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    photo: null,
    designation: 'Project Manager',
    rank: 2,
    score: 2280,
    projectsCompleted: 10,
    tasksCompleted: 76,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Amit Patel',
    photo: null,
    designation: 'Full Stack Developer',
    rank: 3,
    score: 2150,
    projectsCompleted: 9,
    tasksCompleted: 71,
    isOnline: false,
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    photo: null,
    designation: 'UI/UX Designer',
    rank: 4,
    score: 1980,
    projectsCompleted: 8,
    tasksCompleted: 64,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Vikram Singh',
    photo: null,
    designation: 'Backend Developer',
    rank: 5,
    score: 1875,
    projectsCompleted: 7,
    tasksCompleted: 58,
    isOnline: true,
  },
  {
    id: '6',
    name: 'Ananya Desai',
    photo: null,
    designation: 'Frontend Developer',
    rank: 6,
    score: 1720,
    projectsCompleted: 6,
    tasksCompleted: 52,
    isOnline: false,
  },
  {
    id: '7',
    name: 'Karthik Menon',
    photo: null,
    designation: 'DevOps Engineer',
    rank: 7,
    score: 1650,
    projectsCompleted: 6,
    tasksCompleted: 48,
    isOnline: true,
  },
];

// Animated Podium Item Component
const AnimatedPodiumItem = ({ leader, rank, delay }: any) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const translateY = useSharedValue(100);
  const rotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      })
    );
    
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 120,
      })
    );

    // Continuous glow for rank 1
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
      { rotate: `${rotate.value}deg` },
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
  const podiumHeight = rank === 1 ? 180 : rank === 2 ? 150 : 140;

  return (
    <Animated.View style={[styles.podiumItemContainer, animatedStyle]}>
      <View style={styles.podiumContentWrapper}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Ionicons 
            name={getRankIcon()} 
            size={rank === 1 ? 22 : 18} 
            color="#FFFFFF" 
          />
        </View>

        {/* Avatar with glow effect for winner */}
        <View style={styles.avatarContainer}>
          {rank === 1 && (
            <Animated.View style={[styles.glowRing, glowStyle, { borderColor: rankColor }]} />
          )}
          <Avatar
            size={rank === 1 ? 72 : rank === 2 ? 60 : 56}
            source={leader.photo ? { uri: leader.photo } : undefined}
            name={leader.name}
            onlineStatus={leader.isOnline}
          />
        </View>

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

        {/* Designation */}
        <Text style={[styles.podiumDesignation, { color: theme.textSecondary }]} numberOfLines={1}>
          {leader.designation}
        </Text>

        {/* Score with animated background */}
        <LinearGradient
          colors={[rankColor + '20', rankColor + '10']}
          style={styles.scoreContainer}
        >
          <Text style={[styles.scoreValue, { color: rankColor }]}>
            {leader.score}
          </Text>
          <Text style={[styles.scoreLabel, { color: rankColor }]}>points</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.text }]}>{leader.projectsCompleted}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Projects</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.text }]}>{leader.tasksCompleted}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tasks</Text>
          </View>
        </View>
      </View>

      {/* Podium Base */}
      <LinearGradient
        colors={[rankColor + '40', rankColor + '20', rankColor + '10']}
        style={[styles.podiumBase, { height: podiumHeight }]}
      >
        <Text style={[styles.podiumRankText, { color: rankColor }]}>#{rank}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Animated Leaderboard Row
const AnimatedLeaderboardRow = ({ leader, index }: any) => {
  const { theme } = useTheme();
  const translateX = useSharedValue(-SCREEN_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      index * 100,
      withSpring(0, {
        damping: 20,
        stiffness: 90,
      })
    );
    
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const rankColor = theme.primary;

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedPressable
        onPress={() => console.log('View profile:', leader.name)}
        style={[
          styles.leaderboardRow,
          getCardStyle(theme.surface, 'md', 'xl'),
          { marginBottom: spacing.md },
        ]}
        hapticType="light"
        springConfig="bouncy"
      >
        {/* Rank Circle */}
        <View style={[styles.rankCircle, { backgroundColor: rankColor + '15' }]}>
          <Text style={[styles.rankNumber, { color: rankColor }]}>
            {leader.rank}
          </Text>
        </View>

        {/* Avatar */}
        <Avatar
          size={52}
          source={leader.photo ? { uri: leader.photo } : undefined}
          name={leader.name}
          onlineStatus={leader.isOnline}
        />

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {leader.name}
          </Text>
          <Text style={[styles.userDesignation, { color: theme.textSecondary }]} numberOfLines={1}>
            {leader.designation}
          </Text>
          <View style={styles.userStats}>
            <Ionicons name="briefcase" size={12} color={theme.textSecondary} />
            <Text style={[styles.userStatText, { color: theme.textSecondary }]}>
              {leader.projectsCompleted} • {leader.tasksCompleted} tasks
            </Text>
          </View>
        </View>

        {/* Score Badge */}
        <View style={[styles.scoreBadge, { backgroundColor: rankColor + '15' }]}>
          <Text style={[styles.scoreBadgeValue, { color: rankColor }]}>
            {leader.score}
          </Text>
          <Text style={[styles.scoreBadgeLabel, { color: rankColor }]}>pts</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </AnimatedPressable>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const { theme, isDark } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const topThree = DUMMY_LEADERBOARD_FULL.slice(0, 3);
  const remaining = DUMMY_LEADERBOARD_FULL.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Elegant Header */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [theme.primary + '15', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>🏆 Leadership Board</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Top performers of the month
            </Text>
          </View>
        </View>
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
        {/* Championship Podium - 2nd, 1st, 3rd arrangement */}
        <View style={styles.podiumSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎖️ Top Champions</Text>
          
          <View style={styles.podiumStage}>
            {/* 2nd Place - Left */}
            {topThree[1] && (
              <View style={styles.secondPlaceWrapper}>
                <AnimatedPodiumItem 
                  leader={topThree[1]} 
                  rank={2} 
                  delay={200}
                />
              </View>
            )}

            {/* 1st Place - Center (Elevated) */}
            {topThree[0] && (
              <View style={styles.firstPlaceWrapper}>
                <AnimatedPodiumItem 
                  leader={topThree[0]} 
                  rank={1} 
                  delay={400}
                />
              </View>
            )}

            {/* 3rd Place - Right */}
            {topThree[2] && (
              <View style={styles.thirdPlaceWrapper}>
                <AnimatedPodiumItem 
                  leader={topThree[2]} 
                  rank={3} 
                  delay={600}
                />
              </View>
            )}
          </View>
        </View>

        {/* Rest of Rankings - Clean & Spacious */}
        {remaining.length > 0 && (
          <View style={styles.rankingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Rankings</Text>
            <View style={styles.rankingsList}>
              {remaining.map((leader, index) => (
                <AnimatedLeaderboardRow 
                  key={leader.id} 
                  leader={leader} 
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
  
  // Podium Wrappers - FIXED SPACING
  firstPlaceWrapper: {
    flex: 1,
    maxWidth: 130,
    alignItems: 'center',
    zIndex: 3,
  },
  secondPlaceWrapper: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
    zIndex: 2,
    marginTop: 30,
  },
  thirdPlaceWrapper: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
    zIndex: 1,
    marginTop: 40,
  },
  
  // Podium Item - COMPACT
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
    gap: spacing.xs,
  },
  
  // Rank Badge - SMALLER
  rankBadge: {
    position: 'absolute',
    top: -16,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Avatar Container - COMPACT
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
  
  // Podium Text - COMPACT
  podiumNameNew: {
    ...getTypographyStyle('sm', 'bold'),
    textAlign: 'center',
    marginTop: 4,
  },
  podiumNameFirst: {
    ...getTypographyStyle('base', 'bold'),
  },
  podiumDesignation: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
  },
  
  // Score Container - SMALLER
  scoreContainer: {
    paddingVertical: 4,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: 4,
  },
  scoreValue: {
    ...getTypographyStyle('lg', 'bold'),
  },
  scoreLabel: {
    ...getTypographyStyle('xs', 'semibold'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Stats Row - COMPACT
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
    ...getTypographyStyle('base', 'bold'),
  },
  statLabel: {
    ...getTypographyStyle('xs', 'regular'),
  },
  statDivider: {
    width: 1,
    height: 16,
  },
  
  // Podium Base - SHORTER
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
  
  // Rankings Section - COMPACT
  rankingsSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  rankingsList: {
    gap: spacing.sm,
  },
  
  // Leaderboard Row - COMPACT
  leaderboardRow: {
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
  userInfo: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  userName: {
    ...getTypographyStyle('base', 'bold'),
    marginBottom: 2,
  },
  userDesignation: {
    ...getTypographyStyle('xs', 'regular'),
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  scoreBadge: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 60,
  },
  scoreBadgeValue: {
    ...getTypographyStyle('base', 'bold'),
  },
  scoreBadgeLabel: {
    ...getTypographyStyle('xs', 'semibold'),
    textTransform: 'uppercase',
  },
});
