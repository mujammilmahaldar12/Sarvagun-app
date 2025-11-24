import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { Select } from '@/components/core/Select';
import { Button } from '@/components/core/Button';
import { DatePicker } from '@/components/core/DatePicker';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { 
  useInvoice, 
  useCreateInvoice, 
  useUpdateInvoice
} from '@/hooks/useFinanceQueries';
import { useEvents } from '@/hooks/useEventsQueries';
import type { InvoiceItem } from '@/types/finance';
import type { SelectOption } from '@/components/core/Select';

const INVOICE_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AddInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const isEditMode = !!id;

  // Fetch data
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(Number(id), { enabled: isEditMode });
  const { data: events = [] } = useEvents();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    event: null as number | null,
    invoice_date: '',
    due_date: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'cancelled',
    notes: '',
    terms_conditions: '',
    gst_percentage: '18',
  });

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<InvoiceItem> | null>(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Load existing invoice data
  useEffect(() => {
    if (invoice && isEditMode) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        client_name: invoice.client_name || '',
        client_email: invoice.client_email || '',
        client_phone: invoice.client_phone || '',
        client_address: invoice.client_address || '',
        event: invoice.event?.id || null,
        invoice_date: invoice.invoice_date || '',
        due_date: invoice.due_date || '',
        status: invoice.status || 'draft',
        notes: invoice.notes || '',
        terms_conditions: invoice.terms_conditions || '',
        gst_percentage: String(invoice.gst_percentage || 18),
      });
      setSelectedEvent(invoice.event || null);
      setItems(invoice.invoice_items || []);
    }
  }, [invoice, isEditMode]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Filtered events
  const filteredEvents = events.filter((event) =>
    event.name?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.client?.name?.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  // Handlers
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    updateField('event', event.id);
    // Auto-fill client details from event
    if (event.client) {
      updateField('client_name', event.client.name);
      updateField('client_email', event.client.email || '');
      updateField('client_phone', event.client.phone || '');
      updateField('client_address', event.client.address || '');
    }
    setShowEventModal(false);
    setEventSearchQuery('');
  };

  const handleAddItem = () => {
    setEditingItem({
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
    });
    setEditingIndex(-1);
    setShowItemModal(true);
  };

  const handleEditItem = (index: number) => {
    setEditingItem({ ...items[index] });
    setEditingIndex(index);
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!editingItem?.description?.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }
    if (!editingItem.quantity || editingItem.quantity <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }
    if (!editingItem.unit_price || editingItem.unit_price <= 0) {
      Alert.alert('Error', 'Please enter valid unit price');
      return;
    }

    const amount = (editingItem.quantity || 0) * (editingItem.unit_price || 0);
    const itemData = { ...editingItem, amount };

    if (editingIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingIndex] = itemData;
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([...items, itemData]);
    }

    setShowItemModal(false);
    setEditingItem(null);
    setEditingIndex(-1);
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setItems(items.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const gstAmount = useMemo(() => {
    return (subtotal * (Number(formData.gst_percentage) || 0)) / 100;
  }, [subtotal, formData.gst_percentage]);

  const totalAmount = useMemo(() => {
    return subtotal + gstAmount;
  }, [subtotal, gstAmount]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.invoice_number.trim()) {
      Alert.alert('Error', 'Please enter invoice number');
      return;
    }
    if (!formData.client_name.trim()) {
      Alert.alert('Error', 'Please enter client name');
      return;
    }
    if (!formData.invoice_date) {
      Alert.alert('Error', 'Please select invoice date');
      return;
    }
    if (!formData.due_date) {
      Alert.alert('Error', 'Please select due date');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        invoice_number: formData.invoice_number,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        event: formData.event,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        subtotal,
        gst_percentage: Number(formData.gst_percentage) || 0,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        status: formData.status,
        notes: formData.notes || null,
        terms_conditions: formData.terms_conditions || null,
        invoice_items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
      };

      if (isEditMode) {
        await updateInvoice.mutateAsync({ id: Number(id), data: invoiceData });
        Alert.alert('Success', 'Invoice updated successfully');
      } else {
        await createInvoice.mutateAsync(invoiceData);
        Alert.alert('Success', 'Invoice created successfully');
      }
      
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  if (invoiceLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
          Loading invoice...
        </Text>
      </View>
    );
  }

  // Helper components
  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    prefix,
    required = false,
    editable = true,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{
            position: 'absolute',
            left: 12,
            ...getTypographyStyle('sm', 'regular'),
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
          editable={editable}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 28 : 12,
            ...getTypographyStyle('sm', 'regular'),
            color: theme.text,
            backgroundColor: editable ? theme.surface : theme.background,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 44,
          }}
        />
      </View>
    </View>
  );

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={{ gap: 4 }}>
      <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={isEditMode ? 'Edit Invoice' : 'Create Invoice'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Invoice Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Invoice Details" />
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Invoice Number"
                value={formData.invoice_number}
                onChangeText={(text: string) => updateField('invoice_number', text)}
                placeholder="INV-001"
                required
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ gap: 8 }}>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                  Status <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {INVOICE_STATUS_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => updateField('status', option.value)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: formData.status === option.value ? theme.primary : theme.border,
                        backgroundColor: pressed
                          ? theme.primary + '10'
                          : formData.status === option.value
                          ? theme.primary + '20'
                          : theme.surface,
                      })}
                    >
                      <Text
                        style={{
                          ...getTypographyStyle('xs', formData.status === option.value ? 'semibold' : 'regular'),
                          color: formData.status === option.value ? theme.primary : theme.text,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="Invoice Date"
                value={formData.invoice_date}
                onDateSelect={(date) => updateField('invoice_date', date)}
                placeholder="Select invoice date"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="Due Date"
                value={formData.due_date}
                onDateSelect={(date) => updateField('due_date', date)}
                placeholder="Select due date"
              />
            </View>
          </View>
        </View>

        {/* Event Linking (Optional) */}
        <View style={{ gap: 16 }}>
          <SectionHeader 
            title="Event Linking (Optional)" 
            subtitle="Link this invoice to an event"
          />
          
          <DropdownField
            label="Select Event"
            value={selectedEvent?.name || ''}
            placeholder="Tap to select event (optional)"
            onPress={() => setShowEventModal(true)}
          />

          {selectedEvent && (
            <View style={{
              padding: 12,
              backgroundColor: theme.primary + '10',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Client
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                {selectedEvent.client?.name || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Client Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Client Information" />
          
          <FormInput
            label="Client Name"
            value={formData.client_name}
            onChangeText={(text: string) => updateField('client_name', text)}
            placeholder="Enter client name"
            required
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Email"
                value={formData.client_email}
                onChangeText={(text: string) => updateField('client_email', text)}
                placeholder="client@example.com"
                keyboardType="email-address"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Phone"
                value={formData.client_phone}
                onChangeText={(text: string) => updateField('client_phone', text)}
                placeholder="1234567890"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <FormInput
            label="Address"
            value={formData.client_address}
            onChangeText={(text: string) => updateField('client_address', text)}
            placeholder="Enter client address"
            multiline
          />
        </View>

        {/* Invoice Items */}
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionHeader title="Invoice Items" subtitle="Add products or services" />
          </View>

          <Button
            title="Add Item"
            onPress={handleAddItem}
            variant="secondary"
            fullWidth
            leftIcon="add-circle-outline"
          />

          {items.length > 0 && (
            <View style={{ gap: 8 }}>
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                      {item.description}
                    </Text>
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')} = ₹{Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => handleEditItem(index)}>
                      <Ionicons name="create-outline" size={20} color={theme.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleRemoveItem(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Calculation Summary */}
          {items.length > 0 && (
            <View style={{
              padding: 16,
              backgroundColor: theme.surface,
              borderRadius: 12,
              gap: 12,
              ...designSystem.shadows.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  Subtotal
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                  ₹{subtotal.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  GST ({formData.gst_percentage}%)
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                  ₹{gstAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: theme.border }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                  Total Amount
                </Text>
                <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.primary }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}

          <FormInput
            label="GST Percentage"
            value={formData.gst_percentage}
            onChangeText={(text: string) => updateField('gst_percentage', text)}
            placeholder="18"
            keyboardType="numeric"
            prefix="%"
          />
        </View>

        {/* Additional Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Details (Optional)" />
          
          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any notes for the client"
            multiline
          />

          <FormInput
            label="Terms & Conditions"
            value={formData.terms_conditions}
            onChangeText={(text: string) => updateField('terms_conditions', text)}
            placeholder="Enter payment terms and conditions"
            multiline
          />
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <Button
            title={isEditMode ? 'Update Invoice' : 'Create Invoice'}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            leftIcon={isEditMode ? 'checkmark-circle' : 'add-circle'}
          />
        </View>
      </ScrollView>

      {/* Event Selection Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowEventModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ gap: 16 }}>
              <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                Select Event
              </Text>

              <TextInput
                value={eventSearchQuery}
                onChangeText={setEventSearchQuery}
                placeholder="Search events..."
                placeholderTextColor={theme.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  ...getTypographyStyle('sm', 'regular'),
                  color: theme.text,
                  backgroundColor: theme.background,
                }}
              />

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {filteredEvents.length === 0 ? (
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                    No events found
                  </Text>
                ) : (
                  filteredEvents.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => handleSelectEvent(event)}
                      style={({ pressed }) => ({
                        padding: 14,
                        borderRadius: 8,
                        backgroundColor: pressed ? theme.primary + '10' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      })}
                    >
                      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                        {event.name}
                      </Text>
                      <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: 4 }}>
                        {event.client?.name || 'N/A'} • {new Date(event.start_date).toLocaleDateString('en-IN')}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  title="Clear Selection"
                  onPress={() => {
                    setSelectedEvent(null);
                    updateField('event', null);
                    setShowEventModal(false);
                  }}
                  variant="secondary"
                  fullWidth
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowEventModal(false)}
                  variant="secondary"
                  fullWidth
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={showItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowItemModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowItemModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                  {editingIndex >= 0 ? 'Edit' : 'Add'} Invoice Item
                </Text>

                <FormInput
                  label="Description"
                  value={editingItem?.description || ''}
                  onChangeText={(text: string) => 
                    setEditingItem({ ...editingItem, description: text })
                  }
                  placeholder="Enter item description"
                  multiline
                  required
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Quantity"
                      value={String(editingItem?.quantity || '')}
                      onChangeText={(text: string) => 
                        setEditingItem({ ...editingItem, quantity: Number(text) || 0 })
                      }
                      placeholder="1"
                      keyboardType="numeric"
                      required
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Unit Price"
                      value={String(editingItem?.unit_price || '')}
                      onChangeText={(text: string) => 
                        setEditingItem({ ...editingItem, unit_price: Number(text) || 0 })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      prefix="₹"
                      required
                    />
                  </View>
                </View>

                {editingItem && editingItem.quantity && editingItem.unit_price && (
                  <View style={{
                    padding: 12,
                    backgroundColor: theme.primary + '10',
                    borderRadius: 8,
                  }}>
                    <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                      Amount
                    </Text>
                    <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.primary, marginTop: 4 }}>
                      ₹{((editingItem.quantity || 0) * (editingItem.unit_price || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowItemModal(false);
                      setEditingItem(null);
                      setEditingIndex(-1);
                    }}
                    variant="secondary"
                    fullWidth
                  />
                  <Button
                    title={editingIndex >= 0 ? 'Update' : 'Add'}
                    onPress={handleSaveItem}
                    fullWidth
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

