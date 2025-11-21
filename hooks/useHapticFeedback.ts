import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { HAPTIC_TYPES } from '@/utils/animations';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback(async (type: HapticFeedbackType) => {
    // Only trigger haptics on supported platforms
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(HAPTIC_TYPES.light);
          break;
        case 'medium':
          await Haptics.impactAsync(HAPTIC_TYPES.medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(HAPTIC_TYPES.heavy);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'success':
          await Haptics.notificationAsync(HAPTIC_TYPES.notification.success);
          break;
        case 'warning':
          await Haptics.notificationAsync(HAPTIC_TYPES.notification.warning);
          break;
        case 'error':
          await Haptics.notificationAsync(HAPTIC_TYPES.notification.error);
          break;
        default:
          await Haptics.impactAsync(HAPTIC_TYPES.light);
      }
    } catch (error) {
      // Gracefully handle haptic errors
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  // Convenience hooks for specific haptic types
  const triggerLight = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const triggerMedium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const triggerHeavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const triggerSelection = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);
  const triggerSuccess = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const triggerWarning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const triggerError = useCallback(() => triggerHaptic('error'), [triggerHaptic]);

  return {
    triggerHaptic,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerSuccess,
    triggerWarning,
    triggerError,
  };
};

export default useHapticFeedback;