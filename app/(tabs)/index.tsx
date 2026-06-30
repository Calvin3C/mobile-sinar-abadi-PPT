import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
  Platform, StatusBar, ActivityIndicator, FlatList, Image, RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search, ShoppingCart, Package, Pipette, PaintBucket, Paintbrush,
  Construction, Bath, Wrench, Zap, Brush, KeyRound, DoorOpen, Grid3X3,
  ChevronRight, MapPin, Phone, MessageCircle,
} from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows, CATEGORIES } from '../../constants/theme';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import HeroBanner from '../../components/HeroBanner';
import ProductCard from '../../components/ProductCard';
import OwnerDashboard from '../owner/dashboard';
import AdminDashboard from '../admin/dashboard';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'semen': <Package size={22} color={Colors.primary} />,
  'perpipaan': <Pipette size={22} color="#2563eb" />,
  'cat-tembok': <PaintBucket size={22} color="#16a34a" />,
  'cat-kayu': <Paintbrush size={22} color="#ca8a04" />,
  'besi-beton': <Construction size={22} color="#64748b" />,
  'kloset': <Bath size={22} color="#0ea5e9" />,
  'perkakas': <Wrench size={22} color="#d97706" />,
  'listrik': <Zap size={22} color="#f97316" />,
  'kuas-cat': <Brush size={22} color="#059669" />,
  'kunci-pintu': <KeyRound size={22} color="#7c3aed" />,
  'engsel': <DoorOpen size={22} color="#be185d" />,
  'keramik': <Grid3X3 size={22} color="#0d9488" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'semen': '#fff1f2',
  'perpipaan': '#eff6ff',
  'cat-tembok': '#f0fdf4',
  'cat-kayu': '#fefce8',
  'besi-beton': '#f8fafc',
  'kloset': '#f0f9ff',
  'perkakas': '#fffbeb',
  'listrik': '#fff7ed',
  'kuas-cat': '#ecfdf5',
  'kunci-pintu': '#f5f3ff',
  'engsel': '#fdf2f8',
  'keramik': '#f0fdfa',
};

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuthStore();

  // Owner role: show Owner Dashboard
  if (isAuthenticated && user?.role === 'owner') {
    return <OwnerDashboard />;
  }

  // Admin role: show Admin Dashboard
  if (isAuthenticated && user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Customer / Guest: show normal store home page
  return <CustomerHomeScreen />;
}

function CustomerHomeScreen() {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.length);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBestSellers = async () => {
    try {
      const res = await api.get('/products', {
        params: { sort: 'rekomendasi', limit: 8 },
      });
      setBestSellers(Array.isArray(res.data) ? res.data : (res.data?.products || []));
    } catch (e) {
      console.error('Failed to fetch best sellers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBestSellers();
  };

  const bannerSlides = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
      title: 'Semen Berkualitas',
      subtitle: 'Berbagai merek semen terbaik untuk proyek Anda',
      onPress: () => router.push({ pathname: '/(tabs)/catalog', params: { category: 'Semen' } }),
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&auto=format&fit=crop',
      title: 'Cat Tembok Premium',
      subtitle: 'Warna lengkap, harga bersaing',
      onPress: () => router.push({ pathname: '/(tabs)/catalog', params: { category: 'Cat Tembok' } }),
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop',
      title: 'Perkakas & Alat',
      subtitle: 'Lengkapi kebutuhan proyek bangunan Anda',
      onPress: () => router.push({ pathname: '/(tabs)/catalog', params: { category: 'Perkakas' } }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoSmallText}>SA</Text>
          </View>
          <View>
            <Text style={styles.headerBrand}>
              SINAR <Text style={{ color: Colors.primary }}>ABADI</Text>
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={10} color={Colors.textMuted} />
              <Text style={styles.locationText}>Dampit, Malang</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.push('/cart')}
          >
            <ShoppingCart size={22} color={Colors.textMain} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          style={[styles.searchPlaceholder, { flex: 1, paddingVertical: 0 }]}
          placeholder="Cari material bangunan..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              router.push({ pathname: '/(tabs)/catalog', params: { search: searchQuery.trim() } });
            }
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Hero Banner */}
        <HeroBanner slides={bannerSlides} />

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Material</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.filterValue } })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[cat.id] || '#f1f5f9' }]}>
                  {CATEGORY_ICONS[cat.id]}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Best Sellers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produk Paling Laku</Text>
            <Pressable
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.productGrid}>
              {bestSellers.map((product) => (
                <View key={product.id} style={styles.productGridItem}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Store Info Footer */}
        <View style={styles.storeInfoSection}>
          <View style={styles.storeInfoCard}>
            <View style={styles.storeLogoRow}>
              <View style={styles.storeLogoBig}>
                <Text style={styles.storeLogoText}>SA</Text>
              </View>
              <View>
                <Text style={styles.storeName}>Toko Sinar Abadi</Text>
                <Text style={styles.storeDesc}>Toko Material Bangunan Terlengkap</Text>
              </View>
            </View>
            <View style={styles.storeDetailRow}>
              <MapPin size={14} color={Colors.textMuted} />
              <Text style={styles.storeDetailText}>
                Jl. Utara Masjid No.9, Dampit, Kab. Malang
              </Text>
            </View>
            <View style={styles.storeDetailRow}>
              <Phone size={14} color={Colors.textMuted} />
              <Text style={styles.storeDetailText}>+62 819-4512-2202</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSmallText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: Fonts.extrabold,
    letterSpacing: 1,
  },
  headerBrand: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.extrabold,
    color: Colors.textMain,
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerIconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Fonts.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  section: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.bold,
    color: Colors.textMain,
    marginBottom: Spacing.lg,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.lg,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.semibold,
  },
  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: Fonts.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Products
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  productGridItem: {
    width: '47.5%',
  },
  // Store Info
  storeInfoSection: {
    marginTop: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  storeInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  storeLogoBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: Fonts.extrabold,
    letterSpacing: 1,
  },
  storeName: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.bold,
    color: Colors.textMain,
  },
  storeDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  storeDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  storeDetailText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
