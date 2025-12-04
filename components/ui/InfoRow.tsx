/**
 * InfoRow Component
 * Reusable detail row for displaying label-value pairs
 * Used in detail screens across modules
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  valueStyle?: any;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  multiline = false,
  valueStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={16} 
            color={theme.textSecondary} 
            style={styles.icon}
          />
        )}
        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
      
      {typeof value === 'string' ? (
        <Text 
          style={[
            getTypographyStyle('base', 'regular'),
            { color: theme.text },
            multiline && styles.multilineValue,
            valueStyle,
          ]}
          numberOfLines={multiline ? undefined : 1}
        >
          {value}
        </Text>
      ) : (
        <View>{value}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    marginRight: spacing[1],
  },
  multilineValue: {
    lineHeight: 20,
  },
});

export default InfoRow;
