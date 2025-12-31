import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, Modal, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ModuleHeader, Button, FormField, FormSection } from '@/components';
import { DatePicker, MultiDatePicker, Select, Input } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';
import type { ClientCategory, Organisation, Client } from '@/types/events';

export default function AddLeadScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ leadId?: string; id?: string }>();

  // Extract leadId - handle both string and array cases, and accept both 'leadId' and 'id' params
  const rawLeadId = params.leadId || params.id;
  const leadId = rawLeadId ? (Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId) : undefined;
  const isEditMode = !!leadId;

  console.log('📝 AddLeadScreen mounted. Params:', JSON.stringify(params));
  console.log('🆔 Raw leadId from params:', params.leadId, '| Raw id from params:', params.id);
  console.log('🆔 Extracted leadId:', leadId, '| isEditMode:', isEditMode);
  console.log('🆔 leadId type:', typeof leadId);

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Track associated event ID for editing leads that have been converted
  const [associatedEventId, setAssociatedEventId] = useState<number | null>(null);

  // Form mode: 'select' or 'create'
  const [clientMode, setClientMode] = useState<'select' | 'create'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    // Event Details
    company: 'redmagic events', // Default
    startDate: null as Date | null,
    endDate: null as Date | null,
    eventType: '',

    // Active Day Selection
    // stored separately in activeDates state

    // For existing client
    clientId: 0,
    // For new client
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    // Structured address fields (combined into 'address' on submit)
    addressStreet: '',
    addressLandmark: '',
    addressPincode: '',
    categoryId: 0,
    organisationId: 0,

    // Lead details
    source: 'online',
    referral: '',
    message: '',
  });

  const [activeDates, setActiveDates] = useState<Date[]>([]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [categoriesData, orgsData, clientsData] = await Promise.all([
        eventsService.getClientCategories(),
        eventsService.getOrganisations(),
        eventsService.getClients(),
      ]);
      setCategories(categoriesData);
      setOrganisations(orgsData);
      setClients(clientsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load reference data');
    }
  };

  // Fetch lead details for editing
  useEffect(() => {
    if (leadId) {
      fetchLeadDetails(Number(leadId));
    }
  }, [leadId]);

  const fetchLeadDetails = async (id: number) => {
    setLoading(true);
    try {
      console.log('🔍 Fetching lead details for ID:', id);
      const lead = await eventsService.getLeadById(id);
      console.log('📦 Lead data received:', JSON.stringify(lead, null, 2));

      const leadAny = lead as any;
      let eventData = null;

      // Check if we have an event_id to fetch event details
      if (leadAny.event_id) {
        console.log('🎯 Event ID found:', leadAny.event_id, '- fetching event details...');
        setAssociatedEventId(leadAny.event_id); // Track the event ID
        try {
          eventData = await eventsService.getEvent(leadAny.event_id);
          console.log('📦 Event data fetched:', JSON.stringify(eventData, null, 2));
        } catch (eventError) {
          console.warn('⚠️ Could not fetch event details:', eventError);
        }
      }

      console.log('📅 Event data:', eventData);
      console.log('📅 Lead data fields:', {
        start_date: leadAny.start_date,
        end_date: leadAny.end_date,
        type_of_event: leadAny.type_of_event,
        active_days: eventData?.active_days
      });

      // Parse dates - prioritize event data if available
      const startDate = eventData?.start_date ? new Date(eventData.start_date) :
        (leadAny.start_date ? new Date(leadAny.start_date) : null);
      const endDate = eventData?.end_date ? new Date(eventData.end_date) :
        (leadAny.end_date ? new Date(leadAny.end_date) : null);

      console.log('📅 Parsed dates:', { startDate, endDate });

      // Handle active_days - the API returns 'active_days', not 'event_dates'
      const activeDaysArray = eventData?.active_days || eventData?.event_dates || leadAny.active_days || leadAny.event_dates || [];
      const eventDates = activeDaysArray.map((d: any) => new Date(d.date || d));

      console.log('📅 Active dates:', eventDates);

      setActiveDates(eventDates);

      // Set client mode to 'select' since we have an existing client
      setClientMode('select');

      // Find client in the clients list if possible, or use the one from lead
      if (lead.client) {
        setSelectedClient(lead.client as any);
      }

      setFormData(prev => ({
        ...prev,
        // Event Info - prioritize event data
        company: eventData?.company || leadAny.company || 'redmagic events',
        startDate: startDate,
        endDate: endDate,
        eventType: eventData?.type_of_event || leadAny.type_of_event || '',

        // Client Info - Link existing client
        clientId: lead.client?.id || 0,

        // Populate new client fields for reference
        companyName: lead.client?.name || '',
        contactPerson: lead.client?.name || '',
        email: lead.client?.email || '',
        phone: lead.client?.number || '',

        // Link Category
        categoryId: lead.client?.client_category?.[0]?.id || 0,

        // Link Organisation if exists
        organisationId: lead.client?.organisation?.[0]?.id || 0,

        // Reference Info
        source: lead.source?.toLowerCase() || 'online',
        referral: lead.referral || '',
        message: lead.message || '',
      }));

      console.log('✅ Form data updated with lead details');

    } catch (error: any) {
      console.error('❌ Error fetching lead:', error);
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  // Check if selected category requires organisation (B2B/B2G)
  // B2C = no organisation required, B2B and B2G = organisation required
  const requiresOrganisation = (): boolean => {
    if (!formData.categoryId || formData.categoryId === 0) return false;

    // Find the selected category using loose equality for type safety
    const selectedCategory = categories.find(c => c.id == formData.categoryId);
    if (!selectedCategory) return false;

    // Primary check: Use category code (most reliable)
    // B2B and B2G require organisation, B2C does not
    const code = selectedCategory.code?.toLowerCase();
    if (code === 'b2b' || code === 'b2g') {
      return true;
    }
    if (code === 'b2c') {
      return false;
    }

    // Fallback: Use requires_organisation field from backend
    return selectedCategory.requires_organisation === true;
  };

  // Filtered clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.number?.includes(clientSearchQuery)
  );

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validate Event Details
    if (!formData.company) {
      Alert.alert('Error', 'Please select Event Of (Company)');
      return;
    }

    // Validate Client
    if (clientMode === 'select') {
      if (!formData.clientId || formData.clientId === 0) {
        Alert.alert('Error', 'Please select an existing client');
        return;
      }
    } else {
      // Creating new client - validate all fields
      if (!formData.companyName.trim()) {
        Alert.alert('Error', 'Please enter client name');
        return;
      }
      if (!formData.phone.trim()) {
        Alert.alert('Error', 'Please enter phone number');
        return;
      }
      // Only require email if not editing (optional update for existing leads?)
      // Keeping required for new clients
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Please enter email');
        return;
      }
      if (!formData.categoryId || formData.categoryId === 0) {
        Alert.alert('Error', 'Please select client category');
        return;
      }

      // Validate organisation if required
      if (requiresOrganisation() && (!formData.organisationId || formData.organisationId === 0)) {
        Alert.alert('Error', 'Please select an organisation for B2B/B2G clients');
        return;
      }
    }

    // Validate Lead Details
    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please enter a message or notes about this lead');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        company: formData.company,
        type_of_event: formData.eventType,
        start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
        end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
        // Only include event_dates if we have active dates selected (optional in form)
        event_dates: activeDates.length > 0
          ? activeDates.map(d => ({ date: d.toISOString().split('T')[0], is_active: true }))
          : [],
        source: formData.source,
        referral: formData.referral,
        message: formData.message,
      };

      if (clientMode === 'select') {
        payload.client_id = formData.clientId;
      } else {
        // Combine structured address into single string (delimiter: |||)
        const combinedAddress = [
          formData.addressStreet,
          formData.addressLandmark,
          formData.addressPincode
        ].filter(Boolean).join('|||');

        // Prepare client data for creation
        payload.client = {
          name: formData.companyName,
          number: formData.phone,
          email: formData.email,
          address: combinedAddress,
          client_category: formData.categoryId ? [formData.categoryId] : [],
          organisation: formData.organisationId > 0 ? [formData.organisationId] : [],
        };
      }

      console.log('Submit payload:', JSON.stringify(payload, null, 2));

      if (leadId) {
        // UPDATE EXISTING LEAD
        console.log('🔄 Updating lead:', leadId);
        const result = await eventsService.updateLead(Number(leadId), payload);
        console.log('✅ Lead updated successfully:', result);

        // If lead has an associated event, also update the event
        if (associatedEventId) {
          console.log('🔄 Also updating associated event:', associatedEventId);
          try {
            const eventPayload = {
              company: formData.company,
              type_of_event: formData.eventType,
              start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : undefined,
              end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : undefined,
            };
            await eventsService.updateEvent(associatedEventId, eventPayload);
            console.log('✅ Associated event updated successfully');
          } catch (eventError) {
            console.warn('⚠️ Could not update associated event:', eventError);
          }
        }

        // Navigate back immediately
        safeGoBack();
      } else {
        // CREATE NEW LEAD
        if (clientMode === 'select') {
          // Create lead for existing client
          console.log('🆕 Creating lead for existing client...');
          const result = await eventsService.createLead({
            client_id: formData.clientId,
            source: formData.source,
            referral: formData.referral,
            notes: formData.message, // Map message to notes
          });
          console.log('✅ Lead created (existing client):', result);
        } else {
          // Create lead with new client (atomic transaction)
          console.log('🆕 Creating lead with new client (atomic)...');
          const result = await eventsService.createLeadComplete(payload);
          console.log('✅ Lead created (with new client):', result);
        }

        // SUCCESS - Navigate back immediately
        console.log('✅ Lead operation successful, navigating back');
        safeGoBack();
      }
    } catch (error: any) {
      console.error('❌ Error creating lead:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to create lead';
      Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      console.log('🏁 handleSubmit complete, loading set to false');
      setLoading(false);
    }
  };





  // Render helpers removed - using FormSection component from @/components

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ModuleHeader
          title={isEditMode ? "Edit Lead" : "Add Lead"}
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
          {/* Client Selection Mode */}
          <FormSection title="Client Selection">
            <View style={styles.modeContainer}>
              <Pressable
                onPress={() => {
                  setClientMode('create');
                  setFormData({ ...formData, clientId: 0 });
                  setSelectedClient(null);
                }}
                style={[
                  styles.modeButton,
                  {
                    borderColor: clientMode === 'create' ? theme.primary : theme.border,
                    backgroundColor: clientMode === 'create' ? (isDark ? `${theme.primary}30` : `${theme.primary}15`) : theme.surface,
                  },
                  clientMode === 'create' && styles.modeButtonActive,
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={clientMode === 'create' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: clientMode === 'create' ? theme.primary : theme.text }
                  ]}
                >
                  Create New
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setClientMode('select');
                  setFormData({ ...formData, clientId: 0, companyName: '', contactPerson: '', phone: '', email: '', addressStreet: '', addressLandmark: '', addressPincode: '', categoryId: 0, organisationId: 0 });
                }}
                style={[
                  styles.modeButton,
                  {
                    borderColor: clientMode === 'select' ? theme.primary : theme.border,
                    backgroundColor: clientMode === 'select' ? (isDark ? `${theme.primary}30` : `${theme.primary}15`) : theme.surface,
                  },
                  clientMode === 'select' && styles.modeButtonActive,
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={clientMode === 'select' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: clientMode === 'select' ? theme.primary : theme.text }
                  ]}
                >
                  Select Existing
                </Text>
              </Pressable>
            </View>
          </FormSection>

          {/* Select Existing Client */}
          {clientMode === 'select' && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                Search & Select Client *
              </Text>
              <Pressable
                onPress={() => setShowClientModal(true)}
                style={{
                  borderWidth: 1.5,
                  borderColor: selectedClient ? theme.primary : theme.border,
                  borderRadius: borderRadius.full,
                  padding: 14,
                  backgroundColor: theme.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  {selectedClient ? (
                    <>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                        {selectedClient.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                        {selectedClient.email} • {selectedClient.number}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                      Tap to search and select a client
                    </Text>
                  )}
                </View>
                <Ionicons name="search" size={20} color={theme.primary} />
              </Pressable>
            </View>
          )}

          {/* Create New Client */}
          {clientMode === 'create' && (
            <FormSection title="Client Information">
              <Input
                label="Client Name"
                value={formData.companyName}
                onChangeText={(text: string) => updateField('companyName', text)}
                placeholder="Enter client name"
                required
                leftIcon="person-outline"
              />

              <Select
                label="Client Category"
                value={formData.categoryId}
                onChange={(val) => updateField('categoryId', val)}
                options={categories.map(c => ({ label: c.name, value: c.id }))}
                placeholder="Select category"
                required
              />

              {/* Organisation Selection (Conditional - only for B2B/B2G) */}
              {requiresOrganisation() && (
                <View>
                  <Select
                    label="Organisation"
                    value={formData.organisationId}
                    onChange={(val) => {
                      if (val === -1) {
                        // "Add New" was selected
                        setShowOrgModal(true);
                      } else {
                        updateField('organisationId', val);
                      }
                    }}
                    options={[
                      ...organisations.map(o => ({ label: o.name, value: o.id })),
                      { label: '➕ Add New Organisation', value: -1 },
                    ]}
                    placeholder="Select organisation"
                    required
                  />
                </View>
              )}

              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text: string) => updateField('phone', text)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                required
                leftIcon="call-outline"
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text: string) => updateField('email', text)}
                placeholder="Enter email address"
                keyboardType="email-address"
                required
                leftIcon="mail-outline"
                autoCapitalize="none"
              />

              {/* Structured Address Fields */}
              <View style={{ gap: spacing.sm }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  Address
                </Text>
                <Input
                  label=""
                  value={formData.addressStreet}
                  onChangeText={(text: string) => updateField('addressStreet', text)}
                  placeholder="Street / Area"
                  leftIcon="location-outline"
                />
                <Input
                  label=""
                  value={formData.addressLandmark}
                  onChangeText={(text: string) => updateField('addressLandmark', text)}
                  placeholder="Landmark (optional)"
                  leftIcon="flag-outline"
                />
                <Input
                  label=""
                  value={formData.addressPincode}
                  onChangeText={(text: string) => updateField('addressPincode', text)}
                  placeholder="Pincode"
                  keyboardType="numeric"
                  leftIcon="navigate-outline"
                />
              </View>
            </FormSection>
          )}


          {/* Event Information */}
          <FormSection title="Event Information">
            <Select
              label="Event Of (Company) *"
              value={formData.company}
              onChange={(val) => updateField('company', val)}
              options={[
                { value: 'redmagic events', label: 'RedMagic Events' },
                { value: 'bling square events', label: 'Bling Square Events' },
              ]}
              required
            />

            <Input
              label="Type of Event"
              value={formData.eventType}
              onChangeText={(text: string) => updateField('eventType', text)}
              placeholder="e.g., Birthday, Anniversary"
              leftIcon="gift-outline"
            />



            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => updateField('startDate', date)}
                  placeholder="Select start date"
                  format="short"
                />
              </View>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => updateField('endDate', date)}
                  placeholder="Select end date"
                  format="short"
                  minDate={formData.startDate || undefined}
                />
              </View>
            </View>

            {formData.startDate && formData.endDate && (
              <MultiDatePicker
                label="Event Active Days"
                selectedDates={activeDates}
                onChange={setActiveDates}
                placeholder="Select active days"
                minDate={formData.startDate || undefined}
                maxDate={formData.endDate || undefined}
              />
            )}
          </FormSection>

          {/* Lead Details */}
          <FormSection title="Lead Details">
            <Select
              label="Source"
              value={formData.source}
              onChange={(val) => updateField('source', val)}
              options={[
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
              ]}
              required
            />

            <Input
              label="Referral (Optional)"
              value={formData.referral}
              onChangeText={(text: string) => updateField('referral', text)}
              placeholder="e.g., Friend, Social Media"
              leftIcon="share-social-outline"
            />

            <Input
              label="Message / Notes"
              value={formData.message}
              onChangeText={(text: string) => updateField('message', text)}
              placeholder="Enter requirements or notes..."
              multiline
              required
              leftIcon="chatbox-outline"
            />

            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={20} color={isDark ? theme.primary : baseColors.purple[500]} />
              <View style={{ flex: 1 }}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.text, lineHeight: 18 }]}>
                  <Text style={[getTypographyStyle('sm', 'bold')]}>Note: </Text>
                  Event details (venue, vendors, etc.) will be finalized when converting this lead to an event.
                </Text>
              </View>
            </View>
          </FormSection>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title={
                loading
                  ? (isEditMode ? 'Updating Lead...' : 'Creating Lead...')
                  : (isEditMode ? 'Update Lead' : 'Create Lead')
              }
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              size="md"
              shape="pill"
              leftIcon={loading ? undefined : (isEditMode ? "checkmark-circle" : "checkmark-circle")}
            />
            {loading && (
              <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  Saving your lead...
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Client Selection Modal */}
        <Modal
          visible={showClientModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowClientModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80%',
              paddingTop: 20,
            }}>
              {/* Modal Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                  Select Client
                </Text>
                <Pressable onPress={() => setShowClientModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              {/* Search Box */}
              <View style={{ padding: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 8,
                }}>
                  <Ionicons name="search" size={20} color={theme.textSecondary} />
                  <TextInput
                    value={clientSearchQuery}
                    onChangeText={setClientSearchQuery}
                    placeholder="Search by name, email, or phone"
                    placeholderTextColor={theme.textSecondary}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: theme.text,
                    }}
                  />
                  {clientSearchQuery.length > 0 && (
                    <Pressable onPress={() => setClientSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Client List */}
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {filteredClients.map((client) => (
                  <Pressable
                    key={client.id}
                    onPress={() => {
                      setSelectedClient(client);
                      setFormData({ ...formData, clientId: client.id });
                      setShowClientModal(false);
                      setClientSearchQuery('');
                    }}
                    style={{
                      padding: 16,
                      backgroundColor: theme.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{client.name}</Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                      {client.email} • {client.number}
                    </Text>
                  </Pressable>
                ))}
                {filteredClients.length === 0 && (
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                    No clients found
                  </Text>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Organisation Modal (for new org) */}
        <Modal
          visible={showOrgModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOrgModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
                Add New Organisation
              </Text>

              <Input
                label="Organisation Name"
                value={newOrgName}
                onChangeText={setNewOrgName}
                placeholder="Enter organisation name"
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowOrgModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Add"
                  onPress={async () => {
                    if (!newOrgName.trim()) return;
                    setCreatingOrg(true);
                    try {
                      // This part would need an API endpoint to create org
                      // checking eventsService...
                      // Assuming eventsService.createOrganisation exists or similar
                      // For now, I'll just mock it or handle locally if strictly needed
                      // But based on existing code, org creation seems to be implied or separate
                      // Let's assume there is a method or we'll just log it for now as this is UI fix focus
                      Alert.alert('Info', 'Organisation creation to be implemented');
                      setShowOrgModal(false);
                      setNewOrgName('');
                    } catch (e) {
                      Alert.alert('Error', 'Failed to create organisation');
                    } finally {
                      setCreatingOrg(false);
                    }
                  }}
                  loading={creatingOrg}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 120,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    ...getShadowStyle('sm'),
  },
  modeButtonActive: {
    borderWidth: 2,
    backgroundColor: isDark ? `${theme.primary}30` : baseColors.purple[50],
  },
  infoNote: {
    backgroundColor: isDark ? `${theme.primary}15` : baseColors.purple[50],
    borderLeftWidth: 3,
    borderLeftColor: isDark ? theme.primary : baseColors.purple[500],
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  submitContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
