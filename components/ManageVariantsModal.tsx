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
    stock: '',
  });

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [warehouses, setWarehouses] = useState<{id: number, name: string}[]>([]);
  const [stockForm, setStockForm] = useState({
    warehouseId: 0,
    variantId: 0,
    amount: '',
  });
  const [openDropdown, setOpenDropdown] = useState<'gudang' | 'varian' | ''>('');

  React.useEffect(() => {
    if (visible) {
      api.get('/warehouses').then(res => {
        const warehouseData = res.data?.data || [];
        setWarehouses(warehouseData);
      }).catch(console.error);
    }
  }, [visible]);

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
        stock: parseInt(form.stock) || 0,
      });
      setForm({ name: '', price: '', stock: '' });
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menambah varian.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async () => {
    if (!stockForm.amount || parseInt(stockForm.amount) === 0) {
      Alert.alert('Error', 'Jumlah stok tidak boleh kosong/0.');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/products/${productId}/stock`, {
        amount: parseInt(stockForm.amount),
        warehouseId: stockForm.warehouseId || null,
        variantId: stockForm.variantId || null,
      });
      setStockModalVisible(false);
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal update stok.');
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
                  <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Aksi</Text>
                </View>
              )}
              {variants.map((v) => (
                <View key={v.id} style={styles.row}>
                  <Text style={[styles.rowText, { flex: 2 }]} numberOfLines={1}>{v.name}</Text>
                  <Text style={[styles.rowText, { flex: 1, color: '#64748b' }]} numberOfLines={1}>{v.price > 0 ? `+${v.price}` : 'Base'}</Text>
                  <Text style={[styles.rowText, { flex: 1, textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }]}>{getStock(v)}</Text>
                  <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                    <Pressable onPress={() => {
                      setStockForm({ warehouseId: warehouses[0]?.id || 0, variantId: v.id, amount: '' });
                      setStockModalVisible(true);
                    }}>
                      <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: FontSizes.sm }}>Stok</Text>
                    </Pressable>
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
              
              <TextInput
                style={styles.input}
                value={form.stock}
                onChangeText={(val) => setForm((p) => ({ ...p, stock: val }))}
                placeholder="Stok Awal (opsional)"
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

      {/* Stock Update Modal */}
      <Modal visible={stockModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={[styles.header, { paddingBottom: Spacing.md }]}>
              <Text style={styles.headerTitle}>Update Jumlah Stok</Text>
              <Pressable onPress={() => setStockModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#0f172a" />
              </Pressable>
            </View>
            <ScrollView style={styles.scrollArea}>
              <Text style={styles.label}>Gudang</Text>
              <Pressable style={styles.dropdownInput} onPress={() => setOpenDropdown(openDropdown === 'gudang' ? '' : 'gudang')}>
                <Text style={{ color: stockForm.warehouseId ? '#0f172a' : '#94a3b8' }}>
                  {warehouses.find(w => w.id === stockForm.warehouseId)?.name || 'Pilih Gudang'}
                </Text>
              </Pressable>
              {openDropdown === 'gudang' && (
                <ScrollView style={styles.accordionMenu} nestedScrollEnabled>
                  {warehouses.map(w => (
                    <Pressable key={w.id} style={styles.accordionItem} onPress={() => { setStockForm(p => ({ ...p, warehouseId: w.id })); setOpenDropdown(''); }}>
                      <Text style={stockForm.warehouseId === w.id ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>{w.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.label}>Varian (Opsional)</Text>
              <Pressable style={styles.dropdownInput} onPress={() => setOpenDropdown(openDropdown === 'varian' ? '' : 'varian')}>
                <Text style={{ color: stockForm.variantId ? '#0f172a' : '#94a3b8' }}>
                  {variants.find(v => v.id === stockForm.variantId)?.name || 'Pilih Varian'}
                </Text>
              </Pressable>
              {openDropdown === 'varian' && (
                <ScrollView style={styles.accordionMenu} nestedScrollEnabled>
                  {variants.map(v => (
                    <Pressable key={v.id} style={styles.accordionItem} onPress={() => { setStockForm(p => ({ ...p, variantId: v.id })); setOpenDropdown(''); }}>
                      <Text style={stockForm.variantId === v.id ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>{v.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.label}>Jumlah Stok (Ditambah/Dikurang dari saat ini)</Text>
              <TextInput 
                style={styles.input}
                placeholder="Cth: 10 untuk tambah 10, atau -5 untuk kurang"
                keyboardType="numeric"
                value={stockForm.amount}
                onChangeText={(val) => setStockForm(p => ({ ...p, amount: val }))}
              />
              <Text style={styles.helpText}>Isi selisih yang ingin ditambahkan atau dikurangkan.</Text>

              <View style={styles.actionRow}>
                <Pressable style={styles.cancelBtn} onPress={() => setStockModalVisible(false)}>
                  <Text style={styles.cancelText}>Batal</Text>
                </Pressable>
                <Pressable style={styles.saveStockBtn} onPress={handleSaveStock} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveStockText}>Simpan Stok</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  label: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.bold,
    color: '#334155',
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  dropdownInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  accordionMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
    maxHeight: 160,
  },
  accordionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  helpText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: -8,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  cancelText: {
    color: '#334155',
    fontWeight: Fonts.bold,
  },
  saveStockBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: '#d32f2f', // match screenshot
    alignItems: 'center',
  },
  saveStockText: {
    color: Colors.white,
    fontWeight: Fonts.bold,
  },
});
