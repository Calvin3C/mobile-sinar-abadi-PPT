import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function OwnerLayout() {
  const router = useRouter();

  const HeaderBack = () => (
    <Pressable 
      onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/account')}
      style={{ marginLeft: Platform.OS === 'ios' ? 0 : 8, marginRight: 16, paddingVertical: 8 }}
    >
      <ArrowLeft size={24} color={Colors.textMain} />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTitleStyle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },
        headerTintColor: Colors.textMain,
        headerShadowVisible: false,
        headerLeft: () => <HeaderBack />,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard Owner' }} />
      <Stack.Screen name="warehouses" options={{ title: 'Manajemen Gudang' }} />
      <Stack.Screen name="stock" options={{ title: 'Stok Produk' }} />
      <Stack.Screen name="product-form" options={{ title: 'Form Produk' }} />
      <Stack.Screen name="validate-payment" options={{ title: 'Validasi Pembayaran' }} />
      <Stack.Screen name="history" options={{ title: 'Histori Transaksi' }} />
      <Stack.Screen name="admins" options={{ title: 'Kelola Admin' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil Owner' }} />
    </Stack>
  );
}
