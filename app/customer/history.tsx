import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Truck, MapPin } from 'lucide-react-native';
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

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const all = res.data || [];
      setOrders(all.filter((o: Order) => o.status?.toLowerCase() === 'completed'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
    >
      {orders.length === 0 ? (
        <EmptyState title="Belum ada riwayat" subtitle="Pesanan yang selesai akan muncul di sini" />
      ) : (
        orders.map((order) => (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});
