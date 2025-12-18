/**
 * Task Grouping Utilities
 * Groups tasks by urgency: Overdue, Today, This Week, Later, Completed
 */

import type { Task } from '@/types/project';

// Group keys for urgency sections
export type UrgencyGroup = 'overdue' | 'today' | 'thisWeek' | 'later' | 'completed';

// Grouped tasks structure
export interface GroupedTasks {
    overdue: Task[];
    today: Task[];
    thisWeek: Task[];
    later: Task[];
    completed: Task[];
}

// Urgency section configuration
export interface UrgencySectionConfig {
    key: UrgencyGroup;
    title: string;
    color: string;
    icon: string;
    showByDefault: boolean;
}

// Configuration for each urgency group
export const URGENCY_SECTIONS: UrgencySectionConfig[] = [
    { key: 'overdue', title: 'OVERDUE', color: '#EF4444', icon: 'alert-circle', showByDefault: true },
    { key: 'today', title: 'TODAY', color: '#F59E0B', icon: 'today', showByDefault: true },
    { key: 'thisWeek', title: 'THIS WEEK', color: '#EAB308', icon: 'calendar', showByDefault: true },
    { key: 'later', title: 'LATER', color: '#9CA3AF', icon: 'time', showByDefault: false },
    { key: 'completed', title: 'COMPLETED', color: '#10B981', icon: 'checkmark-circle', showByDefault: false },
];

/**
 * Get start of day for a date (midnight)
 */
function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day for a date (23:59:59.999)
 */
function endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Check if a date is within the next N days (exclusive of today)
 */
function isWithinDays(date: Date, days: number, fromDate: Date = new Date()): boolean {
    const targetStart = startOfDay(new Date(fromDate));
    targetStart.setDate(targetStart.getDate() + 1); // Start from tomorrow

    const targetEnd = endOfDay(new Date(fromDate));
    targetEnd.setDate(targetEnd.getDate() + days);

    return date >= targetStart && date <= targetEnd;
}

/**
 * Group tasks by urgency based on due dates
 * 
 * @param tasks - Array of tasks to group
 * @returns Grouped tasks by urgency
 */
export function groupTasksByUrgency(tasks: Task[]): GroupedTasks {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const result: GroupedTasks = {
        overdue: [],
        today: [],
        thisWeek: [],
        later: [],
        completed: [],
    };

    tasks.forEach((task) => {
        // Completed tasks go to completed section
        if (task.status === 'Completed') {
            result.completed.push(task);
            return;
        }

        // Parse due date
        const dueDate = task.due_date ? new Date(task.due_date) : null;

        if (!dueDate) {
            // Tasks without due date go to 'later'
            result.later.push(task);
            return;
        }

        // Check urgency category
        if (dueDate < todayStart) {
            // Overdue: due date is before today
            result.overdue.push(task);
        } else if (dueDate >= todayStart && dueDate <= todayEnd) {
            // Today: due date is today
            result.today.push(task);
        } else if (isWithinDays(dueDate, 7, now)) {
            // This week: due within next 7 days (excluding today)
            result.thisWeek.push(task);
        } else {
            // Later: more than a week away
            result.later.push(task);
        }
    });

    // Sort each group by due date (earliest first), then by priority
    const sortByDueDateAndPriority = (a: Task, b: Task) => {
        // First by due date
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (dateA !== dateB) return dateA - dateB;

        // Then by priority (P1 > P2 > P3 > P4)
        const priorityOrder: Record<string, number> = { 'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4 };
        const prioA = priorityOrder[a.priority_level || 'P3'] || 3;
        const prioB = priorityOrder[b.priority_level || 'P3'] || 3;
        return prioA - prioB;
    };

    result.overdue.sort(sortByDueDateAndPriority);
    result.today.sort(sortByDueDateAndPriority);
    result.thisWeek.sort(sortByDueDateAndPriority);
    result.later.sort(sortByDueDateAndPriority);

    // Completed tasks sorted by completion date (most recent first)
    result.completed.sort((a, b) => {
        const dateA = a.completed_date ? new Date(a.completed_date).getTime() : 0;
        const dateB = b.completed_date ? new Date(b.completed_date).getTime() : 0;
        return dateB - dateA;
    });

    return result;
}

/**
 * Get total task count from grouped tasks
 */
export function getTotalTaskCount(grouped: GroupedTasks): number {
    return (
        grouped.overdue.length +
        grouped.today.length +
        grouped.thisWeek.length +
        grouped.later.length +
        grouped.completed.length
    );
}

/**
 * Get active (non-completed) task count
 */
export function getActiveTaskCount(grouped: GroupedTasks): number {
    return (
        grouped.overdue.length +
        grouped.today.length +
        grouped.thisWeek.length +
        grouped.later.length
    );
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: string | null): string {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    if (date < todayStart) {
        // Overdue - show how many days ago
        const daysAgo = Math.floor((todayStart.getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo === 1) return 'Yesterday';
        return `${daysAgo} days ago`;
    } else if (isSameDay(date, now)) {
        return 'Today';
    } else if (isSameDay(date, tomorrowStart)) {
        return 'Tomorrow';
    } else {
        // Format as "Dec 20" style
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

/**
 * Get urgency color based on due date
 */
export function getUrgencyColor(dueDate: string | null, isCompleted: boolean): string {
    if (isCompleted) return '#10B981'; // Green for completed
    if (!dueDate) return '#9CA3AF'; // Gray for no due date

    const date = new Date(dueDate);
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (date < todayStart) return '#EF4444'; // Red for overdue
    if (date >= todayStart && date <= todayEnd) return '#F59E0B'; // Orange for today
    if (date <= weekEnd) return '#EAB308'; // Yellow for this week
    return '#9CA3AF'; // Gray for later
}

/**
 * Get priority color
 */
export function getPriorityColor(priorityLevel: string | null): string {
    switch (priorityLevel) {
        case 'P1': return '#EF4444'; // Red - Critical
        case 'P2': return '#F59E0B'; // Orange - High
        case 'P3': return '#10B981'; // Green - Medium
        case 'P4': return '#3B82F6'; // Blue - Low
        default: return '#9CA3AF'; // Gray
    }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priorityLevel: string | null): string {
    switch (priorityLevel) {
        case 'P1': return 'Critical';
        case 'P2': return 'High';
        case 'P3': return 'Medium';
        case 'P4': return 'Low';
        default: return 'Medium';
    }
}
