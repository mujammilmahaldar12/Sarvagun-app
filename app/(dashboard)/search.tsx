import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

export default function SearchScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock search results
  const results = [
    {
      id: '1',
      name: 'John Doe',
      designation: 'Senior Developer',
      department: 'Engineering',
      avatar: null,
    },
    {
      id: '2',
      name: 'Jane Smith',
      designation: 'HR Manager',
      department: 'Human Resources',
      avatar: null,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      designation: 'Project Manager',
      department: 'Projects',
      avatar: null,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      {/* Header with Search Bar */}
      <View
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>

          {/* Search Input */}
          <View
            className="flex-1 flex-row items-center rounded-xl px-4"
            style={{
              height: 48,
              backgroundColor: isDark ? '#2A242E' : '#F3F4F6',
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search people..."
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={{
                flex: 1,
                ...getTypographyStyle('base', 'regular'),
                color: theme.text,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Search Results */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20 }}
      >
        {searchQuery.length > 0 ? (
          <>
            <Text
              className="text-sm font-semibold mb-4"
              style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}
            >
              Results for "{searchQuery}"
            </Text>

            {results.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => console.log('Person:', person.name)}
                style={({ pressed }) => ({
                  marginBottom: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{
                    backgroundColor: theme.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Avatar */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: theme.primary,
                    }}
                  >
                    <Text className="text-base font-bold text-white">
                      {getInitials(person.name)}
                    </Text>
                  </View>

                  {/* Person Info */}
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-base font-semibold mb-1"
                      style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}
                    >
                      {person.name}
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}
                    >
                      {person.designation} • {person.department}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <View className="items-center justify-center" style={{ marginTop: 100 }}>
            <Ionicons
              name="search-outline"
              size={64}
              color={theme.textSecondary}
              style={{ marginBottom: 16 }}
            />
            <Text
              className="text-lg font-semibold mb-2"
              style={{ color: theme.text }}
            >
              Search People
            </Text>
            <Text
              className="text-center text-sm"
              style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}
            >
              Find colleagues by name, designation,{'\n'}or department
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
