import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Modal, Pressable, Image, Alert,
} from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { Check, X, Eye, Package } from 'lucide-react-native';
import api from '../../services/api';
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

  const fetchPendingPayments = async () => {
    try {
      const res = await api.get('/orders');
      const allOrders = res.data || [];
      // Filter pending orders with uploaded proofs
      const pendingTransfers = allOrders.filter((o: Order) =>
        o.status === 'pending' &&
        o.paymentMethod === 'Transfer Bank' &&
        o.proofUploaded
      );
      setOrders(pendingTransfers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleValidate = async (orderId: string, action: 'success' | 'cancelled') => {
    Alert.alert(
      action === 'success' ? 'Validasi Pembayaran' : 'Tolak Pembayaran',
      action === 'success' ? 'Terima pembayaran ini?' : 'Tolak dan batalkan pesanan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action === 'success' ? 'Terima' : 'Tolak',
          style: action === 'success' ? 'default' : 'destructive',
          onPress: async () => {
            setProcessingId(orderId);
            try {
              await api.put(`/orders/${orderId}/status`, { status: action });
              Alert.alert('Berhasil', action === 'success' ? 'Pembayaran divalidasi.' : 'Pembayaran ditolak.');
              fetchPendingPayments();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error || 'Gagal mengubah status pesanan.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPendingPayments(); }} colors={[Colors.primary]} />}
      >
        {orders.length === 0 ? (
          <EmptyState title="Tidak ada pembayaran" subtitle="Belum ada bukti transfer baru yang perlu divalidasi" />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{order.user?.name || 'Customer'}</Text>
                <Text style={styles.userPhone}>{order.user?.phone || '-'}</Text>
              </View>

              <View style={styles.itemsSummary}>
                <Package size={14} color={Colors.textMuted} />
                <Text style={styles.itemsText}>{order.items?.length || 0} Item dipesan</Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.viewProofBtn}
                  onPress={() => {
                    setProofUrl(order.proofUrl || '');
                    setShowProof(true);
                  }}
                >
                  <Eye size={16} color={Colors.info} />
                  <Text style={[styles.actionText, { color: Colors.info }]}>Lihat Bukti</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => handleValidate(order.id, 'cancelled')}
                    disabled={processingId === order.id}
                  >
                    {processingId === order.id ? <ActivityIndicator size="small" color={Colors.danger} /> : <X size={18} color={Colors.danger} />}
                  </Pressable>
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleValidate(order.id, 'success')}
                    disabled={processingId === order.id}
                  >
                    {processingId === order.id ? <ActivityIndicator size="small" color={Colors.white} /> : (
                      <>
                        <Check size={16} color={Colors.white} />
                        <Text style={styles.acceptText}>Validasi</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Proof Modal */}
      <Modal visible={showProof} transparent animationType="fade">
        <View style={styles.proofModalOverlay}>
          <Pressable style={styles.proofModalClose} onPress={() => setShowProof(false)}>
            <X size={24} color={Colors.white} />
          </Pressable>
          {proofUrl ? (
            <Image source={{ uri: proofUrl }} style={styles.proofImage} resizeMode="contain" />
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
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm, marginBottom: Spacing.sm },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  orderTotal: { fontSize: FontSizes.base, fontWeight: Fonts.extrabold, color: Colors.primary },
  userInfo: { marginBottom: Spacing.sm },
  userName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  userPhone: { fontSize: FontSizes.xs, color: Colors.textMuted },
  itemsSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, padding: Spacing.sm, borderRadius: Radius.sm },
  itemsText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  viewProofBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.info },
  actionText: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold },
  rejectBtn: { width: 40, height: 40, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.danger, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dangerBg },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, backgroundColor: Colors.success, ...Shadows.sm },
  acceptText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  proofModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  proofModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  proofImage: { width: '90%', height: '70%' },
});
