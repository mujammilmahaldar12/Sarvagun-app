import { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useAuthStore } from "@/store/authStore";
import { designSystem } from "@/constants/designSystem";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { ParticleSystem } from '@/components/ui/ParticleSystem';
import { GRADIENT_PRESETS } from '@/utils/gradientAnimations';

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
  const { triggerHaptic } = useHapticFeedback();

  // Clean, professional animations
  const fadeAnim = useSharedValue(0);
  const slideUp = useSharedValue(20);
  const logoScale = useSharedValue(0.96);
  const buttonScale = useSharedValue(1);
  
  // Subtle input focus animations
  const usernameGlow = useSharedValue(0);
  const passwordGlow = useSharedValue(0);

  useEffect(() => {
    // Smooth entrance
    fadeAnim.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    });
    
    slideUp.value = withTiming(0, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    });
    
    logoScale.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    });
  }, []);
  
  // Minimal input focus
  useEffect(() => {
    usernameGlow.value = withTiming(usernameFocused ? 1 : 0, { duration: 200 });
  }, [usernameFocused]);
  
  useEffect(() => {
    passwordGlow.value = withTiming(passwordFocused ? 1 : 0, { duration: 200 });
  }, [passwordFocused]);

  const handleLogin = async () => {
    if (!username || !password) {
      triggerHaptic('error');
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    // Subtle button press
    buttonScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsLoading(true);
    Keyboard.dismiss();
    
    try {
      const success = await login(username, password);
      if (success) {
        // Clean exit
        fadeAnim.value = withTiming(0, { duration: 300 });
        
        setTimeout(() => {
          if (isFirstTime) {
            router.replace("/welcome-celebration");
          } else {
            router.replace("/(dashboard)/home");
          }
        }, 300);
      } else {
        // Minimal shake
        buttonScale.value = withSequence(
          withTiming(1.02, { duration: 80 }),
          withTiming(0.98, { duration: 80 }),
          withTiming(1, { duration: 80 })
        );
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

  // Clean animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUp.value }],
  }));
  
  const logoStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: logoScale.value }],
  }));
  
  const usernameInputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      usernameGlow.value,
      [0, 1],
      ['rgba(139, 92, 246, 0.2)', 'rgba(109, 55, 109, 0.6)']
    ),
  }));
  
  const passwordInputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      passwordGlow.value,
      [0, 1],
      ['rgba(139, 92, 246, 0.2)', 'rgba(109, 55, 109, 0.6)']
    ),
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A0B2E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <LinearGradient
          colors={["#1A0B2E", "#2D1545", "#3E1F5C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          {/* Subtle purple background blur circles */}
          <Animated.View style={[styles.bgBlur, styles.bgBlur1, containerStyle]} />
          <Animated.View style={[styles.bgBlur, styles.bgBlur2, containerStyle]} />
          
          <Animated.View style={[styles.content, containerStyle]}>
            {/* Logo with rotation animation */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <LottieView
                source={require("@/assets/animations/sarvagun.json")}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </Animated.View>

            {/* Clean welcome message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Enhanced form with animations */}
            <View style={styles.formContainer}>
              {/* Clean username input */}
              <Animated.View style={[styles.inputWrapper, usernameInputStyle]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={usernameFocused ? "#8B5CF6" : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#6B7280"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoComplete="username"
                  textContentType="username"
                  editable={!isLoading}
                />
              </Animated.View>

              {/* Clean password input */}
              <Animated.View style={[styles.inputWrapper, passwordInputStyle]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={passwordFocused ? "#8B5CF6" : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Clean login button */}
              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  style={[
                    styles.button, 
                    (isLoading || !username || !password) && styles.buttonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading || !username || !password}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#6D376D", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.buttonContent}>
                        <LoadingSpinner />
                        <Text style={styles.buttonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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

// Loading Spinner Component
const LoadingSpinner: React.FC = () => {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return (
    <Animated.View style={spinnerStyle}>
      <Ionicons name="sync" size={18} color="#FFFFFF" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  bgBlur: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.06,
    backgroundColor: '#6D376D',
  },
  bgBlur1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  bgBlur2: {
    width: 250,
    height: 250,
    bottom: -50,
    left: -80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(109, 55, 109, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
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
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
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
