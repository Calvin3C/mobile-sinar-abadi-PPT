import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, ArrowLeft } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Product, ProductVariant } from '../../types';

const CATEGORY_OPTIONS = [
  'Semen', 'Perpipaan', 'Cat Tembok', 'Cat Kayu', 'Besi Beton',
  'Kloset', 'Perkakas', 'Listrik', 'Kuas Cat', 'Kunci Pintu',
  'Engsel', 'Keramik & Granite',
];

const UNIT_OPTIONS = ['Sak', 'Galon', 'Pail', 'Batang', 'Buah', 'Dus', 'Unit', 'Pcs'];

export default function ProductForm() {
  const router = useRouter();
  const { mode, productId } = useLocalSearchParams<{ mode: string; productId?: string }>();
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: '', category: 'Semen', brand: '', price: '',
    weight: '', length: '1', width: '1', height: '1',
    unit: 'Pcs', minPurchase: '1', img: '', isLarge: false,
    variants: [] as ProductVariant[],
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit && productId) {
      fetchProduct();
    }
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      const p: Product = res.data;
      setForm({
        name: p.name, category: p.category, brand: p.brand || '',
        price: String(p.price), weight: String(p.weight),
        length: String(p.length), width: String(p.width), height: String(p.height),
        unit: p.unit, minPurchase: String(p.minPurchase), img: p.img || '',
        isLarge: p.isLarge,
        variants: p.variants || [],
      });
    } catch (e) {
      Alert.alert('Error', 'Gagal memuat data produk.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price) {
      Alert.alert('Error', 'Nama, kategori, dan harga wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        price: parseInt(form.price) || 0,
        weight: parseInt(form.weight) || 0,
        length: parseInt(form.length) || 1,
        width: parseInt(form.width) || 1,
        height: parseInt(form.height) || 1,
        unit: form.unit,
        minPurchase: parseInt(form.minPurchase) || 1,
        img: form.img,
        isLarge: form.isLarge,
      };

      if (isEdit && productId) {
        await api.put(`/products/${productId}`, payload);
        Alert.alert('Berhasil', 'Produk berhasil diperbarui.');
      } else {
        await api.post('/products', payload);
        Alert.alert('Berhasil', 'Produk berhasil ditambahkan.');
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/owner/dashboard');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Name */}
        <View style={styles.group}>
          <Text style={styles.label}>Nama Produk *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Nama produk" placeholderTextColor={Colors.textLight} />
        </View>

        {/* Category */}
        <View style={styles.group}>
          <Text style={styles.label}>Kategori *</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((cat) => (
              <Pressable key={cat} style={[styles.chip, form.category === cat && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, category: cat }))}>
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Brand */}
        <View style={styles.group}>
          <Text style={styles.label}>Merek / Brand</Text>
          <TextInput style={styles.input} value={form.brand} onChangeText={(v) => setForm((p) => ({ ...p, brand: v }))} placeholder="Merek produk" placeholderTextColor={Colors.textLight} />
        </View>

        {/* Price */}
        <View style={styles.group}>
          <Text style={styles.label}>Harga (Rp) *</Text>
          <TextInput style={styles.input} value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} placeholder="65000" placeholderTextColor={Colors.textLight} keyboardType="numeric" />
        </View>

        {/* Weight */}
        <View style={styles.group}>
          <Text style={styles.label}>Berat (gram)</Text>
          <TextInput style={styles.input} value={form.weight} onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))} placeholder="50000" placeholderTextColor={Colors.textLight} keyboardType="numeric" />
        </View>

        {/* Dimensions */}
        <View style={styles.group}>
          <Text style={styles.label}>Dimensi (cm) — P × L × T</Text>
          <View style={styles.dimRow}>
            <TextInput style={[styles.input, styles.dimInput]} value={form.length} onChangeText={(v) => setForm((p) => ({ ...p, length: v }))} keyboardType="numeric" placeholder="P" placeholderTextColor={Colors.textLight} />
            <Text style={styles.dimX}>×</Text>
            <TextInput style={[styles.input, styles.dimInput]} value={form.width} onChangeText={(v) => setForm((p) => ({ ...p, width: v }))} keyboardType="numeric" placeholder="L" placeholderTextColor={Colors.textLight} />
            <Text style={styles.dimX}>×</Text>
            <TextInput style={[styles.input, styles.dimInput]} value={form.height} onChangeText={(v) => setForm((p) => ({ ...p, height: v }))} keyboardType="numeric" placeholder="T" placeholderTextColor={Colors.textLight} />
          </View>
        </View>

        {/* Unit */}
        <View style={styles.group}>
          <Text style={styles.label}>Satuan</Text>
          <View style={styles.chipRow}>
            {UNIT_OPTIONS.map((u) => (
              <Pressable key={u} style={[styles.chip, form.unit === u && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, unit: u }))}>
                <Text style={[styles.chipText, form.unit === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Min Purchase */}
        <View style={styles.group}>
          <Text style={styles.label}>Min. Pembelian</Text>
          <TextInput style={styles.input} value={form.minPurchase} onChangeText={(v) => setForm((p) => ({ ...p, minPurchase: v }))} placeholder="1" placeholderTextColor={Colors.textLight} keyboardType="numeric" />
        </View>

        {/* Image URL */}
        <View style={styles.group}>
          <Text style={styles.label}>URL Gambar</Text>
          <TextInput style={styles.input} value={form.img} onChangeText={(v) => setForm((p) => ({ ...p, img: v }))} placeholder="https://..." placeholderTextColor={Colors.textLight} autoCapitalize="none" />
        </View>

        {/* isLarge */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Barang Besar (batasan pengiriman)</Text>
          <Switch value={form.isLarge} onValueChange={(v) => setForm((p) => ({ ...p, isLarge: v }))} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={form.isLarge ? Colors.primary : Colors.textLight} />
        </View>

        <Pressable style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <><Save size={18} color={Colors.white} /><Text style={styles.submitText}>{isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</Text></>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing['5xl'] },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.sm },
  group: { marginBottom: Spacing.lg },
  label: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSizes.sm, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: Fonts.medium },
  chipTextActive: { color: Colors.primary, fontWeight: Fonts.semibold },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dimInput: { flex: 1, textAlign: 'center' },
  dimX: { fontSize: FontSizes.md, color: Colors.textMuted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, ...Shadows.md },
  submitText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
