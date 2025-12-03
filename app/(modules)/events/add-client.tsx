import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';
import type { ClientCategory, Organisation } from '@/types/events';

export default function AddClientScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [showOrgInput, setShowOrgInput] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    categoryIds: [] as number[],  // Changed to array for multi-select
    organisationIds: [] as number[],  // Changed to array for multi-select
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [categoriesData, orgsData] = await Promise.all([
        eventsService.getClientCategories(),
        eventsService.getOrganisations(),
      ]);
      setCategories(categoriesData);
      setOrganisations(orgsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load reference data');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: isNaN(Number(value)) ? value : Number(value) });
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const toggleOrganisation = (orgId: number) => {
    setFormData(prev => ({
      ...prev,
      organisationIds: prev.organisationIds.includes(orgId)
        ? prev.organisationIds.filter(id => id !== orgId)
        : [...prev.organisationIds, orgId],
    }));
  };

  const requiresOrganisation = () => {
    const selectedCategories = categories.filter(c => formData.categoryIds.includes(c.id));
    return selectedCategories.some(cat => ['B2B', 'B2G'].includes(cat.name));
  };

  const handleAddOrganisation = async () => {
    if (!newOrgName.trim()) {
      Alert.alert('Error', 'Please enter organisation name');
      return;
    }

    try {
      const newOrg = await eventsService.createOrganisation({ name: newOrgName.trim() });
      setOrganisations([...organisations, newOrg]);
      // Auto-select the new organisation
      setFormData(prev => ({
        ...prev,
        organisationIds: [...prev.organisationIds, newOrg.id],
      }));
      setNewOrgName('');
      setShowOrgInput(false);
      Alert.alert('Success', 'Organisation added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add organisation');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter client name');
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
    if (formData.categoryIds.length === 0) {
      Alert.alert('Error', 'Please select at least one client category');
      return;
    }

    // Check if B2B/B2G requires organisation
    if (requiresOrganisation() && formData.organisationIds.length === 0) {
      Alert.alert('Error', 'B2B/B2G clients require at least one organisation');
      return;
    }

    setLoading(true);
    try {
      await eventsService.createClient({
        name: formData.name.trim(),
        contact_person: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        category_ids: formData.categoryIds,  // Send array
        organisation_ids: formData.organisationIds.length > 0 ? formData.organisationIds : undefined,
      });

      Alert.alert('Success', 'Client created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create client');
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
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: theme.text,
          backgroundColor: theme.surface,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 100 : 44,
        }}
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Add Client"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Client Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Client Information" />
          <FormInput
            label="Client Name *"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter client/company name"
          />
          
          {/* Client Categories - Multi-Select */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                Client Categories *
              </Text>
              {formData.categoryIds.length > 0 && (
                <View style={{
                  backgroundColor: theme.primary + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                }}>
                  <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
                    {formData.categoryIds.length} selected
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              Select one or more categories (B2B, B2C, B2G)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((category) => {
                const isSelected = formData.categoryIds.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => toggleCategory(category.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 24,
                      borderWidth: 2,
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: pressed
                        ? theme.primary + '10'
                        : isSelected
                        ? theme.primary + '15'
                        : theme.surface,
                    })}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                    )}
                    <Text
                      style={{
                        fontSize: 14,
                        color: isSelected ? theme.primary : theme.text,
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Organisations - Multi-Select (for B2B/B2G) */}
          {requiresOrganisation() && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Organisations *
                  </Text>
                  {formData.organisationIds.length > 0 && (
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                      {formData.organisationIds.length} organisation(s) selected
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => setShowOrgInput(!showOrgInput)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: pressed ? theme.primary + '10' : 'transparent',
                    borderRadius: 16,
                  })}
                >
                  <Ionicons name={showOrgInput ? 'close' : 'add'} size={18} color={theme.primary} />
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>
                    {showOrgInput ? 'Cancel' : 'Add New'}
                  </Text>
                </Pressable>
              </View>

              {showOrgInput ? (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    placeholder="Organisation name"
                    placeholderTextColor={theme.textSecondary}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.surface,
                    }}
                  />
                  <Pressable
                    onPress={handleAddOrganisation}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.primary + 'dd' : theme.primary,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    })}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </Pressable>
                </View>
              ) : null}

              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                Select one or more organisations for B2B/B2G clients
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {organisations.map((org) => {
                  const isSelected = formData.organisationIds.includes(org.id);
                  return (
                    <Pressable
                      key={org.id}
                      onPress={() => toggleOrganisation(org.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 2,
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: pressed
                          ? theme.primary + '10'
                          : isSelected
                          ? theme.primary + '15'
                          : theme.surface,
                      })}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                      )}
                      <Text
                        style={{
                          fontSize: 14,
                          color: isSelected ? theme.primary : theme.text,
                          fontWeight: isSelected ? '600' : '500',
                        }}
                      >
                        {org.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {organisations.length === 0 && !showOrgInput && (
                <View style={{
                  padding: 16,
                  backgroundColor: theme.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderStyle: 'dashed',
                }}>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                    No organisations available. Tap "Add New" to create one.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={{ gap: 16 }}>
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
            placeholder="Enter address"
            multiline
          />
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <AppButton
            title={loading ? 'Creating...' : 'Create Client'}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            fullWidth
            size="lg"
            leftIcon="person-add"
          />
        </View>
      </ScrollView>
    </View>
  );
}
