import { TextInput } from "react-native-paper";
import { useThemeStore } from "@/store/themeStore";

export default function AppInput({ label, value, onChangeText }: any) {
  const theme = useThemeStore();

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      outlineColor={theme.mode === "dark" ? "#4b5563" : "#d1d5db"}
      style={{
        marginVertical: 10,
        width: "90%",
        height: 54,
        justifyContent: "center",
      }}
      contentStyle={{ fontSize: 16 }}
    />
  );
}
