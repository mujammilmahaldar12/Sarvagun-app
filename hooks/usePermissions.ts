import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface PermissionCheckParams {
    action: 'rate_task' | 'approve_leave' | 'view_team_tasks' | 'view_team_projects' | 'view_team_members';
    resourceId?: number;
    resourceType?: 'task' | 'leave' | 'project';
}

interface PermissionCheckResponse {
    allowed: boolean;
    reason?: string;
}

/**
 * Hook to check if user has permission for a specific action.
 * Uses backend API to verify permissions.
 */
export function usePermissionCheck(params: PermissionCheckParams, enabled = true) {
    return useQuery({
        queryKey: ['permission', params.action, params.resourceId],
        queryFn: async (): Promise<PermissionCheckResponse> => {
            const response = await api.post<PermissionCheckResponse>('/core/check-permission/', {
                action: params.action,
                resource_id: params.resourceId,
                resource_type: params.resourceType,
            });
            return response;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes - permissions don't change frequently
        retry: false, // Don't retry permission checks
    });
}

/**
 * Check if user can rate a specific task
 */
export function useCanRateTask(taskId?: number) {
    return usePermissionCheck({
        action: 'rate_task',
        resourceId: taskId,
        resourceType: 'task'
    }, !!taskId);
}

/**
 * Check if user can rate tasks in general (team lead permission)
 */
export function useCanRateTasks() {
    return usePermissionCheck({
        action: 'rate_task',
    });
}

/**
 * Check if user can approve a specific leave request
 */
export function useCanApproveLeave(leaveId?: number) {
    return usePermissionCheck({
        action: 'approve_leave',
        resourceId: leaveId,
        resourceType: 'leave'
    }, !!leaveId);
}

/**
 * Check if user can approve leaves in general
 */
export function useCanApproveLeaves() {
    return usePermissionCheck({
        action: 'approve_leave',
    });
}

/**
 * Check if user can view team tasks
 */
export function useCanViewTeamTasks() {
    return usePermissionCheck({
        action: 'view_team_tasks'
    });
}

/**
 * Check if user can view team projects
 */
export function useCanViewTeamProjects() {
    return usePermissionCheck({
        action: 'view_team_projects'
    });
}

/**
 * Check if user can view team members
 */
export function useCanViewTeamMembers() {
    return usePermissionCheck({
        action: 'view_team_members'
    });
}
