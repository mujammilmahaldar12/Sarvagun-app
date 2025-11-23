import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { AnimatedPressable } from '@/components';

type TeamMember = {
  name: string;
  role: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Feature = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  { name: 'Development Team', role: 'Full-stack Development', icon: 'code-slash' },
  { name: 'Design Team', role: 'UI/UX Design', icon: 'color-palette' },
  { name: 'Product Team', role: 'Product Management', icon: 'bulb' },
  { name: 'QA Team', role: 'Quality Assurance', icon: 'shield-checkmark' },
];

const FEATURES: Feature[] = [
  {
    title: 'HR Management',
    description: 'Complete employee lifecycle management',
    icon: 'people',
    color: '#10B981',
  },
  {
    title: 'Project Tracking',
    description: 'Manage projects and tasks efficiently',
    icon: 'briefcase',
    color: '#8B5CF6',
  },
  {
    title: 'Finance Module',
    description: 'Track expenses and financial records',
    icon: 'cash',
    color: '#F59E0B',
  },
  {
    title: 'Event Management',
    description: 'Organize and track company events',
    icon: 'calendar',
    color: '#3B82F6',
  },
  {
    title: 'Leave Management',
    description: 'Streamlined leave application process',
    icon: 'time',
    color: '#EF4444',
  },
  {
    title: 'Real-time Updates',
    description: 'Stay informed with instant notifications',
    icon: 'notifications',
    color: '#EC4899',
  },
];

export default function AboutScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>About Sarvagun</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* App Hero Card */}
        <View style={styles.section}>
          <LinearGradient
            colors={[theme.primary, theme.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>S</Text>
            </View>
            <Text style={styles.appName}>Sarvagun ERP</Text>
            <Text style={styles.appTagline}>
              Complete Business Management Solution
            </Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <View style={[styles.missionCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <View style={[styles.missionIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="rocket" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.missionTitle, { color: theme.text }]}>Our Mission</Text>
            <Text style={[styles.missionText, { color: theme.textSecondary }]}>
              Sarvagun ERP is designed to streamline your business operations with an
              all-in-one platform. From HR management to project tracking, we provide
              powerful tools to help teams collaborate, communicate, and succeed together.
            </Text>
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureCard,
                  getCardStyle(theme.surface, 'sm', 'md'),
                  { width: '48%' },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Built By</Text>
          <View style={[styles.teamCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            {TEAM_MEMBERS.map((member, index) => (
              <View
                key={index}
                style={[
                  styles.teamMember,
                  {
                    borderBottomWidth: index < TEAM_MEMBERS.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.teamIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name={member.icon} size={20} color={theme.primary} />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={[styles.teamName, { color: theme.text }]}>{member.name}</Text>
                  <Text style={[styles.teamRole, { color: theme.textSecondary }]}>
                    {member.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Technology Stack */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Technology</Text>
          <View style={[styles.techCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <View style={styles.techRow}>
              <Ionicons name="logo-react" size={24} color="#61DAFB" />
              <Text style={[styles.techText, { color: theme.text }]}>React Native</Text>
            </View>
            <View style={styles.techRow}>
              <Ionicons name="flash" size={24} color="#000020" />
              <Text style={[styles.techText, { color: theme.text }]}>Expo</Text>
            </View>
            <View style={styles.techRow}>
              <Ionicons name="server" size={24} color="#092E20" />
              <Text style={[styles.techText, { color: theme.text }]}>Django Backend</Text>
            </View>
            <View style={styles.techRow}>
              <Ionicons name="code-slash" size={24} color="#3178C6" />
              <Text style={[styles.techText, { color: theme.text }]}>TypeScript</Text>
            </View>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Legal</Text>
          <View style={[styles.legalCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <TouchableOpacity
              onPress={() => openLink('https://example.com/privacy')}
              style={[styles.legalLink, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
              <Text style={[styles.legalText, { color: theme.text }]}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink('https://example.com/terms')}
              style={[styles.legalLink, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={22} color={theme.primary} />
              <Text style={[styles.legalText, { color: theme.text }]}>Terms of Service</Text>
              <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink('https://example.com/licenses')}
              style={styles.legalLink}
              activeOpacity={0.7}
            >
              <Ionicons name="key-outline" size={22} color={theme.primary} />
              <Text style={[styles.legalText, { color: theme.text }]}>Open Source Licenses</Text>
              <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.footerSection}>
          <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
            © 2025 Sarvagun ERP. All rights reserved.
          </Text>
          <Text style={[styles.madeWithText, { color: theme.textSecondary }]}>
            Made with ❤️ for productivity
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroCard: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  appIconText: {
    ...getTypographyStyle('3xl', 'bold'),
    color: '#FFFFFF',
  },
  appName: {
    ...getTypographyStyle('2xl', 'bold'),
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...getTypographyStyle('sm', 'regular'),
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  versionText: {
    ...getTypographyStyle('xs', 'semibold'),
    color: '#FFFFFF',
  },
  missionCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  missionIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  missionTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.sm,
  },
  missionText: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.base,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    padding: spacing.base,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
    lineHeight: 16,
  },
  teamCard: {
    overflow: 'hidden',
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.xs,
  },
  teamRole: {
    ...getTypographyStyle('sm', 'regular'),
  },
  techCard: {
    padding: spacing.base,
    gap: spacing.md,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  techText: {
    ...getTypographyStyle('base', 'medium'),
  },
  legalCard: {
    overflow: 'hidden',
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  legalText: {
    flex: 1,
    ...getTypographyStyle('base', 'medium'),
  },
  footerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  copyrightText: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
  },
  madeWithText: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
  },
});
