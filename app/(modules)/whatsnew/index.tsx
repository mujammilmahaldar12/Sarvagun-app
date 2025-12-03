import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Share, FlatList, StyleSheet, Platform, StatusBar, TextInput, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import whatsNewService from '@/services/whatsNew.service';
import { WhatsNew, WhatsNewType } from '@/types/whatsnew';
import WhatsNewFeedCard from '@/components/whatsnew/WhatsNewFeedCard';
import { spacing, borderRadius } from '@/constants/designSystem';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import { AnimatedPressable } from '@/components';

const VIEW_TABS = [
    { label: 'All Posts', value: 'all' },
    { label: 'My Posts', value: 'my' },
];

const FILTER_TABS: { label: string; value: WhatsNewType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Updates', value: 'update' },
    { label: 'News', value: 'news' },
    { label: 'Policies', value: 'policy' },
];

export default function WhatsNewList() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user } = useAuthStore();
    const [items, setItems] = useState<WhatsNew[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'all' | 'my'>('all');
    const [activeFilter, setActiveFilter] = useState<WhatsNewType | 'all'>('all');

    const fetchItems = async () => {
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (activeFilter !== 'all') params.type = activeFilter;
            if (activeView === 'my') params.my_posts = true;

            const data = await whatsNewService.getAll(params);
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeFilter, activeView]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    const handleLike = async (item: WhatsNew) => {
        try {
            await whatsNewService.toggleLike(item.id, 'like');

            // Optimistic update
            setItems(prevItems => prevItems.map(i => {
                if (i.id === item.id) {
                    const isLiked = i.user_reaction === 'like';
                    return {
                        ...i,
                        user_reaction: isLiked ? null : 'like',
                        likes_count: isLiked ? i.likes_count - 1 : i.likes_count + 1
                    };
                }
                return i;
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleShare = async (item: WhatsNew) => {
        try {
            await Share.share({
                message: `${item.title}\n\n${item.short_description}\n\nRead more in Sarvagun App`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const announcements = items.filter(item => item.announcement);
    const feedItems = items.filter(item => !item.announcement);

    const renderAnnouncement = ({ item }: { item: WhatsNew }) => (
        <TouchableOpacity
            onPress={() => router.push(`/(modules)/whatsnew/${item.id}`)}
            style={[
                getCardStyle('md'),
                {
                    marginRight: spacing.md,
                    width: 280,
                    padding: 0,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: `${theme.error}20`
                }
            ]}
        >
            <LinearGradient
                colors={[`${theme.error}05`, `${theme.error}10`]}
                style={{ padding: spacing.md, height: '100%' }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <View style={{
                        backgroundColor: theme.error,
                        paddingHorizontal: spacing.xs,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginRight: spacing.xs
                    }}>
                        <Text style={[getTypographyStyle('xs', 'bold'), { color: 'white', textTransform: 'uppercase' }]}>Breaking</Text>
                    </View>
                    <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                        {new Date(item.publish_at || item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text, marginBottom: spacing.xs }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.short_description}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* Header */}
            <Animated.View 
                entering={FadeInDown.duration(600).springify()}
                style={[styles.header, { backgroundColor: theme.surface }]}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>What's New</Text>
                    
                    {/* Search Bar */}
                    <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            placeholder="Search posts..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={[styles.searchInput, { color: theme.text }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <AnimatedPressable onPress={() => setSearchQuery('')} hapticType="light">
                                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                            </AnimatedPressable>
                        )}
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* View Tabs (All / My Posts) */}
                <View style={styles.tabsContainer}>
                    {VIEW_TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.value}
                            onPress={() => setActiveView(tab.value as 'all' | 'my')}
                            style={[
                                styles.tab,
                                activeView === tab.value && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
                            ]}
                        >
                            <Text
                                style={[
                                    getTypographyStyle('base', 'semibold'),
                                    { color: activeView === tab.value ? theme.primary : theme.textSecondary }
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipsContainer}
                >
                    {FILTER_TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.value}
                            onPress={() => setActiveFilter(tab.value)}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: activeFilter === tab.value ? theme.primary : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    borderColor: activeFilter === tab.value ? theme.primary : 'transparent',
                                }
                            ]}
                        >
                            <Text
                                style={[
                                    getTypographyStyle('sm', 'medium'),
                                    { color: activeFilter === tab.value ? 'white' : theme.textSecondary }
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                        <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                            <Ionicons name="megaphone" size={18} color={theme.error} />
                            <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 1 }]}>
                                Announcements
                            </Text>
                        </View>
                        <FlatList
                            data={announcements}
                            renderItem={renderAnnouncement}
                            keyExtractor={item => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                        />
                    </View>
                )}

                {/* Main Feed */}
                <View style={styles.feedContainer}>
                    {feedItems.length > 0 ? (
                        feedItems.map((item) => (
                            <WhatsNewFeedCard
                                key={item.id}
                                item={item}
                                onPress={() => router.push(`/(modules)/whatsnew/${item.id}`)}
                                onLike={() => handleLike(item)}
                                onShare={() => handleShare(item)}
                            />
                        ))
                    ) : (
                        !loading && (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name={activeView === 'my' ? 'create-outline' : 'newspaper-outline'} size={48} color={theme.primary} />
                                </View>
                                <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text, marginTop: spacing.md }]}>
                                    {activeView === 'my' ? 'No posts yet' : 'No updates found'}
                                </Text>
                                <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
                                    {activeView === 'my' ? 'Share your first update with the team' : 'Check back later for new updates'}
                                </Text>
                            </View>
                        )
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View 
                entering={FadeInUp.delay(300).springify()}
                style={styles.fabContainer}
            >
                <AnimatedPressable
                    onPress={() => router.push('/(modules)/whatsnew/create')}
                    hapticType="medium"
                    springConfig="bouncy"
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </AnimatedPressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['2xl'],
        paddingBottom: spacing.base,
        paddingHorizontal: spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    headerContent: {
        gap: spacing.md,
    },
    headerTitle: {
        ...getTypographyStyle('xl', 'bold'),
        letterSpacing: 0.5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        height: 46,
    },
    searchInput: {
        flex: 1,
        ...getTypographyStyle('base', 'regular'),
        padding: 0,
        paddingVertical: 0,
    },
    scrollContent: {
        paddingTop: spacing.md,
        paddingBottom: 100,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    tab: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginRight: spacing.md,
    },
    filterChipsContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginRight: spacing.sm,
        borderWidth: 1,
    },
    feedContainer: {
        paddingHorizontal: spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['4xl'],
        paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 100,
        right: spacing.lg,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...getShadowStyle('lg'),
    },
});
