import React from 'react';
import { Stack } from 'expo-router';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function CustomerLayout() {
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
      <Stack.Screen name="profile" options={{ title: 'Profil Saya' }} />
      <Stack.Screen name="addresses" options={{ title: 'Daftar Alamat' }} />
      <Stack.Screen name="orders" options={{ title: 'Pesanan & Pengiriman' }} />
      <Stack.Screen name="history" options={{ title: 'Riwayat Selesai' }} />
    </Stack>
  );
}
