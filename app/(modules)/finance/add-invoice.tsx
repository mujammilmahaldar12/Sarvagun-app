import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
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
import type { Event } from '@/types/events';
import type { SelectOption } from '@/components/core/Select';

// Form-specific type for invoice items with editable fields
interface FormInvoiceItem {
  particulars: string;
  quantity: number;
  unit_price?: number;
  amount: number;
}

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
    event: null as number | null,
    date: '',
    total_amount: 0,
    discount: 0,
    final_amount: 0,
    cgst: '9',
    sgst: '9',
    notes: '',
  });

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [items, setItems] = useState<FormInvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<FormInvoiceItem | null>(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Load existing invoice data
  useEffect(() => {
    if (invoice && isEditMode) {
      const eventData = typeof invoice.event === 'object' ? invoice.event : null;
      setFormData({
        invoice_number: invoice.invoice_number || '',
        client_name: invoice.client_name || '',
        event: typeof invoice.event === 'number' ? invoice.event : invoice.event?.id || null,
        date: invoice.date || '',
        total_amount: invoice.total_amount || 0,
        discount: invoice.discount || 0,
        final_amount: invoice.final_amount || 0,
        cgst: invoice.cgst || '9',
        sgst: invoice.sgst || '9',
        notes: '',
      });
      setSelectedEvent(eventData);
      // Convert InvoiceItem to FormInvoiceItem
      const formItems: FormInvoiceItem[] = (invoice.items || []).map(item => ({
        particulars: item.particulars,
        quantity: Number(item.quantity) || 0,
        unit_price: 0, // Not available in InvoiceItem, calculate from amount/quantity if needed
        amount: item.amount
      }));
      setItems(formItems);
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
    }
    setShowEventModal(false);
    setEventSearchQuery('');
  };

  const handleAddItem = () => {
    setEditingItem({
      particulars: '',
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
    if (!editingItem?.particulars?.trim()) {
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
    const cgst = (subtotal * (Number(formData.cgst) || 0)) / 100;
    const sgst = (subtotal * (Number(formData.sgst) || 0)) / 100;
    return cgst + sgst;
  }, [subtotal, formData.cgst, formData.sgst]);

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
    if (!formData.date) {
      Alert.alert('Error', 'Please select invoice date');
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
        event: formData.event,
        date: formData.date,
        total_amount: subtotal,
        discount: formData.discount,
        final_amount: totalAmount,
        cgst: formData.cgst,
        sgst: formData.sgst,
        items: items.map((item, index) => ({
          sr_no: index + 1,
          particulars: item.particulars,
          quantity: String(item.quantity),
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
          
          <FormInput
            label="Invoice Number"
            value={formData.invoice_number}
            onChangeText={(text: string) => updateField('invoice_number', text)}
            placeholder="INV-001"
            required
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <DatePicker
                label="Invoice Date"
                value={formData.date}
                onChange={(date) => updateField('date', date)}
                placeholder="Select invoice date"
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
          
          <View style={{ gap: 4 }}>
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              Select Event
            </Text>
            <Pressable
              onPress={() => setShowEventModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                backgroundColor: theme.surface,
              }}
            >
              <Text style={[getTypographyStyle('sm', 'regular'), { color: selectedEvent?.name ? theme.text : theme.textSecondary }]}>
                {selectedEvent?.name || 'Tap to select event (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

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
                      {item.particulars}
                    </Text>
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      Qty: {item.quantity} × ₹{Number(item.unit_price || 0).toLocaleString('en-IN')} = ₹{Number(item.amount).toLocaleString('en-IN')}
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
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
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
                  GST (CGST {formData.cgst}% + SGST {formData.sgst}%)
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

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="CGST %"
                value={formData.cgst}
                onChangeText={(text: string) => updateField('cgst', text)}
                placeholder="9"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="SGST %"
                value={formData.sgst}
                onChangeText={(text: string) => updateField('sgst', text)}
                placeholder="9"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Additional Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Details (Optional)" />
          
          <FormInput
            label="Discount"
            value={String(formData.discount)}
            onChangeText={(text: string) => updateField('discount', Number(text) || 0)}
            placeholder="0"
            keyboardType="numeric"
            prefix="₹"
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
                  value={editingItem?.particulars || ''}
                  onChangeText={(text: string) => 
                    setEditingItem({ ...editingItem, particulars: text } as FormInvoiceItem)
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
                        setEditingItem({ ...editingItem, quantity: Number(text) || 0 } as FormInvoiceItem)
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
                        setEditingItem({ ...editingItem, unit_price: Number(text) || 0 } as FormInvoiceItem)
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

