import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, ChevronDown, X, Package } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Product } from '../../types';
import ProductCard from '../../components/ProductCard';
import { DEFAULT_PAGE_SIZE } from '../../constants/api';

const SORT_OPTIONS = [
  { label: 'Terlaris', value: 'rekomendasi' },
  { label: 'Harga Termurah', value: 'termurah' },
  { label: 'Harga Termahal', value: 'termahal' },
  { label: 'A-Z', value: 'az' },
];

const CATEGORY_OPTIONS = [
  'Semua Kategori',
  'Semen', 'Perpipaan', 'Cat Tembok', 'Cat Kayu', 'Besi Beton',
  'Kloset', 'Perkakas', 'Listrik', 'Kuas Cat', 'Kunci Pintu',
  'Engsel', 'Keramik & Granite',
];

export default function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(params.category || '');
  const [selectedSort, setSelectedSort] = useState('rekomendasi');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const fetchProducts = useCallback(async (p: number = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (p === 1) setLoading(true);

    try {
      const queryParams: any = {
        page: p,
        limit: DEFAULT_PAGE_SIZE,
        sort: selectedSort,
      };
      if (searchQuery.trim()) queryParams.search = searchQuery.trim();
      if (selectedCategory && selectedCategory !== 'Semua Kategori') {
        queryParams.category = selectedCategory;
      }

      const res = await api.get('/products', { params: queryParams });
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.products || []));
      setTotalPages(res.data?.totalPages || 1);
      setTotalProducts(res.data?.totalProducts || (Array.isArray(res.data) ? res.data.length : 0));
      setPage(p);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedSort]);

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory, selectedSort]);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View style={[styles.productItem, index % 2 === 0 ? { marginRight: Spacing.sm / 2 } : { marginLeft: Spacing.sm / 2 }]}>
      <ProductCard
        product={item}
        onPress={() => router.push(`/product/${item.id}`)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={48} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>
      <Text style={styles.emptySubtitle}>Coba ubah kata kunci atau filter pencarian</Text>
    </View>
  );

  const renderFooter = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.pagination}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Pressable
            key={p}
            style={[styles.pageButton, p === page && styles.pageButtonActive]}
            onPress={() => fetchProducts(p)}
          >
            <Text style={[styles.pageButtonText, p === page && styles.pageButtonTextActive]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama produk, merek..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {/* Category Dropdown */}
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowSortDropdown(false); }}
          >
            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
              {selectedCategory || 'Semua Kategori'}
            </Text>
            <ChevronDown size={14} color={Colors.textMuted} />
          </Pressable>
          {showCategoryDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {CATEGORY_OPTIONS.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.dropdownItem, (selectedCategory === cat || (!selectedCategory && cat === 'Semua Kategori')) && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedCategory(cat === 'Semua Kategori' ? '' : cat);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, (selectedCategory === cat || (!selectedCategory && cat === 'Semua Kategori')) && styles.dropdownItemTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sort Dropdown */}
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => { setShowSortDropdown(!showSortDropdown); setShowCategoryDropdown(false); }}
          >
            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
              {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || 'Urutkan'}
            </Text>
            <ChevronDown size={14} color={Colors.textMuted} />
          </Pressable>
          {showSortDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.dropdownItem, selectedSort === opt.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedSort(opt.value);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedSort === opt.value && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Close dropdowns on content press */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => { setShowCategoryDropdown(false); setShowSortDropdown(false); }}
      >
        {/* Count */}
        {!loading && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              Menampilkan {products.length} dari {totalProducts} produk
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts(1, true)} colors={[Colors.primary]} />
            }
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    paddingVertical: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownTriggerText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Fonts.medium,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
    marginTop: 4,
    maxHeight: 300,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryBg,
  },
  dropdownItemText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  countText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  productItem: {
    flex: 1,
    maxWidth: '48.5%',
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.medium,
  },
  pageButtonTextActive: {
    color: Colors.white,
    fontWeight: Fonts.bold,
  },
});
