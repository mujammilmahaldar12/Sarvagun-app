import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ModuleHeader, Button, FormField, FormSection, Chip } from '@/components';
import { DatePicker, Select, MultiDatePicker } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { baseColors, spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';

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

  const [loading, setLoading] = useState(false);
  const [fetchingLead, setFetchingLead] = useState(false);
  const [leadData, setLeadData] = useState<any>(null); // Store full lead data
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isEditingVenue, setIsEditingVenue] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventType: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    selectedDates: [] as Date[],
    venue: '',
    venueAddress: '',
    company: 'bling square events',
    category: 'corporate events', // Default
  });

  const COMPANIES = ['bling square events', 'redmagic events'];
  const EVENT_CATEGORIES = ['corporate events', 'social events', 'weddings', 'religious events', 'sports', 'other'];

  const [documents, setDocuments] = useState<any[]>([]);

  // Fetch lead details if fromLead is present
  useEffect(() => {
    if (fromLead) {
      fetchLeadDetails(Number(fromLead));
    }
  }, [fromLead]);

  const fetchLeadDetails = async (leadId: number) => {
    setFetchingLead(true);
    try {
      const lead = await eventsService.getLead(leadId);
      setLeadData(lead);
      const leadAny = lead as any;

      // Pre-fill form data
      setFormData(prev => ({
        ...prev,
        clientName: lead.client?.name || '',
        clientEmail: lead.client?.email || '',
        clientPhone: lead.client?.number || '',
        eventType: lead.event && typeof lead.event === 'object' ? (lead.event as any).type_of_event : (leadAny.type_of_event || ''),
        startDate: leadAny.start_date ? new Date(leadAny.start_date) : null,
        endDate: leadAny.end_date ? new Date(leadAny.end_date) : null,
        venue: leadAny.venue?.name || '',
        venueAddress: leadAny.venue?.address || '',
      }));
    } catch (error) {
      console.error('Error fetching lead:', error);
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      setFetchingLead(false);
    }
  };

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

  const handleSubmit = async () => {
    // Validation
    if (!formData.eventType.trim()) {
      Alert.alert('Error', 'Please enter event type');
      return;
    }
    if (!formData.startDate) {
      Alert.alert('Error', 'Please select start date');
      return;
    }
    if (formData.selectedDates.length === 0) {
      Alert.alert('Error', 'Please select at least one active day');
      return;
    }
    if (!formData.venue.trim()) {
      Alert.alert('Error', 'Please enter venue');
      return;
    }

    setLoading(true);
    try {
      if (fromLead && leadData) {
        const clientCategoryCode = leadData.client?.client_category?.[0]?.code || 'b2b';

        await eventsService.convertLead(Number(fromLead), {
          company: formData.company as any,
          client_category: clientCategoryCode,
          venue: {
            name: formData.venue,
            address: formData.venueAddress,
          },
          start_date: formData.startDate!.toISOString().split('T')[0],
          end_date: (formData.endDate || formData.startDate!).toISOString().split('T')[0],
          type_of_event: formData.eventType,
          category: formData.category,
          event_dates: [{ date: formData.startDate!.toISOString().split('T')[0] }],
          // Add active days if available, otherwise it defaults to 1 or calculated by backend
          ...(formData.activeDays ? { active_days: parseInt(formData.activeDays) } : {}),
        });

        Alert.alert('Success', 'Lead converted to event successfully', [
          { text: 'OK', onPress: () => router.push('/(modules)/events') },
        ]);
      } else {
        // Create new standalone event
        Alert.alert('Notice', 'Direct event creation is currently restricted. Please start from a Lead.');
      }
    } catch (error: any) {
      console.error('Error submitting event:', error);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to submit event');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingLead) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>Loading lead details...</Text>
      </View>
    );
  }

  const clientCardStyles = {
    card: {
      backgroundColor: theme.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      marginBottom: spacing.sm,
      borderBottomColor: theme.border,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ModuleHeader
        title={fromLead ? "Convert Lead to Event" : "Add New Event"}
        showBack
        onBack={safeGoBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info Card (Editable) */}
        <View style={clientCardStyles.card}>
          <View style={clientCardStyles.header}>
            <Ionicons name="person" size={20} color={theme.primary} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
              Client Information
            </Text>
            <Pressable onPress={() => setIsEditingClient(!isEditingClient)}>
              <Ionicons
                name={isEditingClient ? "checkmark-circle" : "create-outline"}
                size={24}
                color={isEditingClient ? theme.success : theme.primary}
              />
            </Pressable>
          </View>
          <View style={{ gap: spacing.sm }}>
            {isEditingClient ? (
              <>
                <FormField
                  label="Name *"
                  value={formData.clientName}
                  onChangeText={(text: string) => updateField('clientName', text)}
                  placeholder="Enter client name"
                  shape="pill"
                />
                <FormField
                  label="Email *"
                  value={formData.clientEmail}
                  onChangeText={(text: string) => updateField('clientEmail', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  shape="pill"
                />
                <FormField
                  label="Phone *"
                  value={formData.clientPhone}
                  onChangeText={(text: string) => updateField('clientPhone', text)}
                  placeholder="Enter phone"
                  keyboardType="phone-pad"
                  shape="pill"
                />
              </>
            ) : (
              <>
                <View style={clientCardStyles.row}>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 80 }]}>Name</Text>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                    {formData.clientName || leadData?.client?.name || 'Not set'}
                  </Text>
                </View>
                <View style={clientCardStyles.row}>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 80 }]}>Email</Text>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                    {formData.clientEmail || leadData?.client?.email || 'Not set'}
                  </Text>
                </View>
                <View style={clientCardStyles.row}>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 80 }]}>Phone</Text>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                    {formData.clientPhone || leadData?.client?.number || 'Not set'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Venue Info Card (Editable) */}
        <View style={clientCardStyles.card}>
          <View style={clientCardStyles.header}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
              Venue Information
            </Text>
            <Pressable onPress={() => setIsEditingVenue(!isEditingVenue)}>
              <Ionicons
                name={isEditingVenue ? "checkmark-circle" : "create-outline"}
                size={24}
                color={isEditingVenue ? theme.success : theme.primary}
              />
            </Pressable>
          </View>
          <View style={{ gap: spacing.sm }}>
            {isEditingVenue ? (
              <>
                <FormField
                  label="Venue Name *"
                  value={formData.venue}
                  onChangeText={(text: string) => updateField('venue', text)}
                  placeholder="Enter venue name"
                  shape="pill"
                />
                <FormField
                  label="Address"
                  value={formData.venueAddress}
                  onChangeText={(text: string) => updateField('venueAddress', text)}
                  placeholder="Enter venue address"
                  multiline
                />
              </>
            ) : (
              <>
                <View style={clientCardStyles.row}>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 80 }]}>Name</Text>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                    {formData.venue || 'Not set'}
                  </Text>
                </View>
                <View style={clientCardStyles.row}>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 80 }]}>Address</Text>
                  <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.text, flex: 1 }]}>
                    {formData.venueAddress || 'Not set'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <FormSection title="Event Information">
          {/* Company Selection */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, marginBottom: spacing.sm }]}>
              Company *
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {COMPANIES.map((company) => (
                <Chip
                  key={company}
                  label={company === 'bling square events' ? 'Bling Square' : 'RedMagic'}
                  selected={formData.company === company}
                  onPress={() => updateField('company', company)}
                  variant={formData.company === company ? 'primary' : 'outline'}
                />
              ))}
            </View>
          </View>

          {/* Event Category */}
          <Select
            label="Event Category *"
            value={formData.category}
            placeholder="Select Category"
            options={EVENT_CATEGORIES.map(cat => ({
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
              value: cat
            }))}
            onChange={(val) => updateField('category', val as string)}
          />

          <FormField
            label="Event Type *"
            value={formData.eventType}
            onChangeText={(text: string) => updateField('eventType', text)}
            placeholder="Enter event type (e.g., Conference, Workshop)"
            shape="pill"
          />
        </FormSection>

        <FormSection title="Event Schedule">
          <View style={styles.rowFields}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <DatePicker
                label="Start Date *"
                value={formData.startDate}
                onChange={(date) => {
                  setFormData(prev => {
                    let newEndDate = prev.endDate;
                    if (date && prev.endDate && date > prev.endDate) {
                      newEndDate = date;
                    }
                    return { ...prev, startDate: date, endDate: newEndDate };
                  });
                }}
                placeholder="Select date"
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => {
                  if (date && formData.startDate && date < formData.startDate) {
                    Alert.alert("Invalid Date", "End date cannot be before start date");
                    return;
                  }
                  setFormData(prev => ({ ...prev, endDate: date }));
                }}
                placeholder="Select date"
                minDate={formData.startDate || undefined}
              />
            </View>
          </View>

          {/* Multi-Date Picker for Active Days - Only show when dates are selected */}
          {formData.startDate && formData.endDate && (
            <MultiDatePicker
              label="Active Days *"
              selectedDates={formData.selectedDates}
              onChange={(dates) => setFormData(prev => ({ ...prev, selectedDates: dates }))}
              placeholder="Tap to select event dates"
              minDate={formData.startDate || undefined}
              maxDate={formData.endDate || undefined}
            />
          )}
        </FormSection>

        <View style={styles.submitContainer}>
          <Button
            title={loading ? 'Processing...' : (fromLead ? 'Confirm Conversion' : 'Create Event')}
            onPress={handleSubmit}
            size="lg"
            leftIcon="calendar"
            shape="pill"
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color applied dynamically via theme
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  submitContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
