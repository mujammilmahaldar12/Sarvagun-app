import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, Modal, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
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
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showOrgInput, setShowOrgInput] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  // Form mode: 'select' or 'create'
  const [clientMode, setClientMode] = useState<'select' | 'create'>('select');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
    // Validation based on mode
    if (clientMode === 'select') {
      if (!formData.clientId) {
        Alert.alert('Error', 'Please select an existing client');
        return;
      }
    } else {
      // Creating new client - validate all fields
      if (!formData.companyName.trim()) {
        Alert.alert('Error', 'Please enter company name');
        return;
      }
      if (!formData.contactPerson.trim()) {
        Alert.alert('Error', 'Please enter contact person name');
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
      if (!formData.categoryId) {
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

    setLoading(true);
    try {
      const leadData: any = {
        source: formData.source,
        message: formData.message.trim() || undefined,
      };

      if (formData.referral.trim()) {
        leadData.referral = formData.referral.trim();
      }

      if (clientMode === 'select') {
        // Use existing client
        leadData.client_id = formData.clientId;
        await eventsService.createLead(leadData);
      } else {
        // Create new client with lead
        leadData.client_data = {
          name: formData.companyName.trim(),
          contact_person: formData.contactPerson.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
          category_id: formData.categoryId,
          organisation_id: formData.organisationId || undefined,
        };
        await eventsService.createLeadComplete(leadData);
      }

      Alert.alert('Success', 'Lead created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
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
              style={[styles.modeButton, clientMode === 'select' && styles.modeButtonActive]}
            >
              <Ionicons 
                name="search-outline" 
                size={22} 
                color={baseColors.purple[500]} 
              />
              <Text
                style={[
                  getTypographyStyle('base', 'bold'),
                  { color: clientMode === 'select' ? baseColors.purple[500] : theme.text }
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
              style={[styles.modeButton, clientMode === 'create' && styles.modeButtonActive]}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={22} 
                color={baseColors.purple[500]} 
              />
              <Text
                style={[
                  getTypographyStyle('base', 'bold'),
                  { color: clientMode === 'create' ? baseColors.purple[500] : theme.text }
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
                borderRadius: 12,
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
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TextInput
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    placeholder="Organisation name"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      getTypographyStyle('base', 'regular'),
                      {
                        flex: 1,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        color: theme.text,
                        backgroundColor: theme.surface,
                      }
                    ]}
                  />
                  <Pressable
                    onPress={handleAddOrganisation}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? baseColors.purple[600] : baseColors.purple[500],
                      paddingHorizontal: spacing.base,
                      borderRadius: borderRadius.md,
                      justifyContent: 'center',
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
              label="Contact Person *"
              value={formData.contactPerson}
              onChangeText={(text: string) => updateField('contactPerson', text)}
              placeholder="Enter contact person name"
            />
            <FormField
              label="Phone *"
              value={formData.phone}
              onChangeText={(text: string) => updateField('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <FormField
              label="Email *"
              value={formData.email}
              onChangeText={(text: string) => updateField('email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
            <FormField
              label="Address"
              value={formData.address}
              onChangeText={(text: string) => updateField('address', text)}
              placeholder="Enter company address"
              multiline
            />
          </FormSection>
        )}

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
                style={[styles.modeButton, formData.source === 'online' && styles.modeButtonActive]}
              >
                <Ionicons 
                  name="globe-outline" 
                  size={22} 
                  color={baseColors.purple[500]} 
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: formData.source === 'online' ? baseColors.purple[500] : theme.text }
                  ]}
                >
                  Online
                </Text>
              </Pressable>

              <Pressable
                onPress={() => updateField('source', 'offline')}
                style={[styles.modeButton, formData.source === 'offline' && styles.modeButtonActive]}
              >
                <Ionicons 
                  name="storefront-outline" 
                  size={22} 
                  color={baseColors.purple[500]} 
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'bold'),
                    { color: formData.source === 'offline' ? baseColors.purple[500] : theme.text }
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
            size="lg"
            leftIcon="checkmark-circle"
          />
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
            <ScrollView style={{ paddingHorizontal: 16 }}>
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
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary }}>
                          {client.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                          {client.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
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
    padding: spacing.lg,
    gap: spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: baseColors.neutral[300],
    backgroundColor: baseColors.neutral[50],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...getShadowStyle(2),
  },
  modeButtonActive: {
    borderWidth: 2,
    borderColor: baseColors.purple[500],
    backgroundColor: baseColors.purple[50],
  },
  infoNote: {
    backgroundColor: baseColors.purple[50],
    borderLeftWidth: 4,
    borderLeftColor: baseColors.purple[500],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  submitContainer: {
    marginTop: spacing.base,
    marginBottom: spacing.xl,
  },
});
