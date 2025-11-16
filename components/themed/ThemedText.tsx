import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'title' | 'subtitle' | 'caption';
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  ...props
}) => {
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? darkColor : lightColor;

  return (
    <Text
      style={[
        styles.text,
        styles[`text_${variant}`],
        color ? { color } : undefined,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#1C1C1E',
  },
  text_default: {
    fontSize: 16,
  },
  text_title: {
    fontSize: 24,
    fontWeight: '700',
  },
  text_subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  text_caption: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
