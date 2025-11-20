import { View, Text } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";

export default function Splash() {
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
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6D376D', marginBottom: 10 }}>Sarvagun</Text>
        <Text style={{ fontSize: 16, color: '#666' }}>ERP System</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <LottieView
        ref={animationRef}
        autoPlay
        loop={false}
        style={{ width: "80%", height: "80%" }}
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
