import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import CelebrationAnimation from "@/components/ui/CelebrationAnimation";
import OnboardingTour from "@/components/layout/OnboardingTour";
import { ONBOARDING_STEPS } from "@/constants/onboardingSteps";

export default function Index() {
  const { isAuthenticated, isLoading, showOnboarding, loadUser, completeOnboarding } = useAuthStore();
  const router = useRouter();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log('🔄 Index routing:', { isAuthenticated, showOnboarding });
      
      try {
        if (isAuthenticated) {
          // Check if onboarding should be shown
          if (showOnboarding) {
            setShowCelebration(true);
          } else {
            router.replace("/(dashboard)/home");
          }
        } else {
          console.log('🔓 Redirecting to login');
          // Use timeout to prevent navigation crashes
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 10);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback - force navigation
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading, showOnboarding]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setShowTour(true);
  };

  const handleOnboardingComplete = async () => {
    setShowTour(false);
    await completeOnboarding();
    router.replace("/(dashboard)/home");
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6D376D" />
      
      {/* Celebration Animation for First-Time Users */}
      <CelebrationAnimation
        visible={showCelebration}
        onComplete={handleCelebrationComplete}
        title="Welcome to Sarvagun! 🎉"
        subtitle="Get ready for an amazing experience"
        duration={3500}
      />
      
      {/* Onboarding Tour */}
      <OnboardingTour
        visible={showTour}
        steps={ONBOARDING_STEPS}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
