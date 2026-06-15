import React from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, SafeAreaView, FlatList,
  Platform, StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, ShoppingBag, ShoppingCart, Minus, Plus } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../constants/theme';
import { useCartStore } from '../stores/cartStore';
import { formatPrice, fixImageUrl } from '../utils/format';
import { CartItem } from '../types';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQty, removeItem, getTotal } = useCartStore();
  const total = getTotal();

  const handleRemove = (item: CartItem) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Hapus "${item.name}" dari keranjang?`)) {
        removeItem(item.id, item.color);
      }
    } else {
      Alert.alert(
        'Hapus Item',
        `Hapus "${item.name}" dari keranjang?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: () => removeItem(item.id, item.color) },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: fixImageUrl(item.img) || 'https://via.placeholder.com/80x80?text=No+Image' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        {item.color && (
          <Text style={styles.itemColor}>Warna: {item.color}</Text>
        )}
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.itemActions}>
          <View style={styles.qtyRow}>
            <Pressable
              style={[styles.qtyButton, item.qty <= Math.min(item.minPurchase || 1, Math.max(1, item.stock)) && styles.qtyButtonDisabled]}
              onPress={() => updateQty(item.id, item.color, item.qty - 1)}
              disabled={item.qty <= Math.min(item.minPurchase || 1, Math.max(1, item.stock))}
            >
              <Minus size={14} color={item.qty <= Math.min(item.minPurchase || 1, Math.max(1, item.stock)) ? Colors.textLight : Colors.textMain} />
            </Pressable>
            <Text style={styles.qtyText}>{item.qty}</Text>
            <Pressable
              style={[styles.qtyButton, item.qty >= item.stock && styles.qtyButtonDisabled]}
              onPress={() => updateQty(item.id, item.color, item.qty + 1)}
              disabled={item.qty >= item.stock}
            >
              <Plus size={14} color={item.qty >= item.stock ? Colors.textLight : Colors.textMain} />
            </Pressable>
            <Text style={styles.unitLabel}>{item.unit}</Text>
          </View>
          <Pressable style={styles.deleteButton} onPress={() => handleRemove(item)}>
            <Trash2 size={16} color={Colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={56} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
      <Text style={styles.emptySubtitle}>Mulai belanja dan tambahkan produk ke keranjang</Text>
      <Pressable
        style={styles.shopButton}
        onPress={() => router.push('/(tabs)/catalog')}
      >
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ArrowLeft size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Keranjang Belanja</Text>
        <View style={styles.headerButton}>
          <ShoppingCart size={22} color={Colors.textMain} />
          {items.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}-${item.color}`}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom checkout bar */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
          </View>
          <Pressable
            style={styles.checkoutButton}
            onPress={() => router.push('/payment')}
          >
            <Text style={styles.checkoutText}>Lanjut ke Pembayaran</Text>
          </Pressable>
        </View>
      )}
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
    color: Colors.textMain,
  },
  badge: {
    position: 'absolute', top: 0, right: -2,
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: Fonts.bold },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  itemImage: {
    width: 80, height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
    lineHeight: 18,
  },
  itemColor: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyButton: {
    width: 28, height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  qtyText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.bold,
    color: Colors.textMain,
    minWidth: 24,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  deleteButton: {
    width: 32, height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.dangerBg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg, fontWeight: Fonts.bold,
    color: Colors.textSecondary, marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm, color: Colors.textMuted,
    textAlign: 'center', marginTop: Spacing.sm,
  },
  shopButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing['3xl'],
    marginTop: Spacing.xl,
  },
  shopButtonText: {
    color: Colors.white, fontSize: FontSizes.base, fontWeight: Fonts.bold,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopWidth: 1,
    borderTopColor: Colors.border, padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.lg,
    ...Shadows.lg,
  },
  totalSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSizes.sm, color: Colors.textMuted,
  },
  totalPrice: {
    fontSize: FontSizes.xl, fontWeight: Fonts.extrabold, color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
    ...Shadows.md,
  },
  checkoutText: {
    color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold,
  },
});
