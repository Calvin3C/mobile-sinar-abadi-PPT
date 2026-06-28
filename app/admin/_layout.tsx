import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function AdminLayout() {
  const router = useRouter();

  const HeaderBack = () => (
    <Pressable 
      onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
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
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: 'Update Status Order' }} />
      <Stack.Screen name="delivery" options={{ headerShown: false }} />
      <Stack.Screen name="customers" options={{ title: 'Daftar Customer' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil Admin' }} />
    </Stack>
  );
}
