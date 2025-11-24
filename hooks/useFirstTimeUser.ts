/**
 * First Time User Hook
 * Detects and manages first-time user experience
 */
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_TIME_KEY = '@sarvagun_first_time';

export const useFirstTimeUser = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const value = await AsyncStorage.getItem(FIRST_TIME_KEY);
      console.log('🎯 First Time Check:', value === null ? 'YES - First Time!' : 'NO - Returning User');
      setIsFirstTime(value === null); // First time if no value stored
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error checking first time user:', error);
      setIsFirstTime(false);
      setIsLoading(false);
    }
  };

  const markAsNotFirstTime = async () => {
    try {
      await AsyncStorage.setItem(FIRST_TIME_KEY, 'false');
      console.log('✅ User marked as returning user');
      setIsFirstTime(false);
    } catch (error) {
      console.error('❌ Error marking user as not first time:', error);
    }
  };

  const resetFirstTime = async () => {
    try {
      await AsyncStorage.removeItem(FIRST_TIME_KEY);
      console.log('🔄 First time status reset - User will see welcome screen again');
      setIsFirstTime(true);
    } catch (error) {
      console.error('❌ Error resetting first time:', error);
    }
  };

  return {
    isFirstTime,
    isLoading,
    markAsNotFirstTime,
    resetFirstTime,
  };
};
