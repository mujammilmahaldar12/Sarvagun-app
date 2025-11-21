/**
 * Professional EmptyState Component
 * Standardized empty state with proper accessibility and theming
 */
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, iconSizes } from '../../constants/designSystem';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-outline',
  title,
  description,
  actionTitle,
  onActionPress,
  style,
  variant = 'default',
}) => {
  const { theme } = useTheme();

  const isCompact = variant === 'compact';

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing[6],
          paddingVertical: isCompact ? spacing[8] : spacing[12],
        },
        style,
      ]}
    >
      {/* Icon */}
      <View
        style={{
          backgroundColor: theme.surfaceElevated,
          padding: isCompact ? spacing[4] : spacing[6],
          borderRadius: isCompact ? spacing[8] : spacing[12],
          marginBottom: isCompact ? spacing[3] : spacing[4],
        }}
      >
        <Ionicons
          name={icon}
          size={isCompact ? iconSizes.lg : iconSizes['2xl']}
          color={theme.textSecondary}
        />
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: isCompact ? typography.sizes.base : typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          color: theme.text,
          textAlign: 'center',
          marginBottom: description ? spacing[2] : spacing[4],
        }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={{
            fontSize: isCompact ? typography.sizes.sm : typography.sizes.base,
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: isCompact ? 18 : 22,
            marginBottom: spacing[4],
            maxWidth: 280,
          }}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          variant="outline"
          size={isCompact ? 'sm' : 'md'}
          onPress={onActionPress}
        />
      )}
    </View>
  );
};
