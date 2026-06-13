import React from 'react';
import { Stack } from 'expo-router';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTitleStyle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },
        headerTintColor: Colors.textMain,
        headerShadowVisible: false,
        headerBackTitle: 'Kembali',
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard Admin' }} />
      <Stack.Screen name="orders" options={{ title: 'Update Status Order' }} />
      <Stack.Screen name="customers" options={{ title: 'Daftar Customer' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil Admin' }} />
    </Stack>
  );
}
