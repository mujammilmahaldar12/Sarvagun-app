import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useRequestExtension } from '@/hooks/useInternshipQueries';
import { ModuleHeader, AnimatedButton } from '@/components';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius } from '@/constants/designSystem';

export default function ExtensionRequestScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const requestExtension = useRequestExtension();

    const [duration, setDuration] = useState('3');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            Alert.alert('Validation Error', 'Please provide a reason for the extension.');
            return;
        }

        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 12) {
            Alert.alert('Validation Error', 'Duration must be between 1 and 12 months.');
            return;
        }

        requestExtension.mutate({
            duration_months: durationNum,
            reason: reason.trim(),
        }, {
            onSuccess: () => {
                Alert.alert('Success', 'Extension request submitted successfully.');
                router.back();
            },
            onError: (error: any) => {
                Alert.alert('Error', error?.message || 'Failed to submit request.');
            }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Request Extension" showBack />

            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                <View style={[
                    getCardStyle(theme.surface, 'lg', 'md'),
                    { padding: spacing.lg, gap: spacing.lg }
                ]}>
                    <View>
                        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text, marginBottom: spacing.xs }}>
                            Duration (Months)
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                borderRadius: borderRadius.md,
                                padding: spacing.md,
                                color: theme.text,
                                borderWidth: 1,
                                borderColor: theme.border,
                                ...getTypographyStyle('base', 'regular')
                            }}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="number-pad"
                            placeholder="e.g. 3"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text, marginBottom: spacing.xs }}>
                            Reason for Extension
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                borderRadius: borderRadius.md,
                                padding: spacing.md,
                                color: theme.text,
                                borderWidth: 1,
                                borderColor: theme.border,
                                minHeight: 120,
                                textAlignVertical: 'top',
                                ...getTypographyStyle('base', 'regular')
                            }}
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            placeholder="Explain why you need an extension..."
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <AnimatedButton
                        title={requestExtension.isPending ? "Submitting..." : "Submit Request"}
                        onPress={handleSubmit}
                        variant="primary"
                        disabled={requestExtension.isPending}
                        fullWidth
                    />
                </View>
            </ScrollView>
        </View>
    );
}
