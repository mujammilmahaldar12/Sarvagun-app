
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

// Helper Components from Event Module for consistency
interface DetailSectionProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
    delay?: number;
}

export const DetailSection = ({ title, icon, children, delay = 0 }: DetailSectionProps) => {
    const { theme } = useTheme();
    return (
        <Animated.View
            entering={FadeIn.delay(delay).springify()}
            style={{
                backgroundColor: theme.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: theme.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.primary + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Ionicons name={icon} size={18} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{title}</Text>
            </View>
            <View style={{ gap: 12 }}>
                {children}
            </View>
        </Animated.View>
    );
};

interface DetailRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number | null | undefined;
    isLast?: boolean;
    valueStyle?: any;
}

export const DetailRow = ({ icon, label, value, isLast, valueStyle }: DetailRowProps) => {
    const { theme } = useTheme();
    if (value === null || value === undefined) return null;
    return (
        <View style={{
            flexDirection: 'row',
            gap: 12,
            paddingBottom: isLast ? 0 : 12,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: theme.border,
        }}>
            <View style={{ width: 20, alignItems: 'center', marginTop: 2 }}>
                <Ionicons name={icon} size={18} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>{label}</Text>
                <Text style={[{ fontSize: 14, color: theme.text, fontWeight: '500', lineHeight: 20 }, valueStyle]}>
                    {value}
                </Text>
            </View>
        </View>
    );
};
