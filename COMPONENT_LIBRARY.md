/**
 * 📚 SARVAGUN MOBILE APP - REUSABLE COMPONENT LIBRARY
 * 
 * Comprehensive guide for building consistent, modern UI components
 * across all modules (Events, HR, Finance, Projects, etc.)
 * 
 * Last Updated: December 2, 2025
 * Version: 2.0
 */

# 🎨 Design System Overview

## Color System
```typescript
// Located in: constants/designSystem.ts
import { baseColors, spacing, typography, borderRadius } from '@/constants/designSystem';

// Primary Colors
baseColors.purple[500]   // #6366f1 - Primary actions
baseColors.green[500]    // #10b981 - Success states
baseColors.red[500]      // #ef4444 - Errors & destructive
baseColors.yellow[500]   // #fbbf24 - Warnings
baseColors.blue[500]     // #3b82f6 - Info

// Neutral Colors
baseColors.neutral[50]   // #f9fafb - Background
baseColors.neutral[100]  // #f3f4f6 - Cards
baseColors.neutral[900]  // #1f2937 - Text
```

## Spacing Scale
```typescript
spacing.xs   // 4px  - Tight spacing
spacing.sm   // 8px  - Default gap
spacing.md   // 12px - Section padding
spacing.lg   // 16px - Card padding
spacing.xl   // 24px - Screen margins
```

---

# 📦 Core Components

## 1. DataTable Component

**Location:** `components/core/Table.tsx`

**Usage:**
```tsx
import { Table } from '@/components';

<Table
  columns={[
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', filterable: true },
    { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  ]}
  data={items}
  keyExtractor={(item) => item.id}
  searchable
  sortable
  onRowPress={(item) => handleRowPress(item)}
/>
```

**Features:**
- ✅ Sorting (ascending/descending)
- ✅ Search/filtering
- ✅ Row selection
- ✅ Custom cell rendering
- ✅ Virtualization for large datasets
- ✅ Sticky headers
- ✅ Export to CSV/Excel

**When to use:**
- List views (employees, events, clients, vendors)
- Data grids with multiple columns
- Reports and analytics tables

---

## 2. StatusBadge Component

**Location:** `components/ui/StatusBadge.tsx`

**Usage:**
```tsx
import { StatusBadge } from '@/components';

<StatusBadge status="completed" />
<StatusBadge status="pending" variant="subtle" />
<StatusBadge status="rejected" size="sm" />
```

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'cancelled' | 'approved' | 'rejected' | string;
  variant?: 'solid' | 'subtle' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  customColors?: { background: string; text: string };
}
```

**Color Mapping:**
```typescript
'completed' | 'approved' | 'active'     → Green
'pending' | 'in-progress' | 'ongoing'   → Yellow
'cancelled' | 'rejected' | 'inactive'   → Red
'scheduled' | 'draft'                   → Blue
```

**When to use:**
- Display entity states (event status, leave approval, payment status)
- Workflow indicators
- Active/inactive toggles

---

## 3. KPICard Component

**Location:** `components/core/KPICard.tsx` (Create new)

**Usage:**
```tsx
<KPICard
  title="Total Events"
  value={142}
  trend={{ value: 12, direction: 'up' }}
  icon="calendar"
  color="#6366f1"
  onPress={() => router.push('/events')}
/>
```

**Props:**
```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  loading?: boolean;
  onPress?: () => void;
}
```

**When to use:**
- Dashboard analytics
- Module overview screens
- Statistics displays
- Performance metrics

---

## 4. FilterBar Component

**Location:** `components/core/FilterBar.tsx` (Create new)

**Usage:**
```tsx
<FilterBar
  filters={[
    { key: 'status', label: 'Status', type: 'select', options: statusOptions },
    { key: 'date', label: 'Date Range', type: 'dateRange' },
    { key: 'category', label: 'Category', type: 'multiSelect', options: categories },
  ]}
  activeFilters={filters}
  onChange={(key, value) => handleFilterChange(key, value)}
  onClear={() => clearFilters()}
/>
```

**Filter Types:**
- `select` - Single selection dropdown
- `multiSelect` - Multi-selection chips
- `dateRange` - Start and end date picker
- `search` - Text search input
- `toggle` - Boolean on/off

**When to use:**
- List filtering (events, employees, expenses)
- Advanced search interfaces
- Report parameter selection

---

## 5. ActionSheet Component

**Location:** `components/core/ActionSheet.tsx` (Create new)

**Usage:**
```tsx
<ActionSheet
  visible={showActions}
  onClose={() => setShowActions(false)}
  title="Event Actions"
  actions={[
    { label: 'Edit', icon: 'create-outline', onPress: handleEdit },
    { label: 'Assign Vendors', icon: 'people', onPress: openVendors },
    { label: 'Delete', icon: 'trash', onPress: handleDelete, destructive: true },
  ]}
/>
```

**Props:**
```typescript
interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    destructive?: boolean;
    disabled?: boolean;
  }>;
}
```

**When to use:**
- Context menus
- Bulk actions
- Row action menus
- Long-press options

---

## 6. EmptyState Component

**Location:** `components/core/EmptyState.tsx` (Create new)

**Usage:**
```tsx
<EmptyState
  icon="calendar-outline"
  title="No events found"
  subtitle="Create your first event to get started"
  action={{
    label: 'Add Event',
    onPress: () => router.push('/events/add'),
  }}
/>
```

**When to use:**
- Empty lists
- No search results
- First-time user experiences
- Error states

---

## 7. LoadingState Component

**Location:** `components/core/LoadingState.tsx` (Create new)

**Usage:**
```tsx
<LoadingState
  message="Loading events..."
  variant="spinner" | "skeleton" | "shimmer"
/>
```

**Variants:**
- `spinner` - Circular activity indicator
- `skeleton` - Content placeholders (cards, lists)
- `shimmer` - Animated shimmer effect

**When to use:**
- Data fetching states
- Screen transitions
- Optimistic UI updates

---

# 🎯 Module-Specific Components

## Events Module Components

### EventCard
**Location:** `app/(modules)/events/components/EventCard.tsx`

```tsx
<EventCard
  event={eventData}
  onPress={() => router.push(`/events/${event.id}`)}
  onEdit={() => handleEdit(event)}
  onDelete={() => handleDelete(event)}
/>
```

### LeadCard
**Location:** `app/(modules)/events/components/LeadCard.tsx`

### VendorCard
**Location:** `app/(modules)/events/components/VendorCard.tsx`

---

# 🔧 Utility Components

## FormField
**Location:** `components/ui/FormField.tsx`

```tsx
<FormField
  label="Event Name"
  value={name}
  onChangeText={setName}
  placeholder="Enter event name"
  error={errors.name}
  required
/>
```

## FormSection
**Location:** `components/ui/FormSection.tsx`

```tsx
<FormSection title="Event Information">
  <FormField label="Name" {...} />
  <FormField label="Date" {...} />
</FormSection>
```

---

# 📱 Layout Patterns

## Screen Structure Template

```tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';

export default function MyModuleScreen() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header with actions */}
      <ModuleHeader
        title="My Module"
        showBack
        onBack={() => router.back()}
        rightActions={<HeaderActions />}
      />

      {/* Tabs (optional) */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Your content here */}
      </ScrollView>

      {/* FAB for primary action */}
      <FAB
        icon="add"
        onPress={handleAdd}
        position="bottom-right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flex: 1, padding: 16 },
});
```

---

# 🎨 Component Styling Best Practices

## 1. Use Design Tokens
```tsx
// ✅ Good
import { spacing, borderRadius, baseColors } from '@/constants/designSystem';

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: baseColors.neutral[100],
  },
});

// ❌ Bad - Magic numbers
const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
});
```

## 2. Responsive Sizing
```tsx
import { getResponsiveSize } from '@/utils/responsive';

const styles = StyleSheet.create({
  title: {
    fontSize: getResponsiveSize(18),
    lineHeight: getResponsiveSize(24),
  },
});
```

## 3. Theme-Aware Styling
```tsx
const { theme } = useTheme();

<Text style={[styles.text, { color: theme.text }]}>
  Hello World
</Text>
```

---

# 🚀 Animation Patterns

## Fade In Animation
```tsx
import Animated, { FadeIn } from 'react-native-reanimated';

<Animated.View entering={FadeIn.duration(300)}>
  <MyComponent />
</Animated.View>
```

## Slide In Animation
```tsx
import { SlideInDown } from 'react-native-reanimated';

<Animated.View entering={SlideInDown.springify()}>
  <Modal />
</Animated.View>
```

## Micro-interactions
```tsx
const scaleAnim = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scaleAnim.value }],
}));

const handlePress = () => {
  scaleAnim.value = withSpring(0.95, {}, () => {
    scaleAnim.value = withSpring(1);
  });
};
```

---

# 📊 Data Fetching Patterns

## Using React Query
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsService from '@/services/events.service';

// Fetch data
const { data, isLoading, refetch } = useQuery({
  queryKey: ['events'],
  queryFn: () => eventsService.getEvents(),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (data) => eventsService.createEvent(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    Alert.alert('Success', 'Event created');
  },
});
```

## Optimistic Updates
```tsx
const updateMutation = useMutation({
  mutationFn: eventsService.updateEvent,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['events'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['events']);
    
    // Optimistically update
    queryClient.setQueryData(['events'], (old) => 
      old.map((item) => item.id === newData.id ? newData : item)
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['events'], context.previous);
  },
});
```

---

# 🔍 Search & Filter Patterns

## Debounced Search
```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchData({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

## Multi-Filter State
```tsx
const [filters, setFilters] = useState({
  status: 'all',
  category: undefined,
  dateRange: { start: null, end: null },
});

const updateFilter = (key, value) => {
  setFilters((prev) => ({ ...prev, [key]: value }));
};

const filteredData = useMemo(() => {
  return data.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.category && item.category !== filters.category) return false;
    // ... more filters
    return true;
  });
}, [data, filters]);
```

---

# 📝 Form Patterns

## Form Validation with Zod
```tsx
import { z } from 'zod';

const eventSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  date: z.date(),
  venue: z.string(),
  budget: z.number().positive(),
});

// In component
const [errors, setErrors] = useState({});

const handleSubmit = () => {
  try {
    eventSchema.parse(formData);
    // Submit data
  } catch (error) {
    setErrors(error.flatten().fieldErrors);
  }
};
```

---

# 🎯 Module Migration Checklist

When migrating a module to the new component system:

- [ ] Replace custom buttons with unified `Button` component
- [ ] Use `Table` component for all list views
- [ ] Implement `StatusBadge` for status displays
- [ ] Add `KPICard` components to dashboard
- [ ] Use `FilterBar` for advanced filtering
- [ ] Add `EmptyState` for empty lists
- [ ] Implement `LoadingState` for async operations
- [ ] Use `ActionSheet` for context menus
- [ ] Extract module-specific components to `/components` folder
- [ ] Document component props with TypeScript interfaces
- [ ] Add PropTypes or TypeScript for validation
- [ ] Implement proper error boundaries
- [ ] Add accessibility labels (accessibilityLabel, accessibilityHint)

---

# 🤝 Component Development Guidelines

## 1. Component Structure
```tsx
/**
 * ComponentName
 * Brief description of what the component does
 */
import React from 'react';
import { View, Text } from 'react-native';

interface ComponentNameProps {
  // Props with JSDoc comments
  /** The title to display */
  title: string;
  /** Optional callback when pressed */
  onPress?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onPress,
}) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};
```

## 2. Export Pattern
```tsx
// components/core/ComponentName.tsx
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';

// components/index.tsx
export { ComponentName } from './core/ComponentName';
export type { ComponentNameProps } from './core/ComponentName';
```

## 3. Testing Pattern
```tsx
// ComponentName.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ComponentName title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ComponentName title="Test" onPress={onPress} />
    );
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

# 📚 Additional Resources

- **Design System:** `/constants/designSystem.ts`
- **Theme Provider:** `/store/themeStore.tsx`
- **Typography Utils:** `/utils/styleHelpers.ts`
- **Animation Presets:** `/utils/animations.ts`
- **Responsive Utils:** `/utils/responsive.ts`
- **Formatters:** `/utils/formatters.ts`

---

**For questions or component requests, contact the development team.**
