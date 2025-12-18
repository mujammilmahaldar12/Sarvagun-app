import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';  // Import auth store for user data
import { useMyInternship, useMyExtensions } from '@/hooks/useInternshipQueries';
import { ModuleHeader, Badge, AnimatedButton } from '@/components';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

export default function InternshipScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuthStore();  // Get user from auth store for joiningdate fallback
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
                {internship || user?.joiningdate ? (
                    <View style={[
                        getCardStyle(theme.surface, 'lg', 'md'),
                        { marginBottom: spacing.xl, padding: spacing.lg }
                    ]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                                Program Details
                            </Text>
                            <Badge
                                label={internship?.is_active ? 'Active' : user?.joiningdate ? 'Active' : 'Completed'}
                                status={internship?.is_active || user?.joiningdate ? 'active' : 'inactive'}
                            />
                        </View>

                        <View style={{ gap: spacing.md }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                <View>
                                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>Start Date</Text>
                                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                                        {(() => {
                                            // Priority: Internship.start_date > User.joiningdate
                                            const startDate = internship?.start_date || user?.joiningdate;
                                            if (!startDate) return 'N/A';
                                            try {
                                                return new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                            } catch {
                                                return 'N/A';
                                            }
                                        })()}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <Ionicons name="flag-outline" size={20} color={theme.primary} />
                                <View>
                                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>End Date</Text>
                                    <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                                        {(() => {
                                            // Only Internship has end_date, User doesn't
                                            const endDate = internship?.end_date;
                                            if (!endDate) return 'N/A';
                                            try {
                                                return new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                            } catch {
                                                return 'N/A';
                                            }
                                        })()}
                                    </Text>
                                </View>
                            </View>

                            {internship?.days_remaining !== null && internship?.days_remaining !== undefined && (
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
                        title="🚀 Ready to Build Something More Exciting?"
                        onPress={() => router.push('/(modules)/internship/extension-request')}
                        variant="primary"
                        size="sm"
                        leftIcon="rocket"
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
