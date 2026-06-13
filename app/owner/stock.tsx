import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, Package, Edit3, Layers, X, Trash2 } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Product } from '../../types';
import EmptyState from '../../components/EmptyState';

export default function OwnerStock() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Variant modal
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 1000 } });
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.products || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = products.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (showAvailableOnly && p.stock <= 0) return false;
    if (!showAvailableOnly && p.stock > 0) return false; // Show out of stock when toggle is off - actually let's show all
    return true;
  });

  // Actually, let's simplify: showAvailableOnly filters
  const displayProducts = products.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (showAvailableOnly && p.stock <= 0) return false;
    return true;
  });

  const handleAddVariant = async () => {
    if (!variantProduct || !newVariantName.trim()) {
      Alert.alert('Error', 'Nama varian harus diisi.');
      return;
    }
    try {
      await api.post(`/products/${variantProduct.id}/variants`, {
        name: newVariantName.trim(),
        price: parseInt(newVariantPrice) || 0,
      });
      Alert.alert('Berhasil', 'Varian ditambahkan.');
      setNewVariantName('');
      setNewVariantPrice('');
      fetchProducts();
      // Refresh variant product
      const res = await api.get(`/products/${variantProduct.id}`);
      setVariantProduct(res.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menambah varian.');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!variantProduct) return;
    Alert.alert('Hapus Varian?', 'Varian akan dihapus permanen.', [
      { text: 'Batal' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${variantProduct.id}/variants/${variantId}`);
            fetchProducts();
            const res = await api.get(`/products/${variantProduct.id}`);
            setVariantProduct(res.data);
          } catch (e: any) {
            Alert.alert('Error', 'Gagal menghapus varian.');
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Cari produk..." placeholderTextColor={Colors.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Stok Tersedia</Text>
          <Switch value={showAvailableOnly} onValueChange={setShowAvailableOnly} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={showAvailableOnly ? Colors.primary : Colors.textLight} />
        </View>
      </View>

      {/* Add button */}
      <Pressable
        style={styles.addButton}
        onPress={() => router.push({ pathname: '/owner/product-form', params: { mode: 'create' } })}
      >
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Tambah Produk Baru</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} colors={[Colors.primary]} />}
      >
        {displayProducts.length === 0 ? (
          <EmptyState title="Tidak ada produk" subtitle="Tambahkan produk baru" />
        ) : (
          displayProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productId}>{product.id}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
              </View>
              <View style={styles.productStats}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, product.stock <= 0 && { color: Colors.danger }]}>{product.stock}</Text>
                  <Text style={styles.statSub}>Stok</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{product.sold}</Text>
                  <Text style={styles.statSub}>Terjual</Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <Pressable
                  style={styles.variantBtn}
                  onPress={() => { setVariantProduct(product); setShowVariantModal(true); }}
                >
                  <Layers size={14} color={Colors.info} />
                  <Text style={[styles.actionText, { color: Colors.info }]}>Varian</Text>
                </Pressable>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: '/owner/product-form', params: { mode: 'edit', productId: product.id } })}
                >
                  <Edit3 size={14} color={Colors.primary} />
                  <Text style={[styles.actionText, { color: Colors.primary }]}>Atur</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Variant Modal */}
      <Modal visible={showVariantModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Varian — {variantProduct?.name}</Text>
              <Pressable onPress={() => setShowVariantModal(false)}><X size={22} color={Colors.textMain} /></Pressable>
            </View>
            <ScrollView>
              {/* Existing variants */}
              {variantProduct?.variants?.map((v) => (
                <View key={v.id} style={styles.variantItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.variantName}>{v.name}</Text>
                    {v.price > 0 && <Text style={styles.variantPrice}>Rp {v.price.toLocaleString()}</Text>}
                  </View>
                  <Pressable style={styles.variantDeleteBtn} onPress={() => handleDeleteVariant(v.id)}>
                    <Trash2 size={16} color={Colors.danger} />
                  </Pressable>
                </View>
              ))}

              {(!variantProduct?.variants || variantProduct.variants.length === 0) && (
                <Text style={styles.noVariants}>Belum ada varian</Text>
              )}

              {/* Add variant */}
              <View style={styles.addVariantSection}>
                <Text style={styles.addVariantTitle}>Tambah Varian Baru</Text>
                <TextInput style={styles.formInput} placeholder="Nama varian (contoh: Merah Bata)" placeholderTextColor={Colors.textLight} value={newVariantName} onChangeText={setNewVariantName} />
                <TextInput style={[styles.formInput, { marginTop: Spacing.sm }]} placeholder="Harga (0 = pakai harga base)" placeholderTextColor={Colors.textLight} value={newVariantPrice} onChangeText={setNewVariantPrice} keyboardType="numeric" />
                <Pressable style={styles.addVariantBtn} onPress={handleAddVariant}>
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.addVariantBtnText}>Tambah</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
  toggleLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: Fonts.medium },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.lg, paddingVertical: Spacing.md, ...Shadows.md },
  addButtonText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  productCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  productInfo: { marginBottom: Spacing.md },
  productId: { fontSize: FontSizes.xs, color: Colors.textLight, fontWeight: Fonts.medium },
  productName: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain, marginTop: 2 },
  productCategory: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  productStats: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain },
  statSub: { fontSize: FontSizes.xs, color: Colors.textMuted },
  productActions: { flexDirection: 'row', gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  variantBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.info },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  actionText: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], maxHeight: '80%', padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain, flex: 1 },
  variantItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  variantName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  variantPrice: { fontSize: FontSizes.xs, color: Colors.textMuted },
  variantDeleteBtn: { width: 32, height: 32, borderRadius: Radius.md, backgroundColor: Colors.dangerBg, justifyContent: 'center', alignItems: 'center' },
  noVariants: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  addVariantSection: { marginTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.lg },
  addVariantTitle: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md },
  formInput: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSizes.sm, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border },
  addVariantBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, marginTop: Spacing.md, marginBottom: Spacing['3xl'] },
  addVariantBtnText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
});
