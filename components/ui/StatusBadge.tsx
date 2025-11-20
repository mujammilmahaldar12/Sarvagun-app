import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
  // Leads
  pending: {
    bg: '#FEF3C7',
    text: '#F59E0B',
    icon: 'hourglass-outline' as const,
  },
  converted: {
    bg: '#D1FAE5',
    text: '#059669',
    icon: 'checkmark-circle' as const,
  },
  rejected: {
    bg: '#FEE2E2',
    text: '#DC2626',
    icon: 'close-circle' as const,
  },

  // Events
  planned: {
    bg: '#DBEAFE',
    text: '#2563EB',
    icon: 'calendar-outline' as const,
  },
  'in-progress': {
    bg: '#E0E7FF',
    text: '#7C3AED',
    icon: 'time-outline' as const,
  },
  completed: {
    bg: '#D1FAE5',
    text: '#059669',
    icon: 'checkmark-done-circle' as const,
  },
  cancelled: {
    bg: '#FEE2E2',
    text: '#DC2626',
    icon: 'ban' as const,
  },

  // Sources
  online: {
    bg: '#E0E7FF',
    text: '#6366F1',
    icon: 'globe-outline' as const,
  },
  offline: {
    bg: '#FCE7F3',
    text: '#DB2777',
    icon: 'storefront-outline' as const,
  },

  // General
  approved: {
    bg: '#ECFDF5',
    text: '#10B981',
    icon: 'checkmark-circle' as const,
  },
  active: {
    bg: '#ECFDF5',
    text: '#10B981',
    icon: 'checkmark-circle' as const,
  },
  inactive: {
    bg: '#F3F4F6',
    text: '#6B7280',
    icon: 'remove-circle' as const,
  },
  draft: {
    bg: '#F3F4F6',
    text: '#6B7280',
    icon: 'create-outline' as const,
  },
};

export default function StatusBadge({ status, type, showIcon = true, size = 'medium' }: StatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return null;
  }

  // Auto-detect type from status text if not provided
  const statusLower = status.toLowerCase().replace(/\s+/g, '-');
  const detectedType = type || (statusLower as StatusType);

  const config = STATUS_CONFIG[detectedType] || STATUS_CONFIG.draft;

  const sizeConfig = {
    small: { padding: 6, fontSize: 12, iconSize: 14 },
    medium: { padding: 10, fontSize: 14, iconSize: 16 },
    large: { padding: 12, fontSize: 16, iconSize: 18 },
  };

  const currentSize = sizeConfig[size];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: currentSize.padding + 4,
        paddingVertical: currentSize.padding,
        borderRadius: 12,
        backgroundColor: config.bg,
        alignSelf: 'flex-start',
        gap: 4,
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
