import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../constants/theme';
import { formatPrice, fixImageUrl } from '../utils/format';
import { Product } from '../types';

interface Props {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: fixImageUrl(product.img) || 'https://via.placeholder.com/200x200?text=No+Image' }}
        style={styles.image}
        resizeMode="cover"
      />
      {product.stock <= 10 && product.stock > 0 && (
        <View style={styles.stockBadge}>
          <Text style={styles.stockBadgeText}>Stok Terbatas</Text>
        </View>
      )}
      {product.stock === 0 && (
        <View style={[styles.stockBadge, { backgroundColor: Colors.danger }]}>
          <Text style={styles.stockBadgeText}>Habis</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.sold > 0 && (
          <Text style={styles.sold}>Terjual {product.sold}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.borderLight,
  },
  stockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.warning,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  stockBadgeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: Fonts.bold,
  },
  info: {
    padding: Spacing.md,
  },
  name: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
    lineHeight: 18,
    minHeight: 36,
  },
  category: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  price: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  sold: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
});
