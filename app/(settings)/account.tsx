import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';

export default function AccountScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const handleSave = () => {
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality will be implemented soon',
      [{ text: 'OK' }]
    );
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
          {value || 'Not set'}
        </Text>
      </View>
    </View>
  );

  const EditField = ({ 
    label, 
    value, 
    onChangeText,
    icon,
    keyboardType = 'default'
  }: { 
    label: string; 
    value: string; 
    onChangeText: (text: string) => void;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
  }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '500' }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 16,
            color: theme.colors.text,
          }}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader 
        title="Your account" 
        showBack
        rightActions={
          <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            style={{ padding: 8 }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '600' }}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Picture */}
        <View
          style={{
            alignItems: 'center',
            padding: 24,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' }}>
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </Text>
          </View>
          {isEditing && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: theme.colors.primary + '20',
                borderRadius: 20,
              }}
            >
              <Ionicons name="camera-outline" size={18} color={theme.colors.primary} />
              <Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: '600' }}>
                Change photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Information */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Account information
          </Text>

          {isEditing ? (
            <>
              <EditField
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                icon="person-outline"
              />
              <EditField
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                icon="person-outline"
              />
              <EditField
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                icon="mail-outline"
                keyboardType="email-address"
              />
              <EditField
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <EditField
                label="Department"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                icon="business-outline"
              />
            </>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <InfoRow label="First Name" value={user?.first_name || ''} icon="person-outline" />
              <InfoRow label="Last Name" value={user?.last_name || ''} icon="person-outline" />
              <InfoRow label="Email" value={user?.email || ''} icon="mail-outline" />
              <InfoRow label="Phone" value={user?.phone || 'Not set'} icon="call-outline" />
              <InfoRow label="Department" value={user?.department || 'Not set'} icon="business-outline" />
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                    Role
                  </Text>
                  <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Security */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Security
          </Text>

          <TouchableOpacity
            onPress={handleChangePassword}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                Change password
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 }}>
                Update your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
