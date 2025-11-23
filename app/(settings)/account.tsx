import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { authService } from '@/services/auth.service';
import * as ImagePicker from 'expo-image-picker';

export default function AccountScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.mobileno || '',
    designation: user?.designation || '',
    address: user?.address || '',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const profileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        mobileno: formData.phone,
        designation: formData.designation,
        address: formData.address,
      };

      const response = await authService.updateProfile(profileData);
      
      // Update user in auth store
      if (response.user) {
        setUser(response.user);
      }

      Alert.alert('Success', response.message || 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.mobileno) {
        errorMessage = error.response.data.mobileno[0];
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission to change photo');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        
        const response = await authService.uploadProfilePhoto(result.assets[0].uri);
        
        // Update user in auth store
        if (user && response.photo_url) {
          const updatedUser: typeof user = { ...user, photo: response.photo_url };
          setUser(updatedUser);
        }
        
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error: any) {
      console.error('Photo upload error:', error);
      
      let errorMessage = 'Failed to upload photo';
      if (error.response?.data?.photo) {
        errorMessage = error.response.data.photo[0];
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploadingPhoto(false);
    }
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
        borderBottomColor: theme.border,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, marginBottom: 4 }}>
          {label}
        </Text>
        <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
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
      <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary, marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.background,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            paddingVertical: 12,
            ...getTypographyStyle('base'),
            color: theme.text,
          }}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
            disabled={isSaving}
            style={{ padding: designSystem.spacing.sm }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={{ color: theme.primary, ...getTypographyStyle('base', 'semibold') }}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Picture */}
        <View
          style={{
            alignItems: 'center',
            padding: designSystem.spacing.xl,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ ...getTypographyStyle('4xl', 'bold'), color: theme.textInverse }}>
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </Text>
          </View>
          {isEditing && (
            <TouchableOpacity
              onPress={handleChangePhoto}
              disabled={isUploadingPhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: theme.primary + '20',
                borderRadius: 20,
              }}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={18} color={theme.primary} />
                  <Text style={{ marginLeft: 6, color: theme.primary, fontWeight: '600' }}>
                    Change photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Account Information */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              ...getTypographyStyle('lg', 'semibold'),
              color: theme.text,
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
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <EditField
                label="Designation"
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
                icon="briefcase-outline"
              />
              <EditField
                label="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                icon="location-outline"
              />
            </>
          ) : (
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <InfoRow label="First Name" value={user?.first_name || ''} icon="person-outline" />
              <InfoRow label="Last Name" value={user?.last_name || ''} icon="person-outline" />
              <InfoRow label="Email" value={user?.email || ''} icon="mail-outline" />
              <InfoRow label="Phone" value={user?.mobileno || 'Not set'} icon="call-outline" />
              <InfoRow label="Designation" value={user?.designation || 'Not set'} icon="briefcase-outline" />
              <InfoRow label="Address" value={user?.address || 'Not set'} icon="location-outline" />
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, marginBottom: 4 }}>
                    Category
                  </Text>
                  <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                    {user?.category || 'Not set'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Security */}
        <View style={{ padding: designSystem.spacing.lg, paddingTop: 0 }}>
          <Text
            style={{
              ...getTypographyStyle('lg', 'semibold'),
              color: theme.text,
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
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="key-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
                Change password
              </Text>
              <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, marginTop: 2 }}>
                Update your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
