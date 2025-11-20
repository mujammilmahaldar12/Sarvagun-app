import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';
import type { Lead, Venue, ClientCategory, Organisation } from '@/types/events';

export default function ConvertLeadScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { leadId } = useLocalSearchParams<{ leadId: string }>();

  const [loading, setLoading] = useState(false);
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
      setVenues(venuesData);
      setCategories(categoriesData);
      setOrganisations(orgsData);
      
      // Pre-fill type of event with client name
      setFormData(prev => ({
        ...prev,
        typeOfEvent: `${leadData.client.name} Event`,
      }));
    } catch (error: any) {
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const requiresOrganisation = () => {
    if (!formData.categoryId) return false;
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    return selectedCategory?.requires_organisation || false;
  };

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
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
      return;
    }
    if (!formData.categoryId) {
      return;
    }

    // Check if B2B/B2G requires organisation
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    if (requiresOrganisation() && !formData.organisationId) {
      return;
    }

    if (!formData.venueId) {
      return;
    }
    if (!formData.startDate.trim()) {
      return;
    }
    if (!formData.endDate.trim()) {
      return;
    }
    if (!formData.typeOfEvent.trim()) {
      return;
    }
    if (!formData.eventCategory) {
      return;
    }

    // Validate event dates
    const validEventDates = eventDates.filter(d => d.date.trim());
    if (validEventDates.length === 0) {
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
    prefix,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{
            position: 'absolute',
            left: 12,
            fontSize: 14,
            color: theme.colors.text,
            zIndex: 1,
          }}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 28 : 12,
            fontSize: 14,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 44,
          }}
        />
      </View>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  if (loading && !lead) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ModuleHeader title="Convert Lead to Event" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader
        title="Convert Lead to Event"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Lead Info */}
        {lead && (
          <View style={{
            backgroundColor: theme.colors.primary + '15',
            padding: 14,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>
                Converting Lead: {lead.client.name}
              </Text>
            </View>
            {lead.client.email && (
              <Text style={{ color: theme.colors.text, fontSize: 13, marginLeft: 28 }}>
                📧 {lead.client.email}
              </Text>
            )}
            {lead.client.number && (
              <Text style={{ color: theme.colors.text, fontSize: 13, marginLeft: 28 }}>
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
                  borderColor: formData.company === company ? theme.colors.primary : theme.colors.border,
                  backgroundColor: formData.company === company 
                    ? theme.colors.primary + '15' 
                    : theme.colors.surface,
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
                  color={formData.company === company ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: formData.company === company ? theme.colors.primary : theme.colors.text,
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setFormData({ ...formData, categoryId: category.id, organisationId: 0 })}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderWidth: formData.categoryId === category.id ? 2 : 1,
                  borderColor: formData.categoryId === category.id ? theme.colors.primary : theme.colors.border,
                  backgroundColor: formData.categoryId === category.id 
                    ? theme.colors.primary + '15' 
                    : theme.colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: formData.categoryId === category.id ? theme.colors.primary : theme.colors.text,
                    fontWeight: '700',
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Organisation (conditional) */}
        {requiresOrganisation() && (
          <View style={{ gap: 12 }}>
            <SectionHeader title="Organisation *" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {organisations.map((org) => (
                <Pressable
                  key={org.id}
                  onPress={() => setFormData({ ...formData, organisationId: org.id })}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    borderWidth: formData.organisationId === org.id ? 2 : 1,
                    borderColor: formData.organisationId === org.id ? theme.colors.primary : theme.colors.border,
                    backgroundColor: formData.organisationId === org.id 
                      ? theme.colors.primary + '15' 
                      : theme.colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: formData.organisationId === org.id ? theme.colors.primary : theme.colors.text,
                      fontWeight: '700',
                    }}
                  >
                    {org.name}
                  </Text>
                </Pressable>
              ))}
            </View>
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
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
              Event Category *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['social events', 'weddings', 'corporate events', 'religious events', 'sports', 'other'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setFormData({ ...formData, eventCategory: cat })}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: formData.eventCategory === cat ? 2 : 1,
                    borderColor: formData.eventCategory === cat ? theme.colors.primary : theme.colors.border,
                    backgroundColor: formData.eventCategory === cat 
                      ? theme.colors.primary + '15' 
                      : theme.colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: formData.eventCategory === cat ? theme.colors.primary : theme.colors.text,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Start Date *"
                value={formData.startDate}
                onChangeText={(text: string) => setFormData({ ...formData, startDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="End Date *"
                value={formData.endDate}
                onChangeText={(text: string) => setFormData({ ...formData, endDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Venue Selection */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Venue *" />
          <Pressable
            onPress={() => setShowVenueModal(true)}
            style={{
              borderWidth: 1.5,
              borderColor: selectedVenue ? theme.colors.primary : theme.colors.border,
              borderRadius: 12,
              padding: 14,
              backgroundColor: theme.colors.surface,
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
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                    {selectedVenue.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {selectedVenue.address} • Capacity: {selectedVenue.capacity}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                  Tap to search and select a venue
                </Text>
              )}
            </View>
            <Ionicons name="search" size={20} color={theme.colors.primary} />
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
                backgroundColor: pressed ? theme.colors.primary + '20' : theme.colors.primary + '15',
              })}
            >
              <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>Add Day</Text>
            </Pressable>
          </View>

          {formData.eventDates.map((eventDate, index) => (
            <View
              key={index}
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                    Event Day {index + 1}
                  </Text>
                </View>
                <Pressable onPress={() => removeEventDate(index)}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </Pressable>
              </View>

              <TextInput
                value={eventDate.date}
                onChangeText={(text) => updateEventDate(index, 'date', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                }}
              />
            </View>
          ))}

          {formData.eventDates.length === 0 && (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 8 }}>
                No event days added yet. Click "Add Day" to start.
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            marginTop: 8,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
            opacity: loading ? 0.6 : pressed ? 0.9 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color="white" />
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}
              >
                Convert to Event
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Venue Selection Modal */}
      <Modal visible={showVenueModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              flex: 1,
              marginTop: 80,
              backgroundColor: theme.colors.background,
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
                borderBottomColor: theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={24} color={theme.colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>
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
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  value={venueSearchQuery}
                  onChangeText={setVenueSearchQuery}
                  placeholder="Search venue name or address..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: theme.colors.text,
                  }}
                />
                {venueSearchQuery.length > 0 && (
                  <Pressable onPress={() => setVenueSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Venue List */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {filteredVenues.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="location-outline" size={60} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginTop: 16 }}>
                    No venues found
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
                    Try adjusting your search
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
                        borderColor:
                          selectedVenue?.id === venue.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor:
                          selectedVenue?.id === venue.id
                            ? theme.colors.primary + '10'
                            : theme.colors.surface,
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
                            backgroundColor: theme.colors.primary + '20',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="location" size={20} color={theme.colors.primary} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '600',
                              color: theme.colors.text,
                              marginBottom: 4,
                            }}
                          >
                            {venue.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: theme.colors.textSecondary,
                              marginBottom: 6,
                            }}
                          >
                            {venue.address}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="people" size={14} color={theme.colors.textSecondary} />
                              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                {venue.capacity}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="pricetag" size={14} color={theme.colors.textSecondary} />
                              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                {venue.type}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={
                            selectedVenue?.id === venue.id ? theme.colors.primary : theme.colors.textSecondary
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
  );
}
