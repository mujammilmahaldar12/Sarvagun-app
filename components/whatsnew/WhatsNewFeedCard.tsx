import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { WhatsNew } from '@/types/whatsnew';
import { designSystem, spacing } from '@/constants/designSystem';
import { getCardStyle, getTypographyStyle } from '@/utils/styleHelpers';
import { useTheme } from '@/hooks/useTheme';

interface WhatsNewFeedCardProps {
    item: WhatsNew;
    onPress: () => void;
    onLike: () => void;
    onShare: () => void;
}

export default function WhatsNewFeedCard({ item, onPress, onLike, onShare }: WhatsNewFeedCardProps) {
    const { theme } = useTheme();

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'update': return designSystem.gradientColors.blue;
            case 'news': return designSystem.gradientColors.green;
            case 'policy': return designSystem.gradientColors.orange;
            default: return [theme.textSecondary, theme.textSecondary];
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'update': return 'refresh-circle';
            case 'news': return 'newspaper';
            case 'policy': return 'document-text';
            default: return 'information-circle';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={[
                getCardStyle('lg'),
                { marginBottom: spacing.md, padding: 0, overflow: 'hidden' }
            ]}
        >
            {/* Header */}
            <View style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.textSecondary }]}>
                            {item.author_name?.charAt(0) || 'A'}
                        </Text>
                    </View>
                    <View>
                        <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>
                            {item.author_name || 'Admin'}
                        </Text>
                        <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                            {format(new Date(item.publish_at || item.created_at), 'MMM d, yyyy • h:mm a')}
                        </Text>
                    </View>
                </View>

                <LinearGradient
                    colors={getBadgeColor(item.type) as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 4,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name={getIconForType(item.type) as any} size={12} color="white" style={{ marginRight: 4 }} />
                    <Text style={[getTypographyStyle('xs', 'bold'), { color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                        {item.type}
                    </Text>
                </LinearGradient>
            </View>

            {/* Content */}
            <View style={{ padding: spacing.md }}>
                <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text, marginBottom: spacing.xs, lineHeight: 24 }]}>
                    {item.title}
                </Text>

                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, marginBottom: spacing.sm, lineHeight: 20 }]} numberOfLines={3}>
                    {item.short_description}
                </Text>

                {/* File/Attachment Indicator */}
                {item.file && (
                    <View style={{
                        backgroundColor: theme.background,
                        borderRadius: designSystem.borderRadius.md,
                        padding: spacing.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: spacing.xs,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            backgroundColor: `${theme.error}10`,
                            borderRadius: designSystem.borderRadius.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: spacing.sm,
                        }}>
                            <Ionicons name="document" size={20} color={theme.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>Attachment Available</Text>
                            <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>Tap to view document</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </View>
                )}
            </View>

            {/* Footer Actions */}
            <View style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: theme.background,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopColor: theme.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); onLike(); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                        <Ionicons
                            name={item.user_reaction === 'like' ? "heart" : "heart-outline"}
                            size={22}
                            color={item.user_reaction === 'like' ? theme.error : theme.textSecondary}
                        />
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: item.user_reaction === 'like' ? theme.error : theme.textSecondary }]}>
                            {item.likes_count || 0}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="eye-outline" size={22} color={theme.textSecondary} />
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>
                            {item.views_count || 0}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); onShare(); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                    <Ionicons name="share-social-outline" size={22} color={theme.textSecondary} />
                    <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary }]}>Share</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}
