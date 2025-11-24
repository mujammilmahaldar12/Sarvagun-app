import React, { useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn } from '@/components';
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

    // Apply search filter - match backend field names
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(query) ||
          vendor.contact_number?.toLowerCase().includes(query) ||
          vendor.email?.toLowerCase().includes(query)
      );
    }

    // Transform to row data - map vendor fields to match backend schema
    return filtered.map((vendor): VendorRowData => ({
      id: vendor.id || 0,
      name: vendor.name || '-',
      organization_name: vendor.organization_name || '-',
      category: vendor.category || '-',
      contact_number: vendor.contact_number || '-',
      email: vendor.email || '-',
    }));
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
      key: 'organization_name',
      title: 'Organization',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={1}>
          {row.organization_name}
        </Text>
      ),
    },
    {
      key: 'contact_number',
      title: 'Contact Number',
      width: 130,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
          {row.contact_number}
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
      key: 'category',
      title: 'Category',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {row.category}
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
    <Table
      data={processedVendors}
      columns={columns}
      keyExtractor={(row) => row.id.toString()}
      onRowPress={(row) => router.push(`/(modules)/finance/vendor-detail?id=${row.id}`)}
      emptyMessage="No vendors to display"
    />
  );
}
