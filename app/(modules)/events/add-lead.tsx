import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
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
      // Silent error
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
      return;
    }

    try {
      const newOrg = await eventsService.createOrganisation({ name: newOrgName.trim() });
      setOrganisations([...organisations, newOrg]);
      setFormData({ ...formData, organisationId: newOrg.id });
      setNewOrgName('');
      setShowOrgInput(false);
    } catch (error: any) {
      // Silent error
    }
  };

  const handleSubmit = async () => {
    // Validation based on mode
    if (clientMode === 'select') {
      if (!formData.clientId) {
        return;
      }
    } else {
      // Creating new client - validate all fields
      if (!formData.companyName.trim()) {
        return;
      }
      if (!formData.contactPerson.trim()) {
        return;
      }
      if (!formData.phone.trim()) {
        return;
      }
      if (!formData.email.trim()) {
        return;
      }
      if (!formData.categoryId) {
        return;
      }

      // Check if B2B/B2G requires organisation
      if (requiresOrganisation() && !formData.organisationId) {
        const selectedCategory = categories.find(c => c.id === formData.categoryId);
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

      router.back();
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 100 : 44,
        }}
      />
    </View>
  );

  const SelectInput = ({ label, value, options, onSelect }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option: string) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: value === option ? theme.colors.primary : theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.primary + '10'
                : value === option
                ? theme.colors.primary + '20'
                : theme.colors.surface,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                color: value === option ? theme.colors.primary : theme.colors.text,
                fontWeight: value === option ? '600' : 'normal',
              }}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader
        title="Add Lead"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Client Selection Mode */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Client Selection" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => {
                setClientMode('select');
                setFormData({ ...formData, clientId: 0, companyName: '', contactPerson: '', phone: '', email: '', address: '', categoryId: 0, organisationId: 0 });
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 16,
                borderRadius: 12,
                borderWidth: clientMode === 'select' ? 2 : 1.5,
                borderColor: clientMode === 'select' ? theme.colors.primary : theme.colors.border,
                backgroundColor: clientMode === 'select' 
                  ? theme.colors.primary + '15'
                  : theme.colors.surface,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 3,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons 
                name="search-outline" 
                size={22} 
                color={theme.colors.primary} 
              />
              <Text
                style={{
                  fontSize: 15,
                  color: clientMode === 'select' ? theme.colors.primary : theme.colors.text,
                  fontWeight: '700',
                }}
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
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 16,
                borderRadius: 12,
                borderWidth: clientMode === 'create' ? 2 : 1.5,
                borderColor: clientMode === 'create' ? theme.colors.primary : theme.colors.border,
                backgroundColor: clientMode === 'create'
                  ? theme.colors.primary + '15'
                  : theme.colors.surface,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 3,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={22} 
                color={theme.colors.primary} 
              />
              <Text
                style={{
                  fontSize: 15,
                  color: clientMode === 'create' ? theme.colors.primary : theme.colors.text,
                  fontWeight: '700',
                }}
              >
                Create New
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Select Existing Client */}
        {clientMode === 'select' && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
              Search & Select Client *
            </Text>
            <Pressable
              onPress={() => setShowClientModal(true)}
              style={{
                borderWidth: 1.5,
                borderColor: selectedClient ? theme.colors.primary : theme.colors.border,
                borderRadius: 12,
                padding: 14,
                backgroundColor: theme.colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                {selectedClient ? (
                  <>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                      {selectedClient.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                      {selectedClient.email} • {selectedClient.number}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    Tap to search and select a client
                  </Text>
                )}
              </View>
              <Ionicons name="search" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Create New Client */}
        {clientMode === 'create' && (
          <View style={{ gap: 16 }}>
            <SectionHeader title="Client Information" />
            <FormInput
              label="Company Name *"
              value={formData.companyName}
              onChangeText={(text: string) => updateField('companyName', text)}
              placeholder="Enter company name"
            />
            
            {/* Client Category */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                Client Category *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setFormData({ ...formData, categoryId: category.id, organisationId: 0 })}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: formData.categoryId === category.id ? theme.colors.primary : theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.primary + '10'
                        : formData.categoryId === category.id
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: formData.categoryId === category.id ? theme.colors.primary : theme.colors.text,
                        fontWeight: formData.categoryId === category.id ? '600' : 'normal',
                      }}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Organisation (for B2B/B2G only) - Conditional */}
            {requiresOrganisation() && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                  Organisation *
                </Text>
                <Pressable
                  onPress={() => setShowOrgInput(!showOrgInput)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    padding: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name={showOrgInput ? 'close' : 'add'} size={18} color={theme.colors.primary} />
                  <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '600' }}>
                    {showOrgInput ? 'Cancel' : 'Add New'}
                  </Text>
                </Pressable>
              </View>

              {showOrgInput ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    placeholder="Organisation name"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                    }}
                  />
                  <Pressable
                    onPress={handleAddOrganisation}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.colors.primary + 'dd' : theme.colors.primary,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      justifyContent: 'center',
                    })}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Add</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {organisations.map((org) => (
                    <Pressable
                      key={org.id}
                      onPress={() => setFormData({ ...formData, organisationId: org.id })}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: formData.organisationId === org.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor: pressed
                          ? theme.colors.primary + '10'
                          : formData.organisationId === org.id
                          ? theme.colors.primary + '20'
                          : theme.colors.surface,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: formData.organisationId === org.id ? theme.colors.primary : theme.colors.text,
                          fontWeight: formData.organisationId === org.id ? '600' : 'normal',
                        }}
                      >
                        {org.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          <SectionHeader title="Contact Information" />
          <FormInput
            label="Contact Person *"
            value={formData.contactPerson}
            onChangeText={(text: string) => updateField('contactPerson', text)}
            placeholder="Enter contact person name"
          />
          <FormInput
            label="Phone *"
            value={formData.phone}
            onChangeText={(text: string) => updateField('phone', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          <FormInput
            label="Email *"
            value={formData.email}
            onChangeText={(text: string) => updateField('email', text)}
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          <FormInput
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter company address"
            multiline
          />
        </View>
        )}

        {/* Lead Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Lead Details" />
          
          {/* Source Selection */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
              Lead Source *
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => updateField('source', 'online')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: formData.source === 'online' ? 2 : 1.5,
                  borderColor: formData.source === 'online' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: formData.source === 'online'
                    ? theme.colors.primary + '15'
                    : theme.colors.surface,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons 
                  name="globe-outline" 
                  size={22} 
                  color={theme.colors.primary} 
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: formData.source === 'online' ? theme.colors.primary : theme.colors.text,
                    fontWeight: '700',
                  }}
                >
                  Online
                </Text>
              </Pressable>

              <Pressable
                onPress={() => updateField('source', 'offline')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: formData.source === 'offline' ? 2 : 1.5,
                  borderColor: formData.source === 'offline' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: formData.source === 'offline'
                    ? theme.colors.primary + '15'
                    : theme.colors.surface,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons 
                  name="storefront-outline" 
                  size={22} 
                  color={theme.colors.primary} 
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: formData.source === 'offline' ? theme.colors.primary : theme.colors.text,
                    fontWeight: '700',
                  }}
                >
                  Offline
                </Text>
              </Pressable>
            </View>
          </View>

          <FormInput
            label="Referral Source (Optional)"
            value={formData.referral}
            onChangeText={(text: string) => updateField('referral', text)}
            placeholder="e.g., John Smith, Google Ads, Instagram"
          />
          
          <FormInput
            label="Message / Notes (Optional)"
            value={formData.message}
            onChangeText={(text: string) => updateField('message', text)}
            placeholder="Add any additional notes or message about this lead"
            multiline
          />
          
          {/* Info Note */}
          <View style={{
            backgroundColor: theme.colors.primary + '10',
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
            padding: 12,
            borderRadius: 8,
            flexDirection: 'row',
            gap: 10,
            marginTop: 4,
          }}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700' }}>Note: </Text>
                Event details (venue, dates, vendors) will be added when converting this lead to an event.
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 16, marginBottom: 24 }}>
          <AppButton
            title={loading ? 'Creating Lead...' : 'Create Lead'}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            fullWidth
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.colors.background,
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
              borderBottomColor: theme.colors.border,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>
                Select Client
              </Text>
              <Pressable onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={{ padding: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  value={clientSearchQuery}
                  onChangeText={setClientSearchQuery}
                  placeholder="Search by name, email, or phone"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: theme.colors.text,
                  }}
                />
                {clientSearchQuery.length > 0 && (
                  <Pressable onPress={() => setClientSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Clients List */}
            <ScrollView style={{ paddingHorizontal: 16 }}>
              {filteredClients.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 12 }}>
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
                      backgroundColor: pressed ? theme.colors.primary + '10' : theme.colors.surface,
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.primary + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.primary }}>
                          {client.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                          {client.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
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
                                  backgroundColor: theme.colors.primary + '15',
                                }}
                              >
                                <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '600' }}>
                                  {cat.name}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
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
  );
}
