import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, TextInput } from 'react-native';
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
  const { fromLead, id } = useLocalSearchParams<{ fromLead?: string; id?: string }>();
  const isEditMode = !!id;
  const user = useAuthStore((state) => state.user);

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const [loading, setLoading] = useState(false);
  const [fetchingLead, setFetchingLead] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [clientCategories, setClientCategories] = useState<any[]>([]);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isCreatingNewVenue, setIsCreatingNewVenue] = useState(false);

  // Organisation Modal States
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventType: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    selectedDates: [] as Date[],
    venueId: 0,
    venue: '',
    venueAddress: '',
    company: 'bling square events',
    category: 'corporate events',
    organisationId: 0,  // Added for B2B/B2G requirement
    clientCategory: '',  // To track the category code (b2b/b2c/b2g)
  });

  const COMPANIES = ['bling square events', 'redmagic events'];
  const EVENT_CATEGORIES = ['corporate events', 'social events', 'weddings', 'religious events', 'sports', 'other'];

  const [documents, setDocuments] = useState<any[]>([]);

  // Fetch venues and organisations on mount
  useEffect(() => {
    fetchVenues();
    fetchOrganisations();
    fetchClientCategories();
  }, []);

  // Fetch lead details if fromLead is present
  useEffect(() => {
    if (fromLead) {
      fetchLeadDetails(Number(fromLead));
    } else if (isEditMode && id) {
      fetchEventDetails(Number(id));
    }
  }, [fromLead, isEditMode, id]);

  const fetchVenues = async () => {
    try {
      const venuesData = await eventsService.getVenues();
      setVenues(venuesData || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchOrganisations = async () => {
    try {
      const orgsData = await eventsService.getOrganisations();
      setOrganisations(orgsData || []);
    } catch (error) {
      console.error('Error fetching organisations:', error);
    }
  };

  const fetchClientCategories = async () => {
    try {
      const categories = await eventsService.getClientCategories();
      setClientCategories(categories || []);
    } catch (error) {
      console.error('Error fetching client categories:', error);
    }
  };

  // Handle creating new organisation
  const handleCreateOrganisation = async () => {
    if (!newOrgName.trim()) {
      Alert.alert('Error', 'Please enter organisation name');
      return;
    }
    setCreatingOrg(true);
    try {
      const newOrg = await eventsService.createOrganisation({ name: newOrgName.trim() });
      setOrganisations(prev => [...prev, newOrg]);
      setFormData(prev => ({ ...prev, organisationId: newOrg.id }));
      setShowOrgModal(false);
      setNewOrgName('');
      Alert.alert('Success', 'Organisation created!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create organisation');
    } finally {
      setCreatingOrg(false);
    }
  };

  const fetchEventDetails = async (eventId: number) => {
    setFetchingLead(true); // Reuse same loading state
    try {
      const event = await eventsService.getEvent(eventId);
      console.log('📝 Fetched event for edit:', event);

      const eventAny = event as any;

      // Pre-fill form with event data
      setFormData(prev => ({
        ...prev,
        clientName: eventAny.client?.name || '',
        clientEmail: eventAny.client?.email || '',
        clientPhone: eventAny.client?.number || eventAny.client?.phone || '',
        eventType: eventAny.type_of_event || eventAny.event_type || '',
        startDate: eventAny.start_date ? new Date(eventAny.start_date) : null,
        endDate: eventAny.end_date ? new Date(eventAny.end_date) : null,
        venueId: eventAny.venue?.id || 0,
        venue: eventAny.venue?.name || '',
        venueAddress: eventAny.venue?.address || '',
        company: eventAny.company || 'bling square events',
        category: eventAny.category || 'corporate events',
        clientCategory: eventAny.client?.client_category?.[0]?.code || '',
        organisationId: eventAny.client?.organisation?.[0]?.id || 0,
      }));
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to fetch event details');
      safeGoBack();
    } finally {
      setFetchingLead(false);
    }
  };

  const fetchLeadDetails = async (leadId: number) => {
    setFetchingLead(true);
    try {
      const lead = await eventsService.getLead(leadId);
      setLeadData(lead);
      const leadAny = lead as any;
      const eventData = lead.event && typeof lead.event === 'object' ? lead.event as any : null;

      // Get client category code from lead
      const categoryCode = lead.client?.client_category?.[0]?.code || 'b2b';

      // Pre-fill form data from lead - INCLUDING event type from add-lead form
      setFormData(prev => ({
        ...prev,
        clientName: lead.client?.name || '',
        clientEmail: lead.client?.email || '',
        clientPhone: lead.client?.number || '',
        // Pre-fill event type from lead's event object
        eventType: eventData?.type_of_event || leadAny.type_of_event || '',
        // Pre-fill dates from lead
        startDate: eventData?.start_date ? new Date(eventData.start_date) :
          (leadAny.start_date ? new Date(leadAny.start_date) : null),
        endDate: eventData?.end_date ? new Date(eventData.end_date) :
          (leadAny.end_date ? new Date(leadAny.end_date) : null),
        // Pre-fill venue if exists
        venueId: eventData?.venue?.id || 0,
        venue: eventData?.venue?.name || '',
        venueAddress: eventData?.venue?.address || '',
        // Pre-fill company from lead
        company: eventData?.company || leadAny.company || 'bling square events',
        // Store client category for organisation requirement check
        clientCategory: categoryCode,
        // Pre-fill organisation if exists
        organisationId: lead.client?.organisation?.[0]?.id || 0,
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
    console.log('🔵 handleSubmit called');
    console.log('📋 Form data:', JSON.stringify(formData, null, 2));
    console.log('📋 fromLead:', fromLead, 'leadData:', !!leadData);

    // Different validation for lead conversion vs standalone event
    if (fromLead && leadData) {
      // For lead conversion - only need venue
      if (!formData.venueId && !formData.venue.trim()) {
        Alert.alert('Error', 'Please select or create a venue');
        return;
      }
    } else {
      // For standalone event creation - full validation
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
      if (!formData.venueId && !formData.venue.trim()) {
        Alert.alert('Error', 'Please select or create a venue');
        return;
      }
      // Check for organisation requirement (B2B and B2G require organisation)
      const categoryCode = formData.clientCategory || leadData?.client?.client_category?.[0]?.code;
      if ((categoryCode === 'b2b' || categoryCode === 'b2g') && !formData.organisationId) {
        Alert.alert('Error', 'Please select an organisation for B2B/B2G clients');
        return;
      }
    }

    setLoading(true);
    try {
      if (fromLead && leadData) {
        console.log('🚀 Converting lead to event...');
        const clientCategoryCode = formData.clientCategory || leadData.client?.client_category?.[0]?.code || 'b2b';

        // Prepare venue data - either existing venue ID (number) or new venue object
        const venueData = formData.venueId > 0
          ? formData.venueId  // Just the ID number for existing venue
          : { name: formData.venue, address: formData.venueAddress };  // Object for new venue

        // Get dates from formData (already pre-filled from lead)
        const startDate = formData.startDate ? formData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = formData.endDate ? formData.endDate.toISOString().split('T')[0] : startDate;

        const convertPayload: any = {
          company: formData.company as any,
          client_category: clientCategoryCode,
          venue: venueData,
          start_date: startDate,
          end_date: endDate,
          type_of_event: formData.eventType || 'Event',
          category: formData.category,
          event_dates: [{ date: startDate }],
        };

        // Add organisation for B2B/B2G
        if ((clientCategoryCode === 'b2b' || clientCategoryCode === 'b2g') && formData.organisationId > 0) {
          convertPayload.organisation = formData.organisationId;
        }

        console.log('📤 Convert payload:', JSON.stringify(convertPayload, null, 2));

        const response = await eventsService.convertLead(Number(fromLead), convertPayload);
        console.log('✅ Lead conversion response received:', response);

        // Navigate back
        console.log('🔀 Navigating back...');
        router.back();

        // Show success message after a short delay (toast-style)
        setTimeout(() => {
          Alert.alert('Success', 'Lead converted to event successfully!');
        }, 300);
      } else if (isEditMode && id) {
        // UPDATE EXISTING EVENT
        console.log('🔄 Updating event:', id);

        // Prepare venue data
        const venueData = formData.venueId > 0
          ? formData.venueId
          : { name: formData.venue, address: formData.venueAddress };

        const startDate = formData.startDate ? formData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = formData.endDate ? formData.endDate.toISOString().split('T')[0] : startDate;

        const updatePayload: any = {
          company: formData.company,
          type_of_event: formData.eventType,
          category: formData.category,
          venue: venueData,
          start_date: startDate,
          end_date: endDate,
        };

        // Add organisation if B2B/B2G
        const categoryCode = formData.clientCategory;
        if ((categoryCode === 'b2b' || categoryCode === 'b2g') && formData.organisationId > 0) {
          updatePayload.organisation = formData.organisationId;
        }

        console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));

        await eventsService.updateEvent(Number(id), updatePayload);
        console.log('✅ Event updated successfully');

        // Navigate back
        router.back();

        // Show success message
        setTimeout(() => {
          Alert.alert('Success', 'Event updated successfully!');
        }, 300);
      } else {
        // Create new standalone event
        Alert.alert('Notice', 'Direct event creation is currently restricted. Please start from a Lead.');
      }
    } catch (error: any) {
      console.error('❌ Error converting lead:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to convert lead');
    } finally {
      console.log('🏁 handleSubmit finished, setting loading to false');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ModuleHeader
        title={isEditMode ? "Edit Event" : (fromLead ? "Convert Lead to Event" : "Add New Event")}
        showBack
        onBack={safeGoBack}
        showNotifications={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* Venue Selection Section */}
        <View style={clientCardStyles.card}>
          <View style={clientCardStyles.header}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
              Venue
            </Text>
          </View>

          {/* Toggle: Select Existing vs Create New */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Pressable
              onPress={() => setIsCreatingNewVenue(false)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: !isCreatingNewVenue ? theme.primary + '20' : theme.surface,
                borderWidth: 1,
                borderColor: !isCreatingNewVenue ? theme.primary : theme.border,
                alignItems: 'center',
              }}
            >
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: !isCreatingNewVenue ? theme.primary : theme.text }]}>
                Select Existing
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsCreatingNewVenue(true)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: isCreatingNewVenue ? theme.primary + '20' : theme.surface,
                borderWidth: 1,
                borderColor: isCreatingNewVenue ? theme.primary : theme.border,
                alignItems: 'center',
              }}
            >
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: isCreatingNewVenue ? theme.primary : theme.text }]}>
                Create New
              </Text>
            </Pressable>
          </View>

          {isCreatingNewVenue ? (
            // Create New Venue Form
            <View style={{ gap: spacing.sm }}>
              <FormField
                label="Venue Name *"
                value={formData.venue}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, venue: text, venueId: 0 }))}
                placeholder="Enter venue name"
              />
              <FormField
                label="Address"
                value={formData.venueAddress}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, venueAddress: text }))}
                placeholder="Enter venue address"
                multiline
              />
            </View>
          ) : (
            // Select Existing Venue Dropdown
            <Select
              label="Select Venue *"
              value={formData.venueId}
              options={venues.map(v => ({ label: v.name, value: v.id }))}
              onChange={(val) => {
                const venue = venues.find(v => v.id === val);
                setFormData(prev => ({
                  ...prev,
                  venueId: Number(val),
                  venue: venue?.name || '',
                  venueAddress: venue?.address || '',
                }));
              }}
              placeholder="Select a venue"
              searchable
              leadingIcon="location-outline"
            />
          )}

          {/* Show selected venue details */}
          {formData.venueId > 0 && !isCreatingNewVenue && (
            <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: theme.background, borderRadius: borderRadius.md }}>
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                {formData.venue}
              </Text>
              {formData.venueAddress && (
                <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                  {formData.venueAddress}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Client Category Selection (for conversion) */}
        {fromLead && leadData && (
          <View style={clientCardStyles.card}>
            <View style={clientCardStyles.header}>
              <Ionicons name="pricetag" size={20} color={theme.primary} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
                Client Category (for this event) *
              </Text>
            </View>
            <Select
              label="Select Category"
              value={formData.clientCategory}
              options={
                leadData?.client?.client_category?.length > 0
                  ? leadData.client.client_category.map((c: any) => ({ label: c.name, value: c.code }))
                  : [
                    { label: 'B2C (Individual)', value: 'b2c' },
                    { label: 'B2B (Business)', value: 'b2b' },
                    { label: 'B2G (Government)', value: 'b2g' },
                  ]
              }
              onChange={(val) => setFormData(prev => ({ ...prev, clientCategory: val as string, organisationId: 0 }))}
              placeholder="Select client category"
              leadingIcon="pricetag-outline"
            />
          </View>
        )}

        {/* Organisation Selection (for B2B/B2G clients) */}
        {(formData.clientCategory === 'b2b' || formData.clientCategory === 'b2g') && (
          <View style={clientCardStyles.card}>
            <View style={clientCardStyles.header}>
              <Ionicons name="business" size={20} color={theme.primary} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
                Organisation *
              </Text>
            </View>
            <Select
              label="Select Organisation"
              value={formData.organisationId}
              options={[
                ...organisations.map(o => ({ label: o.name, value: o.id })),
                { label: '➕ Add New Organisation', value: -1 },
              ]}
              onChange={(val) => {
                if (val === -1) {
                  setShowOrgModal(true);
                } else {
                  setFormData(prev => ({ ...prev, organisationId: Number(val) }));
                }
              }}
              placeholder="Select an organisation"
              searchable
              leadingIcon="business-outline"
              required
            />
            {formData.organisationId > 0 && (
              <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: theme.background, borderRadius: borderRadius.md }}>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                  {organisations.find(o => o.id === formData.organisationId)?.name || ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Event Information - Read-only when from lead */}
        {fromLead && leadData ? (
          // Show read-only event details from lead
          <View style={clientCardStyles.card}>
            <View style={clientCardStyles.header}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, flex: 1 }]}>
                Event Details (From Lead)
              </Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              <View style={clientCardStyles.row}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 100 }]}>Company</Text>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                  {formData.company === 'redmagic events' ? 'RedMagic Events' : 'Bling Square Events'}
                </Text>
              </View>
              <View style={clientCardStyles.row}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 100 }]}>Event Type</Text>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                  {formData.eventType || 'Not specified'}
                </Text>
              </View>
              <View style={clientCardStyles.row}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 100 }]}>Start Date</Text>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                  {formData.startDate ? formData.startDate.toLocaleDateString('en-IN') : 'Not set'}
                </Text>
              </View>
              <View style={clientCardStyles.row}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, width: 100 }]}>End Date</Text>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, flex: 1 }]}>
                  {formData.endDate ? formData.endDate.toLocaleDateString('en-IN') : 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // Show editable form for standalone event creation
          <>
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
                      variant={formData.company === company ? 'filled' : 'outlined'}
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
          </>
        )}

        <View style={styles.submitContainer}>
          <Button
            title={
              loading
                ? 'Processing...'
                : isEditMode
                  ? 'Update Event'
                  : (fromLead ? 'Confirm Conversion' : 'Create Event')
            }
            onPress={handleSubmit}
            size="lg"
            leftIcon="calendar"
            shape="pill"
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>

      {/* Organisation Creation Modal */}
      <Modal
        visible={showOrgModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOrgModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: theme.surface }]}>
            <View style={modalStyles.header}>
              <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>Add New Organisation</Text>
              <Pressable onPress={() => setShowOrgModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, marginBottom: 6 }]}>Organisation Name *</Text>
              <TextInput
                value={newOrgName}
                onChangeText={setNewOrgName}
                placeholder="Enter organisation name"
                placeholderTextColor={theme.textSecondary}
                style={[modalStyles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              />
            </View>

            <View style={modalStyles.buttons}>
              <Pressable
                onPress={() => { setShowOrgModal(false); setNewOrgName(''); }}
                style={[modalStyles.btn, modalStyles.btnCancel, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateOrganisation}
                disabled={creatingOrg || !newOrgName.trim()}
                style={[modalStyles.btn, modalStyles.btnCreate, { backgroundColor: theme.primary }, !newOrgName.trim() && { opacity: 0.5 }]}
              >
                {creatingOrg && <ActivityIndicator size="small" color="#FFF" />}
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {creatingOrg ? 'Creating...' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 150, // Extra padding to prevent keyboard from hiding last input
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnCreate: {
    // backgroundColor set dynamically
  },
});
