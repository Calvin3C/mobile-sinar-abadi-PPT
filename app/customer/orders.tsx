import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, Image, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search, Calendar, MapPin, Truck, Upload, Eye, X, Package,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diproses', value: 'success' },
  { label: 'Dikirim', value: 'shipping' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

export default function CustomerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const all = res.data || [];
      setOrders(all.filter((o: Order) => o.status?.toLowerCase() !== 'completed'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && o.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleUploadProof = async (orderId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingOrderId(orderId);
    try {
      const formData = new FormData();
      formData.append('proof', {
        uri: result.assets[0].uri,
        name: 'proof.jpg',
        type: 'image/jpeg',
      } as any);
      await api.put(`/orders/${orderId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Berhasil', 'Bukti pembayaran berhasil diupload.');
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Error', 'Gagal mengupload bukti pembayaran.');
    } finally {
      setUploadingOrderId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID pesanan..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusPills}>
          {STATUS_FILTERS.map((sf) => (
            <Pressable
              key={sf.value}
              style={[styles.pill, statusFilter === sf.value && styles.pillActive]}
              onPress={() => setStatusFilter(sf.value)}
            >
              <Text style={[styles.pillText, statusFilter === sf.value && styles.pillTextActive]}>
                {sf.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState title="Tidak ada pesanan" subtitle="Pesanan Anda akan muncul di sini" />
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              {/* Items */}
              {order.items?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.color ? <Text style={styles.itemColor}>Warna: {item.color}</Text> : null}
                  </View>
                  <Text style={styles.itemQty}>{item.qty}x</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price * item.qty)}</Text>
                </View>
              ))}

              {/* Shipping info */}
              <View style={styles.shippingRow}>
                <Truck size={14} color={Colors.textMuted} />
                <Text style={styles.shippingText}>{order.shippingMethod}</Text>
                {order.shipping?.shippingCost > 0 && (
                  <Text style={styles.shippingCost}>{formatPrice(order.shipping.shippingCost)}</Text>
                )}
              </View>

              {order.address && (
                <View style={styles.addressRow}>
                  <MapPin size={14} color={Colors.textMuted} />
                  <Text style={styles.addressText} numberOfLines={2}>{order.address}</Text>
                </View>
              )}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Pembayaran</Text>
                <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {/* Track button */}
                {order.status !== 'pending' && order.shippingMethod !== 'Ambil di Toko' && (
                  <Pressable
                    style={styles.trackButton}
                    onPress={() => router.push({ pathname: '/tracking', params: { orderId: order.id } })}
                  >
                    <Text style={styles.trackButtonText}>Lacak</Text>
                  </Pressable>
                )}



                {/* Proof uploaded */}
                {order.status === 'pending' && order.proofUploaded && (
                  <View style={styles.proofUploaded}>
                    <Text style={styles.proofUploadedText}>✓ Bukti terkirim, sedang diverifikasi</Text>
                  </View>
                )}

                {/* View proof */}
                {order.proofUploaded && order.proofUrl && (
                  <Pressable
                    style={styles.viewProofButton}
                    onPress={() => { setProofUrl(order.proofUrl); setShowProofModal(true); }}
                  >
                    <Eye size={14} color={Colors.info} />
                    <Text style={[styles.uploadButtonText, { color: Colors.info }]}>Lihat Bukti</Text>
                  </Pressable>
                )}

                {order.status === 'completed' && (
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedText}>✓ Pesanan Selesai</Text>
                  </View>
                )}
                {order.status === 'cancelled' && (
                  <View style={styles.cancelledInfo}>
                    <Text style={styles.cancelledText}>✗ Pesanan Dibatalkan</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Proof Image Modal */}
      <Modal visible={showProofModal} transparent animationType="fade">
        <View style={styles.proofModalOverlay}>
          <Pressable style={styles.proofModalClose} onPress={() => setShowProofModal(false)}>
            <X size={24} color={Colors.white} />
          </Pressable>
          <Image source={{ uri: proofUrl }} style={styles.proofModalImage} resizeMode="contain" />
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
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  itemName: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.medium },
  itemColor: { fontSize: FontSizes.xs, color: Colors.textMuted },
  itemQty: { fontSize: FontSizes.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  itemPrice: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.semibold },
  shippingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  shippingText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted },
  shippingCost: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: Fonts.semibold },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs },
  addressText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalLabel: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  totalValue: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.primary },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  trackButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.infoBg, borderWidth: 1, borderColor: '#bae6fd' },
  trackButtonText: { fontSize: FontSizes.xs, color: Colors.info, fontWeight: Fonts.semibold },
  uploadButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  uploadButtonText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: Fonts.semibold },
  viewProofButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.info },
  proofUploaded: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  proofUploadedText: { fontSize: FontSizes.xs, color: Colors.success, fontWeight: Fonts.semibold },
  completedInfo: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  completedText: { fontSize: FontSizes.xs, color: Colors.success, fontWeight: Fonts.semibold },
  cancelledInfo: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  cancelledText: { fontSize: FontSizes.xs, color: Colors.danger, fontWeight: Fonts.semibold },
  proofModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  proofModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  proofModalImage: { width: '90%', height: '70%' },
});
