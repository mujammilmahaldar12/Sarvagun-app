import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const badgeStyles: ViewStyle[] = [
    styles.badge,
    styles[`badge_${variant}`],
    styles[`badge_${size}`],
    style || {},
  ].filter(Boolean);

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Variants
  badge_default: {
    backgroundColor: '#E5E5EA',
  },
  badge_success: {
    backgroundColor: '#D1F4E0',
  },
  badge_warning: {
    backgroundColor: '#FFE5B4',
  },
  badge_error: {
    backgroundColor: '#FFD7D5',
  },
  badge_info: {
    backgroundColor: '#D1E7FF',
  },
  // Sizes
  badge_sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge_lg: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  // Text variants
  text_default: {
    color: '#3C3C43',
  },
  text_success: {
    color: '#248A3D',
  },
  text_warning: {
    color: '#B25000',
  },
  text_error: {
    color: '#D70015',
  },
  text_info: {
    color: '#0040DD',
  },
  // Text sizes
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 13,
  },
  text_lg: {
    fontSize: 15,
  },
});
