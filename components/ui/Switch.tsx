import React from 'react';
import {
  Switch as RNSwitch,
  View,
  Text,
  StyleSheet,
  SwitchProps,
  ViewStyle,
} from 'react-native';

interface CustomSwitchProps extends SwitchProps {
  label?: string;
  description?: string;
  containerStyle?: ViewStyle;
}

export const Switch: React.FC<CustomSwitchProps> = ({
  label,
  description,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.textContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      
      <RNSwitch
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor="#fff"
        ios_backgroundColor="#E5E5EA"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
