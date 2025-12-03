/**
 * 🎯 COMPONENT USAGE EXAMPLES
 * 
 * Real-world examples of using the Sarvagun Component Library
 * Copy and adapt these patterns for your module
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  KPICard,
  EmptyState,
  LoadingState,
  ActionSheet,
  Table,
  StatusBadge,
  Button,
} from '@/components';
import { spacing } from '@/constants/designSystem';

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 1: Dashboard with KPI Cards
// ═══════════════════════════════════════════════════════════════════

export function DashboardExample() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        {/* Total Count KPI */}
        <KPICard
          title="Total Events"
          value={142}
          icon="calendar"
          color="#6366f1"
          trend={{ value: 12, direction: 'up', label: 'vs last month' }}
          onPress={() => router.push('/events')}
        />

        {/* Revenue KPI */}
        <KPICard
          title="Total Revenue"
          value="₹42.5L"
          icon="cash"
          color="#10b981"
          trend={{ value: 8, direction: 'up' }}
          subtitle="This quarter"
        />

        {/* Conversion Rate KPI */}
        <KPICard
          title="Conversion Rate"
          value="68%"
          icon="trending-up"
          color="#f59e0b"
          trend={{ value: -3, direction: 'down' }}
        />

        {/* Loading State KPI */}
        <KPICard
          title="Active Leads"
          value={0}
          icon="people"
          color="#8b5cf6"
          loading
        />
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 2: Data Table with Actions
// ═══════════════════════════════════════════════════════════════════

export function TableExample() {
  const [data, setData] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
  ]);

  const columns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      keyExtractor={(item) => item.id.toString()}
      searchable
      sortable
      onRowPress={(item) => router.push(`/details/${item.id}`)}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 3: Empty State with Action
// ═══════════════════════════════════════════════════════════════════

export function EmptyStateExample() {
  return (
    <EmptyState
      icon="folder-open-outline"
      title="No events found"
      subtitle="Create your first event to get started with event management"
      action={{
        label: 'Create Event',
        icon: 'add',
        onPress: () => router.push('/events/add'),
      }}
      secondaryAction={{
        label: 'Import Events',
        onPress: () => router.push('/events/import'),
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 4: Loading States
// ═══════════════════════════════════════════════════════════════════

export function LoadingExample() {
  return (
    <View style={styles.container}>
      {/* Spinner Loader */}
      <LoadingState
        message="Loading events..."
        variant="spinner"
        size="large"
      />

      {/* Skeleton Loader */}
      <LoadingState
        variant="skeleton"
        skeletonCount={5}
      />

      {/* Shimmer Loader */}
      <LoadingState
        variant="shimmer"
        skeletonCount={3}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 5: Action Sheet
// ═══════════════════════════════════════════════════════════════════

export function ActionSheetExample() {
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    console.log('Edit action');
  };

  const handleDelete = () => {
    console.log('Delete action');
  };

  return (
    <View style={styles.container}>
      <Button
        title="Show Actions"
        onPress={() => setShowActions(true)}
      />

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title="Event Actions"
        subtitle="Choose an action for this event"
        actions={[
          {
            label: 'Edit Event',
            icon: 'create-outline',
            onPress: handleEdit,
          },
          {
            label: 'Duplicate Event',
            icon: 'copy-outline',
            onPress: () => console.log('Duplicate'),
          },
          {
            label: 'Share Event',
            icon: 'share-outline',
            onPress: () => console.log('Share'),
          },
          {
            label: 'Delete Event',
            icon: 'trash-outline',
            onPress: handleDelete,
            destructive: true,
          },
        ]}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 6: Complete List Screen Pattern
// ═══════════════════════════════════════════════════════════════════

export function CompleteListScreenExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Simulate data loading
  React.useEffect(() => {
    setTimeout(() => {
      setData([
        { id: 1, name: 'Event 1', status: 'completed' },
        { id: 2, name: 'Event 2', status: 'pending' },
      ]);
      setLoading(false);
    }, 1500);
  }, []);

  // Show loading state
  if (loading) {
    return <LoadingState variant="skeleton" skeletonCount={5} />;
  }

  // Show empty state
  if (data.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="No events yet"
        subtitle="Start by creating your first event"
        action={{
          label: 'Add Event',
          icon: 'add',
          onPress: () => router.push('/events/add'),
        }}
      />
    );
  }

  // Show data with action sheet
  return (
    <View style={styles.container}>
      <Table
        columns={[
          { key: 'name', title: 'Name', sortable: true },
          {
            key: 'status',
            title: 'Status',
            render: (value) => <StatusBadge status={value} />,
          },
        ]}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        onRowPress={(item) => {
          setSelectedItem(item);
          setShowActions(true);
        }}
      />

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title={selectedItem?.name}
        actions={[
          {
            label: 'View Details',
            icon: 'eye-outline',
            onPress: () => router.push(`/events/${selectedItem?.id}`),
          },
          {
            label: 'Edit',
            icon: 'create-outline',
            onPress: () => router.push(`/events/edit/${selectedItem?.id}`),
          },
          {
            label: 'Delete',
            icon: 'trash-outline',
            onPress: () => console.log('Delete'),
            destructive: true,
          },
        ]}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 7: Responsive KPI Grid
// ═══════════════════════════════════════════════════════════════════

export function ResponsiveKPIGrid() {
  const kpiData = [
    { title: 'Total Events', value: 142, icon: 'calendar', color: '#6366f1' },
    { title: 'Active Leads', value: 28, icon: 'people', color: '#8b5cf6' },
    { title: 'Revenue', value: '₹42.5L', icon: 'cash', color: '#10b981' },
    { title: 'Conversion', value: '68%', icon: 'trending-up', color: '#f59e0b' },
  ];

  return (
    <View style={styles.kpiGrid}>
      {kpiData.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon as any}
          color={kpi.color}
        />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  kpiGrid: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
