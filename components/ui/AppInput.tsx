import { View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/store/themeStore";

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
};

export default function AppInput({ 
  label, 
  value, 
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default"
}: AppInputProps) {
  const { colors } = useThemeStore();

  return (
    <View style={{ marginVertical: 10, width: "90%", alignSelf: "center" }}>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 14,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.border}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.foreground,
        }}
      />
    </View>
  );
}
