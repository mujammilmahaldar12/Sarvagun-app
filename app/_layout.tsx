import { Slot } from "expo-router";
import { ThemeProvider } from "@/components/themed/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
