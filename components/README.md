# Reusable Components Library

This document describes the reusable UI components available for building module screens in the Sarvagun app.

## Layout Components

### ModuleHeader
A reusable header component for module screens with back navigation, title, and action buttons.

**Props:**
- `title: string` - Header title text
- `onSearch?: () => void` - Optional search button handler
- `onFilter?: () => void` - Optional filter button handler
- `showBack?: boolean` - Show/hide back button (default: true)
- `rightActions?: React.ReactNode` - Optional custom right-side actions

**Features:**
- Automatic platform-specific padding (Android status bar, iOS safe area)
- Back button with router navigation
- Search and filter icon buttons
- Theme-aware styling with shadows and borders
- Customizable right-side action slot

**Usage:**
```tsx
import { ModuleHeader } from '@/components';

<ModuleHeader
  title="HR Management"
  onSearch={() => console.log('Search')}
  onFilter={() => console.log('Filter')}
/>
```

---

### TabBar
A horizontal scrolling tab bar with icon support and active state styling.

**Props:**
- `tabs: Tab[]` - Array of tab configurations
  - `Tab: { key: string, label: string, icon?: string }`
- `activeTab: string` - Currently active tab key
- `onTabChange: (key: string) => void` - Tab change handler

**Features:**
- Horizontal scrolling for many tabs
- Optional icon support (Ionicons)
- Active tab highlighted with primary color
- Smooth transitions and proper spacing
- Theme-aware colors

**Usage:**
```tsx
import { TabBar, Tab } from '@/components';

const tabs: Tab[] = [
  { key: 'staff', label: 'Staff', icon: 'people' },
  { key: 'leave', label: 'Leave', icon: 'calendar' },
];

<TabBar
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

---

## UI Components

### SearchBar
A reusable search input component with clear functionality.

**Props:**
- `placeholder?: string` - Placeholder text (default: "Search...")
- `onSearch?: (query: string) => void` - Search text change handler
- `onClear?: () => void` - Clear button handler
- `autoFocus?: boolean` - Auto-focus on mount (default: false)

**Features:**
- Search icon on the left
- Clear button (X) on the right (shown when text is entered)
- Border radius: 12px for modern look
- Theme-aware styling
- Controlled input with internal state management

**Usage:**
```tsx
import { SearchBar } from '@/components';

<SearchBar
  placeholder="Search staff..."
  onSearch={(query) => console.log(query)}
  autoFocus={true}
/>
```

---

### FloatingActionButton (FAB)
A material design-style floating action button for quick actions.

**Props:**
- `onPress: () => void` - Button press handler
- `icon?: string` - Ionicons icon name (default: "add")
- `color?: string` - Custom background color (default: theme.primary)
- `size?: number` - Button size in pixels (default: 60)

**Features:**
- Fixed bottom-right positioning
- Circular shape with proper border radius
- Shadow/elevation for floating effect
- Pressed state animation (scale + opacity)
- Platform-specific bottom offset (iOS: 100px, Android: 80px)
- Customizable icon and color

**Usage:**
```tsx
import { FloatingActionButton } from '@/components';

<FloatingActionButton
  onPress={() => router.push('/add-staff')}
  icon="add"
/>

// Custom icon and color
<FloatingActionButton
  onPress={() => router.push('/scan')}
  icon="qr-code"
  color="#8B5CF6"
/>
```

---

### StatusBadge
A color-coded status indicator component with auto-detection.

**Props:**
- `status: string` - Status text to display
- `type?: StatusType` - Optional explicit status type
  - `StatusType: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'draft'`

**Features:**
- Auto-detects status type from text if not provided
- Color-coded backgrounds and text:
  - **Pending**: Amber (#FFFBEB bg, #F59E0B text)
  - **Approved**: Green (#ECFDF5 bg, #10B981 text)
  - **Rejected**: Red (#FEE2E2 bg, #EF4444 text)
  - **Active**: Green (#ECFDF5 bg, #10B981 text)
  - **Inactive**: Gray (#F3F4F6 bg, #6B7280 text)
  - **Draft**: Gray (#F3F4F6 bg, #6B7280 text)
- Border radius: 12px
- Compact size with proper padding

**Usage:**
```tsx
import { StatusBadge } from '@/components';

// Auto-detect from text
<StatusBadge status="Pending" />
<StatusBadge status="Approved" />

// Explicit type
<StatusBadge status="Active" type="active" />

// In table column
{
  key: 'status',
  title: 'Status',
  render: (value) => <StatusBadge status={value} />
}
```

---

## Usage in Module Screens

All components follow a consistent pattern and can be used across all modules (HR, Events, Finance, Projects, Leave).

### Example: Complete Module Screen

```tsx
import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  ModuleHeader,
  TabBar,
  Tab,
  FloatingActionButton,
  StatusBadge,
  AppTable,
  TableColumn,
} from '@/components';

export default function ModuleScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('tab1');

  const tabs: Tab[] = [
    { key: 'tab1', label: 'Tab 1', icon: 'list' },
    { key: 'tab2', label: 'Tab 2', icon: 'grid' },
  ];

  const columns: TableColumn[] = [
    { key: 'name', title: 'Name', sortable: true },
    {
      key: 'status',
      title: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />

      <ModuleHeader
        title="Module Name"
        onSearch={() => console.log('Search')}
        onFilter={() => console.log('Filter')}
      />

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <AppTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        onRowPress={(row) => console.log(row)}
        searchable={true}
      />

      <FloatingActionButton
        onPress={() => router.push('/add')}
      />
    </View>
  );
}
```

---

## Design Principles

1. **Consistency**: All components follow the same design language
2. **Theme-aware**: Automatically adapt to light/dark mode
3. **Responsive**: Work across different screen sizes
4. **Accessible**: Proper touch targets and contrast ratios
5. **Reusable**: Can be used across all modules without modification
6. **Customizable**: Support optional props for specific needs

---

## Next Steps

1. Implement search and filter functionality in ModuleHeader
2. Add form components for add/edit screens
3. Create detail screen components (info cards, action buttons)
4. Build approval workflow components
5. Add empty state and loading components
