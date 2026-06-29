import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Pressable, Platform, Modal,
} from 'react-native';
import { Search, Calendar, RefreshCw } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function CustomerHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const all = res.data || [];
      setOrders(all.filter((o: Order) => o.status?.toLowerCase() === 'completed'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (dateFilter && o.date.split('T')[0] !== dateFilter) return false;
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
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
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm, marginBottom: Spacing.md }}>
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
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={{ marginLeft: 8, fontSize: FontSizes.sm, color: dateFilter ? Colors.textMain : Colors.textMuted }}>
                {dateFilter ? dateFilter : 'Pilih Tanggal'}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={resetFilters} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={{ marginLeft: 6, fontSize: FontSizes.sm, fontWeight: Fonts.medium, color: Colors.primary }}>Reset</Text>
          </Pressable>
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Text style={styles.modalTitle}>Pilih Tanggal</Text>
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
                  <Pressable onPress={() => setShowDatePicker(false)} style={styles.modalBtnPrimary}>
                    <Text style={styles.modalBtnPrimaryText}>Selesai</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Modal>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState title="Tidak ada pesanan" subtitle="Riwayat tidak ditemukan berdasarkan filter" />
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              {order.items?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name} {item.color ? `(${item.color})` : ''}</Text>
                  <Text style={styles.itemQty}>{item.qty}x</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price * item.qty)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
              </View>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.sm },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  orderCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderId: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain },
  orderDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  itemName: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain },
  itemQty: { fontSize: FontSizes.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  itemPrice: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.semibold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalLabel: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  totalValue: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.lg, width: '90%', maxWidth: 350 },
  modalTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md, textAlign: 'center' },
  modalBtnPrimary: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md },
  modalBtnPrimaryText: { color: Colors.white, fontWeight: Fonts.bold },
});
