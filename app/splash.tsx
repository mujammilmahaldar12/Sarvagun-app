import { View } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef } from "react";
import { router } from "expo-router";

export default function Splash() {
  const animationRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      router.replace("/"); // Go to home screen
    }, 2000);
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <LottieView
        ref={animationRef}
        autoPlay
        loop={false}
        style={{ width: "100%", height: "100%" }}
        source={require("../assets/animations/sarvagun.json")}
      />
    </View>
  );
}
