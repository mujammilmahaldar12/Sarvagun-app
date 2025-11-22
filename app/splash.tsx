import React, { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';

export default function Splash() {
  const { theme } = useTheme();
  const animationRef = useRef(null);
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (animationError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Sarvagun</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>ERP System</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LottieView
        ref={animationRef}
        autoPlay
        loop={false}
        style={styles.animation}
        source={require("../assets/animations/sarvagun.json")}
        onAnimationFailure={(error) => {
          if (__DEV__) {
            console.warn('Lottie animation failed:', error);
          }
          setAnimationError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...getTypographyStyle('4xl', 'bold'),
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...getTypographyStyle('lg', 'medium'),
  },
  animation: {
    width: '80%',
    height: '80%',
  },
});
