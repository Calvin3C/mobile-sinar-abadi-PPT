import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package, Clock, Users, ChevronRight, BarChart3,
} from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/users'),
      ]);
      const orders = ordersRes.data || [];
      const users = usersRes.data || [];
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        totalCustomers: users.length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const menuItems = [
    { label: 'Update Status Order', desc: 'Kelola status pesanan', icon: <Package size={22} color={Colors.info} />, bg: Colors.infoBg, route: '/admin/orders' },
    { label: 'Daftar Customer', desc: 'Lihat semua pelanggan', icon: <Users size={22} color={Colors.success} />, bg: Colors.successBg, route: '/admin/customers' },
    { label: 'Profil Saya', desc: 'Ubah data profil', icon: <BarChart3 size={22} color={Colors.textMuted} />, bg: Colors.borderLight, route: '/admin/profile' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[Colors.primary]} />}
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Pesanan', value: stats.totalOrders, color: Colors.primary, icon: <Package size={20} color={Colors.primary} /> },
          { label: 'Menunggu Status', value: stats.pendingOrders, color: Colors.warning, icon: <Clock size={20} color={Colors.warning} /> },
          { label: 'Total Pelanggan', value: stats.totalCustomers, color: Colors.success, icon: <Users size={20} color={Colors.success} /> },
        ].map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            {stat.icon}
            <Text style={[styles.statValue, { color: stat.color }]}>
              {loading ? '...' : stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {menuItems.map((item, idx) => (
          <Pressable key={idx} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textLight} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSizes['2xl'], fontWeight: Fonts.extrabold, marginTop: Spacing.sm },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  menuSection: { backgroundColor: Colors.white, borderRadius: Radius.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon: { width: 44, height: 44, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuLabel: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain },
  menuDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
});
