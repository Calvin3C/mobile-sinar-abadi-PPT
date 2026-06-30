import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform, StyleSheet } from 'react-native';
import { ArrowLeft, Crown, User } from 'lucide-react-native';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function OwnerLayout() {
  const router = useRouter();

  const HeaderBack = () => (
    <Pressable 
      onPress={() => router.canGoBack() ? router.back() : router.replace('/owner')}
      style={{ marginLeft: Platform.OS === 'ios' ? 0 : 16, marginRight: 16, paddingVertical: 8 }}
    >
      <ArrowLeft size={24} color={Colors.textMain} />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: { backgroundColor: Colors.white, shadowColor: 'transparent', borderBottomWidth: 1, borderBottomColor: Colors.border },
        headerTitleStyle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },
        headerTintColor: Colors.textMain,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard Owner',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Crown size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Akun Owner',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      
      {/* Screens hidden from tab bar */}
      <Tabs.Screen name="warehouses" options={{ href: null, title: 'Manajemen Gudang', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock" options={{ href: null, title: 'Stok Produk', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="product-form" options={{ href: null, title: 'Form Produk', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="validate-payment" options={{ href: null, title: 'Validasi Pembayaran', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="history" options={{ href: null, title: 'Histori Transaksi', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="admins" options={{ href: null, title: 'Kelola Admin', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profil Owner', headerLeft: () => <HeaderBack />, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: Fonts.medium,
  },
});
