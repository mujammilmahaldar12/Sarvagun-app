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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { AnimatedPressable } from '@/components';
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser';

type FAQCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FAQItem[];
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'account',
    title: 'Account & Profile',
    icon: 'person-circle-outline',
    items: [
      {
        id: '1',
        question: 'How do I update my profile information?',
        answer: 'Go to Profile → Edit Profile. You can update your photo, contact details, and other personal information. Changes are saved automatically.',
      },
      {
        id: '2',
        question: 'How do I change my password?',
        answer: 'Navigate to Profile → Settings → Account → Change Password. You\'ll need to enter your current password and create a new one.',
      },
      {
        id: '3',
        question: 'Can I change my email address?',
        answer: 'Yes, go to Profile → Settings → Account → Email Settings. Verify your new email address through the confirmation link sent to your inbox.',
      },
    ],
  },
  {
    id: 'leave',
    title: 'Leave Management',
    icon: 'time-outline',
    items: [
      {
        id: '4',
        question: 'How do I apply for leave?',
        answer: 'Navigate to Modules → Leave → Apply Leave. Select the leave type, dates, and provide a reason. Your manager will be notified automatically.',
      },
      {
        id: '5',
        question: 'How can I check my leave balance?',
        answer: 'Your leave balance is displayed on the home screen. For detailed breakdown, go to Modules → Leave → Leave Balance.',
      },
      {
        id: '6',
        question: 'What types of leave are available?',
        answer: 'Available leave types include Casual Leave, Sick Leave, Annual Leave, and Optional Holidays. Each has different approval processes and balance limits.',
      },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance & Work Logs',
    icon: 'finger-print-outline',
    items: [
      {
        id: '7',
        question: 'How do I mark my attendance?',
        answer: 'Use the Quick Add button on the home screen to check in/out. Your location and time will be recorded automatically.',
      },
      {
        id: '8',
        question: 'Can I view my attendance history?',
        answer: 'Yes, go to Modules → HR → Attendance to view your complete attendance history with date-wise records.',
      },
      {
        id: '9',
        question: 'What if I forget to check out?',
        answer: 'Contact your HR manager to manually adjust your attendance record. Provide the correct time details.',
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects & Tasks',
    icon: 'briefcase-outline',
    items: [
      {
        id: '10',
        question: 'How do I view my assigned projects?',
        answer: 'Navigate to Modules → Projects to see all projects assigned to you. You can filter by status, priority, or deadline.',
      },
      {
        id: '11',
        question: 'How do I update task status?',
        answer: 'Open the task from your project list, then click on the status dropdown to update it. Add comments if needed.',
      },
      {
        id: '12',
        question: 'Can I collaborate with team members?',
        answer: 'Yes, each project has a team section where you can chat, share files, and coordinate with other members.',
      },
    ],
  },
  {
    id: 'events',
    title: 'Events & Celebrations',
    icon: 'calendar-outline',
    items: [
      {
        id: '13',
        question: 'How do I register for an event?',
        answer: 'Go to Modules → Events, select the event, and click Register. You\'ll receive confirmation and reminders.',
      },
      {
        id: '14',
        question: 'Can I create my own events?',
        answer: 'Team leads and managers can create events. Go to Events → Create New Event and fill in the details.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: 'settings-outline',
    items: [
      {
        id: '15',
        question: 'The app is running slow. What should I do?',
        answer: 'Try clearing the app cache from Settings → Data Usage. If the issue persists, restart the app or contact support.',
      },
      {
        id: '16',
        question: 'I\'m not receiving notifications',
        answer: 'Check Settings → Notifications and ensure they\'re enabled. Also verify notification permissions in your device settings.',
      },
      {
        id: '17',
        question: 'How do I report a bug?',
        answer: 'Go to Profile → Report a Problem. Describe the issue, attach screenshots if possible, and submit the form.',
      },
    ],
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { resetFirstTime } = useFirstTimeUser();

  const handleBack = () => {
    router.back();
  };

  const handleResetFirstTime = () => {
    Alert.alert(
      'Reset Welcome Experience',
      'This will show the welcome celebration screen on next login. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetFirstTime();
            Alert.alert('Success', 'Welcome experience reset. You\'ll see it on next login.');
          },
        },
      ]
    );
  };

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Filter FAQs based on search
  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    items: category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  const displayData = searchQuery ? filteredData : FAQ_DATA;

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
              },
            ]}
            placeholder="Search for help..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Support Card */}
        <View style={styles.section}>
          <View style={[styles.contactCard, getCardStyle(theme.surface, 'md', 'lg')]}>
            <View style={[styles.contactIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="headset-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.contactTitle, { color: theme.text }]}>
              Need More Help?
            </Text>
            <Text style={[styles.contactDescription, { color: theme.textSecondary }]}>
              Can't find what you're looking for? Our support team is here to help.
            </Text>
            <View style={styles.contactButtons}>
              <AnimatedPressable
                onPress={() => router.push('/(settings)/report-problem')}
                style={[styles.contactButton, { backgroundColor: theme.primary }]}
                hapticType="medium"
                springConfig="bouncy"
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Report Problem</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {/* FAQ Categories */}
        {displayData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Try different keywords or browse categories
            </Text>
          </View>
        ) : (
          displayData.map((category) => (
            <View key={category.id} style={styles.section}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name={category.icon} size={20} color={theme.primary} />
                </View>
                <Text style={[styles.categoryTitle, { color: theme.text }]}>
                  {category.title}
                </Text>
              </View>

              <View style={[styles.faqContainer, getCardStyle(theme.surface, 'md', 'lg')]}>
                {category.items.map((item, index) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPress={() => toggleItem(item.id)}
                      style={[
                        styles.faqItem,
                        {
                          borderBottomWidth: index < category.items.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqQuestion}>
                        <Text
                          style={[
                            styles.questionText,
                            { color: theme.text },
                            expandedItems.has(item.id) && { color: theme.primary },
                          ]}
                        >
                          {item.question}
                        </Text>
                        <Ionicons
                          name={expandedItems.has(item.id) ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={expandedItems.has(item.id) ? theme.primary : theme.textSecondary}
                        />
                      </View>
                      {expandedItems.has(item.id) && (
                        <Text style={[styles.answerText, { color: theme.textSecondary }]}>
                          {item.answer}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            QUICK LINKS
          </Text>
          <View style={[styles.quickLinksContainer, getCardStyle(theme.surface, 'md', 'lg')]}>
            <TouchableOpacity
              onPress={() => router.push('/(settings)/about')}
              style={[styles.quickLink, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickLinkText, { color: theme.text }]}>About Sarvagun</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(settings)/report-problem')}
              style={[styles.quickLink, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <Ionicons name="alert-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickLinkText, { color: theme.text }]}>Report a Problem</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleResetFirstTime}
              style={styles.quickLink}
            >
              <Ionicons name="refresh-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickLinkText, { color: theme.text }]}>Reset Welcome Experience</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...getTypographyStyle('base', 'regular'),
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  contactCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  contactIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  contactTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  contactDescription: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  contactButtons: {
    width: '100%',
    gap: spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  contactButtonText: {
    ...getTypographyStyle('base', 'semibold'),
    color: '#FFFFFF',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  faqContainer: {
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.base,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questionText: {
    flex: 1,
    ...getTypographyStyle('base', 'semibold'),
  },
  answerText: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: spacing.md,
    lineHeight: 20,
  },
  emptyState: {
    padding: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...getTypographyStyle('lg', 'bold'),
    marginTop: spacing.base,
    textAlign: 'center',
  },
  emptySubtext: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    ...getTypographyStyle('xs', 'bold'),
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  quickLinksContainer: {
    overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  quickLinkText: {
    flex: 1,
    ...getTypographyStyle('base', 'medium'),
  },
});
