/**
 * Education Card Component
 * Displays education records with institution, degree, dates, and current status
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { Education } from '@/types/user';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface EducationCardProps {
  education: Education;
  onPress?: () => void;
}

const DEGREE_LABELS: Record<string, string> = {
  high_school: 'High School',
  diploma: 'Diploma',
  associate: 'Associate Degree',
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: 'Doctorate/PhD',
  certification: 'Professional Certification',
  other: 'Other',
};

export function EducationCard({ education, onPress }: EducationCardProps) {
  const { theme } = useTheme();
  const isCurrent = education.is_current || !education.end_date;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getDuration = () => {
    const start = formatDate(education.start_date);
    const end = isCurrent ? 'Present' : education.end_date ? formatDate(education.end_date) : 'Present';
    return `${start} - ${end}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons 
            name="school-outline" 
            size={24} 
            color={theme.primary} 
          />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text 
              style={[styles.institution, { color: theme.text }]}
              numberOfLines={1}
            >
              {education.institution}
            </Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.currentText, { color: theme.primary }]}>Current</Text>
              </View>
            )}
          </View>
          <Text style={[styles.degree, { color: theme.textSecondary }]}>
            {DEGREE_LABELS[education.degree] || education.degree}
          </Text>
        </View>
      </View>

      {/* Field of Study */}
      <Text style={[styles.fieldOfStudy, { color: theme.text }]} numberOfLines={2}>
        {education.field_of_study}
      </Text>

      {/* Meta Info */}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {getDuration()}
          </Text>
        </View>

        {education.grade && (
          <View style={styles.metaRow}>
            <Ionicons name="star-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {education.grade}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {education.description && (
        <Text 
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={3}
        >
          {education.description}
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
  institution: {
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
  degree: {
    ...getTypographyStyle('sm', 'medium'),
  },
  fieldOfStudy: {
    ...getTypographyStyle('base', 'medium'),
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...getTypographyStyle('sm', 'regular'),
  },
  description: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 20,
  },
});
