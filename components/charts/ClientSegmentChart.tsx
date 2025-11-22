import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { Ionicons } from '@expo/vector-icons';

interface SegmentData {
  category: string;
  count: number;
  revenue?: number;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ClientSegmentChartProps {
  data: SegmentData[];
}

export default function ClientSegmentChart({ data }: ClientSegmentChartProps) {
  const { theme } = useTheme();
  const width = Dimensions.get('window').width - 72;

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map((item) => item.count));

  const colors = [
    COLORS.gradients.blue[0],
    COLORS.gradients.purple[0],
    COLORS.gradients.green[0],
    COLORS.gradients.orange[0],
  ];

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
        Client Segmentation
      </Text>

      <View style={{ gap: 16 }}>
        {data.map((segment, index) => {
          const percentage = total > 0 ? (segment.count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (segment.count / maxCount) * width : 0;
          const color = colors[index % colors.length];

          return (
            <View key={`${segment.category}-${index}`}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: color + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name={segment.icon} size={18} color={color} />
                  </View>
                  <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
                    {segment.category}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                    {segment.count}
                  </Text>
                  <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary }}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 12,
                  backgroundColor: theme.border,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: barWidth,
                    backgroundColor: color,
                    borderRadius: 6,
                  }}
                />
              </View>

              {segment.revenue !== undefined && (
                <Text
                  style={{
                    ...getTypographyStyle('xs'),
                    color: theme.textSecondary,
                    marginTop: designSystem.spacing[1],
                  }}
                >
                  Revenue: ₹{(segment.revenue / 100000).toFixed(1)}L
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, textAlign: 'center' }}>
          Total Clients: <Text style={{ fontWeight: '600', color: theme.text }}>{total}</Text>
        </Text>
      </View>
    </View>
  );
}
