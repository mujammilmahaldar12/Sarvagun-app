/**
 * UrgencySection Component
 * Collapsible section header for urgency groups (Overdue, Today, This Week, etc.)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    interpolate,
    useSharedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import type { UrgencyGroup } from '@/utils/taskGrouping';

const { spacing, typography, borderRadius } = designSystem;


interface UrgencySectionProps {
    groupKey: UrgencyGroup;
    title: string;
    count: number;
    color: string;
    icon: string;
    isExpanded: boolean;
    onToggle: () => void;
    isEmpty?: boolean;
    sectionId?: number;
    onAddTask?: (sectionId: number) => void;
    onEdit?: (sectionId: number, currentName: string) => void;
    onDelete?: (sectionId: number) => void;
}

/**
 * Collapsible urgency section header
 * Shows: Icon, Title, Count, Add Task button, Expand/Collapse indicator
 */
export const UrgencySection = memo(({
    groupKey,
    title,
    count,
    color,
    icon,
    isExpanded,
    onToggle,
    isEmpty = false,
    sectionId,
    onAddTask,
    onEdit,
    onDelete,
}: UrgencySectionProps) => {
    const { theme } = useTheme();

    // Don't render empty sections (except completed which can be toggled)
    if (isEmpty && groupKey !== 'completed') {
        return null;
    }

    // For completed, show "Show X completed" or "Hide completed"
    const isCompletedSection = groupKey === 'completed';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggle}
            disabled={isEmpty}
            style={[
                styles.container,
                {
                    backgroundColor: color + '15',
                    borderLeftColor: color,
                }
            ]}
        >
            {/* Left: Icon and Title */}
            <View style={styles.leftContent}>
                <View style={[styles.iconContainer, { backgroundColor: color + '25' }]}>
                    <Ionicons name={icon as any} size={16} color={color} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {title}
                </Text>

                {/* Count Badge */}
                <View style={[styles.countBadge, { backgroundColor: color + '25' }]}>
                    <Text style={[styles.countText, { color }]}>
                        {count}
                    </Text>
                </View>
            </View>

            {/* Right: Section Actions + Add Task Button + Expand/Collapse Indicator */}
            <View style={styles.rightContent}>
                {/* Section Edit/Delete Buttons */}
                {sectionId && (onEdit || onDelete) && (
                    <View style={styles.sectionActions}>
                        {onEdit && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEdit(sectionId, title);
                                }}
                                style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                            >
                                <Ionicons name="pencil" size={14} color={theme.primary} />
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onDelete(sectionId);
                                }}
                                style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                            >
                                <Ionicons name="trash-outline" size={14} color={theme.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Add Task Button */}
                {sectionId && onAddTask && !isCompletedSection && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onAddTask(sectionId);
                        }}
                        style={[styles.addTaskButton, { backgroundColor: theme.primary }]}
                    >
                        <Ionicons name="add" size={14} color="#fff" />
                    </TouchableOpacity>
                )}

                {isCompletedSection && !isExpanded ? (
                    <Text style={[styles.showText, { color: theme.primary }]}>
                        Show
                    </Text>
                ) : null}

                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textSecondary}
                />
            </View>
        </TouchableOpacity>
    );
});

UrgencySection.displayName = 'UrgencySection';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderLeftWidth: 4,
        marginTop: spacing.md,
        marginBottom: 4,
        borderRadius: borderRadius.md,
        minHeight: 48,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    title: {
        fontSize: typography.sizes.xs,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    countBadge: {
        marginLeft: spacing.sm,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    countText: {
        fontSize: typography.sizes.xs,
        fontWeight: '700',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    showText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
    },
    addTaskButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
    },
    sectionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginRight: spacing.xs,
    },
    actionButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default UrgencySection;
