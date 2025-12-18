/**
 * JourneyTimeline Component
 * Displays career journey as a vertical timeline with milestones
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

export interface JourneyEvent {
    id: string;
    type: 'start' | 'extension' | 'position_change' | 'current' | 'end';
    title: string;
    subtitle?: string;
    date: string;
    endDate?: string;
    status?: 'approved' | 'pending' | 'rejected';
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    details?: string;
    durationLabel?: string;
}

interface JourneyTimelineProps {
    events: JourneyEvent[];
    currentPosition?: string;
    showConnectors?: boolean;
}

const getEventIcon = (type: JourneyEvent['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
        case 'start':
            return 'rocket-outline';
        case 'extension':
            return 'calendar-outline';
        case 'position_change':
            return 'briefcase-outline';
        case 'current':
            return 'location-outline';
        case 'end':
            return 'flag-outline';
        default:
            return 'ellipse-outline';
    }
};

const getEventColor = (type: JourneyEvent['type'], status?: string): string => {
    if (status === 'pending') return '#F59E0B'; // Amber
    if (status === 'rejected') return '#EF4444'; // Red

    switch (type) {
        case 'start':
            return moduleColors.projects.main;
        case 'extension':
            return moduleColors.events.main;
        case 'position_change':
            return moduleColors.finance.main;
        case 'current':
            return moduleColors.hr.main;
        case 'end':
            return '#64748B'; // Slate
        default:
            return '#6B7280';
    }
};

const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
        approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5' },
        pending: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
        rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
    };

    return statusConfig[status as keyof typeof statusConfig] || null;
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
    events,
    currentPosition,
    showConnectors = true,
}) => {
    const { theme, isDark } = useTheme();

    if (!events || events.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
                <Ionicons name="map-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No journey events to display
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="trail-sign-outline" size={20} color={theme.primary} />
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    Your Journey
                </Text>
            </View>

            {/* Timeline */}
            <View style={styles.timeline}>
                {events.map((event, index) => {
                    const isLast = index === events.length - 1;
                    const eventColor = event.color || getEventColor(event.type, event.status);
                    const eventIcon = event.icon || getEventIcon(event.type);
                    const statusBadge = getStatusBadge(event.status);

                    return (
                        <View key={event.id} style={styles.eventRow}>
                            {/* Timeline connector */}
                            <View style={styles.connectorColumn}>
                                {/* Icon circle */}
                                <View
                                    style={[
                                        styles.iconCircle,
                                        {
                                            backgroundColor: eventColor + '20',
                                            borderColor: eventColor,
                                        },
                                    ]}
                                >
                                    <Ionicons name={eventIcon} size={16} color={eventColor} />
                                </View>

                                {/* Connector line */}
                                {showConnectors && !isLast && (
                                    <View
                                        style={[
                                            styles.connectorLine,
                                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                                        ]}
                                    />
                                )}
                            </View>

                            {/* Event content */}
                            <View style={[styles.eventContent, { flex: 1 }]}>
                                <View
                                    style={[
                                        styles.eventCard,
                                        {
                                            backgroundColor: isDark
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(255,255,255,0.9)',
                                            borderColor: isDark
                                                ? 'rgba(255,255,255,0.1)'
                                                : 'rgba(0,0,0,0.05)',
                                        },
                                    ]}
                                >
                                    {/* Title row with status badge */}
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.eventTitle, { color: theme.text }]}>
                                            {event.title}
                                        </Text>
                                        {statusBadge && (
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: statusBadge.bg },
                                                ]}
                                            >
                                                <Text style={[styles.statusText, { color: statusBadge.color }]}>
                                                    {statusBadge.label}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Date */}
                                    <View style={styles.dateRow}>
                                        <Ionicons
                                            name="time-outline"
                                            size={12}
                                            color={theme.textSecondary}
                                        />
                                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                            {formatDate(event.date)}
                                            {event.endDate && ` → ${formatDate(event.endDate)}`}
                                        </Text>
                                    </View>

                                    {/* Subtitle */}
                                    {event.subtitle && (
                                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                            {event.subtitle}
                                        </Text>
                                    )}

                                    {/* Details */}
                                    {event.details && (
                                        <Text style={[styles.details, { color: theme.textSecondary }]}>
                                            {event.details}
                                        </Text>
                                    )}

                                    {/* Duration label */}
                                    {event.durationLabel && (
                                        <View
                                            style={[
                                                styles.durationBadge,
                                                { backgroundColor: eventColor + '15' },
                                            ]}
                                        >
                                            <Ionicons name="hourglass-outline" size={12} color={eventColor} />
                                            <Text style={[styles.durationText, { color: eventColor }]}>
                                                {event.durationLabel}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Spacing between events */}
                                {!isLast && <View style={{ height: spacing.md }} />}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Current Position Footer */}
            {currentPosition && (
                <View
                    style={[
                        styles.currentPositionCard,
                        {
                            backgroundColor: theme.primary + '10',
                            borderColor: theme.primary + '30',
                        },
                    ]}
                >
                    <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                    <View style={styles.currentPositionContent}>
                        <Text style={[styles.currentPositionLabel, { color: theme.textSecondary }]}>
                            Current Position
                        </Text>
                        <Text style={[styles.currentPositionText, { color: theme.text }]}>
                            {currentPosition}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    headerTitle: {
        ...getTypographyStyle('lg', 'semibold'),
    },
    timeline: {
        paddingLeft: spacing.xs,
    },
    eventRow: {
        flexDirection: 'row',
    },
    connectorColumn: {
        width: 40,
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    connectorLine: {
        width: 2,
        flex: 1,
        marginTop: -2,
        marginBottom: -2,
    },
    eventContent: {
        paddingLeft: spacing.sm,
        paddingBottom: spacing.xs,
    },
    eventCard: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    eventTitle: {
        ...getTypographyStyle('base', 'semibold'),
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.sm,
    },
    statusText: {
        ...getTypographyStyle('xs', 'semibold'),
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: spacing.xs,
    },
    dateText: {
        ...getTypographyStyle('xs', 'regular'),
    },
    subtitle: {
        ...getTypographyStyle('sm', 'medium'),
        marginTop: spacing.xs,
    },
    details: {
        ...getTypographyStyle('xs', 'regular'),
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
    },
    durationText: {
        ...getTypographyStyle('xs', 'semibold'),
    },
    currentPositionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginTop: spacing.lg,
    },
    currentPositionContent: {
        flex: 1,
    },
    currentPositionLabel: {
        ...getTypographyStyle('xs', 'regular'),
    },
    currentPositionText: {
        ...getTypographyStyle('base', 'semibold'),
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
    },
    emptyText: {
        ...getTypographyStyle('sm', 'regular'),
        marginTop: spacing.md,
        textAlign: 'center',
    },
});

export default JourneyTimeline;
