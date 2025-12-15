import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { AnimatedPressable, AnimatedButton } from '@/components';
import api from '@/services/api';

type ProblemCategory = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROBLEM_CATEGORIES: ProblemCategory[] = [
  { id: 'account', label: 'Account Issues', icon: 'person-outline' },
  { id: 'attendance', label: 'Attendance', icon: 'finger-print-outline' },
  { id: 'leave', label: 'Leave Management', icon: 'time-outline' },
  { id: 'project', label: 'Project Access', icon: 'briefcase-outline' },
  { id: 'performance', label: 'App Performance', icon: 'speedometer-outline' },
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
  { id: 'other', label: 'Other', icon: 'help-circle-outline' },
];

export default function ReportProblemScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(dashboard)/profile');
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take screenshots.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Screenshot',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const validateForm = (): boolean => {
    if (!selectedCategory) {
      Alert.alert('Required Field', 'Please select a problem category.');
      return false;
    }
    if (!summary.trim()) {
      Alert.alert('Required Field', 'Please provide a brief summary of the problem.');
      return false;
    }
    if (summary.length < 10) {
      Alert.alert('Invalid Summary', 'Summary must be at least 10 characters long.');
      return false;
    }
    if (!details.trim()) {
      Alert.alert('Required Field', 'Please describe the problem in detail.');
      return false;
    }
    if (details.length < 20) {
      Alert.alert('Invalid Details', 'Please provide more details (at least 20 characters).');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('summary', summary.trim());
      formData.append('details', details.trim());

      // Add screenshot if available
      if (screenshot) {
        const uriParts = screenshot.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('errorpage', {
          uri: screenshot.uri,
          name: `problem_screenshot_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Submit to backend
      const response: any = await api.post('/hr/problem-reports/', formData);

      Alert.alert(
        'Success',
        'Your problem report has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(dashboard)/profile');
              }
            },
          },
        ]
      );

      // Reset form
      setSelectedCategory('');
      setSummary('');
      setDetails('');
      setScreenshot(null);
    } catch (error: any) {
      console.error('Error submitting problem:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit problem report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
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
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <AnimatedPressable onPress={handleBack} hapticType="light">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Report a Problem</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <View style={styles.section}>
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Help us improve your experience. Describe the issue you're facing and we'll work to resolve it quickly.
            </Text>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>
            Problem Category <Text style={{ color: theme.error }}>*</Text>
          </Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Select the category that best describes your issue
          </Text>
          <View style={styles.categoriesGrid}>
            {PROBLEM_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? theme.primary
                        : theme.surface,
                    borderColor:
                      selectedCategory === category.id
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={selectedCategory === category.id ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selectedCategory === category.id ? '#FFFFFF' : theme.text,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>
            Brief Summary <Text style={{ color: theme.error }}>*</Text>
          </Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Provide a short description (10-100 characters)
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g., Unable to mark attendance"
              placeholderTextColor={theme.textSecondary}
              value={summary}
              onChangeText={setSummary}
              maxLength={100}
            />
          </View>
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {summary.length}/100 characters
          </Text>
        </View>

        {/* Details Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>
            Detailed Description <Text style={{ color: theme.error }}>*</Text>
          </Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Explain what happened, when it occurred, and what you expected
          </Text>
          <View
            style={[
              styles.inputContainer,
              styles.textAreaContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text }]}
              placeholder="Describe the problem in detail..."
              placeholderTextColor={theme.textSecondary}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Screenshot Attachment */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>
            Screenshot (Optional)
          </Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Attach a screenshot to help us understand the issue better
          </Text>

          {screenshot ? (
            <View style={[styles.screenshotPreview, getCardStyle(theme.surface, 'md', 'lg')]}>
              <Image source={{ uri: screenshot.uri }} style={styles.screenshotImage} />
              <TouchableOpacity
                onPress={removeScreenshot}
                style={[styles.removeButton, { backgroundColor: theme.error }]}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImageOptions}
              style={[
                styles.uploadButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={theme.primary} />
              <Text style={[styles.uploadText, { color: theme.text }]}>
                Add Screenshot
              </Text>
              <Text style={[styles.uploadSubtext, { color: theme.textSecondary }]}>
                Tap to take photo or choose from library
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          {isSubmitting ? (
            <View style={[styles.submitButton, { backgroundColor: theme.primary }]}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <AnimatedButton
              title="Submit Report"
              onPress={handleSubmit}
              disabled={isSubmitting}
              variant="primary"
              fullWidth
              leftIcon="send"
              hapticType="medium"
              springConfig="bouncy"
            />
          )}

          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            Your report will be reviewed by our support team within 24-48 hours.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  scrollContent: {
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 20,
  },
  label: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.xs,
  },
  helpText: {
    ...getTypographyStyle('xs', 'regular'),
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  categoryLabel: {
    ...getTypographyStyle('sm', 'medium'),
  },
  inputContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  textAreaContainer: {
    paddingVertical: spacing.md,
  },
  input: {
    ...getTypographyStyle('base', 'regular'),
    minHeight: 44,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    ...getTypographyStyle('xs', 'regular'),
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  uploadText: {
    ...getTypographyStyle('base', 'semibold'),
  },
  uploadSubtext: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
  },
  screenshotPreview: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
  },
  submitButtonText: {
    ...getTypographyStyle('base', 'semibold'),
    color: '#FFFFFF',
  },
  footerNote: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
    lineHeight: 18,
  },
});
