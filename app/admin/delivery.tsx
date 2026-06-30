import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, StatusBar,
  Pressable, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Truck, Package, Search, ChevronRight, X, CheckCircle, Clock, Calendar, XCircle
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { formatPrice } from '../../utils/format';
import { Order } from '../../types';

export default function AdminDeliveryScreen() {
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Vehicle Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, fleetRes] = await Promise.all([
        api.get('/orders'),
        api.get('/delivery/fleet'),
      ]);
      setOrders(ordersRes.data || []);
      setFleet(fleetRes.data || []);
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.response?.data?.error || 'Failed to fetch data');
      else Alert.alert('Error', e?.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kurirOrders = useMemo(() => {
    return orders.filter(o => {
      const m = (o.shippingMethod || '').toLowerCase();
      return m.includes('kurir toko') || m.includes('kurir sinar') || m.includes('sinar abadi');
    }).filter(o => {
      const s = o.status?.toLowerCase();
      return s !== 'pending' && s !== 'cancelled';
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = kurirOrders;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) ||
        (o.customer || '').toLowerCase().includes(q) ||
        (o.shipping?.destinationAddress || '').toLowerCase().includes(q)
      );
    }
    if (activeTab !== 'Semua') {
      result = result.filter(o => (o.shipping?.deliveryStatus || 'Menunggu') === activeTab);
    }
    if (dateFilter) {
      result = result.filter(o => o.createdAt && o.createdAt.startsWith(dateFilter));
    }
    return result;
  }, [kurirOrders, searchQuery, activeTab, dateFilter]);

  const handleUpdateDeliveryStatus = async (orderId: string, newStatus: string, vehicleId?: number) => {
    setSubmitting(true);
    try {
      const payload: any = { deliveryStatus: newStatus };
      if (vehicleId) payload.fleetVehicleId = vehicleId;

      await api.put(`/admin/orders/${orderId}/delivery-status`, payload);
      
      // Close modal if open
      setIsVehicleModalOpen(false);
      setSelectedOrderId(null);
      setSelectedVehicleId(null);
      
      // Refresh data
      fetchData();
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.response?.data?.error || 'Failed to update status');
      else Alert.alert('Error', e?.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const onStatusAction = (orderId: string, currentStatus: string) => {
    if (currentStatus === 'Menunggu') {
      handleUpdateDeliveryStatus(orderId, 'Diproses');
    } else if (currentStatus === 'Diproses') {
      // Need to assign vehicle
      setSelectedOrderId(orderId);
      setSelectedVehicleId(null);
      setIsVehicleModalOpen(true);
    } else if (currentStatus === 'Dikirim') {
      handleUpdateDeliveryStatus(orderId, 'Selesai');
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const renderFleet = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fleetScroll}>
      {fleet.map((vehicle) => {
        const isAvailable = vehicle.status === 'Tersedia';
        return (
          <View key={vehicle.id} style={[styles.fleetCard, { borderLeftColor: isAvailable ? Colors.success : Colors.warning }]}>
            <View style={styles.fleetHeader}>
              <View style={styles.fleetIconContainer}>
                <Text style={{ fontSize: 24 }}>🚛</Text>
              </View>
              <View style={styles.fleetInfo}>
                <Text style={styles.fleetName}>{vehicle.name}</Text>
                {vehicle.plate && <Text style={styles.fleetPlate}>{vehicle.plate}</Text>}
              </View>
            </View>
            <View style={[styles.fleetBadge, { backgroundColor: isAvailable ? Colors.successBg : Colors.warningBg }]}>
              <Text style={[styles.fleetBadgeText, { color: isAvailable ? Colors.success : Colors.warning }]}>
                {vehicle.status}
              </Text>
            </View>
            
            {vehicle.status === 'Sedang Mengantar' && vehicle.currentOrder && (
              <View style={styles.fleetActiveOrder}>
                <Text style={styles.fleetActiveTitle}>Sedang Mengantar:</Text>
                <Text style={styles.fleetActiveOrderId}>{vehicle.currentOrderId}</Text>
                <Text style={styles.fleetActiveDest} numberOfLines={1}>
                  {vehicle.currentOrder?.shipping?.destinationAddress || '-'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}>
          <ArrowLeft size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Pengiriman Kurir Toko</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshing={refreshing}
      >
        {/* Fleet Section */}
        <Text style={styles.sectionTitle}>Status Armada</Text>
        {loading ? <ActivityIndicator style={{ margin: 20 }} /> : renderFleet()}

        {/* Orders Section */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Daftar Pengiriman</Text>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari ID / Pelanggan / Tujuan"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {['Semua', 'Menunggu', 'Diproses', 'Dikirim', 'Selesai'].map(tab => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, zIndex: 10 }}>
          <Pressable 
            onPress={() => setShowDatePicker(true)} 
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.borderLight, paddingHorizontal: Spacing.md, height: 40, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}
          >
            <Text style={{ color: dateFilter ? Colors.textMain : Colors.textMuted, fontSize: FontSizes.xs }}>
              {dateFilter || "Filter Tanggal"}
            </Text>
            {dateFilter ? (
              <Pressable onPress={() => setDateFilter('')}>
                <XCircle size={16} color={Colors.textMuted} />
              </Pressable>
            ) : (
              <Calendar size={16} color={Colors.textMuted} />
            )}
          </Pressable>
          {showDatePicker && (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowDatePicker(false)}>
                <Pressable style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, width: 340, alignSelf: 'center', alignItems: 'center', paddingBottom: Spacing.xl }} onPress={(e) => e.stopPropagation()}>
                  {Platform.OS === 'ios' && (
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md }}>
                      <Pressable onPress={() => setShowDatePicker(false)}>
                        <Text style={{ color: Colors.primary, fontWeight: Fonts.bold, fontSize: FontSizes.base }}>Selesai</Text>
                      </Pressable>
                    </View>
                  )}
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
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Tidak ada pesanan pengiriman.</Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const status = order.shipping?.deliveryStatus || 'Menunggu';
            let statusColor = Colors.textMuted;
            let statusBg = Colors.borderLight;
            if (status === 'Menunggu') { statusColor = Colors.warning; statusBg = Colors.warningBg; }
            if (status === 'Diproses') { statusColor = Colors.info; statusBg = Colors.infoBg; }
            if (status === 'Dikirim') { statusColor = Colors.danger; statusBg = Colors.dangerBg; }
            if (status === 'Selesai') { statusColor = Colors.success; statusBg = Colors.successBg; }

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderLabel}>Tanggal</Text>
                  <Text style={styles.orderValue}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderLabel}>Pelanggan</Text>
                  <Text style={styles.orderValue}>{order.customer}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderLabel}>Tujuan</Text>
                  <Text style={[styles.orderValue, { flex: 2 }]} numberOfLines={2}>
                    {order.shipping?.destinationAddress || '-'}
                  </Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderLabel}>Ongkir</Text>
                  <Text style={[styles.orderValue, { fontWeight: Fonts.bold }]}>
                    {order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}
                  </Text>
                </View>

                {/* Action Button */}
                {status !== 'Selesai' && (
                  <Pressable 
                    style={[styles.actionBtn, status === 'Diproses' && styles.actionBtnDanger, status === 'Dikirim' && styles.actionBtnSuccess]}
                    onPress={() => onStatusAction(order.id, status)}
                  >
                    <Text style={styles.actionBtnText}>
                      {status === 'Menunggu' && '▶ Proses Pesanan'}
                      {status === 'Diproses' && '🚚 Pilih Kendaraan & Kirim'}
                      {status === 'Dikirim' && '✅ Tandai Selesai'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal visible={isVehicleModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kendaraan</Text>
              <Pressable onPress={() => setIsVehicleModalOpen(false)}>
                <X size={24} color={Colors.textMain} />
              </Pressable>
            </View>

            <Text style={styles.modalDesc}>Pilih armada yang akan mengirimkan pesanan {selectedOrderId}:</Text>
            
            <ScrollView style={{ maxHeight: 300, marginVertical: Spacing.md }}>
              {fleet.length === 0 ? (
                <Text style={{ textAlign: 'center', color: Colors.textMuted }}>Tidak ada armada.</Text>
              ) : (
                fleet.map(v => {
                  const isAvailable = v.status === 'Tersedia';
                  const isSelected = selectedVehicleId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      style={[styles.vehicleOption, !isAvailable && { opacity: 0.5 }, isSelected && styles.vehicleOptionSelected]}
                      onPress={() => isAvailable && setSelectedVehicleId(v.id)}
                      disabled={!isAvailable}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleName}>{v.name} ({v.plate})</Text>
                        <Text style={[styles.vehicleStatus, { color: isAvailable ? Colors.success : Colors.warning }]}>
                          {v.status}
                        </Text>
                      </View>
                      {isSelected && <CheckCircle size={20} color={Colors.primary} />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Pressable 
              style={[styles.confirmBtn, (!selectedVehicleId || submitting) && { opacity: 0.5 }]}
              disabled={!selectedVehicleId || submitting}
              onPress={() => selectedOrderId && selectedVehicleId && handleUpdateDeliveryStatus(selectedOrderId, 'Dikirim', selectedVehicleId)}
            >
              {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.confirmBtnText}>Kirim Pesanan</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },
  
  content: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md },
  
  fleetScroll: { gap: Spacing.md, paddingBottom: Spacing.lg },
  fleetCard: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, width: 260, ...Shadows.sm },
  fleetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  fleetIconContainer: { width: 40, height: 40, backgroundColor: Colors.borderLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  fleetInfo: { flex: 1 },
  fleetName: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  fleetPlate: { fontSize: FontSizes.xs, color: Colors.textMuted },
  fleetBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.md, marginBottom: Spacing.sm },
  fleetBadgeText: { fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  fleetActiveOrder: { backgroundColor: Colors.warningBg, padding: Spacing.sm, borderRadius: Radius.sm, marginTop: Spacing.xs },
  fleetActiveTitle: { fontSize: 10, fontWeight: Fonts.bold, color: Colors.warning },
  fleetActiveOrderId: { fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMain },
  fleetActiveDest: { fontSize: 10, color: Colors.textSecondary },

  listHeader: { flexDirection: 'column', gap: Spacing.sm, marginBottom: Spacing.md, marginTop: Spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, height: 40 },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSizes.sm, color: Colors.textMain },

  tabRow: { gap: Spacing.sm, marginBottom: Spacing.lg, flexGrow: 0 },
  tabBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.xl, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: '#eafff2', borderColor: '#16a34a' },
  tabBtnText: { fontSize: FontSizes.xs, fontWeight: Fonts.medium, color: Colors.textMuted },
  tabBtnTextActive: { color: '#16a34a', fontWeight: Fonts.bold },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyText: { marginTop: Spacing.md, color: Colors.textMuted, fontSize: FontSizes.sm },

  orderCard: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.textMain },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.md },
  statusText: { fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  
  orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  orderLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, flex: 1 },
  orderValue: { fontSize: FontSizes.xs, color: Colors.textMain, flex: 2, textAlign: 'right', fontWeight: Fonts.medium },

  actionBtn: { marginTop: Spacing.md, backgroundColor: Colors.primary, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  actionBtnDanger: { backgroundColor: Colors.danger },
  actionBtnSuccess: { backgroundColor: Colors.success },
  actionBtnText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain },
  modalDesc: { fontSize: FontSizes.sm, color: Colors.textMuted },
  
  vehicleOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, marginBottom: Spacing.sm },
  vehicleOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  vehicleName: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  vehicleStatus: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold, marginTop: 2 },

  confirmBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md },
  confirmBtnText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
