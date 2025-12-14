import React, { useMemo, useState } from 'react';
import { View, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Table, Badge, FAB, LoadingState } from '@/components';
import ActionButton from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useVendors } from '@/hooks/useFinanceQueries';
import { designSystem } from '@/constants/designSystem';
import type { Vendor } from '@/types/finance';

interface VendorsListProps {
  searchQuery?: string;
  selectedCategory?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: React.ReactNode;
}

const VendorsList: React.FC<VendorsListProps> = ({
  searchQuery = '',
  selectedCategory,
  refreshing = false,
  onRefresh,
  headerComponent,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  // Fetch vendors using the hook
  const {
    data: vendorsData,
    isLoading,
    error,
    refetch,
  } = useVendors({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  // Extract vendors array from paginated response
  const vendors = useMemo(() => {
    if (!vendorsData) return [];
    // Handle both array and paginated response
    if (Array.isArray(vendorsData)) return vendorsData;
    if ((vendorsData as any)?.results) return (vendorsData as any).results;
    return [];
  }, [vendorsData]);

  // Filter client-side if needed (though API supports it)
  const processedVendors = useMemo(() => {
    if (!Array.isArray(vendors)) return [];

    // Additional filtering if API doesn't handle everything perfectly
    let filtered = [...vendors];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(lowerQuery) ||
        v.organization_name?.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    return filtered;
  }, [vendors, searchQuery, selectedCategory]);

  const handleEditVendor = (id: number) => {
    router.push(`/(modules)/finance/add-vendor?id=${id}` as any);
  };

  const handleDeleteVendor = async (id: number) => {
    // Implement delete logic with confirmation if needed
    // or just navigate to details
  };

  const columns = [
    {
      key: 'name',
      title: 'Vendor Name',
      width: 150,
      sortable: true,
      render: (value: string, row: Vendor) => (
        <View>
          <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
            {row.name}
          </Text>
          <Text style={{ fontSize: designSystem.typography.sizes.xs, color: theme.textSecondary }}>
            {row.organization_name}
          </Text>
        </View>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      width: 120,
      sortable: true,
      render: (value: string) => (
        <Badge
          label={value}
          size="sm"
        />
      ),
    },
    {
      key: 'contact_number',
      title: 'Contact',
      width: 120,
      render: (value: string) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, color: theme.textSecondary }}>
          {value || 'N/A'}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 80,
      render: (_: any, row: Vendor) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton
            icon="create-outline"
            title="Edit"
            onPress={() => handleEditVendor(row.id)}
            variant="secondary"
            size="small"
          />
        </View>
      )
    }
  ];

  if (isLoading && !refreshing && !vendors.length) {
    return <LoadingState message="Loading vendors..." variant="skeleton" skeletonCount={5} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Vendors"
          description={(error as any)?.message || "Failed to load vendors"}
          actionTitle="Retry"
          onActionPress={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Table
        data={processedVendors}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        emptyMessage="No vendors found"
        searchable={false} // Search is handled by parent/header
        ListHeaderComponent={headerComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={() => {
              onRefresh?.();
              refetch();
            }}
            colors={[theme.primary]}
          />
        }
      />


    </View>
  );
};

export default VendorsList;
