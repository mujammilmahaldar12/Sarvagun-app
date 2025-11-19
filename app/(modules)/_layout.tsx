import { Stack } from "expo-router";

export default function ModulesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="hr" />
      <Stack.Screen name="events" />
      <Stack.Screen name="finance" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="leave" />
    </Stack>
  );
}
