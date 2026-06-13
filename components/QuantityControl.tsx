import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';

interface Props {
  qty: number;
  min: number;
  max: number;
  unit: string;
  onDecrease: () => void;
  onIncrease: () => void;
}

export default function QuantityControl({ qty, min, max, unit, onDecrease, onIncrease }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, qty <= min && styles.buttonDisabled]}
        onPress={onDecrease}
        disabled={qty <= min}
      >
        <Minus size={18} color={qty <= min ? Colors.textLight : Colors.textMain} />
      </Pressable>
      <View style={styles.qtyContainer}>
        <Text style={styles.qtyText}>{qty}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>
      <Pressable
        style={[styles.button, qty >= max && styles.buttonDisabled]}
        onPress={onIncrease}
        disabled={qty >= max}
      >
        <Plus size={18} color={qty >= max ? Colors.textLight : Colors.textMain} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  buttonDisabled: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.borderLight,
  },
  qtyContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  qtyText: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.bold,
    color: Colors.textMain,
  },
  unitText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: -2,
  },
});
