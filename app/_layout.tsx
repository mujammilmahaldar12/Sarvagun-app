// app/_layout.tsx
import "./global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ThemeWrapper from "@/components/themed/ThemeWrapper";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeWrapper>
          <StatusBar style="auto" />
          <Slot />
        </ThemeWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
