import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import AppInput from "@/components/ui/AppInput";
import AppButton from "@/components/ui/AppButton";
import Screen from "@/components/layout/Screen";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const { colors } = useThemeStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      router.replace("/(dashboard)/home");
    }
  };

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          {/* Logo */}
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.primary,
              borderRadius: 20,
              marginBottom: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 40, color: "#fff", fontWeight: "bold" }}>
              S
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            Welcome to Sarvagun
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.border,
              textAlign: "center",
            }}
          >
            Login to access your ERP dashboard
          </Text>
        </View>

        {/* Login Form */}
        <View>
          <AppInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
          />

          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <AppButton
            title={isLoading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            disabled={isLoading || !username || !password}
          />
        </View>

        {/* Footer */}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: colors.border }}>
            Sarvagun ERP System v1.0
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
