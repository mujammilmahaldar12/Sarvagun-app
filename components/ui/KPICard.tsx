import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 140,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFF', fontSize: 13, opacity: 0.9, fontWeight: '500' }}>
            {title}
          </Text>
          <Text
            style={{
              color: '#FFF',
              fontSize: 32,
              fontWeight: 'bold',
              marginTop: 8,
              marginBottom: 4,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          {subtitle && (
            <Text style={{ color: '#FFF', fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={24} color="#FFF" />
        </View>
      </View>

      {trend && trendValue && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
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
            size={14}
            color="#FFF"
          />
          <Text style={{ color: '#FFF', fontSize: 11, marginLeft: 4, opacity: 0.9 }}>
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
