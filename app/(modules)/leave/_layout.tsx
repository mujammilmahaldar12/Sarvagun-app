import { Stack } from 'expo-router';

export default function LeaveLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
