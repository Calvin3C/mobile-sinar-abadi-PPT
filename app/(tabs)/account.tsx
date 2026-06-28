import React from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User, MapPin, Package, History, LogIn, LogOut, ChevronRight,
  Shield, Crown, Settings, Phone, MessageCircle,
} from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function AccountScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <View style={styles.guestLogoContainer}>
            <View style={styles.guestLogo}>
              <Text style={styles.guestLogoText}>SA</Text>
            </View>
            <Text style={styles.guestTitle}>
              SINAR <Text style={{ color: Colors.primary }}>ABADI</Text>
            </Text>
            <Text style={styles.guestSubtitle}>Masuk untuk mengakses semua fitur</Text>
          </View>

          <View style={styles.guestButtons}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <LogIn size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Masuk / Daftar Customer</Text>
            </Pressable>

            <View style={styles.staffDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Staff Login</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.staffButtonsRow}>
              <Pressable
                style={styles.staffButton}
                onPress={() => router.push('/(auth)/admin-login')}
              >
                <Shield size={18} color={Colors.info} />
                <Text style={styles.staffButtonText}>Admin</Text>
              </Pressable>
              <Pressable
                style={styles.staffButton}
                onPress={() => router.push('/(auth)/owner-login')}
              >
                <Crown size={18} color={Colors.warning} />
                <Text style={styles.staffButtonText}>Owner</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Logged in — role-based menu
  const menuItems = getMenuItems(user.role);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileRole}>
              {user.role === 'customer' ? 'Pelanggan' : user.role === 'admin' ? 'Administrator' : 'Owner'}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={12} color={Colors.textMuted} />
              <Text style={styles.profilePhone}>{user.phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, idx) => (
            <Pressable
              key={idx}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.bgColor }]}>
                {item.icon}
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              <ChevronRight size={18} color={Colors.textLight} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getMenuItems(role: string) {
  if (role === 'customer') {
    return [
      { label: 'Profil Saya', description: 'Ubah nama, email, password', route: '/customer/profile', icon: <User size={20} color={Colors.primary} />, bgColor: Colors.primaryBg },
      { label: 'Daftar Alamat', description: 'Kelola alamat pengiriman', route: '/customer/addresses', icon: <MapPin size={20} color={Colors.success} />, bgColor: Colors.successBg },
      { label: 'Pesanan & Pengiriman', description: 'Lihat status pesanan Anda', route: '/customer/orders', icon: <Package size={20} color={Colors.info} />, bgColor: Colors.infoBg },
      { label: 'Riwayat Selesai', description: 'Pesanan yang sudah selesai', route: '/customer/history', icon: <History size={20} color={Colors.successDark} />, bgColor: Colors.successBg },
      { label: 'Lacak Pengiriman', description: 'Lacak status pengiriman', route: '/tracking', icon: <MapPin size={20} color={Colors.warning} />, bgColor: Colors.warningBg },
      { label: 'Chatbot Asisten', description: 'Konsultasi material bangunan', route: '/customer/chatbot', icon: <MessageCircle size={20} color={Colors.primary} />, bgColor: Colors.primaryBg },
    ];
  }
  if (role === 'admin') {
    return [
      { label: 'Dashboard Admin', description: 'Statistik & kelola pesanan', route: '/admin/dashboard', icon: <Shield size={20} color={Colors.info} />, bgColor: Colors.infoBg },
      { label: 'Profil Saya', description: 'Ubah data profil', route: '/admin/profile', icon: <Settings size={20} color={Colors.textMuted} />, bgColor: Colors.borderLight },
    ];
  }
  // owner
  return [
    { label: 'Dashboard Owner', description: 'Statistik & kelola bisnis', route: '/owner/dashboard', icon: <Crown size={20} color={Colors.warning} />, bgColor: Colors.warningBg },
    { label: 'Profil Saya', description: 'Ubah data profil', route: '/owner/profile', icon: <Settings size={20} color={Colors.textMuted} />, bgColor: Colors.borderLight },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Guest styles
  guestContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  guestLogoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  guestLogo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg, ...Shadows.lg,
  },
  guestLogoText: {
    color: Colors.white, fontSize: FontSizes['3xl'],
    fontWeight: Fonts.extrabold, letterSpacing: 2,
  },
  guestTitle: {
    fontSize: FontSizes['2xl'], fontWeight: Fonts.extrabold,
    color: Colors.textMain, letterSpacing: 2,
  },
  guestSubtitle: {
    fontSize: FontSizes.base, color: Colors.textMuted, marginTop: Spacing.sm,
  },
  guestButtons: {
    gap: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
    ...Shadows.md,
  },
  primaryButtonText: {
    color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold,
  },
  staffDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSizes.sm, color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  staffButtonsRow: {
    flexDirection: 'row', gap: Spacing.md,
  },
  staffButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  staffButtonText: {
    fontSize: FontSizes.base, color: Colors.textSecondary, fontWeight: Fonts.medium,
  },
  // Profile styles
  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.xl, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    color: Colors.white, fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
  },
  profileInfo: {
    marginLeft: Spacing.lg, flex: 1,
  },
  profileName: {
    fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain,
  },
  profileRole: {
    fontSize: FontSizes.sm, color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  profilePhone: {
    fontSize: FontSizes.xs, color: Colors.textMuted,
  },
  menuSection: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIconCircle: {
    width: 40, height: 40, borderRadius: Radius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1, marginLeft: Spacing.md,
  },
  menuLabel: {
    fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain,
  },
  menuDesc: {
    fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing['2xl'], marginBottom: Spacing['4xl'],
    marginHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  logoutText: {
    fontSize: FontSizes.base, color: Colors.danger, fontWeight: Fonts.semibold,
  },
});
