import React from 'react';
import { Stack } from 'expo-router';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function OwnerLayout() {
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
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard Owner' }} />
      <Stack.Screen name="stock" options={{ title: 'Stok Produk' }} />
      <Stack.Screen name="product-form" options={{ title: 'Form Produk' }} />
      <Stack.Screen name="validate-payment" options={{ title: 'Validasi Pembayaran' }} />
      <Stack.Screen name="history" options={{ title: 'Histori Transaksi' }} />
      <Stack.Screen name="admins" options={{ title: 'Kelola Admin' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil Owner' }} />
    </Stack>
  );
}
