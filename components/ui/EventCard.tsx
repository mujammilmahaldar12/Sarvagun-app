/**
 * EventCard Component
 * Displays event information in a card format
 * Used in EventsList component
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { StatusBadge } from './StatusBadge';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import type { Event } from '@/types/events';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(modules)/events/[id]',
        params: { id: event.id.toString(), type: 'events' },
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

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
          <Ionicons name="calendar" size={20} color={moduleColors.events.main} />
          <Text
            style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}
            numberOfLines={1}
          >
            {event.name}
          </Text>
        </View>
        <StatusBadge status={event.status} type="event" />
      </View>

      {/* Client Info */}
      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
        <Text
          style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {event.client?.name || 'No client'}
        </Text>
      </View>

      {/* Date Range */}
      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
        <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </Text>
      </View>

      {/* Venue */}
      {event.venue && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
          <Text
            style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {event.venue.name}
          </Text>
        </View>
      )}

      {/* Budget */}
      {event.total_budget && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.budgetContainer}>
            <Ionicons name="cash-outline" size={16} color={moduleColors.finance.main} />
            <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>
              Budget:
            </Text>
            <Text style={[getTypographyStyle('sm', 'semibold'), { color: moduleColors.finance.main }]}>
              {formatCurrency(event.total_budget)}
            </Text>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

export default EventCard;
