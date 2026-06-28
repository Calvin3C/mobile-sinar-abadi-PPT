import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, Platform,
} from 'react-native';
import { Search, Truck, Store, Package, ChevronDown, Calendar, RefreshCw } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [shippingCode, setShippingCode] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const all = res.data || [];
      setOrders(all.filter((o: Order) => o.status?.toLowerCase() !== 'completed' && o.status?.toLowerCase() !== 'cancelled'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (dateFilter && o.date.split('T')[0] !== dateFilter) return false;
    if (statusFilter && o.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  const updateStatus = async (orderId: string, newStatus: string, code?: string) => {
    setProcessingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus, shippingCode: code || '' });
      Alert.alert('Berhasil', `Status pesanan diupdate ke ${newStatus}.`);
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal mengupdate status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateShipping = () => {
    if (!shippingCode) {
      Alert.alert('Error', 'Silakan masukkan nomor resi.');
      return;
    }
    updateStatus(selectedOrderId, 'shipping', shippingCode);
    setIsShippingModalOpen(false);
  };

  const getShippingType = (method: string) => {
    if (!method) return 'kurir';
    const lower = method.toLowerCase();
    if (lower.includes('ambil')) return 'ambil';
    if (lower.includes('kurir toko') || lower.includes('sinar abadi')) return 'kurir_toko';
    return 'kurir';
  };

  const renderActions = (order: Order) => {
    const type = getShippingType(order.shippingMethod);

    if (order.status?.toUpperCase() !== 'PENDING' && order.status?.toUpperCase() !== 'CANCELLED') {
      if (type === 'kurir') {
        if (order.status?.toUpperCase() === 'SUCCESS' || order.status?.toUpperCase() === 'VERIFIED') {
          return (
            <Pressable style={styles.actionBtn} onPress={() => {
              setSelectedOrderId(order.id);
              setShippingCode('');
              setIsShippingModalOpen(true);
            }}>
              <Text style={styles.actionBtnText}>Cetak Resi</Text>
            </Pressable>
          );
        }
      } else if (type === 'ambil') {
        if (order.status?.toUpperCase() === 'SUCCESS' || order.status?.toUpperCase() === 'VERIFIED') {
          return (
            <Pressable style={styles.actionBtn} onPress={() => updateStatus(order.id, 'completed', 'Diambil di toko')} disabled={processingId === order.id}>
              {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionBtnText}>Selesai</Text>}
            </Pressable>
          );
        }
      } else if (type === 'kurir_toko') {
        if (order.status?.toUpperCase() === 'SUCCESS' || order.status?.toUpperCase() === 'VERIFIED' || order.status?.toUpperCase() === 'SHIPPING') {
          return (
            <View style={styles.actionRow}>
              {order.status?.toUpperCase() !== 'SHIPPING' && (
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.warning, marginRight: 8 }]} onPress={() => updateStatus(order.id, 'shipping', 'Kurir Toko - Dalam Pengiriman')} disabled={processingId === order.id}>
                  {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionBtnText}>Kirim</Text>}
                </Pressable>
              )}
              <Pressable style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => updateStatus(order.id, 'completed', 'Kurir Toko')} disabled={processingId === order.id}>
                {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionBtnText}>Selesai</Text>}
              </Pressable>
            </View>
          );
        }
      }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm, paddingHorizontal: Spacing.lg }}>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: 8,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: Radius.md,
                fontSize: FontSizes.sm,
                color: Colors.textMain,
                backgroundColor: Colors.white,
                outline: 'none',
              } as any}
            />
          ) : (
            <Pressable onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={{ marginLeft: 8, fontSize: FontSizes.sm, color: dateFilter ? Colors.textMain : Colors.textMuted }}>
                {dateFilter ? dateFilter : 'Pilih Tanggal'}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={resetFilters} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={{ marginLeft: 6, fontSize: FontSizes.sm, fontWeight: Fonts.medium, color: Colors.primary }}>Reset Filter</Text>
          </Pressable>
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowDatePicker(false)}>
              <View style={{ backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.lg, width: '90%', maxWidth: 350 }} onStartShouldSetResponder={() => true}>
                <Text style={{ fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md, textAlign: 'center' }}>
                  Pilih Tanggal
                </Text>
                <DateTimePicker
                  value={dateFilter ? new Date(dateFilter) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  themeVariant="light"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selectedDate) {
                      setDateFilter(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <Pressable onPress={() => setShowDatePicker(false)} style={{ backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md }}>
                    <Text style={{ color: Colors.white, fontWeight: Fonts.bold }}>Selesai</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Modal>
        )}
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

      {/* Modal Resi */}
      <Modal
        visible={isShippingModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsShippingModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Input Kode Resi Pengiriman</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor Resi / Bukti Jalan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: JT-12345678"
                value={shippingCode}
                onChangeText={setShippingCode}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnOutline]} onPress={() => setIsShippingModalOpen(false)}>
                <Text style={styles.modalBtnOutlineText}>Batal</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleUpdateShipping}>
                <Text style={styles.modalBtnPrimaryText}>Kirim Barang</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, width: '100%', maxWidth: 400, ...Shadows.lg },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.lg },
  formGroup: { marginBottom: Spacing.xl },
  label: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSizes.base, color: Colors.textMain },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnOutline: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  modalBtnPrimary: { backgroundColor: Colors.primary },
  modalBtnOutlineText: { color: Colors.textMain, fontWeight: Fonts.bold, fontSize: FontSizes.sm },
  modalBtnPrimaryText: { color: Colors.white, fontWeight: Fonts.bold, fontSize: FontSizes.sm },
});
