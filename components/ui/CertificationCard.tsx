// CertificationCard.tsx - Display Professional Certifications with Validity Status
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../core/Card';
import { Badge } from '../core/Badge';
import type { Certification } from '../../types/user';
import { useTheme } from '../../hooks/useTheme';
import { 
  isCertificationExpired, 
  isCertificationExpiringSoon 
} from '../../utils/profileMockData';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

export interface CertificationCardProps {
  certification: Certification;
  onPress?: () => void;
}

export function CertificationCard({ certification, onPress }: CertificationCardProps) {
  const { theme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get validity badge
  const getValidityBadge = () => {
    if (!certification.expiry_date) {
      return <Badge label="No Expiry" variant="filled" status="success" />;
    }

    if (isCertificationExpired(certification.expiry_date)) {
      return <Badge label="Expired" variant="filled" status="error" />;
    }

    if (isCertificationExpiringSoon(certification.expiry_date)) {
      return <Badge label="Expiring Soon" variant="filled" status="warning" />;
    }

    return <Badge label="Valid" variant="filled" status="success" />;
  };

  const handlePress = () => {
    if (onPress) {
      triggerHaptic('light');
      onPress();
    }
  };

  const isExpired = certification.expiry_date && isCertificationExpired(certification.expiry_date);

  const validityColor = isExpired ? '#ef4444' : 
    isCertificationExpiringSoon(certification.expiry_date || '') ? '#f59e0b' : '#10b981';

  return (
    <Pressable 
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.cardWrapper, { borderColor: `${validityColor}30` }]}>
      <Card style={isExpired ? styles.expiredCard : styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons 
              name="ribbon-outline" 
              size={24} 
              color={isExpired ? theme.textSecondary : theme.primary} 
            />
          </View>
          <View style={styles.headerContent}>
            <Text 
              style={[
                styles.title, 
                { color: isExpired ? theme.textSecondary : theme.text }
              ]}
              numberOfLines={2}
            >
              {certification.title}
            </Text>
            <Text style={[styles.issuer, { color: theme.textSecondary }]}>
              {certification.issued_by}
            </Text>
          </View>
        </View>

        {/* Description */}
        {certification.description && (
          <Text 
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {certification.description}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.meta}>
          <View style={styles.dates}>
            <View style={styles.dateItem}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={theme.textSecondary} 
              />
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                Issued {formatDate(certification.issue_date)}
              </Text>
            </View>
            
            {certification.expiry_date && (
              <View style={styles.dateItem}>
                <Ionicons 
                  name={isExpired ? "close-circle-outline" : "time-outline"} 
                  size={14} 
                  color={isExpired ? '#ef4444' : theme.textSecondary} 
                />
                <Text 
                  style={[
                    styles.dateText, 
                    { color: isExpired ? '#ef4444' : theme.textSecondary }
                  ]}
                >
                  {isExpired ? 'Expired' : 'Expires'} {formatDate(certification.expiry_date)}
                </Text>
              </View>
            )}
          </View>

          {getValidityBadge()}
        </View>

        {/* Credential ID */}
        {certification.credential_id && (
          <View style={[styles.credentialContainer, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
              Credential ID:
            </Text>
            <Text 
              style={[styles.credentialId, { color: theme.text }]}
              selectable
            >
              {certification.credential_id}
            </Text>
          </View>
        )}
      </Card>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  cardWrapper: {
    borderRadius: 14,
    borderWidth: 3,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
  },
  expiredCard: {
    padding: 16,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  issuer: {
    fontSize: 14,
    fontWeight: '400',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  dates: {
    flex: 1,
    gap: 6,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
  },
  credentialContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  credentialId: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
});
