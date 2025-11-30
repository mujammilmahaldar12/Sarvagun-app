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
import { DatePicker, DateRangePicker, MultiDatePicker } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius, baseColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';
import type { Lead, Venue, ClientCategory, Organisation } from '@/types/events';

export default function ConvertLeadScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { leadId } = useLocalSearchParams<{ leadId: string }>();

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(modules)/events');
    }
  }, [navigation, router]);

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEventCategoryModal, setShowEventCategoryModal] = useState(false);
  const [showOrganisationModal, setShowOrganisationModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
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
      
      setLead(leadData);
      setVenues(venuesData || []);
      setCategories(categoriesData || []);
      setOrganisations(orgsData || []);
      
      // Initialize venue from lead if available
      if (leadData.venue) {
        setSelectedVenue(leadData.venue);
        setFormData(prev => ({
          ...prev,
          venueId: leadData.venue?.id || 0,
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
    if (!formData.categoryId || !categories) return false;
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    // B2B and B2G require organisation
    return selectedCategory?.code === 'B2B' || selectedCategory?.code === 'B2G';
  };

  const getSelectedCategory = () => {
    return categories.find(c => c.id === formData.categoryId);
  };

  const getSelectedOrganisation = () => {
    return organisations.find(o => o.id === formData.organisationId);
  };

  const filteredVenues = (venues || []).filter(venue =>
    venue.name?.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
    venue.address?.toLowerCase().includes(venueSearchQuery.toLowerCase())
  );

  const handleEventDatesChange = (dates: Date[]) => {
    setEventDates(dates);
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (loading) {
      console.log('⚠️ Already processing, ignoring duplicate click');
      return;
    }

    console.log('🔵 handleSubmit called');
    console.log('Form data:', formData);
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

    // Validate venue (use selected venue or venue from lead)
    const venueToUse = selectedVenue || lead?.venue;
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
        client_category: selectedCategory?.code,
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

      // Navigate immediately after success
      router.replace('/(modules)/events');
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert('Success', 'Lead converted to event successfully!');
      }, 300);
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

  const DropdownField = ({ 
    label, 
    value, 
    placeholder, 
    onPress, 
    required = false,
    icon = "chevron-down-outline"
  }: {
    label: string;
    value: string;
    placeholder: string;
    onPress: () => void;
    required?: boolean;
    icon?: string;
  }) => (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={{ 
        fontSize: typography.sizes.sm, 
        fontWeight: typography.weights.semibold, 
        color: theme.text,
        marginBottom: spacing[1]
      }}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: value ? theme.primary : theme.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: 12,
          paddingVertical: 12,
          minHeight: 48,
        }}
      >
        <Pressable
          onPress={onPress}
          style={{ 
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text 
            numberOfLines={1}
            style={{ 
              flex: 1,
              fontSize: 16,
              color: value ? theme.text : theme.textSecondary,
            }}
          >
            {value || placeholder}
          </Text>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={value ? theme.primary : theme.textSecondary}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
    </View>
  );

  // Using standardized FormField component instead of custom FormInput

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

  const ModalSelector = ({ 
    visible, 
    title, 
    data, 
    onSelect, 
    onClose, 
    selectedId, 
    keyExtractor, 
    labelExtractor 
  }: {
    visible: boolean;
    title: string;
    data: any[];
    onSelect: (item: any) => void;
    onClose: () => void;
    selectedId?: number | string;
    keyExtractor: (item: any) => string | number;
    labelExtractor: (item: any) => string;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          style={{
            flex: 1,
            marginTop: 100,
            backgroundColor: theme.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
              {title}
            </Text>
            <Pressable onPress={onClose} android_disableSound={true} style={{ padding: 4 }}>
              <Ionicons name="close" size={28} color={theme.text} />
            </Pressable>
          </View>

          {/* Options List */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {data.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ ...getTypographyStyle('base'), color: theme.textSecondary }}>
                  No options available
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {data.map((item) => {
                  const key = keyExtractor(item);
                  const isSelected = selectedId === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => onSelect(item)}
                      android_disableSound={true}
                      style={({ pressed }) => ({
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected 
                          ? theme.primary + '10' 
                          : theme.surface,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          ...getTypographyStyle('base', isSelected ? 'semibold' : 'regular'),
                          color: isSelected ? theme.primary : theme.text,
                        }}
                      >
                        {labelExtractor(item)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
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
              
              <DropdownField
                label="Client Category (B2B/B2C/B2G)"
                value={getSelectedCategory()?.name || ''}
                placeholder="Select client category"
                onPress={() => setShowCategoryModal(true)}
                required
              />

              {/* Organisation (conditional) */}
              {requiresOrganisation() && (
                <DropdownField
                  label="Organisation"
                  value={getSelectedOrganisation()?.name || ''}
                  placeholder="Select organisation"
                  onPress={() => setShowOrganisationModal(true)}
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
              <DropdownField
                label="Event Category (Wedding/Corporate/etc.)"
                value={formData.eventCategory}
                placeholder="Select event category"
                onPress={() => setShowEventCategoryModal(true)}
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
            <DropdownField
              label="Venue"
              value={selectedVenue?.name || ''}
              placeholder="Select venue"
              onPress={() => setShowVenueModal(true)}
              required
              icon="location-outline"
            />

            {/* Venue Info from Lead */}
            {(selectedVenue || lead.venue) && (
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
                  {(selectedVenue || lead.venue)?.name}
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginLeft: 28 }}>
                  {(selectedVenue || lead.venue)?.address}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16, marginLeft: 28, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people" size={14} color={theme.textSecondary} />
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      {(selectedVenue || lead.venue)?.capacity} capacity
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="pricetag" size={14} color={theme.textSecondary} />
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      {(selectedVenue || lead.venue)?.type}
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

            {/* Submit Button */}
            <Button
              title="Convert to Event"
              onPress={handleSubmit}
              loading={loading}
              size="md"
              leftIcon="swap-horizontal"
            />
          </ScrollView>

          {/* Category Modal */}
          <ModalSelector
            visible={showCategoryModal}
            title="Select Client Category"
            data={categories}
            onSelect={(category) => {
              setFormData({ ...formData, categoryId: category.id, organisationId: 0 });
              setShowCategoryModal(false);
            }}
            onClose={() => setShowCategoryModal(false)}
            selectedId={formData.categoryId}
            keyExtractor={(item) => item.id}
            labelExtractor={(item) => `${item.name} (${item.code})`}
          />

          {/* Event Category Modal */}
          <ModalSelector
            visible={showEventCategoryModal}
            title="Select Event Category"
            data={eventCategoryOptions.map(cat => ({ value: cat, label: cat }))}
            onSelect={(item) => {
              setFormData({ ...formData, eventCategory: item.value });
              setShowEventCategoryModal(false);
            }}
            onClose={() => setShowEventCategoryModal(false)}
            selectedId={formData.eventCategory}
            keyExtractor={(item) => item.value}
            labelExtractor={(item) => item.label.charAt(0).toUpperCase() + item.label.slice(1)}
          />

          {/* Organisation Modal */}
          <ModalSelector
            visible={showOrganisationModal}
            title="Select Organisation"
            data={organisations}
            onSelect={(org) => {
              setFormData({ ...formData, organisationId: org.id });
              setShowOrganisationModal(false);
            }}
            onClose={() => setShowOrganisationModal(false)}
            selectedId={formData.organisationId}
            keyExtractor={(item) => item.id}
            labelExtractor={(item) => item.name}
          />

          {/* Venue Modal */}
          <Modal visible={showVenueModal} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View
                style={{
                  flex: 1,
                  marginTop: 100,
                  backgroundColor: theme.background,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {/* Modal Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                    Select Venue
                  </Text>
                  <Pressable onPress={() => setShowVenueModal(false)} android_disableSound={true} style={{ padding: 4 }}>
                    <Ionicons name="close" size={28} color={theme.text} />
                  </Pressable>
                </View>

                {/* Search Box */}
                <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.surface,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      gap: 6,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                      value={venueSearchQuery}
                      onChangeText={setVenueSearchQuery}
                      placeholder="Search venue name or address..."
                      placeholderTextColor={theme.textSecondary}
                      style={{ flex: 1, ...getTypographyStyle('base', 'regular'), color: theme.text }}
                    />
                  </View>
                </View>

                {/* Venue List */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  {filteredVenues.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Ionicons name="location-outline" size={48} color={theme.textSecondary} />
                      <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
                        No venues found
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {filteredVenues.map((venue) => (
                        <Pressable
                          key={venue.id}
                          onPress={() => {
                            setSelectedVenue(venue);
                            setFormData({ ...formData, venueId: venue.id });
                            setShowVenueModal(false);
                            setVenueSearchQuery('');
                          }}
                          style={({ pressed }) => ({
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: selectedVenue?.id === venue.id ? theme.primary : theme.border,
                            backgroundColor: selectedVenue?.id === venue.id
                              ? theme.primary + '15'
                              : theme.surface,
                            opacity: pressed ? 0.8 : 1,
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
                              <Ionicons name="location" size={18} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  ...getTypographyStyle('base', selectedVenue?.id === venue.id ? 'bold' : 'semibold'),
                                  color: selectedVenue?.id === venue.id ? theme.primary : theme.text,
                                }}
                              >
                                {venue.name}
                              </Text>
                              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 2 }}>
                                {venue.address}
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                                  <Ionicons name="people" size={12} /> {venue.capacity} capacity
                                </Text>
                                {venue.type && (
                                  <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                                    <Ionicons name="pricetag" size={12} /> {venue.type}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
    </KeyboardAvoidingView>
  );
}