/**
 * FormSection Component
 * Wrapper for grouping form fields with title and consistent spacing
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface FormSectionProps {
  title: string;
  children?: React.ReactNode;
  description?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  description,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
    gap: spacing[1],
  },
  content: {
    gap: spacing.sm,
  },
});

export default FormSection;
