import { useEffect } from 'react';
import { router } from 'expo-router';

export default function TeamIndex() {
  useEffect(() => {
    // Immediately redirect to the member selection screen
    router.replace('/(modules)/team/select-member');
  }, []);

  return null;
}