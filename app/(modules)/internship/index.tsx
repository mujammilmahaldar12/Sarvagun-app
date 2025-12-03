import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMyInternship, useMyExtensions } from '@/hooks/useInternshipQueries';
import { ModuleHeader, Badge, AnimatedButton } from '@/components';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

export default function InternshipScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { data: internship, isLoading: internshipLoading, refetch: refetchInternship } = useMyInternship();
    const { data: extensions, isLoading: extensionsLoading, refetch: refetchExtensions } = useMyExtensions();

    const onRefresh = React.useCallback(() => {
        refetchInternship();
        refetchExtensions();
    }, [refetchInternship, refetchExtensions]);

    const isLoading = internshipLoading || extensionsLoading;

    if (isLoading && !internship) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Internship" />

            <ScrollView
                contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
            >
                {/* Internship Details Card */}
                {internship ? (
                    <View style={[
                        getCardStyle(theme.surface, 'lg', 'md'),
                        { marginBottom: spacing.xl, padding: spacing.lg }
                    ]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                                Program Details
                            </Text>
                            <Badge
                                label={internship.is_active ? 'Active' : 'Completed'}
                                status={internship.is_active ? 'active' : 'inactive'}
                            />
                        </View>

                        <View style={{ gap: spacing.md }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                <View>
                                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>Start Date</Text>
                                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>{internship.start_date}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <Ionicons name="flag-outline" size={20} color={theme.primary} />
                                <View>
                                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>End Date</Text>
                                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>{internship.end_date || 'Ongoing'}</Text>
                                </View>
                            </View>

                            {internship.days_remaining !== null && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                    <Ionicons name="time-outline" size={20} color={theme.primary} />
                                    <View>
                                        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>Days Remaining</Text>
                                        <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>{internship.days_remaining} days</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                        <Text style={{ color: theme.textSecondary }}>No internship details found.</Text>
                    </View>
                )}

                {/* Extensions Section */}
                <View style={{ marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                        Extensions
                    </Text>
                    <AnimatedButton
                        title="Request Extension"
                        onPress={() => router.push('/(modules)/internship/extension-request')}
                        variant="primary"
                        size="sm"
                        leftIcon="add"
                    />
                </View>

                {extensions && extensions.length > 0 ? (
                    extensions.map((ext) => (
                        <View
                            key={ext.id}
                            style={[
                                getCardStyle(theme.surface, 'md', 'sm'),
                                { marginBottom: spacing.md, padding: spacing.md }
                            ]}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                                <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
                                    {ext.duration_months} Months Extension
                                </Text>
                                <Badge
                                    label={ext.status}
                                    status={ext.status === 'approved' ? 'active' : ext.status === 'rejected' ? 'error' : 'warning'}
                                    size="sm"
                                />
                            </View>

                            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: spacing.sm }}>
                                New End Date: {ext.new_end_date}
                            </Text>

                            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={2}>
                                Reason: {ext.reason}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={[
                        getCardStyle(theme.surface, 'md', 'sm'),
                        { padding: spacing.xl, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: theme.border }
                    ]}>
                        <Ionicons name="documents-outline" size={32} color={theme.textTertiary} />
                        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginTop: spacing.sm }}>
                            No extension requests yet
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
