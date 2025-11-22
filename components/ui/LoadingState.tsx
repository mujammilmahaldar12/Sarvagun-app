import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius } from '@/constants/designSystem';
import { Skeleton, SkeletonText, SkeletonCircle } from './Skeleton';

interface LoadingStateProps {
  type?: 'list' | 'card' | 'table' | 'chart' | 'form' | 'custom';
  items?: number;
  showHeader?: boolean;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'list',
  items = 3,
  showHeader = false,
  style,
}) => {
  const { theme } = useTheme();

  const renderLoadingContent = () => {
    switch (type) {
      case 'list':
        return (
          <View style={styles.listContainer}>
            {Array.from({ length: items }).map((_, index) => (
              <View key={index} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SkeletonCircle size={40} />
                <View style={styles.listContent}>
                  <Skeleton height={16} width="70%" />
                  <Skeleton height={12} width="90%" style={{ marginTop: spacing.xs }} />
                </View>
              </View>
            ))}
          </View>
        );
        
      case 'card':
        return (
          <View style={styles.cardGrid}>
            {Array.from({ length: items }).map((_, index) => (
              <View key={index} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Skeleton height={120} width="100%" style={{ marginBottom: spacing.md }} />
                <Skeleton height={18} width="80%" style={{ marginBottom: spacing.sm }} />
                <SkeletonText count={2} height={12} spacing={spacing.xs} />
              </View>
            ))}
          </View>
        );
        
      case 'table':
        return (
          <View style={[styles.table, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {showHeader && (
              <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: theme.border }]}>
                <Skeleton height={16} width="20%" />
                <Skeleton height={16} width="30%" />
                <Skeleton height={16} width="25%" />
                <Skeleton height={16} width="15%" />
              </View>
            )}
            {Array.from({ length: items }).map((_, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                <Skeleton height={14} width="25%" />
                <Skeleton height={14} width="35%" />
                <Skeleton height={14} width="20%" />
                <Skeleton height={14} width="10%" />
              </View>
            ))}
          </View>
        );
        
      case 'chart':
        return (
          <View style={[styles.chart, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Skeleton height={24} width="60%" style={{ marginBottom: spacing.lg }} />
            <View style={styles.chartBars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton 
                  key={index} 
                  height={Math.random() * 100 + 50} 
                  width={30} 
                  style={{ marginRight: spacing.sm }}
                />
              ))}
            </View>
          </View>
        );
        
      case 'form':
        return (
          <View style={styles.form}>
            {Array.from({ length: items }).map((_, index) => (
              <View key={index} style={styles.formField}>
                <Skeleton height={16} width="30%" style={{ marginBottom: spacing.sm }} />
                <Skeleton height={48} width="100%" />
              </View>
            ))}
          </View>
        );
        
      default:
        return <SkeletonText count={items} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showHeader && type !== 'table' && (
        <View style={styles.header}>
          <Skeleton height={24} width="40%" style={{ marginBottom: spacing.md }} />
        </View>
      )}
      {renderLoadingContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  listContainer: {
    gap: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  listContent: {
    flex: 1,
  },
  cardGrid: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  table: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  tableHeader: {
    paddingVertical: spacing.lg,
  },
  chart: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    height: 200,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    paddingTop: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  formField: {
    marginBottom: spacing.md,
  },
});

export default LoadingState;