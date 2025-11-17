import { Text, View, Button, StyleSheet } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { useState } from "react";

const themeColors = {
  "default-light": { background: "#ffffff", foreground: "#000000", primary: "#7f16ff" },
  "default-dark": { background: "#1a1a1a", foreground: "#ffffff", primary: "#9f3fff" },
  "winter-light": { background: "#E0F7FA", foreground: "#004D40", primary: "#00ACC1" },
  "winter-dark": { background: "#004D40", foreground: "#E0F7FA", primary: "#26C6DA" },
  "ganpati-light": { background: "#FFF3E0", foreground: "#BF360C", primary: "#E65100" },
  "ganpati-dark": { background: "#BF360C", foreground: "#FFF3E0", primary: "#FF6F00" },
};

export default function Index() {
  const { toggleMode, setTheme, theme, mode } = useThemeStore();
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);

  const themeKey = `${theme}-${mode}` as keyof typeof themeColors;
  const colors = themeColors[themeKey];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Welcome to Sarvagun App!
      </Text>
      <Text style={[styles.count, { color: colors.foreground }]}>
        Count: {count}
      </Text>
      <Text style={[styles.info, { color: colors.foreground }]}>
        Theme: {theme} | Mode: {mode}
      </Text>

      <Button title="Increment" onPress={increment} />

      <Button title="Toggle Light/Dark" onPress={toggleMode} />
      <Button title="Default Theme" onPress={() => setTheme("default")} />
      <Button title="Winter Theme" onPress={() => setTheme("winter")} />
      <Button title="Ganpati Theme" onPress={() => setTheme("ganpati")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  count: {
    fontSize: 20,
    marginVertical: 16,
  },
  info: {
    fontSize: 14,
    marginVertical: 8,
  },
});
