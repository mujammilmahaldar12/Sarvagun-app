import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onClear,
  autoFocus = false,
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
        color={theme.colors.textSecondary}
        style={{ marginRight: 8 }}
      />
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          fontSize: 15,
          color: theme.colors.text,
          paddingVertical: 0,
        }}
      />
      {query.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 4,
          })}
        >
          <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}
