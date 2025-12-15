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
  Keyboard,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
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
  interpolateColor,
} from 'react-native-reanimated';
import { useAuthStore } from "@/store/authStore";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const buttonScale = useSharedValue(1);
  const usernameBorder = useSharedValue(0);
  const passwordBorder = useSharedValue(0);

  useEffect(() => {
    // Entrance Animation
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    slideUp.value = withSpring(0, { damping: 15 });
  }, []);

  // Focus Animations
  useEffect(() => {
    usernameBorder.value = withTiming(usernameFocused ? 1 : 0, { duration: 250 });
  }, [usernameFocused]);

  useEffect(() => {
    passwordBorder.value = withTiming(passwordFocused ? 1 : 0, { duration: 250 });
  }, [passwordFocused]);

  const handleLogin = async () => {
    if (!username || !password) {
      triggerHaptic('error');
      // Shake effect on button
      buttonScale.value = withSequence(
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
      Alert.alert("Required", "Please enter both username and password");
      return;
    }

    buttonScale.value = withSequence(withTiming(0.95, { duration: 100 }), withTiming(1, { duration: 100 }));
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const success = await login(username, password);
      if (success) {
        if (isFirstTime) {
          router.replace("/welcome-celebration");
        } else {
          router.replace("/(dashboard)/home");
        }
      } else {
        triggerHaptic('error');
        Alert.alert("Login Failed", "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const usernameStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(usernameBorder.value, [0, 1], ['#E5E7EB', '#8B5CF6']),
    borderWidth: interpolateColor(usernameBorder.value, [0, 1], [1, 1.5]),
    backgroundColor: interpolateColor(usernameBorder.value, [0, 1], ['#F9FAFB', '#FFFFFF']),
  }));

  const passwordStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(passwordBorder.value, [0, 1], ['#E5E7EB', '#8B5CF6']),
    borderWidth: interpolateColor(passwordBorder.value, [0, 1], [1, 1.5]),
    backgroundColor: interpolateColor(passwordBorder.value, [0, 1], ['#F9FAFB', '#FFFFFF']),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Background Decors */}
      <View style={styles.backgroundContainer}>
        <View style={styles.purpleBlob} />
        <View style={styles.pinkBlob} />
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.contentContainer, containerStyle]}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("@/assets/images/sarvagun_logo.jpg")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to continue to Sarvagun ERP</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <Animated.View style={[styles.inputContainer, usernameStyle]}>
                <Ionicons name="person-outline" size={20} color={usernameFocused ? "#8B5CF6" : "#9CA3AF"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                />
              </Animated.View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Animated.View style={[styles.inputContainer, passwordStyle]}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? "#8B5CF6" : "#9CA3AF"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#7E22CE', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                  {!isLoading && <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Biometric Placeholder (Visual Only) */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="finger-print-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="scan-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by BlingSquare © 2025</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Simple Loading Spinner
const LoadingSpinner = () => {
  const spinValue = useSharedValue(0);

  useEffect(() => {
    spinValue.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="sync" size={20} color="white" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  purpleBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(126, 34, 206, 0.1)', // Purple
  },
  pinkBlob: {
    position: 'absolute',
    top: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // Pink
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#7E22CE',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#7E22CE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
