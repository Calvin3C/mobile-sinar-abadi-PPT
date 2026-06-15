import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView,
  Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../constants/theme';
import api from '../services/api';
import { formatPrice, formatDateTime } from '../utils/format';

interface TrackingStep {
  title: string;
  time: string;
  status: string;
  description?: string;
}

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [searchId, setSearchId] = useState(params.orderId || '');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (params.orderId) {
      handleSearch(params.orderId);
    }
  }, [params.orderId]);

  const handleSearch = async (id?: string) => {
    const orderId = id || searchId.trim();
    if (!orderId) {
      Alert.alert('Error', 'Masukkan ID pesanan.');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await api.get(`/orders/${orderId}`);
      setOrderData(orderRes.data);

      // Try to fetch tracking
      if (orderRes.data?.shipping?.biteshipOrderId) {
        try {
          const trackRes = await api.get(`/biteship/tracking/${orderId}`);
          const history = trackRes.data?.courier?.history || [];
          if (history.length > 0) {
            const biteshipSteps = history.map((h: any) => ({
              title: h.note || 'Update Pengiriman',
              time: h.updated_at || '',
              status: h.status === 'delivered' ? 'completed' : h.status === 'shipping' || h.status === 'dropped' ? 'shipping' : 'pending',
              description: h.status === 'shipping' && orderRes.data.shipping?.waybillId ? `Resi: ${orderRes.data.shipping.waybillId}` : undefined,
            }));
            setTrackingData({ steps: biteshipSteps, currentStatus: trackRes.data?.status || trackRes.data?.courier?.status });
          } else {
            setTrackingData(null);
          }
        } catch {
          setTrackingData(null);
        }
      } else {
        setTrackingData(null);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Pesanan tidak ditemukan.');
      setOrderData(null);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!orderData?.id) return;
    Alert.alert(
      'Konfirmasi Penerimaan',
      'Apakah Anda sudah menerima pesanan ini?',
      [
        { text: 'Belum', style: 'cancel' },
        {
          text: 'Sudah Diterima',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderData.id}/complete`);
              Alert.alert('Berhasil', 'Pesanan telah dikonfirmasi selesai.');
              handleSearch(orderData.id);
            } catch (e: any) {
              Alert.alert('Error', 'Gagal mengkonfirmasi pesanan.');
            }
          },
        },
      ]
    );
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'delivered': return <CheckCircle size={20} color={Colors.success} />;
      case 'shipping': case 'in_transit': return <Truck size={20} color={Colors.info} />;
      case 'cancelled': return <XCircle size={20} color={Colors.danger} />;
      default: return <Clock size={20} color={Colors.warning} />;
    }
  };

  // Build timeline steps from order status
  const buildTimeline = () => {
    if (!orderData) return [];
    const steps: TrackingStep[] = [];

    steps.push({
      title: 'Pesanan Dibuat',
      time: orderData.date || '',
      status: 'completed',
    });

    if (orderData.status !== 'pending' && orderData.status !== 'cancelled') {
      steps.push({
        title: 'Pembayaran Dikonfirmasi',
        time: orderData.payment?.paidAt || '',
        status: 'completed',
      });
    }

    if (orderData.status?.toLowerCase() === 'shipping' || orderData.status?.toLowerCase() === 'completed') {
      steps.push({
        title: 'Sedang Dikirim',
        time: '',
        status: orderData.status?.toLowerCase() === 'shipping' ? 'shipping' : 'completed',
        description: orderData.shipping?.trackingNumber ? `Resi: ${orderData.shipping.trackingNumber}` : undefined,
      });
    }

    if (orderData.status?.toLowerCase() === 'completed') {
      steps.push({
        title: 'Pesanan Selesai',
        time: '',
        status: 'completed',
      });
    }

    if (orderData.status === 'cancelled') {
      steps.push({
        title: 'Pesanan Dibatalkan',
        time: '',
        status: 'cancelled',
      });
    }

    // Add Biteship tracking steps if available
    if (trackingData?.steps && trackingData.steps.length > 0) {
      const initialSteps = steps.filter(s => s.title === 'Pesanan Dibuat' || s.title === 'Pembayaran Dikonfirmasi');
      return [...initialSteps, ...trackingData.steps];
    }

    return steps;
  };

  const timeline = buildTimeline();
  const isDelivered = trackingData?.currentStatus === 'delivered' || orderData?.shippingStatus?.toLowerCase()?.includes('delivered');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ArrowLeft size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Lacak Pengiriman</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Masukkan ID Pesanan (contoh: ORD-...)"
            placeholderTextColor={Colors.textLight}
            value={searchId}
            onChangeText={setSearchId}
            autoCapitalize="characters"
          />
        </View>
        <Pressable style={styles.searchButton} onPress={() => handleSearch()}>
          <Text style={styles.searchButtonText}>Lacak</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orderData ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Status Pengiriman — {orderData.id}</Text>
            {timeline.map((step: TrackingStep, idx: number) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineDotCol}>
                  {getStepIcon(step.status)}
                  {idx < timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>{step.title}</Text>
                  {step.time ? (
                    <Text style={styles.timelineTime}>{formatDateTime(step.time)}</Text>
                  ) : null}
                  {step.description ? (
                    <Text style={styles.timelineDesc}>{step.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* Items summary */}
          {orderData.items && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Ringkasan Pesanan</Text>
              {orderData.items.map((item: any, idx: number) => (
                <View key={idx} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.name} {item.color ? `(${item.color})` : ''}
                  </Text>
                  <Text style={styles.summaryItemQty}>{item.qty}x</Text>
                  <Text style={styles.summaryItemPrice}>{formatPrice(item.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Complete button */}
          {(isDelivered || orderData.status?.toLowerCase() === 'shipping') && orderData.status?.toLowerCase() !== 'completed' && (
            <Pressable style={styles.completeButton} onPress={handleComplete}>
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.completeButtonText}>Pesanan Diterima</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Package size={56} color={Colors.textLight} />
          <Text style={styles.emptyText}>Masukkan ID pesanan untuk melacak pengiriman</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' },
  searchSection: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.sm },
  searchButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, justifyContent: 'center', ...Shadows.sm },
  searchButtonText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  // Timeline
  timelineCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  timelineTitle: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.lg },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  timelineDotCol: { alignItems: 'center', width: 28, marginRight: Spacing.md },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg },
  timelineStepTitle: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  timelineTime: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  timelineDesc: { fontSize: FontSizes.xs, color: Colors.info, marginTop: 2 },
  // Summary
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm },
  summaryTitle: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  summaryItemName: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary },
  summaryItemQty: { fontSize: FontSizes.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  summaryItemPrice: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.semibold },
  // Complete
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, marginTop: Spacing.lg, ...Shadows.md },
  completeButtonText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
