import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { designSystem } from '../../constants/designSystem';

export type StatusType =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'draft'
  | 'converted'
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'online'
  | 'offline';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  variant?: StatusType; // Alias for type for consistency
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Define status configuration with theme-based colors
function getStatusConfig(theme: any) {
  return {
    // Leads
    pending: {
      bg: theme.warning + '20',
      text: theme.warning,
      icon: 'hourglass-outline' as const,
    },
    converted: {
      bg: theme.success + '20',
      text: theme.success,
      icon: 'checkmark-circle' as const,
    },
    rejected: {
      bg: theme.error + '20',
      text: theme.error,
      icon: 'close-circle' as const,
    },

    // Events
    planned: {
      bg: theme.primary + '20',
      text: theme.primary,
      icon: 'calendar-outline' as const,
    },
    'in-progress': {
      bg: theme.secondary + '20',
      text: theme.secondary,
      icon: 'time-outline' as const,
    },
    completed: {
      bg: theme.success + '20',
      text: theme.success,
      icon: 'checkmark-done-circle' as const,
    },
    cancelled: {
      bg: theme.error + '20',
      text: theme.error,
      icon: 'ban' as const,
    },

    // Sources
    online: {
      bg: theme.primary + '20',
      text: theme.primary,
      icon: 'globe-outline' as const,
    },
    offline: {
      bg: theme.textSecondary + '20',
      text: theme.textSecondary,
      icon: 'storefront-outline' as const,
    },

    // General
    approved: {
      bg: theme.success + '20',
      text: theme.success,
      icon: 'checkmark-circle' as const,
    },
    active: {
      bg: theme.success + '20',
      text: theme.success,
      icon: 'checkmark-circle' as const,
    },
    inactive: {
      bg: theme.textSecondary + '20',
      text: theme.textSecondary,
      icon: 'remove-circle' as const,
    },
    draft: {
      bg: theme.textSecondary + '20',
      text: theme.textSecondary,
      icon: 'create-outline' as const,
    },
  };
}

export default function StatusBadge({ status, type, variant, showIcon = true, size = 'medium' }: StatusBadgeProps) {
  const theme = useTheme();
  
  // Handle undefined or null status
  if (!status) {
    return null;
  }

  // Auto-detect type from status text if not provided
  const statusLower = status.toLowerCase().replace(/\s+/g, '-');
  const detectedType = variant || type || (statusLower as StatusType);

  const statusConfig = getStatusConfig(theme);
  const config = statusConfig[detectedType] || statusConfig.draft;

  const sizeConfig = {
    small: { 
      padding: designSystem.spacing[1], 
      fontSize: designSystem.typography.sizes.xs, 
      iconSize: 14 
    },
    medium: { 
      padding: designSystem.spacing[2], 
      fontSize: designSystem.typography.sizes.sm, 
      iconSize: 16 
    },
    large: { 
      padding: designSystem.spacing[3], 
      fontSize: designSystem.typography.sizes.base, 
      iconSize: 18 
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: currentSize.padding + 4,
        paddingVertical: currentSize.padding,
        borderRadius: designSystem.borderRadius.lg,
        backgroundColor: config.bg,
        alignSelf: 'flex-start',
        gap: designSystem.spacing[1],
      }}
    >
      {showIcon && <Ionicons name={config.icon} size={currentSize.iconSize} color={config.text} />}
      <Text
        style={{
          color: config.text,
          fontSize: currentSize.fontSize,
          fontWeight: '600',
        }}
      >
        {status}
      </Text>
    </View>
  );
}
