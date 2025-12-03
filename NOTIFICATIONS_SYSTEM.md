# Notification System Implementation

## Overview
This notification system provides real-time notifications for event conversions and admin access controls within the Sarvagun app.

## Features

### 1. **Notification Bell Component** 
Location: `components/layout/NotificationBell.tsx`

- Displays a bell icon with unread notification count badge
- Auto-refreshes every 30 seconds
- Shows filled bell icon when there are unread notifications
- Navigates to notifications screen on press

**Props:**
- `size?: number` - Icon size (default: 24)
- `color?: string` - Icon color (defaults to theme text color)

### 2. **Notifications Screen**
Location: `app/(modules)/notifications/index.tsx`

Features:
- Lists all notifications with filtering (All / Unread)
- Pull-to-refresh functionality
- Mark individual notifications as read on tap
- Mark all notifications as read with header button
- Priority-based color coding (low, medium, high, urgent)
- Time ago display for each notification
- Navigation to related content via notification URLs

### 3. **Notification Service**
Location: `services/notifications.service.ts`

**Key Methods:**
- `getNotifications()` - Fetch all notifications
- `getUnreadNotifications()` - Fetch only unread
- `getUnreadCount()` - Get count of unread notifications
- `getNotificationSummary()` - Get dashboard summary
- `markAsRead(ids)` - Mark specific notifications as read
- `markAllAsRead()` - Mark all as read
- `notifyLeadConversion(leadId, eventId, clientName)` - Trigger on lead conversion
- `notifyEventCreation(eventId, eventName, createdBy)` - Trigger on event creation
- `notifyPaymentReceived(eventId, amount, status)` - Trigger on payment

### 4. **Notification Store**
Location: `store/notificationsStore.ts`

Zustand store managing:
- Notifications list
- Notification stats (total, unread counts)
- User preferences
- Loading and error states
- Real-time updates support

### 5. **Type Definitions**
Location: `types/notifications.d.ts`

**Notification Types:**
- `lead_converted` - Lead converted to event
- `event_created` - New event created
- `event_updated` - Event details updated
- `event_cancelled` - Event cancelled
- `payment_received` - Payment received
- `expense_added` - New expense added
- `vendor_assigned` - Vendor assigned to event
- `system` - System notifications

**Priority Levels:**
- `low` - Regular updates
- `medium` - Standard notifications
- `high` - Important alerts
- `urgent` - Critical notifications

## Integration Points

### Event Conversion Notification
When a lead is converted to an event in `app/(modules)/events/convert-lead.tsx`:

```typescript
// After successful conversion
await notificationsService.notifyLeadConversion(
  Number(leadId),
  response.id || response.event_id,
  formData.company
);
```

This triggers a backend notification that:
- Targets admin users (`send_to_admins: true`)
- Includes lead and event IDs in metadata
- Sets appropriate priority level
- Provides action URL to navigate to the event

### Module Header Integration
The `NotificationBell` component is integrated into `ModuleHeader`:

```typescript
<ModuleHeader 
  title="Events"
  showNotifications={true} // Enable/disable per screen
/>
```

## Backend Requirements

The backend should have endpoints for:

1. **GET** `/core/notifications/` - List all notifications
2. **GET** `/core/notifications/unread/` - List unread only
3. **GET** `/core/notifications/unread_count/` - Get unread count
4. **GET** `/core/notification-summary/` - Get summary stats
5. **POST** `/core/notifications/mark_selected_as_read/` - Mark specific as read
6. **POST** `/core/notifications/mark_all_as_read/` - Mark all as read
7. **GET** `/core/notification-preferences/my_preferences/` - Get user preferences
8. **POST** `/core/notification-preferences/update_preferences/` - Update preferences

### Notification Creation
When the frontend calls `notifyLeadConversion`, the backend should:

1. Create notification record with:
   - `type: 'lead_converted'`
   - `title: 'Lead Converted to Event'`
   - `message: 'Lead for {clientName} has been converted to an event'`
   - `priority: 'medium'`
   - `metadata: { lead_id, event_id, client_name }`
   - `action_url: '/events/{event_id}'`
   
2. Target admin users:
   - Query users with `is_staff=true` or specific admin role
   - Create notification records for each admin user
   
3. Optionally trigger:
   - Push notifications
   - Email notifications (based on user preferences)
   - WebSocket updates for real-time delivery

### Admin Access Control
To implement admin-only access:

```python
# Backend view example
class NotificationViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admins see all notifications
            return Notification.objects.all()
        else:
            # Regular users see only their notifications
            return Notification.objects.filter(recipient=user)
```

## Usage Examples

### Displaying Notification Bell
```tsx
import NotificationBell from '@/components/layout/NotificationBell';

// In your header
<NotificationBell size={24} color="#000" />
```

### Manual Notification Creation
```typescript
import notificationsService from '@/services/notifications.service';

// Create notification
await notificationsService.notifyEventCreation(
  eventId,
  eventName,
  createdByUsername
);
```

### Accessing Notifications Store
```typescript
import { useNotificationsStore } from '@/store/notificationsStore';

function MyComponent() {
  const { notifications, unreadCount, fetchNotifications } = useNotificationsStore();
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  return (
    <Text>You have {unreadCount} unread notifications</Text>
  );
}
```

## Customization

### Adding New Notification Types
1. Add type to `types/notifications.d.ts`:
```typescript
export type NotificationType = 
  | 'lead_converted'
  | 'your_new_type';
```

2. Add icon mapping in `notifications.service.ts`:
```typescript
getNotificationIcon(type: string): string {
  const iconMap = {
    your_new_type: 'custom-icon-name',
    // ...
  };
}
```

3. Create notification method:
```typescript
async notifyYourNewEvent(data: any): Promise<boolean> {
  try {
    console.log('Sending notification...');
    // Backend will handle actual creation
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

### Styling Notifications
Priority colors are defined in `notifications.service.ts`:
```typescript
getNotificationColor(priority: string): string {
  return {
    low: '#6B7280',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444',
  }[priority] || '#3B82F6';
}
```

## Testing

### Test Lead Conversion Notification
1. Go to Events module
2. Select a lead
3. Click "Convert to Event"
4. Fill in required fields
5. Submit conversion
6. Check notification bell for new notification
7. Verify notification appears in list
8. Tap notification to mark as read

### Test Notification Bell
1. Ensure there are unread notifications
2. Observe badge count on bell icon
3. Tap bell to navigate to notifications screen
4. Verify smooth navigation

### Test Notification List
1. Open notifications screen
2. Test "All" and "Unread" filters
3. Test pull-to-refresh
4. Tap individual notification (should mark as read)
5. Test "Mark all as read" button
6. Verify empty state displays correctly

## Future Enhancements

1. **WebSocket Integration**
   - Real-time notification delivery
   - Live badge count updates
   - No polling required

2. **Push Notifications**
   - Native push notification support
   - Background notification handling
   - Rich notifications with actions

3. **Notification Preferences**
   - Per-notification-type settings
   - Quiet hours
   - Notification channels

4. **Advanced Filtering**
   - Date range filters
   - Search functionality
   - Category grouping

5. **Notification Actions**
   - Quick actions from notification list
   - Inline responses
   - Swipe gestures for mark as read/delete

## Troubleshooting

### Notifications Not Appearing
- Check backend API endpoints are accessible
- Verify user has proper permissions
- Check console logs for API errors
- Ensure notification service methods are called correctly

### Badge Count Not Updating
- Check `getUnreadCount()` API response
- Verify polling interval (30 seconds)
- Check for JavaScript errors in console

### Navigation Not Working
- Verify `action_url` format in notification data
- Check router configuration includes notification routes
- Ensure proper route permissions

## API Response Examples

### Get Notifications Response
```json
[
  {
    "id": 1,
    "notification": {
      "id": 1,
      "title": "Lead Converted to Event",
      "message": "Lead for ACME Corp has been converted to an event",
      "url": "/events/123",
      "created_at": "2025-12-02T10:30:00Z",
      "type_name": "lead_converted",
      "type_description": "Lead conversion notification"
    },
    "read": false,
    "read_at": null,
    "is_seen": false,
    "priority": "medium",
    "related_task_id": null,
    "related_project_id": null,
    "related_user_id": 5,
    "action_data": {
      "action": "view_event",
      "event_id": 123
    },
    "time_ago": "2 hours ago"
  }
]
```

### Unread Count Response
```json
{
  "unread_count": 5
}
```

## Security Considerations

1. **Authorization**: All notification endpoints should verify user authentication
2. **Data Filtering**: Users should only see notifications intended for them
3. **Admin Check**: Backend must verify admin status for admin-only notifications
4. **XSS Prevention**: Sanitize notification content before display
5. **Rate Limiting**: Implement rate limits on notification creation to prevent spam

## Performance Optimization

1. **Pagination**: Implement pagination for notification lists
2. **Caching**: Cache notification counts for faster badge updates
3. **Lazy Loading**: Load notification details on demand
4. **Debouncing**: Debounce refresh operations
5. **Background Sync**: Use background sync for notification fetching

---

**Last Updated**: December 2, 2025
**Version**: 1.0.0
**Author**: Sarvagun Development Team
