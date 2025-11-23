/**
 * VenueCard Component
 * Displays venue information in a card format
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import type { Venue } from '@/types/events';

interface VenueCardProps {
  venue: Venue;
  onPress?: () => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onPress }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(modules)/events/[id]',
        params: { id: venue.id.toString(), type: 'venues' },
      } as any);
    }
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
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="location" size={20} color={moduleColors.events.main} />
        <Text
          style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}
          numberOfLines={1}
        >
          {venue.name}
        </Text>
      </View>

      {/* Address */}
      {venue.address && (
        <View style={styles.row}>
          <Ionicons name="map-outline" size={16} color={theme.textSecondary} />
          <Text
            style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {venue.address}
          </Text>
        </View>
      )}

      {/* Capacity */}
      {venue.capacity && (
        <View style={styles.row}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
            Capacity: {venue.capacity}
          </Text>
        </View>
      )}

      {/* Contact */}
      {(venue.contact_person || venue.contact_phone) && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {venue.contact_person && (
            <View style={styles.row}>
              <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
              <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                {venue.contact_person}
              </Text>
            </View>
          )}
          {venue.contact_phone && (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
              <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                {venue.contact_phone}
              </Text>
            </View>
          )}
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
});

export default VenueCard;
