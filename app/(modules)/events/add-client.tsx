import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';
import type { ClientCategory, Organisation } from '@/types/events';
import { Button, FormField, FormSection, Chip } from '@/components';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius, baseColors } = designSystem;

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
    categoryIds: [] as number[],
    organisationIds: [] as number[],
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
    setFormData({ ...formData, [field]: value });
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
    if (!formData.name.trim()) return Alert.alert('Error', 'Please enter client name');
    if (!formData.contactPerson.trim()) return Alert.alert('Error', 'Please enter contact person name');
    if (!formData.phone.trim()) return Alert.alert('Error', 'Please enter phone number');
    if (!formData.email.trim()) return Alert.alert('Error', 'Please enter email address');
    if (formData.categoryIds.length === 0) return Alert.alert('Error', 'Please select at least one client category');

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
        category_ids: formData.categoryIds,
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Add Client"
        showBack
        showNotifications={false}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <FormSection title="Client Information">
          <FormField
            label="Client Name *"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter client/company name"
            shape="pill"
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
              Categories *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={formData.categoryIds.includes(category.id)}
                  onPress={() => toggleCategory(category.id)}
                />
              ))}
            </View>
          </View>

          {requiresOrganisation() && (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                  Organisations *
                </Text>
                <Pressable
                  onPress={() => setShowOrgInput(!showOrgInput)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  })}
                >
                  <Ionicons name={showOrgInput ? 'close' : 'add'} size={18} color={theme.primary} />
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>
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
                      height: 48,
                      width: 48,
                      borderRadius: borderRadius.full,
                      justifyContent: 'center',
                      alignItems: 'center',
                    })}
                  >
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {organisations.length > 0 ? (
                    organisations.map((org) => (
                      <Chip
                        key={org.id}
                        label={org.name}
                        selected={formData.organisationIds.includes(org.id)}
                        onPress={() => toggleOrganisation(org.id)}
                      />
                    ))
                  ) : (
                    <Text style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>
                      No organisations found. Add one above.
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </FormSection>

        <FormSection title="Contact Information">
          <FormField
            label="Contact Person *"
            value={formData.contactPerson}
            onChangeText={(text: string) => updateField('contactPerson', text)}
            placeholder="Enter contact person name"
            shape="pill"
          />
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
          <FormField
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter address"
            multiline
          />
        </FormSection>

        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <Button
            title={loading ? 'Creating...' : 'Create Client'}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            fullWidth
            shape="pill"
          />
        </View>
      </ScrollView>
    </View>
  );
}
