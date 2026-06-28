import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Pressable, Modal, TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { Search, Calendar, RefreshCw, X, Package, ArrowRight } from 'lucide-react-native';
import api from '../../services/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function OwnerHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const all = res.data || [];
      setOrders(all.filter((o: Order) => o.status?.toLowerCase() === 'completed'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.customer || '').toLowerCase().includes(q) ||
        (o.items && o.items.some(item => item.name.toLowerCase().includes(q)))
      );
    }

    if (dateFilter) {
      result = result.filter(o => o.createdAt && o.createdAt.startsWith(dateFilter));
    }

    return result;
  }, [orders, searchQuery, dateFilter]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID / Pelanggan / Produk"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.row}>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={styles.webDatePicker}
            />
          ) : (
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={{ marginLeft: 8, fontSize: FontSizes.xs, color: dateFilter ? Colors.textMain : Colors.textMuted }}>
                {dateFilter ? dateFilter : 'Pilih Tanggal'}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={resetFilters} style={styles.resetBtn}>
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={styles.resetBtnText}>Reset Filter</Text>
          </Pressable>
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <Modal transparent animationType="fade" visible={true} onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.dropdownOverlay} onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerContainer}>
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
                  <Pressable onPress={() => setShowDatePicker(false)} style={styles.iosDateConfirmBtn}>
                    <Text style={{ color: Colors.white, fontWeight: Fonts.bold }}>Selesai</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Modal>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState title="Belum ada riwayat" subtitle="Transaksi selesai akan muncul di sini" />
        ) : (
          filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              style={styles.orderCard}
              onPress={() => {
                setSelectedOrder(order);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{order.customer || 'Customer'}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total ({order.items?.length || 0} item)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
                  <ArrowRight size={14} color={Colors.primary} />
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi</Text>
              <Pressable onPress={() => setShowDetailModal(false)}>
                <X size={22} color={Colors.textMain} />
              </Pressable>
            </View>

            {selectedOrder && (
              <ScrollView style={{ maxHeight: '85%' }}>
                {/* Customer Details block */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeader}>Informasi Pelanggan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nama Pelanggan</Text>
                    <Text style={styles.detailValue}>{selectedOrder.customer || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nomor HP</Text>
                    <Text style={styles.detailValue}>{selectedOrder.phone || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tanggal Transaksi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                </View>

                {/* Delivery details block */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeader}>Informasi Pengiriman</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Metode Pengiriman</Text>
                    <Text style={styles.detailValue}>{selectedOrder.shippingMethod || '-'}</Text>
                  </View>
                  {selectedOrder.shipping?.waybillId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nomor Resi</Text>
                      <Text style={[styles.detailValue, { fontFamily: 'monospace', fontWeight: Fonts.bold }]}>
                        {selectedOrder.shipping.waybillId}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Alamat Pengiriman</Text>
                    <Text style={[styles.detailValue, { flex: 1.5, textAlign: 'right' }]}>
                      {selectedOrder.address || '-'}
                    </Text>
                  </View>
                </View>

                {/* Items list block */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeader}>Daftar Item Dibeli</Text>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.itemBlock}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.color && (
                          <Text style={styles.itemVariant}>Varian: {item.color}</Text>
                        )}
                      </View>
                      <Text style={styles.itemQty}>{item.qty}x</Text>
                      <Text style={styles.itemPrice}>{formatPrice(item.price * item.qty)}</Text>
                    </View>
                  ))}
                </View>

                {/* Pricing Summary */}
                <View style={[styles.detailSection, { borderBottomWidth: 0 }]}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
                    <Text style={styles.summaryValue}>
                      {selectedOrder.shipping?.shippingCost === 0 ? 'Gratis' : formatPrice(selectedOrder.shipping?.shippingCost || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontWeight: Fonts.bold, color: Colors.textMain }]}>Total Tagihan</Text>
                    <Text style={[styles.summaryValue, { fontWeight: Fonts.extrabold, color: Colors.primary }]}>
                      {formatPrice(selectedOrder.total)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  
  filterSection: { backgroundColor: Colors.white, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, height: 40 },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSizes.sm, color: Colors.textMain },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webDatePicker: { padding: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, fontSize: 13, color: Colors.textMain, width: 140, outline: 'none' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, width: 140 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetBtnText: { fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.primary },
  
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerContainer: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, width: 340, alignSelf: 'center' },
  iosDateConfirmBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, marginTop: Spacing.md },

  orderCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  userInfo: { marginBottom: Spacing.sm },
  userName: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  totalValue: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain },

  detailSection: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  detailLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  detailValue: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: Fonts.semibold },

  itemBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  itemName: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold, color: Colors.textMain },
  itemVariant: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  itemQty: { fontSize: FontSizes.xs, color: Colors.textSecondary, width: 40, textAlign: 'center' },
  itemPrice: { fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMain, textAlign: 'right' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  summaryValue: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: Fonts.semibold },
});
