import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Button, FormField } from '@/components';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import eventsService from '@/services/events.service';
import type { Lead, Venue, ClientCategory, Organisation } from '@/types/events';

export default function ConvertLeadScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { leadId } = useLocalSearchParams<{ leadId: string }>();

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
    startDate: '',
    endDate: '',
    typeOfEvent: '',
    eventCategory: '' as 'social events' | 'weddings' | 'corporate events' | 'religious events' | 'sports' | 'other' | '',
  });

  const [eventDates, setEventDates] = useState<Array<{ date: string }>>([
    { date: '' },
  ]);

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
      router.back();
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
      
      // Initialize form with default values but allow editing
      setFormData(prev => ({
        ...prev,
        typeOfEvent: '', // Start with empty field, let user type
      }));
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

  const updateEventDate = (index: number, value: string) => {
    const newDates = [...eventDates];
    newDates[index] = { date: value };
    setEventDates(newDates);
  };

  const addEventDate = () => {
    setEventDates([...eventDates, { date: '' }]);
  };

  const removeEventDate = (index: number) => {
    if (eventDates.length === 1) {
      return;
    }
    setEventDates(eventDates.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.company) {
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

    if (!formData.venueId) {
      Alert.alert('Error', 'Please select a venue');
      return;
    }
    if (!formData.startDate.trim()) {
      Alert.alert('Error', 'Please select a start date');
      return;
    }
    if (!formData.endDate.trim()) {
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
    const validEventDates = eventDates.filter(d => d.date.trim());
    if (validEventDates.length === 0) {
      Alert.alert('Error', 'Please add at least one event date');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = getSelectedCategory();
      await eventsService.convertLeadToEvent(Number(leadId), {
        company: formData.company,
        client_category: selectedCategory?.code,
        organisation: formData.organisationId || undefined,
        venue: formData.venueId,
        start_date: formData.startDate.trim(),
        end_date: formData.endDate.trim(),
        type_of_event: formData.typeOfEvent.trim(),
        category: formData.eventCategory,
        event_dates: validEventDates,
      });

      Alert.alert('Success', 'Lead converted to event successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to convert lead');
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
      <Pressable
        onPress={onPress}
        android_disableSound={true}
        style={({ pressed }) => ({
          borderWidth: 1.5,
          borderColor: value ? theme.primary : theme.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
          backgroundColor: theme.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ 
          color: value ? theme.text : theme.textSecondary,
          fontSize: typography.sizes.base,
          flex: 1,
        }}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon as any} size={20} color={theme.primary} />
      </Pressable>
    </View>
  );

  // Using standardized FormField component instead of custom FormInput

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ 
      fontSize: typography.sizes.lg, 
      fontWeight: typography.weights.bold, 
      color: theme.text, 
      marginTop: spacing[2],
      marginBottom: spacing[3]
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
              paddingHorizontal: 20,
              paddingVertical: 16,
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            {data.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
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
                        padding: 16,
                        borderRadius: 12,
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
        <ModuleHeader title="Convert Lead to Event" showBack />
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
        <ModuleHeader title="Convert Lead to Event" showBack />

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
            {/* Lead Info */}
            <View style={{
              backgroundColor: theme.primary + '15',
              padding: 14,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="person-circle" size={20} color={theme.primary} />
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
                      paddingVertical: 16,
                      borderRadius: 12,
                      borderWidth: formData.company === company ? 2 : 1.5,
                      borderColor: formData.company === company ? theme.primary : theme.border,
                      backgroundColor: formData.company === company 
                        ? theme.primary + '15' 
                        : theme.surface,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                      elevation: 3,
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    })}
                  >
                    <Ionicons 
                      name="business-outline" 
                      size={20} 
                      color={formData.company === company ? theme.primary : theme.textSecondary} 
                    />
                    <Text
                      style={{
                        ...getTypographyStyle('sm', 'bold'),
                        color: formData.company === company ? theme.primary : theme.text,
                      }}
                    >
                      {company === 'redmagic events' ? 'RedMagic' : 'Bling Square'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Client Category Dropdown */}
            <DropdownField
              label="Client Category"
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

            {/* Event Details */}
            <View style={{ gap: 16 }}>
              <SectionHeader title="Event Details" />
              
              <FormField
                label="Type of Event"
                value={formData.typeOfEvent}
                onChangeText={(text: string) => setFormData({ ...formData, typeOfEvent: text })}
                placeholder="Enter type of event (e.g., Birthday Party, Conference)"
                required
              />

              {/* Event Category Dropdown */}
              <DropdownField
                label="Event Category"
                value={formData.eventCategory}
                placeholder="Select event category"
                onPress={() => setShowEventCategoryModal(true)}
                required
              />

              {/* Date Selection */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <DatePickerInput
                  label="Start Date *"
                  value={formData.startDate}
                  onDateSelect={(date) => setFormData({ ...formData, startDate: date })}
                  placeholder="YYYY-MM-DD"
                />
                <DatePickerInput
                  label="End Date *"
                  value={formData.endDate}
                  onDateSelect={(date) => setFormData({ ...formData, endDate: date })}
                  placeholder="YYYY-MM-DD"
                />
              </View>
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

            {/* Event Active Days */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionHeader title="Event Active Days *" />
                <Pressable
                  onPress={addEventDate}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.primary + '20' : theme.primary + '15',
                  })}
                >
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
                  <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.primary }}>Add Day</Text>
                </Pressable>
              </View>

              {eventDates.map((eventDate, index) => (
                <View
                  key={index}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar" size={16} color={theme.primary} />
                      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                        Event Day {index + 1}
                      </Text>
                    </View>
                    {eventDates.length > 1 && (
                      <Pressable onPress={() => removeEventDate(index)} android_disableSound={true}>
                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                      </Pressable>
                    )}
                  </View>

                  <DatePickerInput
                    label=""
                    value={eventDate.date}
                    onDateSelect={(date) => updateEventDate(index, date)}
                    placeholder="Select event date"
                  />
                </View>
              ))}
            </View>

            {/* Submit Button */}
            <Button
              title="Convert to Event"
              onPress={handleSubmit}
              isLoading={loading}
              icon="swap-horizontal"
              style={{ marginTop: 8 }}
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

          {/* Venue Selection Modal */}
          <Modal visible={showVenueModal} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View
                style={{
                  flex: 1,
                  marginTop: 80,
                  backgroundColor: theme.background,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                {/* Modal Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                    Select Venue
                  </Text>
                  <Pressable onPress={() => setShowVenueModal(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={28} color={theme.text} />
                  </Pressable>
                </View>

                {/* Search Box */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.surface,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      gap: 8,
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
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                  {filteredVenues.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Ionicons name="location-outline" size={60} color={theme.textSecondary} />
                      <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary, marginTop: 16 }}>
                        No venues found
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
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
                            padding: 14,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: selectedVenue?.id === venue.id ? theme.primary : theme.border,
                            backgroundColor: selectedVenue?.id === venue.id
                              ? theme.primary + '10'
                              : theme.surface,
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: theme.primary + '20',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Ionicons name="location" size={20} color={theme.primary} />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 4 }}>
                                {venue.name}
                              </Text>
                              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 6 }}>
                                {venue.address}
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="people" size={14} color={theme.textSecondary} />
                                  <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                                    {venue.capacity}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="pricetag" size={14} color={theme.textSecondary} />
                                  <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                                    {venue.type}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* Convert Button */}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: theme.background,
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                }}>
                  <Button
                    onPress={handleSubmit}
                    isLoading={loading}
                    disabled={loading}
                    title={loading ? 'Converting...' : 'Convert Lead to Event'}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
    </KeyboardAvoidingView>
  );
}