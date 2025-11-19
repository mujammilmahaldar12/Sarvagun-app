import React from 'react';
import { View, Text } from 'react-native';

export type StatusType = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'draft';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

const STATUS_COLORS = {
  pending: { bg: '#FFFBEB', text: '#F59E0B' },
  approved: { bg: '#ECFDF5', text: '#10B981' },
  rejected: { bg: '#FEE2E2', text: '#EF4444' },
  active: { bg: '#ECFDF5', text: '#10B981' },
  inactive: { bg: '#F3F4F6', text: '#6B7280' },
  draft: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return null;
  }

  // Auto-detect type from status text if not provided
  const statusLower = status.toLowerCase();
  const detectedType =
    type ||
    (statusLower as StatusType) ||
    (statusLower.includes('pend')
      ? 'pending'
      : statusLower.includes('approv')
      ? 'approved'
      : statusLower.includes('reject')
      ? 'rejected'
      : statusLower.includes('activ')
      ? 'active'
      : 'draft');

  const colors = STATUS_COLORS[detectedType] || STATUS_COLORS.draft;

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: colors.bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
        }}
      >
        {status}
      </Text>
    </View>
  );
}
