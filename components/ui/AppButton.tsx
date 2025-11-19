import { Text, Pressable } from "react-native";
import { useThemeStore } from "@/store/themeStore";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
};

export default function AppButton({ 
  title, 
  onPress, 
  variant = "primary",
  disabled = false 
}: AppButtonProps) {
  const { colors } = useThemeStore();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: 
          variant === "outline" ? "transparent" : 
          disabled ? colors.border : colors.primary,
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: "90%",
        alignSelf: "center",
        marginVertical: 10,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: variant === "outline" ? colors.primary : "#FFFFFF",
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
