import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform, StyleSheet } from 'react-native';
import { ArrowLeft, Shield, User } from 'lucide-react-native';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function AdminLayout() {
  const router = useRouter();

  const HeaderBack = () => (
    <Pressable 
      onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')}
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
          title: 'Dashboard Admin',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Akun Admin',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      
      {/* Screens hidden from tab bar */}
      <Tabs.Screen 
        name="orders" 
        options={{ 
          href: null, 
          title: 'Update Status Order',
          headerLeft: () => <HeaderBack />,
          tabBarStyle: { display: 'none' }
        }} 
      />
      <Tabs.Screen 
        name="delivery" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }} 
      />
      <Tabs.Screen 
        name="customers" 
        options={{ 
          href: null, 
          title: 'Daftar Customer',
          headerLeft: () => <HeaderBack />,
          tabBarStyle: { display: 'none' }
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          href: null, 
          title: 'Profil Admin',
          headerLeft: () => <HeaderBack />,
          tabBarStyle: { display: 'none' }
        }} 
      />
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
