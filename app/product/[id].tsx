import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, Pressable, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Linking, Platform, StatusBar, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, ShoppingCart, Heart, Share2, MessageCircle,
  AlertTriangle, Truck, ChevronRight,
} from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { Product, ProductVariant } from '../../types';
import { formatPrice, formatWeight, formatDimensions, getWhatsAppLink, fixImageUrl } from '../../utils/format';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { getColorsForBrand, COLOR_CATEGORIES, classifyColor } from '../../data/paintColors';
import QuantityControl from '../../components/QuantityControl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'spesifikasi' | 'deskripsi'>('spesifikasi');
  const [colorFilter, setColorFilter] = useState('all');

  // Derived colors (from API variants or hardcoded)
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const prod: Product = res.data;
      setProduct(prod);

      // Determine available colors
      if (prod.variants && prod.variants.length > 0) {
        setAvailableColors(prod.variants.map((v) => v.name));
      } else if (prod.category === 'Cat Tembok' || prod.category === 'Cat Kayu') {
        const colors = getColorsForBrand(prod.brand || '');
        setAvailableColors(colors);
      }

      // Initialize qty based on effective minimum
      const effectiveMin = Math.min(prod.minPurchase || 1, Math.max(1, prod.stock));
      setQty(effectiveMin);

    } catch (e) {
      console.error('Failed to fetch product:', e);
      if (Platform.OS === 'web') {
        window.alert('Gagal memuat produk.');
      } else {
        Alert.alert('Error', 'Gagal memuat produk.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = (() => {
    if (selectedVariant && selectedVariant.price > 0) return selectedVariant.price;
    return product?.price || 0;
  })();

  const subtotal = currentPrice * qty;

  const filteredColors = (() => {
    if (colorFilter === 'all') return availableColors;
    return availableColors.filter((c) => classifyColor(c) === colorFilter);
  })();

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    // Check if there's a matching API variant
    if (product?.variants) {
      const variant = product.variants.find((v) => v.name === color);
      setSelectedVariant(variant || null);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      if (Platform.OS === 'web') {
        if (window.confirm('Login Diperlukan. Silakan login terlebih dahulu untuk menambahkan ke keranjang. Lanjut ke Login?')) {
          router.push('/(auth)/login');
        }
      } else {
        Alert.alert('Login Diperlukan', 'Silakan login terlebih dahulu untuk menambahkan ke keranjang.', [
          { text: 'Batal' },
          { text: 'Login', onPress: () => router.push('/(auth)/login') },
        ]);
      }
      return;
    }

    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: currentPrice,
      img: product.img,
      isLarge: product.isLarge,
      weight: product.weight,
      length: product.length,
      width: product.width,
      height: product.height,
      stock: product.stock,
      qty,
      minPurchase: product.minPurchase,
      unit: product.unit,
      color: selectedColor,
    });

    if (Platform.OS === 'web') {
      window.alert(`${product.name} ditambahkan ke keranjang!`);
    } else {
      Alert.alert('Berhasil', `${product.name} ditambahkan ke keranjang!`, [
        { text: 'Lihat Keranjang', onPress: () => router.push('/cart') },
        { text: 'Lanjut Belanja' },
      ]);
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppLink(product?.name);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Produk tidak ditemukan</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ArrowLeft size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Detail Produk</Text>
        <Pressable style={styles.headerButton} onPress={() => router.push('/cart')}>
          <ShoppingCart size={22} color={Colors.textMain} />
          {cartItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <Image
          source={{ uri: fixImageUrl(product.img) || 'https://via.placeholder.com/400x400?text=No+Image' }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(currentPrice)}</Text>

          <View style={styles.metaRow}>
            {product.stock <= 10 && product.stock > 0 && (
              <View style={styles.stockWarning}>
                <AlertTriangle size={12} color={Colors.warning} />
                <Text style={styles.stockWarningText}>Stok Terbatas ({product.stock})</Text>
              </View>
            )}
            {product.sold > 0 && (
              <Text style={styles.soldText}>Terjual {product.sold}</Text>
            )}
          </View>
        </View>

        {/* Variant/Color Selection */}
        {availableColors.length > 0 && (
          <View style={styles.colorSection}>
            <Text style={styles.sectionLabel}>Pilihan Warna</Text>

            {/* Color Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorFilterRow}>
              {COLOR_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.colorFilterChip, colorFilter === cat.id && styles.colorFilterChipActive]}
                  onPress={() => setColorFilter(cat.id)}
                >
                  <Text style={[styles.colorFilterText, colorFilter === cat.id && styles.colorFilterTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Color Grid */}
            <View style={styles.colorGrid}>
              {filteredColors.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorChip,
                    selectedColor === color && styles.colorChipSelected,
                  ]}
                  onPress={() => handleSelectColor(color)}
                >
                  <Text
                    style={[
                      styles.colorChipText,
                      selectedColor === color && styles.colorChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {color}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedColor && (
              <Text style={styles.selectedColorLabel}>Warna: {selectedColor}</Text>
            )}
          </View>
        )}

        {/* Tabs: Spesifikasi / Deskripsi */}
        <View style={styles.tabSection}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, activeTab === 'spesifikasi' && styles.tabActive]}
              onPress={() => setActiveTab('spesifikasi')}
            >
              <Text style={[styles.tabText, activeTab === 'spesifikasi' && styles.tabTextActive]}>
                Spesifikasi
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'deskripsi' && styles.tabActive]}
              onPress={() => setActiveTab('deskripsi')}
            >
              <Text style={[styles.tabText, activeTab === 'deskripsi' && styles.tabTextActive]}>
                Deskripsi
              </Text>
            </Pressable>
          </View>

          {activeTab === 'spesifikasi' ? (
            <View style={styles.specTable}>
              {[
                { label: 'Kategori', value: product.category },
                { label: 'Merek', value: product.brand },
                { label: 'Satuan', value: product.unit },
                { label: 'Min. Pembelian', value: `${product.minPurchase} ${product.unit}` },
                { label: 'Berat', value: formatWeight(product.weight) },
                ...(formatDimensions(product.length, product.width, product.height) ? [{ label: 'Dimensi', value: formatDimensions(product.length, product.width, product.height)! }] : []),
                { label: 'Stok', value: `${product.stock} ${product.unit}` },
              ].map((spec, idx) => (
                <View key={idx} style={[styles.specRow, idx % 2 === 0 && styles.specRowAlt]}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {product.name} - {product.brand}. {product.category} berkualitas tinggi untuk kebutuhan proyek bangunan Anda.
              </Text>
            </View>
          )}
        </View>

        {/* Shipping Estimate */}
        <View style={styles.shippingInfo}>
          <Truck size={18} color={Colors.info} />
          <View>
            <Text style={styles.shippingTitle}>Estimasi Pengiriman</Text>
            <Text style={styles.shippingText}>Malang: 2-7 hari kerja</Text>
          </View>
        </View>

        {/* WhatsApp */}
        <Pressable style={styles.whatsappButton} onPress={handleWhatsApp}>
          <MessageCircle size={20} color="#25D366" />
          <Text style={styles.whatsappText}>Hubungi Sinar Abadi</Text>
          <ChevronRight size={16} color={Colors.textMuted} />
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Cart Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.bottomPanelLeft}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalPrice}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.bottomPanelRight}>
          <QuantityControl
            qty={qty}
            min={Math.min(product.minPurchase || 1, Math.max(1, product.stock))}
            max={product.stock}
            unit={product.unit}
            onDecrease={() => setQty(Math.max(Math.min(product.minPurchase || 1, Math.max(1, product.stock)), qty - 1))}
            onIncrease={() => setQty(Math.min(product.stock, qty + 1))}
          />
          <Pressable
            style={[styles.addToCartButton, product.stock === 0 && styles.addToCartDisabled]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart size={18} color={Colors.white} />
            <Text style={styles.addToCartText}>
              {product.stock === 0 ? 'Stok Habis' : 'Masukkan Keranjang'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40, height: 40, borderRadius: Radius.lg,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: FontSizes.md, fontWeight: Fonts.semibold,
    color: Colors.textMain, flex: 1, textAlign: 'center',
  },
  badge: {
    position: 'absolute', top: 0, right: -2,
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: Fonts.bold },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.borderLight,
  },
  infoSection: {
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.textMain,
    lineHeight: 28,
  },
  productPrice: {
    fontSize: FontSizes['2xl'],
    fontWeight: Fonts.extrabold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  stockWarningText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    fontWeight: Fonts.semibold,
  },
  soldText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  // Colors
  colorSection: {
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
    marginBottom: Spacing.md,
  },
  colorFilterRow: {
    marginBottom: Spacing.md,
  },
  colorFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorFilterChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  colorFilterText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  colorFilterTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorChipSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  colorChipText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  colorChipTextSelected: {
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
  selectedColorLabel: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.semibold,
    marginTop: Spacing.md,
  },
  // Tabs
  tabSection: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
  specTable: {
    padding: Spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  specRowAlt: {
    backgroundColor: Colors.borderLight,
  },
  specLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  specValue: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: Fonts.semibold,
    textAlign: 'right',
  },
  descriptionContainer: {
    padding: Spacing.xl,
  },
  descriptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Shipping
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shippingTitle: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
  },
  shippingText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  // WhatsApp
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  whatsappText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
  },
  // Bottom Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.lg,
    ...Shadows.lg,
  },
  bottomPanelLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subtotalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  subtotalPrice: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.bold,
    color: Colors.primary,
  },
  bottomPanelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    ...Shadows.md,
  },
  addToCartDisabled: {
    backgroundColor: Colors.textLight,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: Fonts.bold,
  },
});
