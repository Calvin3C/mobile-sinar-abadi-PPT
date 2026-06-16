import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../constants/theme';
import api from '../services/api';
import { ProductVariant } from '../types';

interface ManageVariantsModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variants: ProductVariant[];
  onRefresh: () => void;
}

export default function ManageVariantsModal({ visible, onClose, productId, productName, variants, onRefresh }: ManageVariantsModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
  });

  const getStock = (v: ProductVariant) => {
    if (!v.warehouseStocks || v.warehouseStocks.length === 0) return 0;
    return v.warehouseStocks.reduce((acc, curr) => acc + curr.stock, 0);
  };

  const handleAdd = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Nama varian wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/products/${productId}/variants`, {
        name: form.name,
        price: parseInt(form.price) || 0,
      });
      setForm({ name: '', price: '' });
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menambah varian.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (variantId: number) => {
    Alert.alert('Hapus Varian', 'Yakin ingin menghapus varian ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/products/${productId}/variants/${variantId}`);
            onRefresh();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Gagal menghapus varian.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Varian — {productName}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#0f172a" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea}>
            <View style={styles.listContainer}>
              {variants.length > 0 && (
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 2 }]}>Nama Varian</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Harga</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Stok</Text>
                  <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Aksi</Text>
                </View>
              )}
              {variants.map((v) => (
                <View key={v.id} style={styles.row}>
                  <Text style={[styles.rowText, { flex: 2 }]} numberOfLines={1}>{v.name}</Text>
                  <Text style={[styles.rowText, { flex: 1, color: '#64748b' }]} numberOfLines={1}>{v.price > 0 ? `+${v.price}` : 'Base'}</Text>
                  <Text style={[styles.rowText, { flex: 1, textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }]}>{getStock(v)}</Text>
                  <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                    <Pressable onPress={() => handleDelete(v.id)} style={styles.deleteIconBtn}>
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
              {variants.length === 0 && (
                <View style={[styles.row, { justifyContent: 'center' }]}>
                  <Text style={styles.emptyText}>Belum ada varian</Text>
                </View>
              )}
            </View>

            {/* Add New Variant Form */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Tambah Varian Baru</Text>
              
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(val) => setForm((p) => ({ ...p, name: val }))}
                placeholder="Nama varian (contoh: Merah Bata)"
                placeholderTextColor="#94a3b8"
              />
              
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(val) => setForm((p) => ({ ...p, price: val }))}
                placeholder="Harga (0 = pakai harga base)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />

              <Pressable style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleAdd} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitText}>+ Tambah</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.bold,
    color: '#0f172a',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollArea: {
    padding: Spacing.lg,
  },
  listContainer: {
    marginBottom: Spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: Spacing.xs,
  },
  th: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.bold,
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowText: {
    fontSize: FontSizes.sm,
    color: '#334155',
    fontWeight: Fonts.medium,
  },
  deleteIconBtn: {
    backgroundColor: '#fee2e2', // Light red bg
    padding: 6,
    borderRadius: Radius.sm,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: FontSizes.sm,
  },
  formSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.bold,
    color: '#334155',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.sm,
    color: '#0f172a',
    marginBottom: Spacing.md,
  },
  submitBtn: {
    backgroundColor: '#e11d48', // Red like in screenshot
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: Fonts.bold,
  },
});
