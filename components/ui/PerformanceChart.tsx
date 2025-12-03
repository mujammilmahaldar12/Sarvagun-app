/**
 * PerformanceChart - Beautiful line chart for profile performance
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { GlassCard } from './GlassCard';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { spacing, typography } = designSystem;

interface DataPoint {
  label: string;
  value: number;
}

interface PerformanceChartProps {
  title: string;
  data: DataPoint[];
  color: string;
  subtitle?: string;
  height?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  data,
  color,
  subtitle,
  height = 220,
}) => {
  const { colors, isDark } = useThemeStore();
  const chartWidth = SCREEN_WIDTH - spacing.lg * 2 - spacing.base * 2;
  const chartHeight = height - 80; // Reserve space for labels
  const padding = 20;

  if (!data || data.length < 2) {
    return null;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Calculate points
  const points = data.map((point, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (data.length - 1);
    const y = chartHeight - padding - ((point.value - minValue) / range) * (chartHeight - padding * 2);
    return { x, y, value: point.value };
  });

  // Generate smooth curve path
  const generatePath = () => {
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      const cpX = (prevPoint.x + currPoint.x) / 2;
      path += ` Q ${cpX} ${prevPoint.y}, ${currPoint.x} ${currPoint.y}`;
    }
    
    return path;
  };

  // Generate filled area path
  const generateAreaPath = () => {
    const linePath = generatePath();
    const lastPoint = points[points.length - 1];
    return `${linePath} L ${lastPoint.x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  };

  return (
    <GlassCard variant="gradient" gradientColors={[color, color]} intensity="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
            <Ionicons name="trending-up" size={16} color={color} />
            <Text style={[styles.badgeText, { color }]}>
              {data[data.length - 1].value}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
          <Defs>
            <SvgGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </SvgGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i * (chartHeight - padding * 2)) / 4;
            return (
              <Rect
                key={i}
                x={padding}
                y={y}
                width={chartWidth - padding * 2}
                height={1}
                fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              />
            );
          })}
          
          {/* Filled area */}
          <Path
            d={generateAreaPath()}
            fill="url(#areaGradient)"
          />
          
          {/* Line */}
          <Path
            d={generatePath()}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={colors.surface}
              stroke={color}
              strokeWidth={2}
            />
          ))}
        </Svg>

        {/* Labels */}
        <View style={styles.labels}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.label,
                { color: colors.textSecondary },
                index === 0 && { textAlign: 'left' },
                index === data.length - 1 && { textAlign: 'right' },
              ]}
            >
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  chart: {
    marginVertical: spacing.sm,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    flex: 1,
    textAlign: 'center',
  },
});
