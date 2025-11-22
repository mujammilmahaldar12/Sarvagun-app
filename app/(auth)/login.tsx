import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { designSystem } from "@/constants/designSystem";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        router.replace("/(dashboard)/home");
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.title}>Welcome to Sarvagun</Text>
        <Text style={styles.subtitle}>Login to access your ERP dashboard</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || !username || !password}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sarvagun ERP System v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#fff",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: "#6D376D",
    borderRadius: 20,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: designSystem.typography.sizes['4xl'],
    color: "#fff",
    fontWeight: designSystem.typography.weights.bold,
  },
  title: {
    fontSize: designSystem.typography.sizes['2xl'],
    fontWeight: designSystem.typography.weights.bold,
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: designSystem.typography.sizes.base,
    color: "#666",
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: designSystem.borderRadius.md,
    paddingHorizontal: designSystem.spacing[4],
    paddingVertical: designSystem.spacing[3],
    marginBottom: designSystem.spacing[4],
    fontSize: designSystem.typography.sizes.base,
  },
  button: {
    backgroundColor: "#6D376D",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: designSystem.typography.sizes.base,
    fontWeight: designSystem.typography.weights.semibold,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: designSystem.typography.sizes.sm,
    color: "#666",
  },
});
