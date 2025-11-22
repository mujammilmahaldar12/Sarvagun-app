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
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: designSystem.spacing[4] }}>
        Event Status Distribution
      </Text>

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
                  height: 8, 
                  backgroundColor: theme.background,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <View style={{ 
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    borderRadius: 4,
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
