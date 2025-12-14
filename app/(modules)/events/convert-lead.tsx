import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Button, FormField } from '@/components';
import { DatePicker, DateRangePicker, MultiDatePicker, Select } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';
import notificationsService from '@/services/notifications.service';
import type { Lead, Venue, ClientCategory, Organisation } from '@/types/events';

export default function ConvertLeadScreen() {
  console.log('🎬 ConvertLeadScreen RENDERED');

  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { leadId } = useLocalSearchParams<{ leadId: string }>();

  console.log('📋 Lead ID from params:', leadId);

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(modules)/events');
    }
  }, [navigation, router]);

  const [loading, setLoading] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const [formData, setFormData] = useState({
    company: '' as 'redmagic events' | 'bling square events' | '',
    categoryId: 0,
    organisationId: 0,
    venueId: 0,
    startDate: null as Date | null,
    endDate: null as Date | null,
    typeOfEvent: '',
    eventCategory: '' as 'social events' | 'weddings' | 'corporate events' | 'religious events' | 'sports' | 'other' | '',
  });

  const [eventDates, setEventDates] = useState<Date[]>([]);

  const eventCategoryOptions = [
    'social events',
    'weddings',
    'corporate events',
    'religious events',
    'sports',
    'other'
  ] as const;

  useEffect(() => {
    fetchData();
  }, []);

  // Track loading state changes visually
  useEffect(() => {
    if (!loading && lead) {
      // Data loaded successfully
      Alert.alert('✅ Data Loaded', `Lead loaded: ${lead.client?.name || 'Unknown'}`);
    }
  }, [loading, lead]);

  const fetchData = async () => {
    if (!leadId) {
      Alert.alert('Error', 'No lead ID provided');
      safeGoBack();
      return;
    }

    setLoading(true);
    try {
      const [leadData, venuesData, categoriesData, orgsData] = await Promise.all([
        eventsService.getLead(Number(leadId)),
        eventsService.getVenues(),
        eventsService.getClientCategories(),
        eventsService.getOrganisations(),
      ]);

      console.log('✅ Lead data fetched:', leadData);
      setLead(leadData);
      setVenues(venuesData || []);
      setCategories(categoriesData || []);
      setOrganisations(orgsData || []);
      console.log('📊 Data loaded - Venues:', venuesData?.length, 'Categories:', categoriesData?.length, 'Orgs:', orgsData?.length);

      // Initialize venue from lead's event if available
      if (leadData.event && typeof leadData.event === 'object' && leadData.event.venue) {
        setSelectedVenue(leadData.event.venue);
        setFormData(prev => ({
          ...prev,
          venueId: leadData.event && typeof leadData.event === 'object' ? leadData.event.venue?.id || 0 : 0,
          typeOfEvent: '', // Start with empty field, let user type
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          typeOfEvent: '', // Start with empty field, let user type
        }));
      }
    } catch (error: any) {
      console.error('Event management fetch error:', error);
      Alert.alert('Error', error.message || 'Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  const requiresOrganisation = () => {
    if (!formData.categoryId || !Array.isArray(categories)) return false;
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    // B2B and B2G require organisation
    return selectedCategory?.code === 'b2b' || selectedCategory?.code === 'b2g';
  };

  const getSelectedCategory = () => {
    if (!Array.isArray(categories)) return undefined;
    return categories.find(c => c.id === formData.categoryId);
  };

  const getSelectedOrganisation = () => {
    if (!Array.isArray(organisations)) return undefined;
    return organisations.find(o => o.id === formData.organisationId);
  };



  const handleEventDatesChange = (dates: Date[]) => {
    setEventDates(dates);
  };

  const handleSubmit = async () => {
    console.log('🔵 Convert button clicked!');

    // Prevent double submission
    if (loading) {
      console.log('⚠️ Already processing, ignoring duplicate click');
      return;
    }

    console.log('✅ Not loading, proceeding with submission');
    console.log('Form data:', JSON.stringify(formData, null, 2));
    console.log('Event dates:', eventDates);
    console.log('Selected venue:', selectedVenue);
    console.log('Lead:', lead);

    // Validation
    if (!formData.company) {
      console.log('❌ Validation failed: No company selected');
      Alert.alert('Error', 'Please select a company');
      return;
    }
    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select a client category');
      return;
    }

    // Check if B2B/B2G requires organisation
    if (requiresOrganisation() && !formData.organisationId) {
      Alert.alert('Error', 'Please select an organisation for this category');
      return;
    }

    if (!formData.startDate) {
      Alert.alert('Error', 'Please select a start date');
      return;
    }
    if (!formData.endDate) {
      Alert.alert('Error', 'Please select an end date');
      return;
    }
    if (!formData.typeOfEvent.trim()) {
      Alert.alert('Error', 'Please enter the type of event');
      return;
    }
    if (!formData.eventCategory) {
      Alert.alert('Error', 'Please select an event category');
      return;
    }

    // Validate event dates
    if (eventDates.length === 0) {
      Alert.alert('Error', 'Please add at least one event date');
      return;
    }

    // Validate venue (use selected venue or venue from lead's event)
    const venueToUse = selectedVenue || (lead?.event && typeof lead.event === 'object' ? lead.event.venue : null);
    if (!venueToUse) {
      Alert.alert('Error', 'Please select a venue');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = getSelectedCategory();

      // Format dates to YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const payload = {
        company: formData.company,
        client_category: selectedCategory?.code as 'b2b' | 'b2c' | 'b2g',
        organisation: formData.organisationId || undefined,
        venue: venueToUse.id,
        start_date: formatDate(formData.startDate),
        end_date: formatDate(formData.endDate),
        type_of_event: formData.typeOfEvent.trim(),
        category: formData.eventCategory,
        event_dates: eventDates.map(date => ({ date: formatDate(date) })),
      };

      console.log('🚀 Converting lead to event:', {
        leadId,
        payload,
      });

      const response = await eventsService.convertLeadToEvent(Number(leadId), payload);

      console.log('✅ Lead converted successfully:', response);

      // Send notification to admins about lead conversion
      try {
        await notificationsService.notifyLeadConversion(
          Number(leadId),
          response.id || response.event_id,
          formData.company
        );
        console.log('✅ Notification sent for lead conversion');
      } catch (notifError) {
        console.error('⚠️ Failed to send notification:', notifError);
        // Don't fail the conversion if notification fails
      }

      // Show success animation
      setShowSuccessAnimation(true);

      // Wait for animation, then navigate to events tab
      setTimeout(() => {
        // Navigate to events module with events tab active
        router.replace('/(modules)/events');

        // Show success message with event details
        setTimeout(() => {
          Alert.alert(
            'Success! 🎉',
            `Lead converted to event successfully!\n\nEvent ID: ${response.eventId || response.id}\nClient: ${lead?.client?.name}`,
            [
              { text: 'View Events', onPress: () => router.push('/(modules)/events') },
              { text: 'OK', style: 'default' }
            ]
          );
        }, 400);
      }, 1200);
    } catch (error: any) {
      console.error('❌ Error converting lead:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Extract error message from different possible formats
      let errorMessage = 'Failed to convert lead. Please check all required fields.';

      if (error.response?.data) {
        const data = error.response.data;

        // Check various error formats
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          // Handle error field (string or array)
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (Array.isArray(data.error)) {
            errorMessage = data.error.join(', ');
          } else {
            errorMessage = JSON.stringify(data.error);
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(', ')
            : data.non_field_errors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Clean up the error message (remove array brackets and quotes)
      errorMessage = errorMessage.replace(/^\['?|'?\]$/g, '').replace(/^"?|"?$/g, '');

      Alert.alert('Conversion Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      color: theme.text,
      marginTop: spacing[1],
      marginBottom: spacing[2]
    }}>
      {title}
    </Text>
  );





  if (loading || !lead) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Convert Lead to Event" showBack onBack={safeGoBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{
            color: theme.text,
            marginTop: 16,
            ...getTypographyStyle('base')
          }}>
            Loading lead details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ flex: 1 }}>
        <ModuleHeader title="Convert Lead to Event" showBack onBack={safeGoBack} />



        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Lead Info */}
          <View style={{
            backgroundColor: theme.primary + '15',
            padding: 12,
            borderRadius: 10,
            borderLeftWidth: 3,
            borderLeftColor: theme.primary,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="person-circle" size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, ...getTypographyStyle('base', 'bold') }}>
                Converting Lead: {lead.client.name}
              </Text>
            </View>
            {lead.client.email && (
              <Text style={{ color: theme.text, ...getTypographyStyle('sm'), marginLeft: 28 }}>
                📧 {lead.client.email}
              </Text>
            )}
            {lead.client.number && (
              <Text style={{ color: theme.text, ...getTypographyStyle('sm'), marginLeft: 28 }}>
                📱 {lead.client.number}
              </Text>
            )}
          </View>

          {/* Company Selection */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="Company *" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['redmagic events', 'bling square events'] as const).map((company) => (
                <Pressable
                  key={company}
                  onPress={() => setFormData({ ...formData, company })}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 10,
                    minHeight: 44,
                    borderRadius: 10,
                    borderWidth: formData.company === company ? 2 : 1.5,
                    borderColor: formData.company === company ? theme.primary : theme.border,
                    backgroundColor: formData.company === company
                      ? theme.primary + '15'
                      : theme.surface,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  })}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={formData.company === company ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={{
                      ...getTypographyStyle('sm', 'semibold'),
                      color: formData.company === company ? theme.primary : theme.text,
                    }}
                  >
                    {company === 'redmagic events' ? 'RedMagic' : 'Bling Square'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Client Business Type Section */}
          <View style={{ gap: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingBottom: 6,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <Ionicons name="business-outline" size={20} color={theme.primary} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
                Client Business Type
              </Text>
            </View>

            <Select
              label="Client Category (B2B/B2C/B2G)"
              value={formData.categoryId}
              options={(categories || []).map(c => ({ label: c.name, value: c.id }))}
              onChange={(val) => setFormData({ ...formData, categoryId: Number(val) })}
              placeholder="Select client category"
              required
            />

            {/* Organisation (conditional) */}
            {requiresOrganisation() && (
              <Select
                label="Organisation"
                value={formData.organisationId}
                options={(organisations || []).map(o => ({ label: o.name, value: o.id }))}
                onChange={(val) => setFormData({ ...formData, organisationId: Number(val) })}
                placeholder="Select organisation"
                required
              />
            )}
          </View>

          {/* Event Details Section */}
          <View style={{ gap: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingBottom: 6,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>
                Event Details
              </Text>
            </View>

            <FormField
              label="Type of Event"
              value={formData.typeOfEvent}
              onChangeText={(text: string) => setFormData({ ...formData, typeOfEvent: text })}
              placeholder="Enter type of event (e.g., Birthday Party, Conference)"
              required
            />

            {/* Event Category Dropdown */}
            <Select
              label="Event Category (Wedding/Corporate/etc.)"
              value={formData.eventCategory}
              options={eventCategoryOptions.map(c => ({ label: c, value: c }))}
              onChange={(val) => setFormData({ ...formData, eventCategory: val as any })}
              placeholder="Select event category"
              required
            />

            {/* Date Selection */}
            <DateRangePicker
              label="Event Duration"
              value={{ startDate: formData.startDate || undefined, endDate: formData.endDate || undefined }}
              onChange={(range) => setFormData({ ...formData, startDate: range.startDate || null, endDate: range.endDate || null })}
              placeholder="Select start and end date"
              required
            />
          </View>

          {/* Venue Selection */}
          <Select
            label="Venue"
            value={selectedVenue?.id || formData.venueId || 0}
            options={(venues || []).map(v => ({ label: v.name, value: v.id }))}
            onChange={(val) => {
              const venue = venues.find(v => v.id === val);
              setSelectedVenue(venue || null);
              setFormData({ ...formData, venueId: Number(val) });
            }}
            placeholder="Select venue"
            required
            searchable
            leadingIcon="location-outline"
          />

          {/* Venue Info from Lead */}
          {(selectedVenue || (lead.event && typeof lead.event === 'object' && lead.event.venue)) && (
            <View style={{
              backgroundColor: theme.surface,
              padding: 14,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: theme.primary,
              gap: 6,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                  {selectedVenue ? 'Selected Venue' : 'Venue (from Lead)'}
                </Text>
              </View>
              <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginLeft: 28 }}>
                {(selectedVenue || (lead.event && typeof lead.event === 'object' ? lead.event.venue : null))?.name}
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginLeft: 28 }}>
                {(selectedVenue || (lead.event && typeof lead.event === 'object' ? lead.event.venue : null))?.address}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginLeft: 28, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="people" size={14} color={theme.textSecondary} />
                  <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                    {(selectedVenue || (lead.event && typeof lead.event === 'object' ? lead.event.venue : null))?.capacity} capacity
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="pricetag" size={14} color={theme.textSecondary} />
                  <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                    {(selectedVenue || (lead.event && typeof lead.event === 'object' ? lead.event.venue : null))?.type_of_venue}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Event Active Days */}
          <MultiDatePicker
            label="Event Active Days"
            selectedDates={eventDates}
            onChange={handleEventDatesChange}
            placeholder="Select event dates"
            minDate={formData.startDate || undefined}
            maxDate={formData.endDate || undefined}
            required
          />
        </ScrollView>

        {/* Fixed Submit Button */}
        <View style={{
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          zIndex: 1000,
          position: 'relative',
        }}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.primary + 'DD' : theme.primary,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: loading ? 0.7 : 1,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={26} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}>
                  Convert to Event
                </Text>
              </>
            )}
          </Pressable>
        </View>



        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999999,
            elevation: 9999999,
          }}>
            <View style={{
              backgroundColor: theme.surface,
              padding: 32,
              borderRadius: 24,
              alignItems: 'center',
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 10,
            }}>
              <Ionicons name="checkmark-circle" size={80} color={theme.primary} />
              <Text style={{
                ...getTypographyStyle('xl', 'bold'),
                color: theme.text,
                marginTop: 16,
                marginBottom: 8,
              }}>
                Success!
              </Text>
              <Text style={{
                ...getTypographyStyle('base'),
                color: theme.textSecondary,
                textAlign: 'center',
              }}>
                Lead converted successfully
              </Text>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}