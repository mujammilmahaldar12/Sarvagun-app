import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

export default function TempProjectScreen() {
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      padding: 20,
    }}>
      <Text style={{
        ...getTypographyStyle('lg', 'semibold'),
        color: theme.text,
        textAlign: 'center',
        marginBottom: 10,
      }}>
        Projects Module
      </Text>
      <Text style={{
        ...getTypographyStyle('sm', 'regular'),
        color: theme.textSecondary,
        textAlign: 'center',
      }}>
        This is a temporary placeholder for the projects module.
        Coming soon...
      </Text>
    </View>
  );
}
