import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface EventStatusPieChartProps {
  data: StatusData[];
}

export default function EventStatusPieChart({ data }: EventStatusPieChartProps) {
  const { theme } = useTheme();

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: designSystem.borderRadius.xl,
        padding: designSystem.spacing[5],
        ...designSystem.shadows.sm,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: designSystem.spacing[4] }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: `${COLORS.charts.warning}15`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 18 }}>📈</Text>
        </View>
        <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, letterSpacing: -0.3 }}>
          Event Status Distribution
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        {/* Total Count Card */}
        <View style={{ 
          alignItems: 'center', 
          padding: 20, 
          backgroundColor: theme.primary + '10',
          borderRadius: 12,
        }}>
          <Text style={{ ...getTypographyStyle('4xl', 'bold'), color: theme.primary }}>
            {total}
          </Text>
          <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>Total Events</Text>
        </View>

        {/* Status Bars */}
        <View style={{ gap: 12 }}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <View key={`${item.status}-${index}`} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: item.color,
                      }}
                    />
                    <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.textSecondary }}>
                    {item.count} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
                {/* Progress Bar */}
                <View style={{ 
                  height: 10, 
                  backgroundColor: `${item.color}15`,
                  borderRadius: 6,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: `${item.color}20`,
                }}>
                  <View style={{ 
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    borderRadius: 5,
                  }} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
