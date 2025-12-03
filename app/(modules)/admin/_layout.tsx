import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function AdminLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Stack.Screen name="audit-logs" />
        </Stack>
    );
}
