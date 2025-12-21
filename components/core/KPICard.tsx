import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

export interface KPICardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  gradient?: string[];
  loading?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  subtitle,
  icon,
  color = '#6366f1',
  loading = false,
  onPress,
  disabled = false,
  compact = false,
}) => {
  // Use simple theme hook - rely on standard colors
  const { theme, isDark } = useTheme();

  // Explicit color logic to prevent any "invisible text" issues
  const bgColor = isDark ? '#1A171D' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const getTrendColor = () => {
    if (!trend) return subtextColor;
    return trend.direction === 'up' ? '#10b981' : '#ef4444';
  };

  const getTrendIcon = () => {
    if (!trend) return undefined;
    return trend.direction === 'up' ? 'trending-up' : 'trending-down';
  };

  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
        compact && styles.compactContainer,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {/* Icon */}
      {icon && (
        <View style={[styles.iconContainer, compact && styles.compactIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={compact ? 20 : 24} color={color} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: subtextColor }
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={color} style={{ marginVertical: 8 }} />
        ) : (
          <View>
            <Text
              style={[
                compact ? styles.compactValue : styles.value,
                { color: textColor }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>

            {trend && (
              <View style={styles.trendRow}>
                <Ionicons name={getTrendIcon() as any} size={14} color={getTrendColor()} />
                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                  {trend.value}%
                </Text>
              </View>
            )}

            {subtitle && (
              <Text style={[styles.subtitle, { color: subtextColor }]}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    // Add simple shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContainer: {
    padding: 12,
    minWidth: 140,
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  }
});
