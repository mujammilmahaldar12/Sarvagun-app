import React, { useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppTable, { TableColumn } from '@/components/ui/AppTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useVendors, useDeleteVendor } from '@/hooks/useFinanceQueries';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { VendorRowData } from '@/types/finance';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface VendorsListProps {
  searchQuery?: string;
}

export default function VendorsList({ searchQuery = '' }: VendorsListProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;

  const { data: vendors = [], isLoading, error } = useVendors();
  const deleteVendor = useDeleteVendor();

  const processedVendors = useMemo(() => {
    let filtered = [...vendors];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(query) ||
          vendor.contact_person?.toLowerCase().includes(query) ||
          vendor.email?.toLowerCase().includes(query) ||
          vendor.phone?.toLowerCase().includes(query)
      );
    }

    // Transform to row data
    return filtered.map(
      (vendor): VendorRowData => ({
        id: vendor.id,
        name: vendor.name || 'N/A',
        contact_person: vendor.contact_person || 'N/A',
        email: vendor.email || 'N/A',
        phone: vendor.phone || 'N/A',
        address: vendor.address || 'N/A',
        gst_number: vendor.gst_number || 'N/A',
        pan_number: vendor.pan_number || 'N/A',
        bank_details: vendor.bank_details || 'N/A',
        created_by: vendor.created_by ? `${vendor.created_by.first_name} ${vendor.created_by.last_name}` : 'N/A',
      })
    );
  }, [vendors, searchQuery]);

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Vendor',
      'Are you sure you want to delete this vendor? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor.mutateAsync(id);
              Alert.alert('Success', 'Vendor deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete vendor');
            }
          },
        },
      ]
    );
  };

  const columns: TableColumn<VendorRowData>[] = [
    {
      key: 'name',
      title: 'Vendor Name',
      width: 180,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }} numberOfLines={1}>
          {row.name}
        </Text>
      ),
    },
    {
      key: 'contact_person',
      title: 'Contact Person',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={1}>
          {row.contact_person}
        </Text>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      width: 180,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }} numberOfLines={1}>
          {row.email}
        </Text>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      width: 120,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
          {row.phone}
        </Text>
      ),
    },
    {
      key: 'gst_number',
      title: 'GST Number',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }} numberOfLines={1}>
          {row.gst_number}
        </Text>
      ),
    },
    {
      key: 'pan_number',
      title: 'PAN Number',
      width: 120,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {row.pan_number}
        </Text>
      ),
    },
    {
      key: 'address',
      title: 'Address',
      width: 200,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }} numberOfLines={2}>
          {row.address}
        </Text>
      ),
    },
    {
      key: 'created_by',
      title: 'Created By',
      width: 130,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {row.created_by}
        </Text>
      ),
    },
  ];

  // Add actions column if user has permission
  if (canManage || canEdit || canDelete) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      width: 100,
      align: 'center',
      render: (row) => (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          {(canManage || canEdit) && (
            <Pressable
              onPress={() => router.push(`/(modules)/finance/add-vendor?id=${row.id}`)}
              style={{ padding: 4 }}
            >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </Pressable>
          )}
          {(canManage || canDelete) && (
            <Pressable
              onPress={() => handleDelete(row.id)}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
      ),
    });
  }

  if (isLoading) {
    return <LoadingState type="card" items={5} />;
  }

  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error Loading Vendors"
        description="Failed to load vendors. Please try again."
      />
    );
  }

  if (processedVendors.length === 0) {
    return (
      <EmptyState
        icon="people-outline"
        title="No Vendors Found"
        description={
          searchQuery
            ? 'No vendors match your search criteria. Try adjusting filters.'
            : 'Start by adding your first vendor.'
        }
      />
    );
  }

  return (
    <AppTable
      data={processedVendors}
      columns={columns}
      keyExtractor={(row) => row.id.toString()}
      onRowPress={(row) => router.push(`/(modules)/finance/vendor-detail?id=${row.id}`)}
      emptyMessage="No vendors to display"
    />
  );
}
