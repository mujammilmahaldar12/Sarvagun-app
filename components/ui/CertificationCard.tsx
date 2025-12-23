// CertificationCard.tsx - Display Professional Certifications with Validity Status
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
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

  // Get API base URL
  const getApiBaseUrl = () => {
    if (__DEV__) {
      return 'http://10.97.251.100:8000';
    }
    return 'https://api.manager.blingsquare.in';
  };

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
                name={certification.certificate_type === 'company_issued' ? 'shield-checkmark-outline' : 'ribbon-outline'}
                size={24}
                color={isExpired ? theme.textSecondary : theme.primary}
              />
            </View>
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    { color: isExpired ? theme.textSecondary : theme.text }
                  ]}
                  numberOfLines={2}
                >
                  {certification.title}
                </Text>
                {certification.certificate_type === 'company_issued' && (
                  <View style={[styles.typeBadge, { backgroundColor: '#6D376D' + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#6D376D' }]}>
                      Company
                    </Text>
                  </View>
                )}
              </View>
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

          {/* Credential ID or Verification Code */}
          {certification.certificate_type === 'external' && certification.credential_id && (
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

          {certification.certificate_type === 'company_issued' && certification.verification_code && (
            <View style={[styles.credentialContainer, { backgroundColor: '#6D376D' + '10' }]}>
              <Ionicons name="shield-checkmark" size={16} color="#6D376D" />
              <Text style={[styles.credentialLabel, { color: '#6D376D' }]}>
                Verification:
              </Text>
              <Text
                style={[styles.credentialId, { color: '#6D376D', fontWeight: '600' }]}
                selectable
              >
                {certification.verification_code}
              </Text>
            </View>
          )}

          {/* Download Button - Available for all certificates with files */}
          {(certification.certificate_file || certification.generated_certificate_url) && (
            <Pressable
              style={[styles.viewCertButton, { backgroundColor: theme.primary }]}
              onPress={async () => {
                triggerHaptic('light');
                try {
                  const baseUrl = getApiBaseUrl();
                  const downloadUrl = `${baseUrl}/api/hr/certifications/${certification.id}/download/`;
                  console.log('📥 Opening download URL:', downloadUrl);

                  const supported = await Linking.canOpenURL(downloadUrl);
                  if (supported) {
                    await Linking.openURL(downloadUrl);
                  } else {
                    Alert.alert('Error', 'Cannot open download link');
                  }
                } catch (error) {
                  console.error('❌ Download error:', error);
                  Alert.alert('Download Failed', 'Unable to download certificate. Please try again.');
                }
              }}
            >
              <Ionicons name="download-outline" size={18} color="#FFF" />
              <Text style={styles.viewCertButtonText}>Download Certificate</Text>
            </Pressable>
          )}

          {/* Credential URL for External - Opens external verification */}
          {certification.certificate_type === 'external' && certification.credential_url && (
            <Pressable
              style={[styles.viewCertButton, { backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary, marginTop: 8 }]}
              onPress={async () => {
                triggerHaptic('light');
                try {
                  const supported = await Linking.canOpenURL(certification.credential_url!);
                  if (supported) {
                    await Linking.openURL(certification.credential_url!);
                  } else {
                    Alert.alert('Error', 'Cannot open verification link');
                  }
                } catch (error) {
                  console.error('❌ Open URL error:', error);
                  Alert.alert('Error', 'Unable to open verification link');
                }
              }}
            >
              <Ionicons name="link-outline" size={18} color={theme.primary} />
              <Text style={[styles.viewCertButtonText, { color: theme.primary }]}>Verify Credential</Text>
            </Pressable>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  viewCertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  viewCertButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
