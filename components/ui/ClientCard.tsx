/**
 * ClientCard Component
 * Displays client information in a card format
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Chip } from './Chip';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import type { Client } from '@/types/events';

interface ClientCardProps {
  client: Client;
  onPress?: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(modules)/events/[id]',
        params: { id: client.id.toString(), type: 'clients' },
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
        <View style={styles.titleContainer}>
          <Ionicons name="people" size={20} color={moduleColors.clients.main} />
          <Text
            style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}
            numberOfLines={1}
          >
            {client.name}
          </Text>
        </View>
        {client.bookings_count !== undefined && (
          <View style={[styles.bookingsBadge, { backgroundColor: moduleColors.events.light }]}>
            <Text style={[getTypographyStyle('xs', 'semibold'), { color: moduleColors.events.main }]}>
              {client.bookings_count} {client.bookings_count === 1 ? 'Booking' : 'Bookings'}
            </Text>
          </View>
        )}
      </View>

      {/* Contact Info */}
      <View style={styles.infoSection}>
        {client.number && (
          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              {client.number}
            </Text>
          </View>
        )}

        {client.email && (
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
            <Text
              style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {client.email}
            </Text>
          </View>
        )}

        {client.leadperson && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              {client.leadperson}
            </Text>
          </View>
        )}
      </View>

      {/* Categories */}
      {client.category && client.category.length > 0 && (
        <View style={styles.categoriesSection}>
          {client.category.slice(0, 3).map((cat, index) => (
            <Chip
              key={index}
              label={cat.name}
              variant="outlined"
              size="sm"
            />
          ))}
          {client.category.length > 3 && (
            <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
              +{client.category.length - 3} more
            </Text>
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
  bookingsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
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
  categoriesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
});

export default ClientCard;
