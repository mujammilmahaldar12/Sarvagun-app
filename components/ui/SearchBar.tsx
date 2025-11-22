import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onClear,
  autoFocus = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SearchBarProps) {
  const { theme, isDark } = useTheme();
  const [query, setQuery] = useState('');

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#2A242E' : '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#E5E7EB',
      }}
    >
      <Ionicons
        name="search"
        size={20}
        color={theme.textSecondary}
        style={{ marginRight: 8 }}
      />
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoFocus={autoFocus}
        accessible={true}
        accessibilityLabel={accessibilityLabel || `Search ${placeholder?.toLowerCase()}`}
        accessibilityHint={accessibilityHint || "Type to search"}
        accessibilityRole="search"
        testID={testID}
        style={{
          flex: 1,
          fontSize: designSystem.typography.sizes.base,
          color: theme.text,
          paddingVertical: 0,
        }}
      />
      {query.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          accessibilityHint="Clears the search input"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 4,
          })}
        >
          <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}
