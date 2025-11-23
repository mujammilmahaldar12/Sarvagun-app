/**
 * LeadCard Component
 * Displays lead information in a card format
 * Used in LeadsList component
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { StatusBadge } from './StatusBadge';
import { spacing, borderRadius, moduleColors, baseColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import type { Lead } from '@/types/events';

interface LeadCardProps {
  lead: Lead;
  onPress?: () => void;
  onConvert?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  onConvert,
  onReject,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(modules)/events/[id]',
        params: { id: lead.id.toString(), type: 'leads' },
      } as any);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const canConvert = !lead.convert && !lead.reject;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        getCardStyle(theme.surface, 'md', 'md'),
        getShadowStyle('sm', theme.isDark),
        pressed && styles.pressed,
      ]}
    >
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="person-add" size={20} color={moduleColors.events.main} />
          <Text
            style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}
            numberOfLines={1}
          >
            {lead.client?.name || 'Unknown Client'}
          </Text>
        </View>
        <StatusBadge status={lead.status} type="lead" />
      </View>

      {/* Contact Info */}
      <View style={styles.infoSection}>
        {lead.client?.number && (
          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              {lead.client.number}
            </Text>
          </View>
        )}

        {lead.client?.email && (
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
            <Text
              style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {lead.client.email}
            </Text>
          </View>
        )}

        {lead.client?.leadperson && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              {lead.client.leadperson}
            </Text>
          </View>
        )}
      </View>

      {/* Source and Date */}
      <View style={styles.metaSection}>
        <View style={[styles.sourceBadge, { backgroundColor: lead.source === 'online' ? baseColors.info[50] : baseColors.neutral[100] }]}>
          <Ionicons
            name={lead.source === 'online' ? 'globe-outline' : 'storefront-outline'}
            size={14}
            color={lead.source === 'online' ? baseColors.info[600] : baseColors.neutral[600]}
          />
          <Text
            style={[
              getTypographyStyle('xs', 'medium'),
              { color: lead.source === 'online' ? baseColors.info[600] : baseColors.neutral[600] },
            ]}
          >
            {lead.source || 'Unknown'}
          </Text>
        </View>

        <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
          {formatDate(lead.created_at)}
        </Text>
      </View>

      {/* Actions */}
      {showActions && canConvert && onConvert && onReject && (
        <View style={[styles.actionsContainer, { borderTopColor: theme.border }]}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onReject();
            }}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: pressed ? baseColors.error[100] : baseColors.error[50] },
            ]}
          >
            <Ionicons name="close-circle-outline" size={18} color={baseColors.error[600]} />
            <Text style={[getTypographyStyle('sm', 'medium'), { color: baseColors.error[600] }]}>
              Reject
            </Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onConvert();
            }}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: pressed ? baseColors.success[100] : baseColors.success[50] },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={baseColors.success[600]} />
            <Text style={[getTypographyStyle('sm', 'medium'), { color: baseColors.success[600] }]}>
              Convert
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  infoSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
});

export default LeadCard;
