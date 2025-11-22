import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

export default function AboutScreen() {
  const { theme } = useTheme();

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary }}>
        {label}
      </Text>
      <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="About" showBack />

      <ScrollView style={{ flex: 1 }}>
        {/* App Icon */}
        <View
          style={{
            alignItems: 'center',
            padding: designSystem.spacing['3xl'],
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="business" size={50} color="#FFFFFF" />
          </View>
          <Text
            style={{
              ...getTypographyStyle('2xl', 'bold'),
              color: theme.text,
              marginBottom: 8,
            }}
          >
            Sarvagun ERP
          </Text>
          <Text
            style={{
              ...getTypographyStyle('base', 'regular'),
              color: theme.textSecondary,
            }}
          >
            Version 1.0.0
          </Text>
        </View>

        {/* App Info */}
        <View style={{ padding: designSystem.spacing.lg }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Build" value="2025.11.20" />
            <InfoRow label="Platform" value="React Native" />
            <InfoRow label="Framework" value="Expo 52" />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 16,
              }}
            >
              <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary }}>
                Last Updated
              </Text>
              <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                November 2025
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'semibold'),
              color: theme.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            About
          </Text>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                ...getTypographyStyle('base', 'regular'),
                color: theme.text,
                lineHeight: 22,
              }}
            >
              Sarvagun ERP is a comprehensive enterprise resource planning solution designed to 
              streamline your business operations. Manage HR, events, projects, and finances 
              all in one place with our intuitive and powerful platform.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'semibold'),
              color: theme.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Links
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
            {[
              { icon: 'globe-outline', label: 'Website', value: 'www.sarvagun.com' },
              { icon: 'mail-outline', label: 'Support', value: 'support@sarvagun.com' },
              { icon: 'logo-github', label: 'GitHub', value: 'github.com/sarvagun' },
            ].map((item, index, arr) => (
              <View
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <Ionicons name={item.icon as any} size={22} color={theme.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 2 }}>
                    {item.label}
                  </Text>
                  <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'semibold'),
              color: theme.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Legal
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
            {[
              'Terms of Service',
              'Privacy Policy',
              'Licenses',
            ].map((item, index, arr) => (
              <View
                key={item}
                style={{
                  padding: 16,
                  borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text
            style={{
              ...getTypographyStyle('sm', 'regular'),
              color: theme.textSecondary,
              textAlign: 'center',
            }}
          >
            © 2025 Sarvagun ERP. All rights reserved.
          </Text>
          <Text
            style={{
              ...getTypographyStyle('xs', 'regular'),
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Made with ❤️ for modern businesses
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
