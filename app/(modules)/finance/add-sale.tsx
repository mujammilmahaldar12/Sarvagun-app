import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque'];
const PAYMENT_TERMS = ['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'];

export default function AddSaleScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    // Customer Information
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    
    // Product/Service Details
    productService: '',
    description: '',
    quantity: '1',
    unitPrice: '',
    
    // Financial Details
    amount: '',
    taxRate: '18',
    taxAmount: '',
    totalAmount: '',
    
    // Invoice Details
    invoiceDate: '',
    dueDate: '',
    paymentTerms: '',
    paymentMethod: '',
    
    // Additional Details
    notes: '',
  });

  const [documents, setDocuments] = useState<any[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Auto-calculate amounts
    if (field === 'amount' || field === 'taxRate') {
      const amount = parseFloat(field === 'amount' ? value : formData.amount) || 0;
      const taxRate = parseFloat(field === 'taxRate' ? value : formData.taxRate) || 0;
      const taxAmount = (amount * taxRate) / 100;
      const totalAmount = amount + taxAmount;
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      }));
    }
  };

  const calculateFromUnitPrice = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const amount = quantity * unitPrice;
    
    updateField('amount', amount.toString());
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
    if (!formData.customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!formData.productService.trim()) {
      Alert.alert('Error', 'Please enter product/service name');
      return;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }
    if (!formData.invoiceDate.trim()) {
      Alert.alert('Error', 'Please enter invoice date');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Submit logic here
    console.log('Submitting sale:', formData);
    Alert.alert('Success', 'Sale created successfully', [
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
    suffix,
    required = false,
    editable = true,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
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
          editable={editable}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 28 : 12,
            paddingRight: suffix ? 40 : 12,
            fontSize: 14,
            color: theme.colors.text,
            backgroundColor: editable ? theme.colors.surface : '#9CA3AF' + '20',
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 44,
          }}
        />
        {suffix && (
          <Text style={{
            position: 'absolute',
            right: 12,
            fontSize: 14,
            color: theme.colors.textSecondary,
          }}>
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );

  const SelectInput = ({ label, value, options, onSelect, required = false }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
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
              borderColor: value === option ? theme.colors.primary : theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.primary + '10'
                : value === option
                ? theme.colors.primary + '20'
                : theme.colors.surface,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                color: value === option ? theme.colors.primary : theme.colors.text,
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
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader
        title="Create Sale"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Customer Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Customer Information" />
          <FormInput
            label="Customer Name"
            value={formData.customerName}
            onChangeText={(text: string) => updateField('customerName', text)}
            placeholder="Enter customer name"
            required
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Email"
                value={formData.customerEmail}
                onChangeText={(text: string) => updateField('customerEmail', text)}
                placeholder="email@example.com"
                keyboardType="email-address"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Phone"
                value={formData.customerPhone}
                onChangeText={(text: string) => updateField('customerPhone', text)}
                placeholder="1234567890"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <FormInput
            label="Address"
            value={formData.customerAddress}
            onChangeText={(text: string) => updateField('customerAddress', text)}
            placeholder="Enter customer address"
            multiline
          />
        </View>

        {/* Product/Service Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Product/Service Details" />
          <FormInput
            label="Product/Service Name"
            value={formData.productService}
            onChangeText={(text: string) => updateField('productService', text)}
            placeholder="Enter product or service name"
            required
          />
          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(text: string) => updateField('description', text)}
            placeholder="Enter description"
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Quantity"
                value={formData.quantity}
                onChangeText={(text: string) => {
                  updateField('quantity', text);
                  calculateFromUnitPrice();
                }}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Unit Price"
                value={formData.unitPrice}
                onChangeText={(text: string) => {
                  updateField('unitPrice', text);
                  calculateFromUnitPrice();
                }}
                placeholder="0"
                keyboardType="numeric"
                prefix="₹"
              />
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Financial Details" />
          <FormInput
            label="Amount"
            value={formData.amount}
            onChangeText={(text: string) => updateField('amount', text)}
            placeholder="0"
            keyboardType="numeric"
            prefix="₹"
            required
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Tax Rate"
                value={formData.taxRate}
                onChangeText={(text: string) => updateField('taxRate', text)}
                placeholder="18"
                keyboardType="numeric"
                suffix="%"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Tax Amount"
                value={formData.taxAmount}
                onChangeText={(text: string) => {}}
                placeholder="0"
                keyboardType="numeric"
                prefix="₹"
                editable={false}
              />
            </View>
          </View>
          <View style={{
            padding: 16,
            backgroundColor: theme.colors.primary + '20',
            borderRadius: 8,
            borderWidth: 2,
            borderColor: theme.colors.primary,
          }}>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 }}>
              Total Amount
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
              ₹{formData.totalAmount || '0'}
            </Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Invoice Details" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Invoice Date"
                value={formData.invoiceDate}
                onChangeText={(text: string) => updateField('invoiceDate', text)}
                placeholder="DD-MM-YYYY"
                required
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Due Date"
                value={formData.dueDate}
                onChangeText={(text: string) => updateField('dueDate', text)}
                placeholder="DD-MM-YYYY"
              />
            </View>
          </View>
          <SelectInput
            label="Payment Terms"
            value={formData.paymentTerms}
            options={PAYMENT_TERMS}
            onSelect={(value: string) => updateField('paymentTerms', value)}
          />
          <SelectInput
            label="Payment Method"
            value={formData.paymentMethod}
            options={PAYMENT_METHODS}
            onSelect={(value: string) => updateField('paymentMethod', value)}
          />
        </View>

        {/* Additional Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Details" />
          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes or terms"
            multiline
          />
        </View>

        {/* Documents */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Supporting Documents" />
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
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="document" size={20} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text, fontSize: 14, flex: 1 }}>
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
            title="Create Invoice"
            onPress={handleSubmit}
            fullWidth
            size="lg"
            leftIcon="document-text"
          />
        </View>
      </ScrollView>
    </View>
  );
}
