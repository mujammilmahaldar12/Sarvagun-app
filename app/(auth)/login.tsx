/**
 * Login Screen - Dark Gradient Theme
 * Matches the premium look of the new-user onboarding screens
 */
import { useState, useEffect } from "react";
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
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuthStore();

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideUp.value = withTiming(0, { duration: 600 });
  }, []);

  // Clear error when user starts typing
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (loginError) setLoginError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (loginError) setLoginError(null);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    setLoginError(null);
    setIsLoading(true);
    try {
      const success = await login(username.trim(), password);
      if (success) {
        router.replace("/(dashboard)/home");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Extract meaningful error message
      let message = "Wrong password. Please try again.";
      if (error?.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error?.response?.data?.error) {
        message = error.response.data.error;
      } else if (error?.message) {
        // Check for common error patterns
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes("invalid") || errMsg.includes("credential") || errMsg.includes("password") || errMsg.includes("401")) {
          message = "Wrong username or password. Please try again.";
        } else if (errMsg.includes("network") || errMsg.includes("connection")) {
          message = "Network error. Please check your connection.";
        } else {
          message = error.message;
        }
      }
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUp.value }],
  }));

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A0B2E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <LinearGradient
          colors={['#1A0B2E', '#2D1545', '#3E1F5C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View style={[styles.content, containerStyle]}>
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoWrapper}>
                  <Image
                    source={require("../../assets/images/sarvagun_logo.jpg")}
                    style={styles.logo}
                  />
                </View>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitleText}>
                  Sign in to continue to Sarvagun
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                {/* Username Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={[
                    styles.inputWrapper,
                    usernameFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={usernameFocused ? "#8B5CF6" : "#9CA3AF"}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      placeholderTextColor="#6B7280"
                      value={username}
                      onChangeText={handleUsernameChange}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => setUsernameFocused(false)}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordFocused ? "#8B5CF6" : "#9CA3AF"}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#6B7280"
                      value={password}
                      onChangeText={handlePasswordChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Error Message */}
                {loginError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.errorText}>{loginError}</Text>
                  </View>
                )}

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
                >
                  <LinearGradient
                    colors={['#6D376D', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* New User Link */}
                <TouchableOpacity
                  style={styles.newUserLink}
                  onPress={() => router.push('/new-user')}
                >
                  <Text style={styles.newUserText}>
                    New User? <Text style={styles.newUserBold}>Complete your onboarding</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by BlingSquare © 2025</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
}

// Loading Spinner Component
const LoadingSpinner = () => {
  const spinValue = useSharedValue(0);

  useEffect(() => {
    spinValue.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="sync" size={20} color="#fff" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'transparent', // Removed white background
    overflow: 'hidden',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    resizeMode: 'stretch', // Force fill to eliminate any gaps
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(109, 55, 109, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  button: {
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  biometricButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  newUserLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  newUserText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  newUserBold: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
