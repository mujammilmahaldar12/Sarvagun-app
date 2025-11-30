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
import PrimaryButton from '@/components/ui/PrimaryButton';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { useTheme } from '@/hooks/useTheme';
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

  // Venue modal states
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!leadId) {
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
      setVenues(venuesData);
      setCategories(categoriesData);
      setOrganisations(orgsData);
      
      // Pre-fill type of event with client name
      setFormData(prev => ({
        ...prev,
        typeOfEvent: `${leadData.client.name} Event`,
      }));
    } catch (error: any) {
      safeGoBack();
    } finally {
      setLoading(false);
    }
  };

  const requiresOrganisation = () => {
    if (!formData.categoryId || !categories) return false;
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    return selectedCategory?.requires_organisation || false;
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
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
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
        { text: 'OK', onPress: () => safeGoBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to convert lead');
    } finally {
      setLoading(false);
    }
  };

  // Component for form inputs
  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    prefix,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{
            position: 'absolute',
            left: 12,
            fontSize: 14,
            color: theme.text,
            zIndex: 1,
          }}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 28 : 12,
            fontSize: 14,
            color: theme.text,
            backgroundColor: theme.surface,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 44,
          }}
        />
      </View>
    </View>
  );

  // Component for section headers
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  if (loading || !lead || !categories || !organisations || !venues) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Convert Lead to Event" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ 
            color: theme.text, 
            marginTop: 16,
            fontSize: 16 
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ModuleHeader
            title="Convert Lead to Event"
            showBack
          />

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Lead Info */}
            {lead && (
              <View style={{
                backgroundColor: theme.primary + '15',
                padding: 14,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: theme.primary,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="person-circle" size={20} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '700' }}>
                    Converting Lead: {lead.client.name}
                  </Text>
                </View>
                {lead.client.email && (
                  <Text style={{ color: theme.text, fontSize: 13, marginLeft: 28 }}>
                    📧 {lead.client.email}
                  </Text>
                )}
                {lead.client.number && (
                  <Text style={{ color: theme.text, fontSize: 13, marginLeft: 28 }}>
                    📱 {lead.client.number}
                  </Text>
                )}
              </View>
            )}

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
                        fontSize: 14,
                        color: formData.company === company ? theme.primary : theme.text,
                        fontWeight: '700',
                      }}
                    >
                      {company === 'redmagic events' ? 'RedMagic' : 'Bling Square'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Client Category */}
            <View style={{ gap: 12 }}>
              <SectionHeader title="Client Category *" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(categories || []).map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => setFormData({ ...formData, categoryId: category.id, organisationId: 0 })}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 20,
                        borderWidth: formData.categoryId === category.id ? 2 : 1,
                        borderColor: formData.categoryId === category.id ? theme.primary : theme.border,
                        backgroundColor: formData.categoryId === category.id 
                          ? theme.primary + '15' 
                          : theme.surface,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                        opacity: pressed ? 0.8 : 1,
                        minWidth: 100,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: formData.categoryId === category.id ? theme.primary : theme.text,
                          fontWeight: '700',
                          textAlign: 'center',
                        }}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Organisation (conditional) */}
            {requiresOrganisation() && (
              <View style={{ gap: 12 }}>
                <SectionHeader title="Organisation *" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(organisations || []).map((org) => (
                      <Pressable
                        key={org.id}
                        onPress={() => setFormData({ ...formData, organisationId: org.id })}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 20,
                          borderWidth: formData.organisationId === org.id ? 2 : 1,
                          borderColor: formData.organisationId === org.id ? theme.primary : theme.border,
                          backgroundColor: formData.organisationId === org.id 
                            ? theme.primary + '15' 
                            : theme.surface,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                          opacity: pressed ? 0.8 : 1,
                          minWidth: 120,
                        })}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: formData.organisationId === org.id ? theme.primary : theme.text,
                            fontWeight: '700',
                            textAlign: 'center',
                          }}
                        >
                          {org.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Event Details */}
            <View style={{ gap: 16 }}>
              <SectionHeader title="Event Details" />
              
              <FormInput
                label="Type of Event *"
                value={formData.typeOfEvent}
                onChangeText={(text: string) => setFormData({ ...formData, typeOfEvent: text })}
                placeholder="e.g., Birthday Party, Annual Conference"
              />

              {/* Event Category */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                  Event Category *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['social events', 'weddings', 'corporate events', 'religious events', 'sports', 'other'] as const).map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setFormData({ ...formData, eventCategory: cat })}
                        style={({ pressed }) => ({
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 20,
                          borderWidth: formData.eventCategory === cat ? 2 : 1,
                          borderColor: formData.eventCategory === cat ? theme.primary : theme.border,
                          backgroundColor: formData.eventCategory === cat 
                            ? theme.primary + '15' 
                            : theme.surface,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                          opacity: pressed ? 0.8 : 1,
                          minWidth: 80,
                        })}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: formData.eventCategory === cat ? theme.primary : theme.text,
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            textAlign: 'center',
                          }}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Date Selection with DatePickerInput */}
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
            <View style={{ gap: 12 }}>
              <SectionHeader title="Venue *" />
              <Pressable
                onPress={() => setShowVenueModal(true)}
                style={{
                  borderWidth: 1.5,
                  borderColor: selectedVenue ? theme.primary : theme.border,
                  borderRadius: 12,
                  padding: 14,
                  backgroundColor: theme.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View style={{ flex: 1 }}>
                  {selectedVenue ? (
                    <>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                        {selectedVenue.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                        {selectedVenue.address} • Capacity: {selectedVenue.capacity}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                      Tap to search and select a venue
                    </Text>
                  )}
                </View>
                <Ionicons name="search" size={20} color={theme.primary} />
              </Pressable>
            </View>

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
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Add Day</Text>
                </Pressable>
              </View>

              {(eventDates || []).map((eventDate, index) => (
                <View
                  key={index}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar" size={16} color={theme.primary} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                        Event Day {index + 1}
                      </Text>
                    </View>
                    {eventDates.length > 1 && (
                      <Pressable onPress={() => removeEventDate(index)}>
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
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

              {(eventDates || []).length === 0 && (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={40} color={theme.textSecondary} />
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 8 }}>
                    No event days added yet. Click "Add Day" to start.
                  </Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <PrimaryButton
              title="Convert to Event"
              onPress={handleSubmit}
              loading={loading}
              icon="swap-horizontal"
              style={{ marginTop: 8 }}
            />
          </ScrollView>

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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="location" size={24} color={theme.primary} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                      Select Venue
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setShowVenueModal(false)}
                    style={({ pressed }) => ({
                      padding: 4,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
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

                {/* Venue List */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                  {filteredVenues.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Ionicons name="location-outline" size={60} color={theme.textSecondary} />
                      <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>
                        No venues found
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                        Try adjusting your search
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {(filteredVenues || []).map((venue) => (
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
                            borderColor:
                              selectedVenue?.id === venue.id ? theme.primary : theme.border,
                            backgroundColor:
                              selectedVenue?.id === venue.id
                                ? theme.primary + '10'
                                : theme.surface,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
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
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '600',
                                  color: theme.text,
                                  marginBottom: 4,
                                }}
                              >
                                {venue.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: theme.textSecondary,
                                  marginBottom: 6,
                                }}
                              >
                                {venue.address}
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="people" size={14} color={theme.textSecondary} />
                                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    {venue.capacity}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="pricetag" size={14} color={theme.textSecondary} />
                                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    {venue.type}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={
                                selectedVenue?.id === venue.id ? theme.primary : theme.textSecondary
                              }
                            />
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}