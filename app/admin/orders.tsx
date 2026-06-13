import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Search, Truck, Store, Package, ChevronDown } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = [
  { label: 'Semua', value: '' },
  { label: 'Diproses', value: 'success' },
  { label: 'Dikirim', value: 'shipping' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Menunggu', value: 'pending' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (orderId: string, newStatus: string) => {
    setProcessingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert('Berhasil', `Status pesanan diupdate ke ${newStatus}.`);
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal mengupdate status.');
    } finally {
      setProcessingId(null);
    }
  };

  const getShippingType = (method: string) => {
    if (!method) return 'ekspedisi';
    const lower = method.toLowerCase();
    if (lower.includes('ambil')) return 'ambil';
    if (lower.includes('kurir toko') || lower.includes('sinar abadi')) return 'kurir';
    return 'ekspedisi';
  };

  const renderActions = (order: Order) => {
    const type = getShippingType(order.shippingMethod);

    if (order.status === 'success') {
      if (type === 'ambil') {
        return (
          <Pressable style={styles.actionBtn} onPress={() => updateStatus(order.id, 'completed')} disabled={processingId === order.id}>
            {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionBtnText}>Selesai</Text>}
          </Pressable>
        );
      }
      return (
        <Pressable style={styles.actionBtn} onPress={() => updateStatus(order.id, 'shipping')} disabled={processingId === order.id}>
          {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionBtnText}>Kirim Pesanan</Text>}
        </Pressable>
      );
    }

    if (order.status === 'shipping' && type === 'kurir') {
      return (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => updateStatus(order.id, 'completed')} disabled={processingId === order.id}>
            <Text style={styles.actionBtnText}>Selesai</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Cari ID pesanan..." placeholderTextColor={Colors.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusPills}>
          {STATUS_FILTERS.map((sf) => (
            <Pressable key={sf.value} style={[styles.pill, statusFilter === sf.value && styles.pillActive]} onPress={() => setStatusFilter(sf.value)}>
              <Text style={[styles.pillText, statusFilter === sf.value && styles.pillTextActive]}>{sf.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState title="Tidak ada pesanan" subtitle="Pesanan akan muncul di sini" />
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              <View style={styles.infoRow}>
                <Truck size={14} color={Colors.textMuted} />
                <Text style={styles.infoText}>{order.shippingMethod}</Text>
              </View>
              <View style={styles.infoRow}>
                <Package size={14} color={Colors.textMuted} />
                <Text style={styles.infoText}>{order.items?.length || 0} item — {formatPrice(order.total)}</Text>
              </View>

              {order.shipping?.waybillId && (
                <View style={styles.resiRow}>
                  <Text style={styles.resiLabel}>Resi:</Text>
                  <Text style={styles.resiValue}>{order.shipping.waybillId}</Text>
                </View>
              )}

              {renderActions(order)}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.sm },
  statusPills: { marginBottom: Spacing.md },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.borderLight, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  pillActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  pillText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: Fonts.medium },
  pillTextActive: { color: Colors.primary, fontWeight: Fonts.semibold },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  orderCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  infoText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  resiRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.infoBg, borderRadius: Radius.sm },
  resiLabel: { fontSize: FontSizes.xs, color: Colors.info, fontWeight: Fonts.semibold },
  resiValue: { fontSize: FontSizes.xs, color: Colors.info },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, alignItems: 'center', marginTop: Spacing.md, ...Shadows.sm },
  actionBtnText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
});
