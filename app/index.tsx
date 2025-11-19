import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      // Small delay to ensure root layout is mounted
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(dashboard)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mounted, isAuthenticated, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#6D376D" />
    </View>
  );
}
