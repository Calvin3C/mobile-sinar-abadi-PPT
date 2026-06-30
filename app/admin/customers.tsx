import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, Pressable
} from 'react-native';
import { User, Phone, Mail, Search, XCircle } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import EmptyState from '../../components/EmptyState';

interface CustomerData {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetch = async () => {
    try {
      const res = await api.get('/users');
      setCustomers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, username, atau no HP..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <XCircle size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <FlatList
        data={filteredCustomers}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      ListEmptyComponent={<EmptyState title="Belum ada customer" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <View style={styles.detailRow}>
              <Mail size={12} color={Colors.textMuted} />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Phone size={12} color={Colors.textMuted} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          </View>
        </View>
      )}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, height: 48 },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSizes.sm, color: Colors.textMain },
  card: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.primary },
  name: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain },
  username: { fontSize: FontSizes.xs, color: Colors.textMuted },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  detailText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});
