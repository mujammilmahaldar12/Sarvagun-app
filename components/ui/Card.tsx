import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 16,
  style,
  ...props
}) => {
  const cardStyles: ViewStyle[] = [
    styles.card,
    styles[`card_${variant}`],
    { padding },
    style as ViewStyle,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  card_elevated: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card_outlined: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  card_filled: {
    backgroundColor: '#F2F2F7',
  },
});
