import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  bgColor: string;
}

const MODULES: Module[] = [
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Manage employees, attendance & payroll',
    icon: 'people',
    route: '/(modules)/hr',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'events',
    name: 'Event Management',
    description: 'Plan & organize company events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Track expenses & financial records',
    icon: 'cash',
    route: '/(modules)/finance',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Monitor projects & tasks',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'leave',
    name: 'Leave Management',
    description: 'Apply & approve leave requests',
    icon: 'exit',
    route: '/(modules)/leave',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
];

export default function ModulesScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const handleModulePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 48,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.text }}
        >
          Modules
        </Text>
        <Text
          className="text-base"
          style={{ color: theme.colors.textSecondary, fontSize: 15 }}
        >
          Access all ERP modules from here
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
      >
        {MODULES.map((module, index) => (
          <Pressable
            key={module.id}
            onPress={() => handleModulePress(module.route)}
            className="mb-4"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              className="rounded-2xl p-5 flex-row items-center"
              style={{
                backgroundColor: theme.colors.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Icon Container */}
              <View
                className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                style={{
                  backgroundColor: isDark ? `${module.color}20` : module.bgColor,
                }}
              >
                <Ionicons name={module.icon} size={28} color={module.color} />
              </View>

              {/* Content */}
              <View className="flex-1">
                <Text
                  className="text-lg font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {module.name}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary, fontSize: 14 }}
                >
                  {module.description}
                </Text>
              </View>

              {/* Arrow Icon */}
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
