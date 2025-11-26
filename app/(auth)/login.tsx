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
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { designSystem } from "@/constants/designSystem";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();
  const { isFirstTime } = useFirstTimeUser();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#6D376D", "#8B4789", "#A658A6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated Background Elements */}
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section with Animation */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <LottieView
                source={require("@/assets/animations/sarvagun.json")}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Sarvagun ERP</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlideAnim }],
              },
            ]}
          >
            <View style={styles.form}>
              {/* Username Input */}
              <View style={[
                styles.inputContainer,
                usernameFocused && styles.inputFocused
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={usernameFocused ? "#fff" : "#E0D4E0"} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#E0D4E0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View style={[
                styles.inputContainer,
                passwordFocused && styles.inputFocused
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={passwordFocused ? "#fff" : "#E0D4E0"} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#E0D4E0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#E0D4E0"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, (isLoading || !username || !password) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading || !username || !password}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#fff", "#f0f0f0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.buttonText}>Logging in</Text>
                      <View style={styles.loadingDots}>
                        <Text style={styles.buttonText}>.</Text>
                        <Text style={styles.buttonText}>.</Text>
                        <Text style={styles.buttonText}>.</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Login</Text>
                      <Ionicons name="arrow-forward" size={20} color="#6D376D" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.footerText}>Sarvagun ERP System v1.0</Text>
            <Text style={[styles.footerText, styles.footerSubtext]}>
              Powered by BlingSquare
            </Text>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundCircle1: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -width * 0.5,
    left: -width * 0.3,
  },
  backgroundCircle2: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    bottom: -width * 0.4,
    right: -width * 0.3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  lottieAnimation: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 32,
    fontWeight: designSystem.typography.weights.bold,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    marginBottom: 32,
  },
  form: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  button: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#6D376D",
    fontSize: 18,
    fontWeight: designSystem.typography.weights.bold,
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDots: {
    flexDirection: "row",
    marginLeft: 4,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  footerSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
