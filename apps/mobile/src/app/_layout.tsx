import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrate } from '../db/schema';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="work360.db" onInit={migrate}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'WORK360' }} />
        <Stack.Screen name="catat" options={{ title: 'Catat Aktivitas' }} />
        <Stack.Screen name="kegiatan/[id]/index" options={{ title: 'Kegiatan' }} />
        <Stack.Screen name="kegiatan/[id]/selesai" options={{ title: 'Selesaikan Kegiatan' }} />
      </Stack>
    </SQLiteProvider>
  );
}
