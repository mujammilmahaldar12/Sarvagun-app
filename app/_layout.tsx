import "./global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import FlashMessage from "react-native-flash-message";
import { useEffect } from "react";

export default function RootLayout() {
  const { colors } = useThemeStore();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Protected routes logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inDashboard = segments[0] === "(dashboard)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to dashboard if authenticated and in auth pages
      router.replace("/(dashboard)/home");
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: colors.primary,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Slot />
      <FlashMessage position="top" />
    </View>
  );
}
