import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Modal, Pressable, Image, Alert, TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { Check, X, Eye, Package, Search, Calendar, RefreshCw } from 'lucide-react-native';
import api from '../../services/api';
import { API_BASE_URL } from '../../constants/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function ValidatePaymentScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showProof, setShowProof] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
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

  const handleValidate = async (orderId: string, action: 'success' | 'cancelled') => {
    const title = action === 'success' ? 'Validasi Pembayaran' : 'Batalkan/Tolak Pembayaran';
    const message = action === 'success' ? 'Terima pembayaran ini?' : 'Tolak dan batalkan pesanan ini?';

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`${title}\n${message}`);
      if (confirm) {
        setProcessingId(orderId);
        try {
          await api.put(`/orders/${orderId}/status`, { status: action });
          window.alert(action === 'success' ? 'Pembayaran divalidasi.' : 'Pesanan berhasil dibatalkan.');
          fetchOrders();
        } catch (e: any) {
          window.alert(e?.response?.data?.error || 'Gagal mengubah status pesanan.');
        } finally {
          setProcessingId(null);
        }
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: action === 'success' ? 'Terima' : 'Batalkan/Tolak',
            style: action === 'success' ? 'default' : 'destructive',
            onPress: async () => {
              setProcessingId(orderId);
              try {
                await api.put(`/orders/${orderId}/status`, { status: action });
                Alert.alert('Berhasil', action === 'success' ? 'Pembayaran divalidasi.' : 'Pesanan berhasil dibatalkan.');
                fetchOrders();
              } catch (e: any) {
                Alert.alert('Error', e?.response?.data?.error || 'Gagal mengubah status pesanan.');
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setStatusFilter('Semua');
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

    if (statusFilter !== 'Semua') {
      result = result.filter(o => {
        const s = o.status?.toLowerCase();
        const filterMap: Record<string, string[]> = {
          'Menunggu Konfirmasi': ['pending'],
          'Diproses': ['success'],
          'Dikirim': ['shipping'],
          'Dibatalkan': ['cancelled'],
          'Selesai': ['completed']
        };
        const expected = filterMap[statusFilter] || [];
        return expected.includes(s);
      });
    }

    return result;
  }, [orders, searchQuery, dateFilter, statusFilter]);

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingRight: 20 }}>
          {['Semua', 'Menunggu Konfirmasi', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].map(tab => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, statusFilter === tab && styles.tabBtnActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text style={[styles.tabBtnText, statusFilter === tab && styles.tabBtnTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState title="Tidak ada pembayaran" subtitle="Belum ada transaksi yang sesuai dengan filter" />
        ) : (
          filteredOrders.map((order) => {
            const status = order.status?.toLowerCase();
            const isPending = status === 'pending';
            const isCancelled = status === 'cancelled';
            const isCompleted = status === 'completed';
            const isOnlinePayment = order.payment?.paymentMethod?.toLowerCase().includes('midtrans') || order.payment?.paymentMethod?.toLowerCase().includes('online');

            let statusLabel = 'Menunggu';
            let statusColor = Colors.warning;
            let statusBg = Colors.warningBg;
            if (status === 'success') { statusLabel = 'Diproses'; statusColor = Colors.warning; statusBg = Colors.warningBg; }
            if (status === 'shipping') { statusLabel = 'Dikirim'; statusColor = Colors.warning; statusBg = Colors.warningBg; }
            if (isCompleted) { statusLabel = 'Selesai'; statusColor = Colors.success; statusBg = Colors.successBg; }
            if (isCancelled) { statusLabel = 'Dibatalkan'; statusColor = Colors.danger; statusBg = Colors.dangerBg; }

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{order.customer || 'Customer'}</Text>
                  <Text style={styles.userPhone}>{order.phone || '-'}</Text>
                  {order.shippingMethod && (
                    <Text style={styles.shippingMethodText}>Kurir: {order.shippingMethod}</Text>
                  )}
                </View>

                {order.items && order.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQty}>{item.qty}x</Text>
                    <Text style={styles.itemSubtotal}>{formatPrice(item.price * item.qty)}</Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Tagihan:</Text>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                </View>

                <View style={styles.actionsRow}>
                  {order.proofUploaded && order.proofUrl ? (
                    <Pressable
                      style={styles.viewProofBtn}
                      onPress={() => {
                        let url = order.proofUrl || '';
                        if (url.includes('/storage/proofs/')) {
                          const pathInfo = url.substring(url.indexOf('/storage/proofs/'));
                          const baseUrl = API_BASE_URL.replace('/api', '');
                          url = `${baseUrl}${pathInfo}`;
                        } else if (url.startsWith('/')) {
                          const baseUrl = API_BASE_URL.replace('/api', '');
                          url = `${baseUrl}${url}`;
                        } else if (url.includes(':8000')) {
                          const baseUrl = API_BASE_URL.replace('/api', '');
                          url = url.replace(/^https?:\/\/[^\/]+:8000/, baseUrl);
                        }
                        setProofUrl(url);
                        setShowProof(true);
                      }}
                    >
                      <Eye size={16} color={Colors.info} />
                      <Text style={[styles.actionText, { color: Colors.info }]}>Lihat Bukti</Text>
                    </Pressable>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FontSizes.xs, fontStyle: 'italic', color: Colors.textMuted }}>
                        {order.proofUploaded ? 'Bukti Uploaded' : 'Tidak Ada Bukti Transfer'}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {isPending ? (
                      isOnlinePayment ? (
                        <Text style={styles.midtransLabel}>Menunggu Midtrans</Text>
                      ) : (
                        <>
                          <Pressable
                            style={styles.rejectActionBtn}
                            onPress={() => handleValidate(order.id, 'cancelled')}
                            disabled={processingId === order.id}
                          >
                            <X size={18} color={Colors.white} />
                          </Pressable>
                          <Pressable
                            style={styles.acceptActionBtn}
                            onPress={() => handleValidate(order.id, 'success')}
                            disabled={processingId === order.id}
                          >
                            <Check size={18} color={Colors.white} />
                            <Text style={styles.acceptActionText}>Validasi</Text>
                          </Pressable>
                        </>
                      )
                    ) : (
                      !isCancelled && !isCompleted && (
                        <Pressable
                          style={styles.cancelBtn}
                          onPress={() => handleValidate(order.id, 'cancelled')}
                          disabled={processingId === order.id}
                        >
                          <X size={16} color={Colors.danger} />
                          <Text style={styles.cancelBtnText}>Batalkan</Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Proof Modal */}
      <Modal visible={showProof} transparent animationType="fade">
        <View style={styles.proofModalOverlay}>
          <Pressable style={styles.proofModalClose} onPress={() => setShowProof(false)}>
            <X size={24} color={Colors.white} />
          </Pressable>
          {proofUrl ? (
            <View style={{ width: '100%', height: '80%', alignItems: 'center' }}>
              <Image source={{ uri: proofUrl }} style={styles.proofImage} resizeMode="contain" />
            </View>
          ) : (
            <Text style={{ color: Colors.white }}>Gambar tidak tersedia</Text>
          )}
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
  
  tabRow: { flexDirection: 'row', marginTop: Spacing.sm, height: 35 },
  tabBtn: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.xl, backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.xs, height: 26, justifyContent: 'center' },
  tabBtnActive: { backgroundColor: '#eafff2', borderColor: '#16a34a' },
  tabBtnText: { fontSize: 10, fontWeight: Fonts.medium, color: Colors.textMuted },
  tabBtnTextActive: { color: '#16a34a', fontWeight: Fonts.bold },

  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm, marginBottom: Spacing.sm },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.md },
  statusText: { fontSize: 10, fontWeight: Fonts.bold },
  
  userInfo: { marginBottom: Spacing.sm },
  userName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  userPhone: { fontSize: FontSizes.xs, color: Colors.textMuted },
  shippingMethodText: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2, fontWeight: Fonts.medium },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, borderStyle: 'dashed' },
  itemName: { fontSize: FontSizes.xs, color: Colors.textMain, flex: 2 },
  itemQty: { fontSize: FontSizes.xs, color: Colors.textSecondary, flex: 0.5, textAlign: 'center' },
  itemSubtotal: { fontSize: FontSizes.xs, color: Colors.textMain, flex: 1, textAlign: 'right', fontWeight: Fonts.medium },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingVertical: 4 },
  totalLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: Fonts.medium },
  orderTotal: { fontSize: FontSizes.sm, fontWeight: Fonts.extrabold, color: Colors.primary },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  viewProofBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.info },
  actionText: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold },
  
  rejectActionBtn: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  acceptActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.success, ...Shadows.sm },
  acceptActionText: { color: Colors.white, fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.danger },
  cancelBtnText: { color: Colors.danger, fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  
  midtransLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontStyle: 'italic' },
  
  proofModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  proofModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  proofImage: { width: '90%', height: '70%' },
});
