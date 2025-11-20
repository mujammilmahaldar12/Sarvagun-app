import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getCircularStyle, getTypographyStyle } from '../../utils/styleHelpers';
import { borderWidth } from '../../constants/designTokens';

interface AvatarProps {
  size?: number;
  source?: { uri: string } | number;
  name?: string;
  onlineStatus?: boolean;
  borderColor?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 48,
  source,
  name,
  onlineStatus,
  borderColor,
  style,
}) => {
  const { theme } = useTheme();

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const containerStyle: ViewStyle = {
    ...getCircularStyle(size, theme.colors.primary),
    borderWidth: borderColor ? borderWidth.medium : 0,
    borderColor: borderColor || 'transparent',
  };

  const textStyle: TextStyle = {
    ...getTypographyStyle(size > 40 ? 'lg' : 'base', 'semibold'),
    color: '#FFFFFF',
  };

  const statusSize = size * 0.25;
  const statusPosition = size * 0.05;

  return (
    <View style={[styles.container, style]}>
      <View style={containerStyle}>
        {source ? (
          <Image source={source} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
        ) : (
          <Text style={textStyle}>{getInitials(name)}</Text>
        )}
      </View>
      {onlineStatus !== undefined && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: onlineStatus ? '#10B981' : '#6B7280',
              right: statusPosition,
              bottom: statusPosition,
              borderWidth: borderWidth.medium,
              borderColor: theme.colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  statusIndicator: {
    position: 'absolute',
  },
});
