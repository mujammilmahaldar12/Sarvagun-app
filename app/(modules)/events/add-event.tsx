import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const EVENT_TYPES = ['Conference', 'Workshop', 'Seminar', 'Launch', 'Training', 'Meeting', 'Other'];

export default function AddEventScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { fromLead } = useLocalSearchParams<{ fromLead?: string }>();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    startDate: '',
    endDate: '',
    venue: '',
    venueAddress: '',
    budget: '',
    attendees: '',
    description: '',
    agenda: '',
  });

  const [documents, setDocuments] = useState<any[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickDocument = async () => {
    // TODO: Implement document picker
    console.log('Pick document');
    Alert.alert('Info', 'Document picker will be implemented with expo-document-picker');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.eventName.trim()) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }
    if (!formData.eventType) {
      Alert.alert('Error', 'Please select event type');
      return;
    }
    if (!formData.startDate.trim()) {
      Alert.alert('Error', 'Please enter start date');
      return;
    }
    if (!formData.venue.trim()) {
      Alert.alert('Error', 'Please enter venue');
      return;
    }

    // Submit logic here
    console.log('Submitting event:', formData);
    Alert.alert('Success', 'Event created successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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

  const SelectInput = ({ label, value, options, onSelect }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
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
              borderColor: value === option ? theme.primary : theme.border,
              backgroundColor: pressed
                ? theme.primary + '10'
                : value === option
                ? theme.primary + '20'
                : theme.surface,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                color: value === option ? theme.primary : theme.text,
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
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={fromLead ? "Convert Lead to Event" : "Add New Event"}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {fromLead && (
          <View style={{
            backgroundColor: theme.primary + '20',
            padding: 12,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
          }}>
            <Text style={{ color: theme.text, fontSize: 14 }}>
              Creating event from lead #{fromLead}
            </Text>
          </View>
        )}

        {/* Event Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Event Information" />
          <FormInput
            label="Event Name *"
            value={formData.eventName}
            onChangeText={(text: string) => updateField('eventName', text)}
            placeholder="Enter event name"
          />
          <SelectInput
            label="Event Type *"
            value={formData.eventType}
            options={EVENT_TYPES}
            onSelect={(value: string) => updateField('eventType', value)}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Start Date *"
                value={formData.startDate}
                onChangeText={(text: string) => updateField('startDate', text)}
                placeholder="DD-MM-YYYY"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="End Date"
                value={formData.endDate}
                onChangeText={(text: string) => updateField('endDate', text)}
                placeholder="DD-MM-YYYY"
              />
            </View>
          </View>
        </View>

        {/* Venue Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Venue Information" />
          <FormInput
            label="Venue *"
            value={formData.venue}
            onChangeText={(text: string) => updateField('venue', text)}
            placeholder="Enter venue name"
          />
          <FormInput
            label="Venue Address"
            value={formData.venueAddress}
            onChangeText={(text: string) => updateField('venueAddress', text)}
            placeholder="Enter venue address"
            multiline
          />
          <FormInput
            label="Expected Attendees"
            value={formData.attendees}
            onChangeText={(text: string) => updateField('attendees', text)}
            placeholder="Enter number of attendees"
            keyboardType="numeric"
          />
        </View>

        {/* Financial Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Financial Information" />
          <FormInput
            label="Budget"
            value={formData.budget}
            onChangeText={(text: string) => updateField('budget', text)}
            placeholder="0"
            keyboardType="numeric"
            prefix="₹"
          />
        </View>

        {/* Event Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Event Details" />
          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(text: string) => updateField('description', text)}
            placeholder="Enter event description"
            multiline
          />
          <FormInput
            label="Agenda"
            value={formData.agenda}
            onChangeText={(text: string) => updateField('agenda', text)}
            placeholder="Enter event agenda"
            multiline
          />
        </View>

        {/* Documents */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Documents" />
          <AppButton
            title="Upload Documents"
            onPress={pickDocument}
            variant="secondary"
            fullWidth
            leftIcon="cloud-upload-outline"
          />

          {documents.length > 0 && (
            <View style={{ gap: 8 }}>
              {documents.map((doc, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: theme.surface,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="document" size={20} color={theme.primary} />
                    <Text style={{ color: theme.text, fontSize: 14, flex: 1 }}>
                      {doc.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeDocument(index)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <AppButton
            title="Create Event"
            onPress={handleSubmit}
            fullWidth
            size="lg"
            leftIcon="calendar"
          />
        </View>
      </ScrollView>
    </View>
  );
}
