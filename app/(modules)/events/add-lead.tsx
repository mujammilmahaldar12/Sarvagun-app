import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, Modal, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ModuleHeader, Button, FormField, FormSection, Chip } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';
import type { ClientCategory, Organisation, Client } from '@/types/events';

export default function AddLeadScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
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
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [venues, setVenues] = useState<any[]>([]);

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [showOrgInput, setShowOrgInput] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Form mode: 'select' or 'create'
  const [clientMode, setClientMode] = useState<'select' | 'create'>('select');
  const [venueMode, setVenueMode] = useState<'select' | 'create'>('select');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);

  const [formData, setFormData] = useState({
    // For existing client
    clientId: 0,
    // For new client
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    categoryId: 0,
    organisationId: 0,
    // For existing venue
    venueId: 0,
    // For new venue
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    venueType: 'home',
    venueRegion: 'india',
    // Lead details
    source: 'online',
    referral: '',
    message: '',
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [categoriesData, orgsData, clientsData, venuesData] = await Promise.all([
        eventsService.getClientCategories(),
        eventsService.getOrganisations(),
        eventsService.getClients(),
        eventsService.getVenues(),
      ]);
      setCategories(categoriesData);
      setOrganisations(orgsData);
      setClients(clientsData);
      setVenues(venuesData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load reference data');
    }
  };

  // Check if selected category requires organisation (B2B/B2G)
  const requiresOrganisation = () => {
    if (!formData.categoryId) return false;
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    return selectedCategory?.requires_organisation || false;
  };

  // Filtered clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.number?.includes(clientSearchQuery)
  );

  // Filtered venues based on search
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
    venue.address?.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
    venue.region?.toLowerCase().includes(venueSearchQuery.toLowerCase())
  );

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddOrganisation = async () => {
    if (!newOrgName.trim()) {
      Alert.alert('Error', 'Please enter organisation name');
      return;
    }

    try {
      const newOrg = await eventsService.createOrganisation({ name: newOrgName.trim() });
      setOrganisations([...organisations, newOrg]);
      setFormData({ ...formData, organisationId: newOrg.id });
      setNewOrgName('');
      setShowOrgInput(false);
      Alert.alert('Success', 'Organisation added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add organisation');
    }
  };

  const handleSubmit = async () => {
    // Validate Client
    if (clientMode === 'select') {
      if (!formData.clientId || formData.clientId === 0) {
        Alert.alert('Error', 'Please select an existing client');
        return;
      }
    } else {
      // Creating new client - validate all fields
      if (!formData.companyName.trim()) {
        Alert.alert('Error', 'Please enter company name');
        return;
      }
      if (!formData.phone.trim()) {
        Alert.alert('Error', 'Please enter phone number');
        return;
      }
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Please enter email address');
        return;
      }
      if (!formData.categoryId || formData.categoryId === 0) {
        Alert.alert('Error', 'Please select client category');
        return;
      }

      // Check if B2B/B2G requires organisation
      if (requiresOrganisation() && !formData.organisationId) {
        const selectedCategory = categories.find(c => c.id === formData.categoryId);
        Alert.alert('Error', `${selectedCategory?.name} clients require an organisation`);
        return;
      }
    }

    // Validate Venue (REQUIRED)
    if (venueMode === 'select') {
      if (!formData.venueId || formData.venueId === 0) {
        Alert.alert('Error', 'Please select a venue');
        return;
      }
    } else {
      if (!formData.venueName.trim()) {
        Alert.alert('Error', 'Please enter venue name');
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
      const leadData: any = {
        source: formData.source,
        message: formData.message.trim(),
      };

      // Add referral only if it has a value
      if (formData.referral.trim()) {
        leadData.referral = formData.referral.trim();
      }

      // Client Data
      if (clientMode === 'select') {
        leadData.client = formData.clientId;
      } else {
        leadData.client = {
          name: formData.companyName.trim(),
          email: formData.email.trim(),
          number: formData.phone.trim(),
          client_category: [formData.categoryId],
        };

        // Add organisation only if selected
        if (formData.organisationId) {
          leadData.client.organisation = [formData.organisationId];
        }
      }

      // Venue Data
      if (venueMode === 'select') {
        leadData.venue = formData.venueId;
      } else {
        leadData.venue = {
          name: formData.venueName.trim(),
          address: formData.venueAddress.trim() || '',
          capacity: parseInt(formData.venueCapacity) || 100,
          type_of_venue: formData.venueType,
          region: formData.venueRegion,
        };
      }

      console.log('📤 Sending lead data:', JSON.stringify(leadData, null, 2));

      // Use create-complete endpoint
      const result = await eventsService.createLeadComplete(leadData);
      console.log('✅ Lead created successfully:', result);

      // Navigate back immediately (no alert needed)
      safeGoBack();

      // Show toast-style success message after navigation
      setTimeout(() => {
        Alert.alert('Success', 'Lead created successfully! 🎉', [{ text: 'OK' }]);
      }, 500);

    } catch (error: any) {
      console.error('❌ Error creating lead:', error);
      Alert.alert('Error', error.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };





  // Render helpers removed - using FormSection component from @/components

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ModuleHeader
          title="Add Lead"
          showBack
          onBack={safeGoBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Selection Mode */}
          <FormSection title="Client Selection">
            <View style={styles.modeContainer}>
              <Pressable
                onPress={() => {
                  setClientMode('select');
                  setFormData({ ...formData, clientId: 0, companyName: '', contactPerson: '', phone: '', email: '', address: '', categoryId: 0, organisationId: 0 });
                }}
                style={[
                  styles.modeButton,
                  {
                    borderColor: clientMode === 'select' ? theme.primary : theme.border,
                    backgroundColor: clientMode === 'select' ? `${theme.primary}15` : theme.surface,
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
                    backgroundColor: clientMode === 'create' ? `${theme.primary}15` : theme.surface,
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
              <FormField
                label="Company Name *"
                value={formData.companyName}
                onChangeText={(text: string) => updateField('companyName', text)}
                placeholder="Enter company name"
              />

              {/* Client Category */}
              <View style={{ gap: spacing.sm }}>
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                  Client Category *
                </Text>
                <View style={styles.chipContainer}>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      selected={formData.categoryId === category.id}
                      onPress={() => setFormData({ ...formData, categoryId: category.id, organisationId: 0 })}
                    />
                  ))}
                </View>
              </View>

              {/* Organisation (for B2B/B2G only) - Conditional */}
              {requiresOrganisation() && (
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                      Organisation *
                    </Text>
                    <Pressable
                      onPress={() => setShowOrgInput(!showOrgInput)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        padding: spacing.sm,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Ionicons name={showOrgInput ? 'close' : 'add'} size={18} color={baseColors.purple[500]} />
                      <Text style={[getTypographyStyle('xs', 'semibold'), { color: baseColors.purple[500] }]}>
                        {showOrgInput ? 'Cancel' : 'Add New'}
                      </Text>
                    </Pressable>
                  </View>

                  {showOrgInput ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <FormField
                          value={newOrgName}
                          onChangeText={setNewOrgName}
                          placeholder="Organisation name"
                          shape="pill"
                          containerStyle={{ marginBottom: 0 }}
                        />
                      </View>
                      <Pressable
                        onPress={handleAddOrganisation}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? baseColors.purple[600] : baseColors.purple[500],
                          paddingHorizontal: spacing.base,
                          borderRadius: borderRadius.full,
                          justifyContent: 'center',
                          height: 48,
                        })}
                      >
                        <Text style={[getTypographyStyle('base', 'semibold'), { color: baseColors.neutral[50] }]}>Add</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.chipContainer}>
                      {organisations.map((org) => (
                        <Chip
                          key={org.id}
                          label={org.name}
                          selected={formData.organisationId === org.id}
                          onPress={() => setFormData({ ...formData, organisationId: org.id })}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

            </FormSection>
          )}

          {/* Contact Information */}
          {clientMode === 'create' && (
            <FormSection title="Contact Information">
              <FormField
                label="Phone *"
                value={formData.phone}
                onChangeText={(text: string) => updateField('phone', text)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                shape="pill"
              />
              <FormField
                label="Email *"
                value={formData.email}
                onChangeText={(text: string) => updateField('email', text)}
                placeholder="Enter email address"
                keyboardType="email-address"
                shape="pill"
              />
            </FormSection>
          )}

          {/* Venue Selection */}
          <FormSection title="Venue Information">
            <View style={styles.modeContainer}>
              <Pressable
                onPress={() => {
                  setVenueMode('select');
                  setFormData({ ...formData, venueId: 0, venueName: '', venueAddress: '', venueCapacity: '', venueType: 'home' });
                }}
                style={[
                  styles.modeButton,
                  {
                    borderColor: venueMode === 'select' ? theme.primary : theme.border,
                    backgroundColor: venueMode === 'select' ? `${theme.primary}15` : theme.surface,
                  },
                  venueMode === 'select' && styles.modeButtonActive,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={venueMode === 'select' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: venueMode === 'select' ? theme.primary : theme.text }
                  ]}
                >
                  Select Existing
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setVenueMode('create');
                  setFormData({ ...formData, venueId: 0 });
                  setSelectedVenue(null);
                }}
                style={[
                  styles.modeButton,
                  {
                    borderColor: venueMode === 'create' ? theme.primary : theme.border,
                    backgroundColor: venueMode === 'create' ? `${theme.primary}15` : theme.surface,
                  },
                  venueMode === 'create' && styles.modeButtonActive,
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={venueMode === 'create' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: venueMode === 'create' ? theme.primary : theme.text }
                  ]}
                >
                  Create New
                </Text>
              </Pressable>
            </View>

            {/* Select Existing Venue */}
            {venueMode === 'select' && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                  Search & Select Venue *
                </Text>
                <Pressable
                  onPress={() => setShowVenueModal(true)}
                  style={{
                    borderWidth: 1.5,
                    borderColor: selectedVenue ? theme.primary : theme.border,
                    borderRadius: borderRadius.full,
                    padding: 14,
                    backgroundColor: theme.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {selectedVenue ? (
                      <>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                          {selectedVenue.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {selectedVenue.address} • Capacity: {selectedVenue.capacity}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                        Tap to search and select a venue
                      </Text>
                    )}
                  </View>
                  <Ionicons name="search" size={20} color={theme.primary} style={{ marginLeft: 8, flexShrink: 0 }} />
                </Pressable>
              </View>
            )}

            {/* Create New Venue */}
            {venueMode === 'create' && (
              <>
                <FormField
                  label="Venue Name *"
                  value={formData.venueName}
                  onChangeText={(text: string) => updateField('venueName', text)}
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
                <FormField
                  label="Capacity"
                  value={formData.venueCapacity}
                  onChangeText={(text: string) => updateField('venueCapacity', text)}
                  placeholder="Enter venue capacity"
                  keyboardType="numeric"
                  shape="pill"
                />
                <View style={{ gap: spacing.sm }}>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                    Venue Type
                  </Text>
                  <View style={styles.chipContainer}>
                    {[
                      { value: 'home', label: 'Home' },
                      { value: 'ground', label: 'Ground' },
                      { value: 'hall', label: 'Hall' },
                    ].map((type) => (
                      <Chip
                        key={type.value}
                        label={type.label}
                        selected={formData.venueType === type.value}
                        onPress={() => setFormData({ ...formData, venueType: type.value })}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </FormSection>

          {/* Lead Details */}
          <FormSection title="Lead Details">
            {/* Source Selection */}
            <View style={{ gap: spacing.sm }}>
              <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
                Lead Source *
              </Text>
              <View style={styles.modeContainer}>
                <Pressable
                  onPress={() => updateField('source', 'online')}
                  style={[
                    styles.modeButton,
                    {
                      borderColor: formData.source === 'online' ? theme.primary : theme.border,
                      backgroundColor: formData.source === 'online' ? `${theme.primary}15` : theme.surface,
                    },
                    formData.source === 'online' && styles.modeButtonActive,
                  ]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={22}
                    color={formData.source === 'online' ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      getTypographyStyle('base', 'bold'),
                      { color: formData.source === 'online' ? theme.primary : theme.text }
                    ]}
                  >
                    Online
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => updateField('source', 'offline')}
                  style={[
                    styles.modeButton,
                    {
                      borderColor: formData.source === 'offline' ? theme.primary : theme.border,
                      backgroundColor: formData.source === 'offline' ? `${theme.primary}15` : theme.surface,
                    },
                    formData.source === 'offline' && styles.modeButtonActive,
                  ]}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={22}
                    color={formData.source === 'offline' ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      getTypographyStyle('base', 'bold'),
                      { color: formData.source === 'offline' ? theme.primary : theme.text }
                    ]}
                  >
                    Offline
                  </Text>
                </Pressable>
              </View>
            </View>

            <FormField
              label="Referral Source (Optional)"
              value={formData.referral}
              onChangeText={(text: string) => updateField('referral', text)}
              placeholder="e.g., John Smith, Google Ads, Instagram"
              shape="pill"
            />

            <FormField
              label="Message / Notes (Optional)"
              value={formData.message}
              onChangeText={(text: string) => updateField('message', text)}
              placeholder="Add any additional notes or message about this lead"
              multiline
            />

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={20} color={baseColors.purple[500]} />
              <View style={{ flex: 1 }}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.text, lineHeight: 18 }]}>
                  <Text style={[getTypographyStyle('sm', 'bold')]}>Note: </Text>
                  Event details (venue, dates, vendors) will be added when converting this lead to an event.
                </Text>
              </View>
            </View>
          </FormSection>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title={loading ? 'Creating Lead...' : 'Create Lead'}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              size="md"
              shape="pill"
              leftIcon={loading ? undefined : "checkmark-circle"}
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
          <View style={{ flex: 1, backgroundColor: baseColors.neutral[900] + '80', justifyContent: 'flex-end' }}>
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
                      <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Clients List */}
              <ScrollView style={{ paddingHorizontal: 12 }}>
                {filteredClients.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12 }}>
                      {clientSearchQuery ? 'No clients found' : 'No clients available'}
                    </Text>
                  </View>
                ) : (
                  filteredClients.map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => {
                        setSelectedClient(client);
                        setFormData({ ...formData, clientId: client.id });
                        setShowClientModal(false);
                        setClientSearchQuery('');
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.primary + '10' : theme.surface,
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: theme.border,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.primary }}>
                            {client.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                            {client.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                            {client.email || 'No email'} • {client.number || 'No phone'}
                          </Text>
                          {client.category && client.category.length > 0 && (
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                              {client.category.map((cat) => (
                                <View
                                  key={cat.id}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 8,
                                    backgroundColor: theme.primary + '15',
                                  }}
                                >
                                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                                    {cat.name}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Venue Selection Modal */}
        <Modal
          visible={showVenueModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowVenueModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: baseColors.neutral[900] + '80', justifyContent: 'flex-end' }}>
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
                  Select Venue
                </Text>
                <Pressable onPress={() => setShowVenueModal(false)}>
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
                    value={venueSearchQuery}
                    onChangeText={setVenueSearchQuery}
                    placeholder="Search by name, address, or region"
                    placeholderTextColor={theme.textSecondary}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: theme.text,
                    }}
                  />
                  {venueSearchQuery.length > 0 && (
                    <Pressable onPress={() => setVenueSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Venues List */}
              <ScrollView style={{ paddingHorizontal: 16 }}>
                {filteredVenues.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={48} color={theme.textSecondary} />
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12 }}>
                      {venueSearchQuery ? 'No venues found' : 'No venues available'}
                    </Text>
                  </View>
                ) : (
                  filteredVenues.map((venue) => (
                    <Pressable
                      key={venue.id}
                      onPress={() => {
                        setSelectedVenue(venue);
                        setFormData({ ...formData, venueId: venue.id });
                        setShowVenueModal(false);
                        setVenueSearchQuery('');
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.primary + '10' : theme.surface,
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: theme.primary + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="location" size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                            {venue.name}
                          </Text>
                          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                            {venue.address || 'No address'} • Capacity: {venue.capacity}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            <View style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: theme.primary + '15',
                            }}>
                              <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                                {venue.type_of_venue || 'home'}
                              </Text>
                            </View>
                            {venue.region && (
                              <View style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8,
                                backgroundColor: theme.primary + '15',
                              }}>
                                <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                                  {venue.region}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
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
    backgroundColor: baseColors.purple[50],
  },
  infoNote: {
    backgroundColor: baseColors.purple[50],
    borderLeftWidth: 3,
    borderLeftColor: baseColors.purple[500],
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
