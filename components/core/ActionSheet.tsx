/**
 * ActionSheet Component
 * Bottom sheet with action options
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { SlideInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius, typography } = designSystem;

export interface ActionSheetAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionSheetAction[];
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  actions,
}) => {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const handleActionPress = (action: ActionSheetAction) => {
    if (!action.disabled) {
      onClose();
      // Small delay to allow modal to close before action
      setTimeout(() => action.onPress(), 150);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInDown.springify().damping(15)}
              style={[
                styles.container,
                { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.md },
              ]}
            >
              {/* Header */}
              {(title || subtitle) && (
                <View style={styles.header}>
                  {title && (
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: pressed ? colors.border : 'transparent' },
                      action.disabled && styles.actionDisabled,
                    ]}
                    onPress={() => handleActionPress(action)}
                    disabled={action.disabled}
                  >
                    {action.icon && (
                      <Ionicons
                        name={action.icon}
                        size={24}
                        color={
                          action.disabled
                            ? colors.text.tertiary
                            : action.destructive
                            ? '#ef4444'
                            : colors.text.primary
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: colors.text.primary },
                        action.destructive && styles.actionLabelDestructive,
                        action.disabled && { color: colors.text.tertiary },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Cancel Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    backgroundColor: pressed ? colors.border : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelLabel, { color: colors.text.primary }]}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
  },
  actionLabelDestructive: {
    color: '#ef4444',
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
