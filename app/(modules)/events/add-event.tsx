import React, { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ModuleHeader, Button, FormField, FormSection, Chip } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { baseColors, spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

const EVENT_TYPES = ['Conference', 'Workshop', 'Seminar', 'Launch', 'Training', 'Meeting', 'Other'];

export default function AddEventScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { fromLead } = useLocalSearchParams<{ fromLead?: string }>();
  const user = useAuthStore((state) => state.user);

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(modules)/events');
    }
  }, [navigation, router]);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    startDate: '',
    endDate: '',
    venue: '',
    venueAddress: '',
    budget: '',
    attendees: '',
    description: '',
    agenda: '',
  });

  const [documents, setDocuments] = useState<any[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickDocument = async () => {
    // TODO: Implement document picker
    console.log('Pick document');
    Alert.alert('Info', 'Document picker will be implemented with expo-document-picker');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.eventName.trim()) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }
    if (!formData.eventType) {
      Alert.alert('Error', 'Please select event type');
      return;
    }
    if (!formData.startDate.trim()) {
      Alert.alert('Error', 'Please enter start date');
      return;
    }
    if (!formData.venue.trim()) {
      Alert.alert('Error', 'Please enter venue');
      return;
    }

    // Submit logic here
    console.log('Submitting event:', formData);
    Alert.alert('Success', 'Event created successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ModuleHeader
        title={fromLead ? "Convert Lead to Event" : "Add New Event"}
        showBack
        onBack={safeGoBack}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {fromLead && (
          <View style={styles.leadBanner}>
            <Text style={[getTypographyStyle('base', 'regular'), { color: theme.text }]}>
              Creating event from lead #{fromLead}
            </Text>
          </View>
        )}

        {/* Event Information */}
        <FormSection title="Event Information">
          <FormField
            label="Event Name *"
            value={formData.eventName}
            onChangeText={(text: string) => updateField('eventName', text)}
            placeholder="Enter event name"
          />
          <View style={styles.chipSection}>
            <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
              Event Type *
            </Text>
            <View style={styles.chipContainer}>
              {EVENT_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={formData.eventType === type}
                  onPress={() => updateField('eventType', type)}
                />
              ))}
            </View>
          </View>
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <FormField
                label="Start Date *"
                value={formData.startDate}
                onChangeText={(text: string) => updateField('startDate', text)}
                placeholder="DD-MM-YYYY"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="End Date"
                value={formData.endDate}
                onChangeText={(text: string) => updateField('endDate', text)}
                placeholder="DD-MM-YYYY"
              />
            </View>
          </View>
        </FormSection>

        {/* Venue Information */}
        <FormSection title="Venue Information">
          <FormField
            label="Venue *"
            value={formData.venue}
            onChangeText={(text: string) => updateField('venue', text)}
            placeholder="Enter venue name"
          />
          <FormField
            label="Venue Address"
            value={formData.venueAddress}
            onChangeText={(text: string) => updateField('venueAddress', text)}
            placeholder="Enter venue address"
            multiline
          />
          <FormField
            label="Expected Attendees"
            value={formData.attendees}
            onChangeText={(text: string) => updateField('attendees', text)}
            placeholder="Enter number of attendees"
            keyboardType="numeric"
          />
        </FormSection>

        {/* Financial Information */}
        <FormSection title="Financial Information">
          <FormField
            label="Budget"
            value={formData.budget}
            onChangeText={(text: string) => updateField('budget', text)}
            placeholder="0"
            keyboardType="numeric"
            prefix="₹"
          />
        </FormSection>

        {/* Event Details */}
        <FormSection title="Event Details">
          <FormField
            label="Description"
            value={formData.description}
            onChangeText={(text: string) => updateField('description', text)}
            placeholder="Enter event description"
            multiline
          />
          <FormField
            label="Agenda"
            value={formData.agenda}
            onChangeText={(text: string) => updateField('agenda', text)}
            placeholder="Enter event agenda"
            multiline
          />
        </FormSection>

        {/* Documents */}
        <FormSection title="Documents">
          <Button
            title="Upload Documents"
            onPress={pickDocument}
            variant="secondary"
            leftIcon="cloud-upload-outline"
          />

          {documents.length > 0 && (
            <View style={styles.documentsContainer}>
              {documents.map((doc, index) => (
                <View key={index} style={styles.documentRow}>
                  <View style={styles.documentInfo}>
                    <Ionicons name="document" size={20} color={theme.primary} />
                    <Text style={[getTypographyStyle('base', 'regular'), { color: theme.text, flex: 1 }]}>
                      {doc.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeDocument(index)}>
                    <Ionicons name="close-circle" size={24} color={baseColors.error[500]} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </FormSection>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title="Create Event"
            onPress={handleSubmit}
            size="lg"
            leftIcon="calendar"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.lg,
  },
  leadBanner: {
    backgroundColor: baseColors.purple[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.purple[500],
  },
  chipSection: {
    gap: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  documentsContainer: {
    gap: spacing.sm,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: baseColors.neutral[100],
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  submitContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
