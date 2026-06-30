import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, Package, Edit3, Layers, X, Trash2, ChevronDown } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows, CATEGORIES } from '../../constants/theme';
import api from '../../services/api';
import { Product } from '../../types';
import EmptyState from '../../components/EmptyState';
import ManageVariantsModal from '../../components/ManageVariantsModal';

export default function OwnerStock() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Variant modal
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

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

  const refreshVariantProduct = async () => {
    if (!variantProduct) return;
    try {
      const res = await api.get(`/products/${variantProduct.id}`);
      setVariantProduct(res.data);
      fetchProducts();
    } catch (e) {
      console.error('Failed to refresh variant product', e);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const selectedCategoryName = CATEGORIES.find(c => c.filterValue === selectedCategory)?.name || 'Semua Kategori';

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Cari produk..." placeholderTextColor={Colors.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <Pressable style={styles.pickerContainer} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.pickerText}>{selectedCategoryName}</Text>
          <ChevronDown size={18} color={Colors.textMuted} />
        </Pressable>

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

      {/* Manage Variants Modal */}
      {variantProduct && (
        <ManageVariantsModal
          visible={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          productId={variantProduct.id}
          productName={variantProduct.name}
          variants={variantProduct.variants || []}
          onRefresh={refreshVariantProduct}
        />
      )}

      {/* Category Dropdown Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <X size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList}>
              <Pressable
                style={[styles.categoryListItem, selectedCategory === '' && styles.categoryListItemActive]}
                onPress={() => { setSelectedCategory(''); setShowCategoryModal(false); }}
              >
                <Text style={[styles.categoryListText, selectedCategory === '' && styles.categoryListTextActive]}>Semua Kategori</Text>
              </Pressable>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryListItem, selectedCategory === cat.filterValue && styles.categoryListItemActive]}
                  onPress={() => { setSelectedCategory(cat.filterValue); setShowCategoryModal(false); }}
                >
                  <Text style={[styles.categoryListText, selectedCategory === cat.filterValue && styles.categoryListTextActive]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
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
  pickerContainer: { marginTop: Spacing.md, backgroundColor: Colors.borderLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: FontSizes.sm, color: Colors.textMain },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing['4xl'], maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain },
  categoryList: { padding: Spacing.lg },
  categoryListItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm },
  categoryListItemActive: { backgroundColor: Colors.primaryBg },
  categoryListText: { fontSize: FontSizes.sm, color: Colors.textMain },
  categoryListTextActive: { color: Colors.primary, fontWeight: Fonts.bold },
});
