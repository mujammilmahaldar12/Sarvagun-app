/**
 * Experience Card Component
 * Displays work experience with company, position, dates, and employment type
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { WorkExperience } from '@/types/user';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface ExperienceCardProps {
  experience: WorkExperience;
  onPress?: () => void;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
};

const EMPLOYMENT_TYPE_ICONS: Record<string, string> = {
  full_time: 'briefcase',
  part_time: 'time',
  contract: 'document-text',
  freelance: 'rocket',
  internship: 'school',
};

export function ExperienceCard({ experience, onPress }: ExperienceCardProps) {
  const { theme } = useTheme();
  const isCurrent = experience.is_current || !experience.end_date;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getDuration = () => {
    const start = formatDate(experience.start_date);
    const end = isCurrent ? 'Present' : experience.end_date ? formatDate(experience.end_date) : 'Present';
    
    // Calculate duration
    const startDate = new Date(experience.start_date);
    const endDate = isCurrent ? new Date() : new Date(experience.end_date || new Date());
    const months = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let durationText = '';
    if (years > 0) {
      durationText = `${years} yr${years > 1 ? 's' : ''}`;
      if (remainingMonths > 0) {
        durationText += ` ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
      }
    } else if (months > 0) {
      durationText = `${months} mo${months > 1 ? 's' : ''}`;
    } else {
      durationText = 'Less than 1 month';
    }
    
    return { period: `${start} - ${end}`, duration: durationText };
  };

  const { period, duration } = getDuration();
  const employmentTypeLabel = EMPLOYMENT_TYPE_LABELS[experience.employment_type] || experience.employment_type;
  const employmentTypeIcon = EMPLOYMENT_TYPE_ICONS[experience.employment_type] || 'briefcase';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons 
            name={employmentTypeIcon as any} 
            size={24} 
            color={theme.primary} 
          />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text 
              style={[styles.position, { color: theme.text }]}
              numberOfLines={1}
            >
              {experience.position}
            </Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: '#10B981' + '15' }]}>
                <Text style={[styles.currentText, { color: '#10B981' }]}>Current</Text>
              </View>
            )}
          </View>
          <Text style={[styles.company, { color: theme.primary }]} numberOfLines={1}>
            {experience.company}
          </Text>
        </View>
      </View>

      {/* Meta Info */}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {period}
          </Text>
        </View>

        <View style={styles.dot} />

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {duration}
          </Text>
        </View>
      </View>

      {/* Employment Type & Location */}
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: theme.primary + '10' }]}>
          <Text style={[styles.tagText, { color: theme.primary }]}>
            {employmentTypeLabel}
          </Text>
        </View>
        {experience.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              {experience.location}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {experience.description && (
        <Text 
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={4}
        >
          {experience.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  position: {
    ...getTypographyStyle('lg', 'semibold'),
    flex: 1,
    marginRight: spacing.xs,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  currentText: {
    ...getTypographyStyle('xs', 'semibold'),
  },
  company: {
    ...getTypographyStyle('base', 'semibold'),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...getTypographyStyle('sm', 'regular'),
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...getTypographyStyle('xs', 'semibold'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  description: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 20,
  },
});
