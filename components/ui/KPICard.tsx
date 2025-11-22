import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { designSystem } from '@/constants/designSystem';
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
        borderRadius: designSystem.borderRadius.lg,
        padding: designSystem.spacing[5],
        ...designSystem.shadows.lg,
        elevation: 5,
        minHeight: 140,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textInverse, ...getTypographyStyle('sm', 'medium'), opacity: 0.9 }}>
            {title}
          </Text>
          <Text
            style={{
              color: theme.textInverse,
              ...getTypographyStyle('3xl', 'bold'),
              marginTop: designSystem.spacing[2],
              marginBottom: designSystem.spacing[1],
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          {subtitle && (
            <Text style={{ color: theme.textInverse, ...getTypographyStyle('xs'), opacity: 0.85, marginTop: designSystem.spacing[1] }}>
              {subtitle}
            </Text>
          )}
        </View>
        <View
          style={{
            width: designSystem.iconSizes['2xl'],
            height: designSystem.iconSizes['2xl'],
            borderRadius: designSystem.borderRadius.full,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={designSystem.iconSizes.md} color="#FFF" />
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
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        {content}
      </Pressable>
    );
  }

  return <View style={{ flex: 1 }}>{content}</View>;
}
