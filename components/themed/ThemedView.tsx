import React from 'react';
import { View, ViewProps, StyleSheet, useColorScheme } from 'react-native';

interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  style,
  lightColor,
  darkColor,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? darkColor : lightColor;

  return (
    <View
      style={[
        styles.container,
        backgroundColor ? { backgroundColor } : undefined,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
});
