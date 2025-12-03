import { useCallback } from 'react';
import { activityStorage, LocalActivity } from '@/services/activityStorage.service';

/**
 * Hook to easily track activities throughout the app
 * Usage:
 * const { trackActivity } = useActivityTracker();
 * 
 * trackActivity({
 *   type: 'leave',
 *   title: 'Leave Request Submitted',
 *   description: 'Casual Leave for 2 days',
 *   related_id: leaveId
 * });
 */
export function useActivityTracker() {
  const trackActivity = useCallback(async (activity: Omit<LocalActivity, 'id' | 'timestamp'>) => {
    try {
      await activityStorage.addActivity(activity);
      return true;
    } catch (error) {
      console.error('Failed to track activity:', error);
      return false;
    }
  }, []);

  const trackLeaveRequest = useCallback(async (leaveType: string, fromDate: string, toDate: string, leaveId?: string | number) => {
    return trackActivity({
      type: 'leave',
      title: `${leaveType} Request Submitted`,
      description: `${fromDate} to ${toDate}`,
      related_id: leaveId,
    });
  }, [trackActivity]);

  const trackLeaveApproval = useCallback(async (leaveType: string, employeeName: string, status: 'approved' | 'rejected', leaveId?: string | number) => {
    return trackActivity({
      type: 'leave',
      title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      description: `${leaveType} for ${employeeName}`,
      related_id: leaveId,
    });
  }, [trackActivity]);

  const trackProjectUpdate = useCallback(async (projectName: string, status: string, progress: number, projectId?: string | number) => {
    return trackActivity({
      type: 'project',
      title: `${projectName}`,
      description: `Status: ${status} - Progress: ${progress}%`,
      related_id: projectId,
    });
  }, [trackActivity]);

  const trackEventCreation = useCallback(async (eventTitle: string, eventDate: string, eventId?: string | number) => {
    return trackActivity({
      type: 'event',
      title: `Event Created: ${eventTitle}`,
      description: `Scheduled for ${eventDate}`,
      related_id: eventId,
    });
  }, [trackActivity]);

  const trackEventRegistration = useCallback(async (eventTitle: string, eventDate: string, eventId?: string | number) => {
    return trackActivity({
      type: 'event',
      title: `Registered for ${eventTitle}`,
      description: `Event date: ${eventDate}`,
      related_id: eventId,
    });
  }, [trackActivity]);

  const trackFinanceRequest = useCallback(async (requestType: string, amount: number, requestId?: string | number) => {
    return trackActivity({
      type: 'finance',
      title: `${requestType} Request`,
      description: `Amount: ₹${amount.toLocaleString('en-IN')}`,
      related_id: requestId,
    });
  }, [trackActivity]);

  const trackHRAction = useCallback(async (action: string, description: string, relatedId?: string | number) => {
    return trackActivity({
      type: 'hr',
      title: action,
      description: description,
      related_id: relatedId,
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackLeaveRequest,
    trackLeaveApproval,
    trackProjectUpdate,
    trackEventCreation,
    trackEventRegistration,
    trackFinanceRequest,
    trackHRAction,
  };
}
