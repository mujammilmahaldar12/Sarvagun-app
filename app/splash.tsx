import React, { View, Text, StyleSheet, Animated } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { spacing } from '@/constants/designSystem';
import { LinearGradient } from 'expo-linear-gradient';

export default function Splash() {
  const { theme, isDark } = useTheme();
  const animationRef = useRef(null);
  const [animationError, setAnimationError] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const letterAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Start animations sequence
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate letters one by one (typing effect)
    const letterAnimations = letterAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        delay: index * 100 + 300,
        useNativeDriver: true,
      })
    );
    Animated.stagger(50, letterAnimations).start();

    // Navigate after animation
    const timer = setTimeout(() => {
      router.replace("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const letters = "SARVAGUN".split("");

  return (
    <LinearGradient
      colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#FFFFFF', '#F1F5F9', '#E2E8F0']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Animated Logo/Icon (if you want to keep Lottie) */}
      {!animationError && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            marginBottom: spacing.xl,
          }}
        >
          <LottieView
            ref={animationRef}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
            source={require("../assets/animations/sarvagun.json")}
            onAnimationFailure={(error) => {
              if (__DEV__) {
                console.warn('Lottie animation failed:', error);
              }
              setAnimationError(true);
            }}
          />
        </Animated.View>
      )}

      {/* Animated Text with Letter-by-Letter Effect */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        }}
      >
        <View style={styles.textContainer}>
          {letters.map((letter, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.letter,
                { color: theme.primary },
                {
                  opacity: letterAnims[index],
                  transform: [
                    {
                      translateY: letterAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Subtitle with fade effect */}
        <Animated.Text
          style={[
            styles.subtitle,
            { color: theme.textSecondary },
            { opacity: fadeAnim },
          ]}
        >
          Enterprise Resource Planning
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { color: theme.textSecondary },
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7],
              }),
            },
          ]}
        >
          Powered by BlingSquare
        </Animated.Text>
      </Animated.View>

      {/* Loading dots animation */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: fadeAnim },
        ]}
      >
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: theme.primary },
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  letter: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...getTypographyStyle('base', 'semibold'),
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagline: {
    ...getTypographyStyle('sm', 'medium'),
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
