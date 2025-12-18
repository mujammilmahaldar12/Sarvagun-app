import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Platform, Alert, Modal, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { FormSection } from '@/components';
import { Button } from '@/components/core/Button';
import { DatePicker } from '@/components/core/DatePicker';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius } from '@/constants/designSystem';
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice
} from '@/hooks/useFinanceQueries';
import { useEvents, useClients } from '@/hooks/useEventsQueries';
import type { InvoiceItem } from '@/types/finance.d';
import type { Event, Client } from '@/types/events.d';

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
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(Number(id)); // checking useInvoice definition, it takes only id
  const { data: events = [] } = useEvents();
  const { data: clients = [] } = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  // Form state
  const [formData, setFormData] = useState({
    client: null as number | null,
    event: null as number | null,
    date: new Date(), // Changed to Date object
    total_amount: 0,
    discount: 0,
    final_amount: 0,
    cgst: '9',
    sgst: '9',
    notes: '',
  });

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null); // Using any due to Client type variations
  const [items, setItems] = useState<FormInvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [editingItem, setEditingItem] = useState<FormInvoiceItem | null>(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Load existing invoice data
  // Load existing invoice data - updated to handle event/client as IDs or objects
  useEffect(() => {
    if (invoice && isEditMode && events.length > 0 && clients.length > 0) {
      // Get event data - check if it's an object or ID
      let eventData = null;
      if (typeof invoice.event === 'object' && invoice.event) {
        eventData = invoice.event;
      } else if (typeof invoice.event === 'number') {
        // Find event in events list
        eventData = events.find((e: Event) => e.id === invoice.event) || null;
      }

      // Get client data - check if it's an object or ID
      let clientData = null;
      if (typeof invoice.client === 'object' && invoice.client) {
        clientData = invoice.client;
      } else if (typeof invoice.client === 'number') {
        // Find client in clients list
        clientData = clients.find((c: any) => c.id === invoice.client) || null;
      }

      setFormData({
        client: typeof invoice.client === 'number' ? invoice.client : invoice.client?.id || null,
        event: typeof invoice.event === 'number' ? invoice.event : invoice.event?.id || null,
        date: invoice.date ? new Date(invoice.date) : new Date(),
        total_amount: invoice.total_amount || 0,
        discount: invoice.discount || 0,
        final_amount: invoice.final_amount || 0,
        cgst: invoice.cgst || '9',
        sgst: invoice.sgst || '9',
        notes: (invoice as any).notes || '',
      });
      setSelectedEvent(eventData);
      setSelectedClient(clientData);

      // Convert InvoiceItem to FormInvoiceItem
      const formItems: FormInvoiceItem[] = (invoice.items || []).map(item => ({
        particulars: item.particulars,
        quantity: Number(item.quantity) || 1,
        unit_price: item.amount / (Number(item.quantity) || 1), // Calculate from amount/quantity
        amount: item.amount
      }));
      setItems(formItems);
    }
  }, [invoice, isEditMode, events, clients]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Filtered lists
  const filteredEvents = events.filter((event: Event) => {
    const clientName = typeof event.client === 'object' ? event.client?.name : '';
    return event.name?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      clientName?.toLowerCase().includes(eventSearch.toLowerCase());
  });

  const filteredClients = clients.filter((client: any) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    updateField('event', event.id);
    // Auto-fill client details from event
    if (event.client && typeof event.client === 'object') {
      setSelectedClient(event.client as Client);
      updateField('client', event.client.id);
    } else {
      // Event has no client object - user must select client manually
      setSelectedClient(null);
      updateField('client', null);
      if (event.client) {
        // Event has client ID but not object - shouldn't happen but handle it
        Alert.alert('Note', 'Please select the client for this invoice manually');
      }
    }
    setShowEventModal(false);
    setEventSearch('');
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    updateField('client', client.id);
    setShowClientModal(false);
    setSearchQuery('');
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
    // Only calculate GST if percentages are provided
    const cgstRate = Number(formData.cgst) || 0;
    const sgstRate = Number(formData.sgst) || 0;

    const cgst = (subtotal * cgstRate) / 100;
    const sgst = (subtotal * sgstRate) / 100;
    return cgst + sgst;
  }, [subtotal, formData.cgst, formData.sgst]);

  const totalAmount = useMemo(() => {
    return subtotal + gstAmount - (Number(formData.discount) || 0);
  }, [subtotal, gstAmount, formData.discount]);

  const handleSubmit = async () => {
    // Validation
    // Client can come from event or be manually selected
    const clientId = selectedEvent && typeof selectedEvent.client === 'object'
      ? selectedEvent.client.id
      : formData.client;

    if (!clientId) {
      Alert.alert('Error', 'Please select a client or an event with a client');
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
        // invoice_number is handled by backend
        client: clientId!, // Use computed clientId (from event or manual selection)
        event: formData.event || undefined, // Convert null to undefined for TS
        date: formData.date.toISOString().split('T')[0], // Ensure YYYY-MM-DD string
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
        notes: formData.notes, // Include notes if in state
      };

      if (isEditMode) {
        await updateInvoice.mutateAsync({ id: Number(id), data: invoiceData });
        Alert.alert('Success', 'Invoice updated successfully');
      } else {
        await createInvoice.mutateAsync(invoiceData);
        Alert.alert('Success', 'Invoice created successfully');
      }

      router.replace('/(modules)/finance');
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



  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={isEditMode ? 'Edit Invoice' : 'Create Invoice'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}>
        {/* Invoice Details */}
        <FormSection title="Invoice Details">
          {/* Invoice Number is Auto-generated, so we only show it in edit mode or hide it */}
          {isEditMode && invoice?.invoice_number && (
            <View style={{ opacity: 0.7 }}>
              <Input
                label="Invoice Number"
                value={invoice.invoice_number}
                onChangeText={() => { }}
                editable={false}
                placeholder="Auto-generated"
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <DatePicker
                label="Invoice Date"
                value={formData.date}
                onChange={(date) => updateField('date', date)}
                placeholder="Select invoice date"
              />
            </View>
          </View>
        </FormSection>

        {/* Event Selection (Primary - select event first to auto-populate client) */}
        <FormSection
          title="Event Linking"
          description="Select an event to auto-populate client details"
        >
          <Pressable
            onPress={() => setShowEventModal(true)}
            style={{ gap: spacing.xs }}
          >
            <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text }]}>
              Select Event
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: selectedEvent ? theme.primary : theme.border,
                borderRadius: borderRadius.md,
                backgroundColor: selectedEvent ? theme.primary + '10' : theme.surface,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[getTypographyStyle('sm', 'regular'), { color: selectedEvent?.name ? theme.text : theme.textSecondary }]}>
                  {selectedEvent?.name || 'Tap to select event'}
                </Text>
                {selectedEvent && (
                  <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, marginTop: 2 }]}>
                    {selectedEvent.start_date ? new Date(selectedEvent.start_date).toLocaleDateString() : ''}
                    {typeof selectedEvent.client === 'object' && selectedEvent.client?.name
                      ? ` • ${selectedEvent.client.name}`
                      : ''}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {selectedEvent && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedEvent(null);
                      updateField('event', null);
                      // Clear auto-populated client when event is removed
                      setSelectedClient(null);
                      updateField('client', null);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.error || '#EF4444'} />
                  </TouchableOpacity>
                )}
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </View>
            </View>
          </Pressable>
        </FormSection>

        {/* Client Information - Conditional based on event selection */}
        <FormSection title="Client Information">
          {selectedEvent && typeof selectedEvent.client === 'object' && selectedEvent.client ? (
            // Read-only display when client is derived from event
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                Client (from Event)
              </Text>
              <View
                style={{
                  padding: spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.surface,
                  opacity: 0.8,
                }}
              >
                <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>
                  {selectedEvent.client.name}
                </Text>
                {(selectedEvent.client.email || selectedEvent.client.number) && (
                  <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, marginTop: 2 }]}>
                    {selectedEvent.client.email || ''}{selectedEvent.client.email && selectedEvent.client.number ? ' • ' : ''}{selectedEvent.client.number || ''}
                  </Text>
                )}
              </View>
              <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, fontStyle: 'italic' }]}>
                Client is automatically set from the selected event
              </Text>
            </View>
          ) : (
            // Client selector when no event is selected or event has no client
            <Pressable
              onPress={() => setShowClientModal(true)}
              style={{ gap: spacing.xs }}
            >
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                Client Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: theme.surface,
                }}
              >
                <Text style={[getTypographyStyle('sm', 'regular'), { color: selectedClient?.name ? theme.text : theme.textSecondary }]}>
                  {selectedClient?.name || 'Select Client'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </View>
              {!selectedEvent && (
                <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                  Or select an event above to auto-populate client
                </Text>
              )}
            </Pressable>
          )}
        </FormSection>

        {/* Invoice Items */}
        <FormSection title="Invoice Items" description="Add products or services">
          <Button
            title="Add Item"
            onPress={handleAddItem}
            variant="secondary"
            fullWidth
            leftIcon="add-circle-outline"
          />

          {items.length > 0 && (
            <View style={{ gap: spacing.xs }}>
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                      {item.particulars}
                    </Text>
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      Qty: {item.quantity} × ₹{Number(item.unit_price || 0).toLocaleString('en-IN')} = ₹{Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
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
              padding: spacing.md,
              backgroundColor: theme.surface,
              borderRadius: borderRadius.lg,
              gap: spacing.sm,
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

              {Number(formData.discount) > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                    Discount
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: '#EF4444' }}>
                    - ₹{Number(formData.discount).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

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

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="CGST %"
                value={formData.cgst}
                onChangeText={(text: string) => updateField('cgst', text)}
                placeholder="9"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="SGST %"
                value={formData.sgst}
                onChangeText={(text: string) => updateField('sgst', text)}
                placeholder="9"
                keyboardType="numeric"
              />
            </View>
          </View>
        </FormSection>

        {/* Additional Details */}
        <FormSection title="Additional Details (Optional)">
          <Input
            label="Discount"
            value={String(formData.discount)}
            onChangeText={(text: string) => updateField('discount', Number(text) || 0)}
            placeholder="0"
            keyboardType="numeric"
          />

          <Input
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={3}
          />
        </FormSection>

        {/* Submit Button */}
        <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: '90%',
            overflow: 'hidden'
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Select Event</Text>
            </View>

            <View style={{ padding: 16 }}>
              <Input
                label=""
                placeholder="Search events..."
                value={eventSearch}
                onChangeText={setEventSearch}
                leftIcon="search"
              />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
              {filteredEvents.map((event: any) => (
                <TouchableOpacity
                  key={event.id}
                  style={{
                    backgroundColor: theme.surface,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: formData.event === event.id ? theme.primary : theme.border,
                  }}
                  onPress={() => handleSelectEvent(event)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 4 }}>
                        {event.name}
                      </Text>
                      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date'}
                      </Text>
                      {/* Finance Info */}
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <View style={{ backgroundColor: theme.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                            Budget: ₹{event.total_budget?.toLocaleString() || '0'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {formData.event === event.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Client Selection Modal */}
      <Modal
        visible={showClientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: '90%',
            overflow: 'hidden'
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>Select Client</Text>
            </View>

            <View style={{ padding: 16 }}>
              <Input
                label=""
                placeholder="Search clients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon="search"
              />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
              {filteredClients.map((client: any) => (
                <TouchableOpacity
                  key={client.id}
                  style={{
                    backgroundColor: theme.surface,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: formData.client === client.id ? theme.primary : theme.border,
                  }}
                  onPress={() => handleSelectClient(client)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 4 }}>
                        {client.name}
                      </Text>
                      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                        {client.email || 'No email'} • {client.phone || 'No phone'}
                      </Text>
                    </View>
                    {formData.client === client.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={showItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '90%',
              overflow: 'hidden'
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ ...getTypographyStyle('lg', 'semibold'), color: theme.text }}>
                {editingIndex >= 0 ? 'Edit' : 'Add'} Invoice Item
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              <Input
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
                  <Input
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
                  <Input
                    label="Unit Price"
                    value={String(editingItem?.unit_price || '')}
                    onChangeText={(text: string) =>
                      setEditingItem({ ...editingItem, unit_price: Number(text) || 0 } as FormInvoiceItem)
                    }
                    placeholder="0"
                    keyboardType="numeric"
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

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 }}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                    setEditingIndex(-1);
                  }}
                  variant="secondary" // Removed fullWidth from secondary variant based on typical patterns or keeping it if valid, keeping fullWidth prop for Layout
                  fullWidth
                />
                <Button
                  title={editingIndex >= 0 ? 'Update' : 'Add'}
                  onPress={handleSaveItem}
                  fullWidth
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

