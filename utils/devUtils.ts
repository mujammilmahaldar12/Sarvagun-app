/**
 * Developer Utilities for Testing Onboarding
 * Add these to Profile/Settings screen for easy testing
 */
import { resetOnboarding } from '@/utils/storage';
import { Alert } from 'react-native';

/**
 * Reset onboarding status to show celebration & tour again
 * Useful for testing and demonstrations
 * 
 * Usage in Profile/Settings screen:
 * ```tsx
 * import { resetOnboardingForTesting } from '@/utils/devUtils';
 * 
 * <Button 
 *   title="Reset Onboarding (Dev)" 
 *   onPress={resetOnboardingForTesting}
 * />
 * ```
 */
export const resetOnboardingForTesting = async () => {
  Alert.alert(
    'Reset Onboarding',
    'This will reset the onboarding tour. You\'ll see the celebration and tour on next login.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetOnboarding();
          Alert.alert('Success', 'Onboarding reset! Log out and log in again to see it.');
        },
      },
    ]
  );
};

/**
 * Check onboarding status (for debugging)
 */
export const checkOnboardingStatus = async () => {
  const { isFirstTimeUser } = await import('@/utils/storage');
  const isFirstTime = await isFirstTimeUser();
  
  Alert.alert(
    'Onboarding Status',
    `First Time User: ${isFirstTime ? 'Yes' : 'No'}`,
    [{ text: 'OK' }]
  );
};
