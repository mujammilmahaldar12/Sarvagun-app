# Local Activity Storage System

## Overview
This system stores recent user activities locally in the app using AsyncStorage. Activities are displayed on the home screen and are used to show users what actions they've performed recently.

## Why Local Storage?
- Backend doesn't have a dedicated activity tracking endpoint yet
- Activities are stored client-side for immediate feedback
- Section automatically hides when no activities are present

## Components

### 1. Activity Storage Service
Location: `services/activityStorage.service.ts`

Provides methods to:
- Add new activities
- Retrieve all/recent activities
- Clear activities
- Remove old activities
- Filter by activity type

### 2. Activity Tracker Hook
Location: `hooks/useActivityTracker.ts`

Provides convenient helper functions to track different types of activities:
```typescript
const {
  trackActivity,
  trackLeaveRequest,
  trackLeaveApproval,
  trackProjectUpdate,
  trackEventCreation,
  trackEventRegistration,
  trackFinanceRequest,
  trackHRAction,
} = useActivityTracker();
```

### 3. Home Screen Integration
Location: `app/(dashboard)/home.tsx`

- Loads activities from local storage
- Hides "Recent Activity" section if no activities exist
- Refreshes on pull-to-refresh

## How to Use

### Basic Usage
```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function YourComponent() {
  const { trackActivity } = useActivityTracker();
  
  const handleSomeAction = async () => {
    // ... your action logic
    
    // Track the activity
    await trackActivity({
      type: 'project',
      title: 'Project Created',
      description: 'New project started: Mobile App',
      related_id: projectId,
    });
  };
}
```

### Leave Request Example
```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function ApplyLeaveScreen() {
  const { trackLeaveRequest } = useActivityTracker();
  
  const submitLeave = async () => {
    // Submit leave to backend
    const response = await createLeave(leaveData);
    
    // Track activity
    await trackLeaveRequest(
      'Casual Leave',
      '2024-01-15',
      '2024-01-17',
      response.id
    );
  };
}
```

### Project Update Example
```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function ProjectDetailScreen() {
  const { trackProjectUpdate } = useActivityTracker();
  
  const updateProjectStatus = async () => {
    // Update project
    await updateProject({ status: 'In Progress', progress: 50 });
    
    // Track activity
    await trackProjectUpdate(
      'Mobile App Development',
      'In Progress',
      50,
      projectId
    );
  };
}
```

### Event Registration Example
```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function EventScreen() {
  const { trackEventRegistration } = useActivityTracker();
  
  const registerForEvent = async () => {
    // Register for event
    await registerEvent(eventId);
    
    // Track activity
    await trackEventRegistration(
      'Annual Company Meeting',
      '2024-12-15',
      eventId
    );
  };
}
```

### Finance Request Example
```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function FinanceRequestScreen() {
  const { trackFinanceRequest } = useActivityTracker();
  
  const submitExpense = async () => {
    // Submit expense
    const response = await createExpense(expenseData);
    
    // Track activity
    await trackFinanceRequest(
      'Travel Expense',
      5000,
      response.id
    );
  };
}
```

## Activity Types

Available activity types:
- `leave` - Leave requests and approvals
- `project` - Project updates and creations
- `event` - Event creations and registrations
- `finance` - Finance requests and approvals
- `hr` - HR actions (attendance, etc.)
- `other` - Any other activity type

## Activity Structure

```typescript
interface LocalActivity {
  id: string;              // Auto-generated
  type: 'leave' | 'project' | 'event' | 'finance' | 'hr' | 'other';
  title: string;           // Activity title (e.g., "Leave Request Submitted")
  description: string;     // Activity description (e.g., "Casual Leave for 2 days")
  timestamp: string;       // ISO date string (auto-generated)
  related_id?: string | number;  // Optional ID to link to related entity
  metadata?: any;          // Optional additional data
}
```

## Best Practices

1. **Track immediately after successful action**
   ```typescript
   onSuccess: async (data) => {
     await trackActivity({ ... });
   }
   ```

2. **Use descriptive titles and descriptions**
   ```typescript
   title: 'Leave Request Submitted',
   description: 'Casual Leave: Jan 15 - Jan 17',
   ```

3. **Include related_id when available**
   ```typescript
   related_id: response.id,  // Link to the entity
   ```

4. **Don't track on errors**
   - Only track successful actions
   - Users should only see completed activities

5. **Keep descriptions concise**
   - One line descriptions work best
   - Include key information only

## Implementation Checklist

When adding activity tracking to a new module:

- [ ] Import `useActivityTracker` hook
- [ ] Choose appropriate tracking method or use generic `trackActivity`
- [ ] Track after successful API response
- [ ] Include meaningful title and description
- [ ] Pass related_id when available
- [ ] Test that activity appears on home screen
- [ ] Verify activity navigation works (when tapping activity)

## Example: Complete Implementation

```typescript
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useCreateLeave } from '@/hooks/useHRQueries';

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { trackLeaveRequest } = useActivityTracker();
  const { mutate: createLeave } = useCreateLeave();
  
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('2024-01-15');
  const [toDate, setToDate] = useState('2024-01-17');
  
  const handleSubmit = () => {
    createLeave(
      {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: 'Personal work',
      },
      {
        onSuccess: async (data) => {
          // Track activity
          await trackLeaveRequest(
            leaveType,
            fromDate,
            toDate,
            data.id
          );
          
          Alert.alert('Success', 'Leave request submitted!');
          router.back();
        },
        onError: (error) => {
          Alert.alert('Error', 'Failed to submit leave request');
        },
      }
    );
  };
  
  return (
    // ... your UI
  );
}
```

## Maintenance

### Clearing Old Activities
Activities older than 30 days can be cleared automatically:
```typescript
import { activityStorage } from '@/services/activityStorage.service';

// Remove activities older than 30 days
await activityStorage.removeOldActivities(30);
```

### Manual Clear
```typescript
import { activityStorage } from '@/services/activityStorage.service';

// Clear all activities
await activityStorage.clearActivities();
```

## Future Enhancements

When backend activity tracking is available:
1. Sync local activities to backend
2. Fetch activities from backend API
3. Merge local and backend activities
4. Keep local storage as fallback/cache
