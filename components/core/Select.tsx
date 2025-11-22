/**
 * Select Component
 * Dropdown with search functionality and multi-select support
 */
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { Input } from './Input';
import { Button } from './Button';

const { spacing, typography, borderRadius } = designSystem;

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number | (string | number)[];
  onChange: (value: any) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select option',
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = true,
}) => {
  const { colors } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get display text
  const getDisplayText = (): string => {
    if (!value) return placeholder;
    
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      const labels = value
        .map((v) => options.find((opt) => opt.value === v)?.label)
        .filter(Boolean);
      return labels.join(', ');
    }
    
    const option = options.find((opt) => opt.value === value);
    return option?.label || placeholder;
  };

  // Check if option is selected
  const isSelected = (optionValue: string | number): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Handle option selection
  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValue = (value as (string | number)[]) || [];
      if (isSelected(optionValue)) {
        onChange(currentValue.filter((v) => v !== optionValue));
      } else {
        onChange([...currentValue, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = () => {
    onChange(multiple ? [] : undefined);
    if (!multiple) {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* Label */}
      {label && (
        <Text
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing[1],
          }}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Select Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: error ? colors.error : colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            flex: 1,
            fontSize: typography.sizes.base,
            color: value ? colors.text : colors.textSecondary,
          }}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {clearable && value && !disabled && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </View>
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.error,
            marginTop: spacing[1],
            marginLeft: spacing[1],
          }}
        >
          {error}
        </Text>
      )}

      {/* Options Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Animated.View
          entering={FadeIn}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.overlay,
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing[4],
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          <Animated.View
            entering={SlideInDown.springify()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing[4],
              width: '100%',
              maxWidth: 400,
              maxHeight: '80%',
            }}
          >
            {/* Search Input */}
            {searchable && (
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                variant="search"
                autoFocus
              />
            )}

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <SelectOption
                  option={item}
                  isSelected={isSelected(item.value)}
                  onPress={() => handleSelect(item.value)}
                  multiple={multiple}
                />
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: spacing[4], alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>
                    No options found
                  </Text>
                </View>
              )}
              style={{ marginTop: searchable ? spacing[3] : 0 }}
            />

            {/* Action Buttons for Multi-Select */}
            {multiple && (
              <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[3] }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleClose}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Done"
                  variant="primary"
                  onPress={handleClose}
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

// SelectOption Component
interface SelectOptionProps {
  option: SelectOption;
  isSelected: boolean;
  onPress: () => void;
  multiple: boolean;
}

const SelectOption: React.FC<SelectOptionProps> = ({ option, isSelected, onPress, multiple }) => {
  const { colors } = useThemeStore();

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isSelected ? `${colors.primary}15` : 'transparent',
      { duration: 200 }
    ),
  }));

  return (
    <Pressable onPress={onPress} disabled={option.disabled}>
      {({ pressed }) => (
        <Animated.View
          style={[
            animatedStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing[3],
              borderRadius: borderRadius.md,
              opacity: option.disabled ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.sizes.base,
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? typography.weights.semibold : typography.weights.regular,
            }}
          >
            {option.label}
          </Text>
          
          {isSelected && (
            <Ionicons
              name={multiple ? 'checkmark-circle' : 'checkmark'}
              size={20}
              color={colors.primary}
            />
          )}
        </Animated.View>
      )}
    </Pressable>
  );
};

export default Select;
