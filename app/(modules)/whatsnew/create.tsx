import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import whatsNewService from '@/services/whatsNew.service';
import { WhatsNewType } from '@/types/whatsnew';
import { AnimatedPressable } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getShadowStyle } from '@/utils/styleHelpers';
import { useActivityTracker } from '@/hooks/useActivityTracker';

const POST_TYPES: { label: string; value: WhatsNewType; icon: string }[] = [
    { label: 'Update', value: 'update', icon: 'bulb-outline' },
    { label: 'News', value: 'news', icon: 'newspaper-outline' },
    { label: 'Policy', value: 'policy', icon: 'shield-checkmark-outline' },
];

export default function CreateWhatsNew() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user } = useAuthStore();
    const { trackActivity } = useActivityTracker();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [type, setType] = useState<WhatsNewType>('update');
    const [image, setImage] = useState<string | null>(null);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !shortDescription.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('short_description', shortDescription);
            formData.append('description', fullDescription);
            formData.append('type', type);
            formData.append('announcement', isAnnouncement.toString());
            formData.append('status', 'published');
            
            console.log('📦 FormData contents:', {
                title,
                shortDescription,
                fullDescription,
                type,
                announcement: isAnnouncement.toString(),
                status: 'published',
                hasImage: !!image
            });
            
            if (image) {
                const filename = image.split('/').pop() || 'image.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const fileType = match ? `image/${match[1]}` : 'image/jpeg';
                
                console.log('📸 Image details:', {
                    uri: image,
                    name: filename,
                    type: fileType
                });
                
                formData.append('file', {
                    uri: image,
                    name: filename,
                    type: fileType,
                } as any);
            }

            console.log('🚀 Submitting post to backend...');
            const response = await whatsNewService.create(formData);
            
            // Track activity
            await trackActivity({
                type: 'other',
                title: `Posted: ${title}`,
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${shortDescription.substring(0, 50)}${shortDescription.length > 50 ? '...' : ''}`,
                related_id: (response as any)?.id,
            });
            
            Alert.alert('Success', 'Post created successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('❌ Create post error:', error);
            console.error('❌ Error response:', error.response?.data);
            
            let errorMessage = 'Failed to create post';
            if (error.response?.data) {
                const data = error.response.data;
                // Handle field-specific errors
                if (typeof data === 'object') {
                    const errors = [];
                    for (const [field, messages] of Object.entries(data)) {
                        if (Array.isArray(messages)) {
                            errors.push(`${field}: ${messages.join(', ')}`);
                        } else if (typeof messages === 'string') {
                            errors.push(`${field}: ${messages}`);
                        }
                    }
                    if (errors.length > 0) {
                        errorMessage = errors.join('\n');
                    }
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert('Error Creating Post', errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
                <View style={styles.headerContent}>
                    <AnimatedPressable
                        onPress={() => router.back()}
                        hapticType="light"
                        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </AnimatedPressable>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Create Post</Text>
                    <View style={{ width: 40 }} />
                </View>
            </Animated.View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Post Type Selection */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Post Type *</Text>
                    <View style={styles.typeSelector}>
                        {POST_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                onPress={() => setType(item.value)}
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: type === item.value ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                        borderColor: type === item.value ? theme.primary : 'transparent',
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name={item.icon as any} 
                                    size={20} 
                                    color={type === item.value ? '#FFFFFF' : theme.textSecondary} 
                                />
                                <Text style={[
                                    getTypographyStyle('sm', 'medium'),
                                    { color: type === item.value ? '#FFFFFF' : theme.textSecondary, marginLeft: spacing.xs }
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter post title..."
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.input,
                            { 
                                color: theme.text, 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            }
                        ]}
                        maxLength={200}
                    />
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {title.length}/200
                    </Text>
                </View>

                {/* Short Description */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Short Description *</Text>
                    <TextInput
                        value={shortDescription}
                        onChangeText={setShortDescription}
                        placeholder="Brief summary (shown in feed)..."
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.textArea,
                            { 
                                color: theme.text, 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                height: 80,
                            }
                        ]}
                        multiline
                        maxLength={300}
                    />
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {shortDescription.length}/300
                    </Text>
                </View>

                {/* Full Description */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Full Description *</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Detailed content of your post..."
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.textArea,
                            { 
                                color: theme.text, 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                height: 200,
                            }
                        ]}
                        multiline
                        maxLength={5000}
                    />
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {description.length}/5000
                    </Text>
                </View>

                {/* Image Upload */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Image (Optional)</Text>
                    {image ? (
                        <View style={styles.imagePreview}>
                            <Image source={{ uri: image }} style={styles.previewImage} />
                            <TouchableOpacity
                                onPress={() => setImage(null)}
                                style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                            >
                                <Ionicons name="close" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={pickImage}
                            style={[
                                styles.uploadButton,
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                }
                            ]}
                        >
                            <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                            <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginTop: spacing.xs }]}>
                                Tap to upload image
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Announcement Toggle */}
                <TouchableOpacity
                    onPress={() => setIsAnnouncement(!isAnnouncement)}
                    style={[
                        styles.announcementToggle,
                        { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                            borderColor: isAnnouncement ? theme.error : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                        }
                    ]}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                            <Ionicons name="megaphone" size={20} color={isAnnouncement ? theme.error : theme.textSecondary} />
                            <Text style={[getTypographyStyle('base', 'semibold'), { color: theme.text, marginLeft: spacing.xs }]}>
                                Mark as Announcement
                            </Text>
                        </View>
                        <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                            Announcements appear at the top of the feed
                        </Text>
                    </View>
                    <View style={[
                        styles.checkbox,
                        { 
                            backgroundColor: isAnnouncement ? theme.error : 'transparent',
                            borderColor: isAnnouncement ? theme.error : theme.border,
                        }
                    ]}>
                        {isAnnouncement && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                </TouchableOpacity>

                {/* Submit Button */}
                <AnimatedPressable
                    onPress={handleSubmit}
                    disabled={loading}
                    hapticType="medium"
                    springConfig="bouncy"
                    style={[
                        styles.submitButton,
                        { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }
                    ]}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Creating...' : 'Publish Post'}
                    </Text>
                </AnimatedPressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing['2xl'],
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...getTypographyStyle('lg', 'bold'),
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: spacing.xl,
    },
    label: {
        ...getTypographyStyle('sm', 'semibold'),
        marginBottom: spacing.sm,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
    },
    input: {
        ...getTypographyStyle('base', 'regular'),
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm + 4,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    textArea: {
        ...getTypographyStyle('base', 'regular'),
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm + 4,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        textAlignVertical: 'top',
    },
    charCount: {
        ...getTypographyStyle('xs', 'regular'),
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    uploadButton: {
        height: 150,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        position: 'relative',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.lg,
    },
    removeImageButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.base,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        marginBottom: spacing.xl,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        paddingVertical: spacing.base,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...getShadowStyle('md'),
    },
    submitButtonText: {
        ...getTypographyStyle('base', 'bold'),
        color: '#FFFFFF',
    },
});
