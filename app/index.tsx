import Screen from "@/components/layout/Screen";
import Header from "@/components/layout/Header";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import { useThemeStore } from "@/store/themeStore";
import { useState } from "react";
import { Text as RNText } from "react-native";

export default function Index() {
  const { toggleMode } = useThemeStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <Header title="Sarvagun App" />
      <Screen>

        <AppInput label="Email" value={email} onChangeText={setEmail} />
        <AppInput label="Password" value={password} onChangeText={setPassword} />

        <AppButton title="Login" onPress={() => {}} />

        <AppCard title="Welcome">
          <RNText className="text-red-500 bg-green-500 text-2xl">TEST</RNText>

        </AppCard>

      </Screen>
    </>
  );
}
