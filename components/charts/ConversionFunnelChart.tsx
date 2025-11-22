import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

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
        backgroundColor: theme.surface,
        borderRadius: designSystem.borderRadius.lg,
        padding: designSystem.spacing[5],
        marginBottom: designSystem.spacing[4],
        ...designSystem.shadows.md,
        elevation: 3,
      }}
    >
      <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: designSystem.spacing[4] }}>
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
                <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, flex: 1 }}>
                  {stage.label}
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                  {stage.value}
                </Text>
                <Text
                  style={{
                    ...getTypographyStyle('xs'),
                    color: theme.textSecondary,
                    marginLeft: designSystem.spacing[2],
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
                  backgroundColor: theme.border,
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
                    <Text style={{ color: theme.textInverse, ...getTypographyStyle('xs', 'semibold') }}>
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
                      backgroundColor: theme.border,
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
          borderTopColor: theme.border,
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ ...getTypographyStyle('2xl', 'bold'), color: COLORS.charts.success }}>
            {data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : 0}%
          </Text>
          <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, marginTop: designSystem.spacing[1] }}>
            Conversion Rate
          </Text>
        </View>

        <View style={{ width: 1, backgroundColor: theme.border }} />

        <View style={{ alignItems: 'center' }}>
          <Text style={{ ...getTypographyStyle('2xl', 'bold'), color: COLORS.charts.danger }}>
            {data.total > 0
              ? (((data.total - data.converted - data.pending) / data.total) * 100).toFixed(1)
              : 0}
            %
          </Text>
          <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, marginTop: designSystem.spacing[1] }}>
            Rejection Rate
          </Text>
        </View>
      </View>
    </View>
  );
}
