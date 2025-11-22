import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

type ThemeOption = 'light' | 'dark' | 'auto';

export default function AppearanceScreen() {
  const { theme, isDark } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('auto');

  const themeOptions: { value: ThemeOption; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: 'sunny-outline',
      description: 'Always use light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: 'moon-outline',
      description: 'Always use dark theme',
    },
    {
      value: 'auto',
      label: 'Use device theme',
      icon: 'phone-portrait-outline',
      description: 'Sync with system settings',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Appearance" showBack />

      <ScrollView style={{ flex: 1 }}>
        {/* Preview */}
        <View
          style={{
            margin: designSystem.spacing.lg,
            padding: designSystem.spacing.lg,
            backgroundColor: theme.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 8 }}>
            Preview
          </Text>
          <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 16 }}>
            Currently using {isDark ? 'dark' : 'light'} theme
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 80,
                backgroundColor: theme.primary,
                borderRadius: 8,
                padding: designSystem.spacing.md,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  marginBottom: designSystem.spacing.sm,
                }}
              />
              <View
                style={{
                  height: 8,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 4,
                  marginBottom: 4,
                }}
              />
              <View
                style={{
                  height: 8,
                  width: '60%',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 4,
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                height: 80,
                backgroundColor: theme.background,
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.primary + '40',
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  height: 8,
                  backgroundColor: theme.text + '40',
                  borderRadius: 4,
                  marginBottom: 4,
                }}
              />
              <View
                style={{
                  height: 8,
                  width: '60%',
                  backgroundColor: theme.text + '20',
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>

        {/* Theme Options */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'semibold'),
              color: theme.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Theme
          </Text>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: 'hidden',
            }}
          >
            {themeOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedTheme(option.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < themeOptions.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                  backgroundColor: selectedTheme === option.value 
                    ? theme.primary + '10' 
                    : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: selectedTheme === option.value
                      ? theme.primary + '20'
                      : theme.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={selectedTheme === option.value ? theme.primary : theme.textSecondary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...getTypographyStyle('base', 'medium'),
                      color: theme.text,
                      marginBottom: 4,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      ...getTypographyStyle('sm', 'regular'),
                      color: theme.textSecondary,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>

                {selectedTheme === option.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Settings */}
        <View style={{ padding: designSystem.spacing.lg }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'semibold'),
              color: theme.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Display
          </Text>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="contrast-outline" size={22} color={theme.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                  High contrast
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="text-outline" size={22} color={theme.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                  Font size
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 2 }}>
                  Medium
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
