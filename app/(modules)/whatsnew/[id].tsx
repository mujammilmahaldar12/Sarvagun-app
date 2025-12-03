import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator, useWindowDimensions, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import whatsNewService from '@/services/whatsNew.service';
import { WhatsNew } from '@/types/whatsnew';
import { format } from 'date-fns';
import { designSystem } from '@/constants/designSystem';

export default function WhatsNewDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [item, setItem] = useState<WhatsNew | null>(null);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetail();
            recordView();
        }
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await whatsNewService.getById(Number(id));
            setItem(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const recordView = async () => {
        try {
            await whatsNewService.recordView(Number(id));
        } catch (error) {
            // Ignore view recording errors
        }
    };

    const handleLike = async () => {
        if (!item || liking) return;
        setLiking(true);
        try {
            const response = await whatsNewService.toggleLike(item.id, 'like');

            // Optimistic update
            setItem(prev => {
                if (!prev) return null;
                const isLiked = prev.user_reaction === 'like';
                return {
                    ...prev,
                    user_reaction: isLiked ? null : 'like',
                    likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
                };
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLiking(false);
        }
    };

    const handleShare = async () => {
        if (!item) return;
        try {
            await Share.share({
                message: `${item.title}\n\n${item.short_description}\n\nRead more in Sarvagun App`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenFile = async () => {
        if (item?.file) {
            try {
                await Linking.openURL(item.file);
            } catch (error) {
                console.error("Couldn't open file:", error);
            }
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'update': return designSystem.gradientColors.blue;
            case 'news': return designSystem.gradientColors.green;
            case 'policy': return designSystem.gradientColors.orange;
            default: return ['#6B7280', '#4B5563'];
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!item) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-gray-500">Item not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-indigo-600">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Simple HTML stripper for description since we don't have a renderer yet
    const cleanDescription = item.description.replace(/<[^>]+>/g, '\n').trim();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-gray-50">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="flex-row space-x-2">
                    <TouchableOpacity onPress={handleShare} className="p-2 rounded-full bg-gray-50">
                        <Ionicons name="share-social-outline" size={24} color="#1F2937" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-6 pt-6">
                    {/* Meta Info */}
                    <View className="flex-row items-center mb-4">
                        <LinearGradient
                            colors={getBadgeColor(item.type) as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-3 py-1 rounded-full mr-3"
                        >
                            <Text className="text-xs font-bold text-white uppercase tracking-wider">
                                {item.type}
                            </Text>
                        </LinearGradient>
                        <Text className="text-sm text-gray-500">
                            {format(new Date(item.publish_at || item.created_at), 'MMMM d, yyyy')}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
                        {item.title}
                    </Text>

                    {/* Author Card */}
                    <View className="flex-row items-center mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-4 border-2 border-white shadow-sm">
                            <Text className="text-lg font-bold text-indigo-600">
                                {item.author_name?.charAt(0) || 'A'}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-base font-bold text-gray-900">
                                {item.author_name || 'Admin'}
                            </Text>
                            <Text className="text-xs text-gray-500">Author</Text>
                        </View>
                    </View>

                    {/* File Attachment Button */}
                    {item.file && (
                        <TouchableOpacity
                            onPress={handleOpenFile}
                            className="mb-8 flex-row items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100 active:bg-indigo-100"
                        >
                            <View className="w-12 h-12 bg-indigo-500 rounded-xl items-center justify-center mr-4 shadow-sm">
                                <Ionicons name="document-text" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-indigo-900">View Attachment</Text>
                                <Text className="text-sm text-indigo-600">Tap to open document</Text>
                            </View>
                            <Ionicons name="open-outline" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                    )}

                    {/* Content */}
                    <View className="mb-6">
                        <Text className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
                            {item.short_description}
                        </Text>
                        <View className="h-px bg-gray-100 mb-4" />
                        <Text className="text-base text-gray-600 leading-relaxed">
                            {cleanDescription}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="px-6 py-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={handleLike}
                        className="flex-row items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full"
                    >
                        <Ionicons
                            name={item.user_reaction === 'like' ? "heart" : "heart-outline"}
                            size={24}
                            color={item.user_reaction === 'like' ? "#EF4444" : "#4B5563"}
                        />
                        <Text className={`text-base font-medium ${item.user_reaction === 'like' ? 'text-red-500' : 'text-gray-600'}`}>
                            {item.likes_count} Likes
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center space-x-2 px-4 py-2">
                        <Ionicons name="eye-outline" size={24} color="#9CA3AF" />
                        <Text className="text-base font-medium text-gray-400">
                            {item.views_count} Views
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
