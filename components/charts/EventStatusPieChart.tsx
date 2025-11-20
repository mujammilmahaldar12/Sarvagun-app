import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';

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
        backgroundColor: theme.colors.surface,
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
      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 16 }}>
        Event Status Distribution
      </Text>

      <View style={{ gap: 16 }}>
        {/* Total Count Card */}
        <View style={{ 
          alignItems: 'center', 
          padding: 20, 
          backgroundColor: theme.colors.primary + '10',
          borderRadius: 12,
        }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: theme.colors.primary }}>
            {total}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '500' }}>Total Events</Text>
        </View>

        {/* Status Bars */}
        <View style={{ gap: 12 }}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <View key={index} style={{ gap: 6 }}>
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
                    <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '500' }}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' }}>
                    {item.count} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
                {/* Progress Bar */}
                <View style={{ 
                  height: 8, 
                  backgroundColor: theme.colors.background,
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
