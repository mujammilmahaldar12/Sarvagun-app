import { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { designSystem } from "@/constants/designSystem";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();
  const { isFirstTime } = useFirstTimeUser();

  // Professional, smooth animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Clean entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        // Add a slight delay for smooth transition
        setTimeout(() => {
          if (isFirstTime) {
            router.replace("/welcome-celebration");
          } else {
            router.replace("/(dashboard)/home");
          }
        }, 300);
      } else {
        Alert.alert(
          "Login Failed", 
          "Invalid username or password. Please check your credentials and try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Connection Error", 
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={["#0A0A0A", "#1A1A2E", "#16213E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View 
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideUp }]
              }
            ]}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <LottieView
                source={require("@/assets/animations/sarvagun.json")}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>

            {/* Welcome message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Clean form */}
            <View style={styles.formContainer}>
              {/* Username */}
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color="#7C7C8A" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#5A5A66"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#7C7C8A" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#5A5A66"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#7C7C8A"
                  />
                </TouchableOpacity>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={[
                  styles.button, 
                  (isLoading || !username || !password) && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading || !username || !password}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Authenticating...</Text>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Sarvagun ERP • Powered by BlingSquare</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  formContainer: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: "center",
    marginTop: 50,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
});
