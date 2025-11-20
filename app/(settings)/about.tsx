import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModuleHeader from '@/components/layout/ModuleHeader';

export default function AboutScreen() {
  const { theme } = useTheme();

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader title="About" showBack />

      <ScrollView style={{ flex: 1 }}>
        {/* App Icon */}
        <View
          style={{
            alignItems: 'center',
            padding: 40,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="business" size={50} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.colors.text,
              marginBottom: 8,
            }}
          >
            Sarvagun ERP
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.textSecondary,
            }}
          >
            Version 1.0.0
          </Text>
        </View>

        {/* App Info */}
        <View style={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
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
              <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
                Last Updated
              </Text>
              <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
                November 2025
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            About
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text,
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
              fontSize: 14,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Links
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
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
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Ionicons name={item.icon as any} size={22} color={theme.colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 2 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 15, color: theme.colors.text, fontWeight: '500' }}>
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
              fontSize: 14,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Legal
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
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
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
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
              fontSize: 13,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            © 2025 Sarvagun ERP. All rights reserved.
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
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
