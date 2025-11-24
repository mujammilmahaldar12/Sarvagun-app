import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { designSystem, baseColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useTheme } from '@/hooks/useTheme';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

export default function KPICard({
  title,
  value,
  icon,
  gradientColors,
  subtitle,
  trend,
  trendValue,
  onPress,
}: KPICardProps) {
  const { theme } = useTheme();
  
  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: designSystem.borderRadius.xl,
        padding: designSystem.spacing[4],
        ...designSystem.shadows.md,
        elevation: 3,
        minHeight: 140,
        maxHeight: 140,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text 
            style={{ color: baseColors.neutral[0], fontSize: 13, fontWeight: '500', opacity: 0.95, marginBottom: 8 }}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={{
              color: baseColors.neutral[0],
              fontSize: 26,
              fontWeight: '700',
              letterSpacing: -0.5,
              marginBottom: 4,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {value}
          </Text>
          {subtitle && (
            <Text 
              style={{ color: baseColors.neutral[0], fontSize: 12, opacity: 0.85 }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Ionicons name={icon} size={24} color={baseColors.neutral[0]} />
        </View>
      </View>

      {trend && trendValue && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: designSystem.spacing[3],
            paddingTop: designSystem.spacing[3],
            borderTopWidth: designSystem.borderWidth.thin,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Ionicons
            name={
              trend === 'up'
                ? 'trending-up'
                : trend === 'down'
                ? 'trending-down'
                : 'remove'
            }
            size={designSystem.iconSizes.xs}
            color="#FFF"
          />
          <Text style={{ color: theme.textInverse, ...getTypographyStyle('xs'), marginLeft: designSystem.spacing[1], opacity: 0.9 }}>
            {trendValue}
          </Text>
        </View>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ flex: 1, minWidth: 280, maxHeight: 140 }}>
        {content}
      </Pressable>
    );
  }

  return <View style={{ flex: 1, minWidth: 280, maxHeight: 140 }}>{content}</View>;
}
