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
    categoryId: 0,
    organisationId: 0,
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
    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select client category');
      return;
    }

    // Check if B2B/B2G requires organisation
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    if (selectedCategory && ['B2B', 'B2G'].includes(selectedCategory.name) && !formData.organisationId) {
      Alert.alert('Error', `${selectedCategory.name} clients require an organisation`);
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
        category_id: formData.categoryId,
        organisation_id: formData.organisationId || undefined,
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
          
          {/* Client Category */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
              Client Category *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => updateField('categoryId', category.id.toString())}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: formData.categoryId === category.id ? theme.primary : theme.border,
                    backgroundColor: pressed
                      ? theme.primary + '10'
                      : formData.categoryId === category.id
                      ? theme.primary + '20'
                      : theme.surface,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: formData.categoryId === category.id ? theme.primary : theme.text,
                      fontWeight: formData.categoryId === category.id ? '600' : 'normal',
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Organisation (for B2B/B2G) */}
          {formData.categoryId && ['B2B', 'B2G'].includes(categories.find(c => c.id === formData.categoryId)?.name || '') && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
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
                  <Ionicons name={showOrgInput ? 'close' : 'add'} size={18} color={theme.primary} />
                  <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
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
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      justifyContent: 'center',
                    })}
                  >
                    <Text style={{ color: theme.textInverse, fontSize: 14, fontWeight: '600' }}>Add</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {organisations.map((org) => (
                    <Pressable
                      key={org.id}
                      onPress={() => updateField('organisationId', org.id.toString())}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: formData.organisationId === org.id ? theme.primary : theme.border,
                        backgroundColor: pressed
                          ? theme.primary + '10'
                          : formData.organisationId === org.id
                          ? theme.primary + '20'
                          : theme.surface,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: formData.organisationId === org.id ? theme.primary : theme.text,
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
