// Rammen rundt alle skjermene: navigasjon + felles plan-hukommelse.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/components/theme';
import { PlanProvider } from '@/state/PlanContext';

export default function RootLayout() {
  return (
    <PlanProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: 'Tilbake',
        }}>
        <Stack.Screen name="index" options={{ title: 'Løpeplan' }} />
        <Stack.Screen name="mal" options={{ title: 'Ditt mål' }} />
        <Stack.Screen name="forslag" options={{ title: 'Forslag til plan' }} />
        <Stack.Screen name="okt/[dato]" options={{ title: 'Økt' }} />
      </Stack>
    </PlanProvider>
  );
}
