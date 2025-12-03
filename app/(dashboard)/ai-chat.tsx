import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAIStore, ChatMessage } from '@/store/aiStore';
import { aiService } from '@/services/ai.service';
import { AnimatedPressable, Avatar } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';

// Typing indicator animation
const TypingIndicator = () => {
  const { theme } = useTheme();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 300, easing: Easing.ease }),
        withTiming(0, { duration: 300, easing: Easing.ease })
      ),
      -1,
      false
    );
    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300, easing: Easing.ease }),
          withTiming(0, { duration: 300, easing: Easing.ease })
        ),
        -1,
        false
      );
    }, 100);
    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300, easing: Easing.ease }),
          withTiming(0, { duration: 300, easing: Easing.ease })
        ),
        -1,
        false
      );
    }, 200);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const animatedStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const animatedStyle3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: theme.surface }]}>
        <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, animatedStyle1]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, animatedStyle2]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, animatedStyle3]} />
      </View>
    </View>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isUser }: { message: ChatMessage; isUser: boolean }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const formatTime = (date: Date) => {
    try {
      const d = new Date(date);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Animated.View
      entering={isUser ? SlideInRight.springify().damping(15) : SlideInLeft.springify().damping(15)}
      style={[
        styles.messageBubbleContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.primary }]
            : [styles.aiBubble, { backgroundColor: theme.surface }],
          getShadowStyle('sm'),
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : theme.text },
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {isUser && (
        <Avatar
          size={32}
          source={user?.photo ? { uri: user.photo } : undefined}
          name={user?.full_name || 'User'}
        />
      )}
    </Animated.View>
  );
};

// Suggested Prompt Chip
const SuggestedPrompt = ({ text, onPress }: { text: string; onPress: () => void }) => {
  const { theme } = useTheme();
  
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.suggestedPrompt,
        { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' },
      ]}
      hapticType="light"
      springConfig="gentle"
    >
      <Text style={[styles.suggestedPromptText, { color: theme.primary }]}>{text}</Text>
    </AnimatedPressable>
  );
};

export default function AIChatScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const { messages, isLoading, addMessage, setLoading, clearMessages } = useAIStore();
  
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Get suggested prompts
  const suggestedPrompts = aiService.getSuggestedPrompts(user?.category);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();
    
    // Add user message
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);
    
    try {
      // Prepare conversation history
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      
      // Get AI response
      const response = await aiService.sendMessage(userMessage, history, {
        userName: user?.full_name || user?.username,
        userRole: user?.category,
        department: user?.designation,
      });
      
      // Add AI response
      addMessage({ role: 'assistant', content: response.content });
    } catch (error) {
      console.error('AI Chat Error:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
      });
    } finally {
      setLoading(false);
    }
  }, [inputText, isLoading, messages, user, addMessage, setLoading]);

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleClearChat = () => {
    clearMessages();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.headerContent}>
          <AnimatedPressable
            onPress={() => router.push('/(dashboard)/home')}
            hapticType="light"
            springConfig="bouncy"
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </AnimatedPressable>

          <View style={styles.headerTitleContainer}>
            <View style={[styles.aiIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="sparkles" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Sarvagun AI</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Beta</Text>
            </View>
          </View>

          <AnimatedPressable
            onPress={handleClearChat}
            hapticType="light"
            springConfig="bouncy"
            style={[styles.clearButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Message if no messages */}
          {messages.length === 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.welcomeContainer}>
              <View style={[styles.welcomeIconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="sparkles" size={36} color={theme.primary} />
              </View>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                Hi {user?.first_name || 'there'}! 👋
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                I'm your AI assistant. Ask me about leave, tasks, events, or workplace queries.
              </Text>

              {/* Suggested Prompts */}
              <View style={styles.suggestedPromptsContainer}>
                <Text style={[styles.suggestedTitle, { color: theme.textSecondary }]}>
                  Try asking:
                </Text>
                <View style={styles.suggestedPromptsList}>
                  {suggestedPrompts.map((prompt, index) => (
                    <SuggestedPrompt
                      key={index}
                      text={prompt}
                      onPress={() => handleSuggestedPrompt(prompt)}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}
          
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Message Sarvagun AI..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
            
            <AnimatedPressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              hapticType="medium"
              springConfig="bouncy"
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() && !isLoading ? theme.primary : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                  opacity: inputText.trim() && !isLoading ? 1 : 0.5,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() && !isLoading ? '#FFFFFF' : theme.textSecondary} 
                />
              )}
            </AnimatedPressable>
          </View>
          
          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
            AI may make mistakes. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('xs', 'medium'),
    marginTop: 2,
    opacity: 0.7,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  welcomeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    opacity: 0.7,
  },
  suggestedPromptsContainer: {
    width: '100%',
  },
  suggestedTitle: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: spacing.sm,
  },
  suggestedPromptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestedPrompt: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  suggestedPromptText: {
    ...getTypographyStyle('sm', 'medium'),
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.base,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.base + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius['2xl'],
  },
  userBubble: {
    borderBottomRightRadius: spacing.xs,
  },
  aiBubble: {
    borderBottomLeftRadius: spacing.xs,
    maxWidth: '90%',
  },
  messageText: {
    ...getTypographyStyle('base', 'regular'),
    lineHeight: 22,
  },
  messageTime: {
    ...getTypographyStyle('2xs', 'regular'),
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: spacing.base,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.sm,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: borderRadius['3xl'],
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...getTypographyStyle('base', 'regular'),
    lineHeight: 22,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    ...getTypographyStyle('xs', 'regular'),
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.5,
  },
});
