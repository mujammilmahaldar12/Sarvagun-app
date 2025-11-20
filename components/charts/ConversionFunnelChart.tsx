import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';

interface FunnelData {
  total: number;
  pending: number;
  converted: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData;
}

export default function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const { theme } = useTheme();
  const width = Dimensions.get('window').width - 32;

  const stages = [
    { label: 'Total Leads', value: data.total, color: COLORS.charts.info, percentage: 100 },
    {
      label: 'Pending',
      value: data.pending,
      color: COLORS.charts.warning,
      percentage: data.total > 0 ? (data.pending / data.total) * 100 : 0,
    },
    {
      label: 'Converted',
      value: data.converted,
      color: COLORS.charts.success,
      percentage: data.total > 0 ? (data.converted / data.total) * 100 : 0,
    },
  ];

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
        Lead Conversion Funnel
      </Text>

      <View style={{ gap: 12 }}>
        {stages.map((stage, index) => {
          const barWidth = (stage.percentage / 100) * (width - 80);

          return (
            <View key={stage.label}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, flex: 1 }}>
                  {stage.label}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                  {stage.value}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                    marginLeft: 8,
                    width: 50,
                    textAlign: 'right',
                  }}
                >
                  {stage.percentage.toFixed(1)}%
                </Text>
              </View>

              <View
                style={{
                  height: 40,
                  backgroundColor: theme.colors.border,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: barWidth,
                    backgroundColor: stage.color,
                    borderRadius: 8,
                    justifyContent: 'center',
                    paddingLeft: 12,
                  }}
                >
                  {barWidth > 60 && (
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                      {stage.value}
                    </Text>
                  )}
                </View>
              </View>

              {index < stages.length - 1 && (
                <View style={{ alignItems: 'center', marginVertical: 4 }}>
                  <View
                    style={{
                      width: 2,
                      height: 8,
                      backgroundColor: theme.colors.border,
                    }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Conversion Rate Summary */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.charts.success }}>
            {data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : 0}%
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
            Conversion Rate
          </Text>
        </View>

        <View style={{ width: 1, backgroundColor: theme.colors.border }} />

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.charts.danger }}>
            {data.total > 0
              ? (((data.total - data.converted - data.pending) / data.total) * 100).toFixed(1)
              : 0}
            %
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
            Rejection Rate
          </Text>
        </View>
      </View>
    </View>
  );
}
