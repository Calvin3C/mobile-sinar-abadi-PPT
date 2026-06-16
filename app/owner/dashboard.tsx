import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  DollarSign, CheckCircle, AlertTriangle, Users, Package, CreditCard,
  History, Shield, ChevronRight, BarChart3, Store,
} from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function OwnerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ revenue: 0, completed: 0, needRestock: 0, adminCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes, adminsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products', { params: { limit: 1000 } }),
        api.get('/users/admins'),
      ]);
      const orders = ordersRes.data || [];
      const products = productsRes.data?.products || [];
      const admins = adminsRes.data || [];

      const completedOrders = orders.filter((o: any) => o.status === 'completed');
      const revenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const needRestock = products.filter((p: any) => p.stock <= 0).length;

      setStats({
        revenue,
        completed: completedOrders.length,
        needRestock,
        adminCount: admins.length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const menuItems = [
    { label: 'Manajemen Gudang', desc: 'Kelola gudang & logistik', icon: <Store size={22} color={Colors.warning} />, bg: Colors.warningBg, route: '/owner/warehouses' },
    { label: 'Stok Produk', desc: 'Kelola stok & produk', icon: <Package size={22} color={Colors.primary} />, bg: Colors.primaryBg, route: '/owner/stock' },
    { label: 'Validasi Pembayaran', desc: 'Verifikasi pembayaran masuk', icon: <CreditCard size={22} color={Colors.success} />, bg: Colors.successBg, route: '/owner/validate-payment' },
    { label: 'Histori Transaksi', desc: 'Lihat semua transaksi', icon: <History size={22} color={Colors.info} />, bg: Colors.infoBg, route: '/owner/history' },
    { label: 'Kelola Staf Admin', desc: 'Tambah/edit administrator', icon: <Shield size={22} color={Colors.warning} />, bg: Colors.warningBg, route: '/owner/admins' },
    { label: 'Profil Saya', desc: 'Ubah data profil', icon: <BarChart3 size={22} color={Colors.textMuted} />, bg: Colors.borderLight, route: '/owner/profile' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[Colors.primary]} />}
    >
      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Omzet Finansial', value: loading ? '...' : formatPrice(stats.revenue), color: Colors.success, icon: <DollarSign size={20} color={Colors.success} /> },
          { label: 'Transaksi Selesai', value: loading ? '...' : String(stats.completed), color: Colors.info, icon: <CheckCircle size={20} color={Colors.info} /> },
          { label: 'Butuh Restock', value: loading ? '...' : String(stats.needRestock), color: Colors.danger, icon: <AlertTriangle size={20} color={Colors.danger} /> },
          { label: 'Staf Admin', value: loading ? '...' : String(stats.adminCount), color: Colors.warning, icon: <Users size={20} color={Colors.warning} /> },
        ].map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            {stat.icon}
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSizes.lg, fontWeight: Fonts.extrabold, marginTop: Spacing.sm },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  menuSection: { backgroundColor: Colors.white, borderRadius: Radius.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon: { width: 44, height: 44, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuLabel: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain },
  menuDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
});
