import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function CustomerLayout() {
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
      <Stack.Screen name="profile" options={{ title: 'Profil Saya' }} />
      <Stack.Screen name="addresses" options={{ title: 'Daftar Alamat' }} />
      <Stack.Screen name="orders" options={{ title: 'Pesanan & Pengiriman' }} />
      <Stack.Screen name="history" options={{ title: 'Riwayat Selesai' }} />
      <Stack.Screen name="chatbot" options={{ title: 'Chatbot Asisten' }} />
    </Stack>
  );
}
