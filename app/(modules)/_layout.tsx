import { Stack } from "expo-router";

export default function ModulesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* HR Module */}
      <Stack.Screen name="hr/index" options={{ title: 'HR Management' }} />
      <Stack.Screen name="hr/[id]" options={{ title: 'HR Details' }} />
      <Stack.Screen name="hr/add-employee" options={{ title: 'Add Employee' }} />
      <Stack.Screen name="hr/add-reimbursement" options={{ title: 'Add Reimbursement' }} />
      <Stack.Screen name="hr/apply-leave" options={{ title: 'Apply Leave' }} />
      
      {/* Events Module */}
      <Stack.Screen name="events/index" options={{ title: 'Event Management' }} />
      <Stack.Screen name="events/[id]" options={{ title: 'Event Details' }} />
      <Stack.Screen name="events/add-lead" options={{ title: 'Add Lead' }} />
      <Stack.Screen name="events/add-client" options={{ title: 'Add Client' }} />
      <Stack.Screen name="events/add-venue" options={{ title: 'Add Venue' }} />
      <Stack.Screen name="events/convert-lead" options={{ title: 'Convert Lead' }} />
      <Stack.Screen name="events/add-event" options={{ title: 'Add Event' }} />
      
      {/* Finance Module */}
      <Stack.Screen name="finance/index" options={{ title: 'Finance Management' }} />
      <Stack.Screen name="finance/[id]" options={{ title: 'Finance Details' }} />
      <Stack.Screen name="finance/add-expense" options={{ title: 'Add Expense' }} />
      <Stack.Screen name="finance/add-sale" options={{ title: 'Add Sale' }} />
      
      {/* Notifications Module */}
      <Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
