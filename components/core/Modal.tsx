/**
 * Modal Component
 * Unified modal with multiple variants and animations
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Modal as RNModal, Pressable, StyleSheet, Dimensions, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn, ZoomOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius } = designSystem;
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type ModalVariant = 'center' | 'bottom-sheet' | 'full-screen';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: ModalVariant;
  
  // Options
  title?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  swipeable?: boolean;
  blurBackdrop?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  
  // Sizing
  width?: number | string;
  height?: number | string;
  maxHeight?: number | string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  variant = 'center',
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
  swipeable = true,
  blurBackdrop = false,
  scrollable = true,
  keyboardAvoiding = true,
  width = '90%',
  height,
  maxHeight = '80%',
}) => {
  const { colors } = useThemeStore();
  const translateY = useSharedValue(0);
  const lastSwipe = useRef(0);

  useEffect(() => {
    if (!visible) {
      translateY.value = 0;
    }
  }, [visible]);

  const handleSwipe = (event: any) => {
    if (!swipeable || variant !== 'bottom-sheet') return;
    
    const currentY = event.nativeEvent.translationY;
    if (currentY > 0) {
      translateY.value = currentY;
      lastSwipe.current = currentY;
    }
  };

  const handleSwipeEnd = () => {
    if (!swipeable || variant !== 'bottom-sheet') return;
    
    if (lastSwipe.current > 100) {
      translateY.value = withSpring(SCREEN_HEIGHT, {}, () => {
        onClose();
      });
    } else {
      translateY.value = withSpring(0);
    }
    lastSwipe.current = 0;
  };

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getAnimationProps = () => {
    switch (variant) {
      case 'bottom-sheet':
        return {
          entering: SlideInDown.springify(),
          exiting: SlideOutDown.springify(),
        };
      case 'full-screen':
        return {
          entering: SlideInDown.duration(300),
          exiting: SlideOutDown.duration(200),
        };
      case 'center':
      default:
        return {
          entering: ZoomIn.springify(),
          exiting: ZoomOut.duration(200),
        };
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'bottom-sheet':
        return {
          justifyContent: 'flex-end' as const,
        };
      case 'full-screen':
        return {
          justifyContent: 'flex-start' as const,
        };
      case 'center':
      default:
        return {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          padding: spacing[4],
        };
    }
  };

  const getContentStyle = (): any => {
    switch (variant) {
      case 'bottom-sheet':
        return {
          backgroundColor: colors.surface,
          borderTopLeftRadius: borderRadius['2xl'],
          borderTopRightRadius: borderRadius['2xl'],
          paddingTop: spacing[2],
          paddingBottom: spacing[6],
          paddingHorizontal: spacing[4],
          maxHeight: typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.8,
        };
      case 'full-screen':
        return {
          backgroundColor: colors.background,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          paddingTop: Platform.OS === 'ios' ? spacing[12] : spacing[8],
        };
      case 'center':
      default:
        return {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing[4],
          width: typeof width === 'number' ? width : undefined,
          maxWidth: 500,
          maxHeight: typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.8,
        };
    }
  };

  const Backdrop = (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} 
    />
  );

  const Content = scrollable ? ScrollView : View;

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} enabled={keyboardAvoiding}>
        <View style={[styles.container, getContainerStyle()]}>
          {closeOnBackdrop && (
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
              {Backdrop}
            </Pressable>
          )}

          <Animated.View {...getAnimationProps()} style={[swipeStyle, getContentStyle()]}>
            {/* Swipe Handle for Bottom Sheet */}
            {variant === 'bottom-sheet' && swipeable && (
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
                {title && (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => ({
                      padding: spacing[2],
                      borderRadius: borderRadius.full,
                      backgroundColor: pressed ? colors.border : 'transparent',
                    })}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Content */}
            <Content showsVerticalScrollIndicator={false} bounces={false}>
              {children}
            </Content>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default Modal;
