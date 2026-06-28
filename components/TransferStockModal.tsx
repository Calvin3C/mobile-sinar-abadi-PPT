import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../services/api';
import { Colors } from '../constants/theme';
import { Warehouse, ProductVariant } from '../types';

interface TransferStockModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string | number;
  variants: ProductVariant[];
}

export default function TransferStockModal({ visible, onClose, productId, variants }: TransferStockModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    variantId: '',
    quantity: '1'
  });
  const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | 'variant' | ''>('');

  useEffect(() => {
    if (visible) {
      api.get('/warehouses').then(res => {
        setWarehouses(res.data?.data || res.data || []);
      }).catch(console.error);
    }
  }, [visible]);

  const handleTransfer = async () => {
    if (!form.fromWarehouseId || !form.toWarehouseId) return Alert.alert('Error', 'Gudang asal dan tujuan wajib dipilih');
    if (form.fromWarehouseId === form.toWarehouseId) return Alert.alert('Error', 'Gudang asal dan tujuan tidak boleh sama');
    const qty = parseInt(form.quantity);
    if (!qty || qty <= 0) return Alert.alert('Error', 'Kuantitas minimal 1');

    setLoading(true);
    try {
      await api.post(`/products/${productId}/transfer`, {
        fromWarehouseId: parseInt(form.fromWarehouseId),
        toWarehouseId: parseInt(form.toWarehouseId),
        variantId: form.variantId ? parseInt(form.variantId) : null,
        quantity: qty
      });
      Alert.alert('Berhasil', 'Transfer stok berhasil');
      onClose();
      setForm({ fromWarehouseId: '', toWarehouseId: '', variantId: '', quantity: '1' });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Transfer Stok Antar Gudang</Text>

          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={styles.label}>Gudang Asal</Text>
            <Pressable style={styles.dropdownInput} onPress={() => setOpenDropdown(openDropdown === 'from' ? '' : 'from')}>
              <Text style={{ color: form.fromWarehouseId ? '#0f172a' : '#94a3b8' }}>
                {warehouses.find(w => w.id.toString() === form.fromWarehouseId)?.name || 'Pilih Gudang Asal'}
              </Text>
            </Pressable>
            {openDropdown === 'from' && (
              <ScrollView style={styles.accordionMenu} nestedScrollEnabled>
                {warehouses.filter(w => w.isActive).map(w => (
                  <Pressable key={w.id} style={styles.accordionItem} onPress={() => { setForm({ ...form, fromWarehouseId: w.id.toString() }); setOpenDropdown(''); }}>
                    <Text style={form.fromWarehouseId === w.id.toString() ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>{w.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Text style={styles.label}>Gudang Tujuan</Text>
            <Pressable style={styles.dropdownInput} onPress={() => setOpenDropdown(openDropdown === 'to' ? '' : 'to')}>
              <Text style={{ color: form.toWarehouseId ? '#0f172a' : '#94a3b8' }}>
                {warehouses.find(w => w.id.toString() === form.toWarehouseId)?.name || 'Pilih Gudang Tujuan'}
              </Text>
            </Pressable>
            {openDropdown === 'to' && (
              <ScrollView style={styles.accordionMenu} nestedScrollEnabled>
                {warehouses.filter(w => w.isActive && w.id.toString() !== form.fromWarehouseId).map(w => (
                  <Pressable key={w.id} style={styles.accordionItem} onPress={() => { setForm({ ...form, toWarehouseId: w.id.toString() }); setOpenDropdown(''); }}>
                    <Text style={form.toWarehouseId === w.id.toString() ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>{w.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {variants && variants.length > 0 && (
              <>
                <Text style={styles.label}>Varian Produk (Opsional)</Text>
                <Pressable style={styles.dropdownInput} onPress={() => setOpenDropdown(openDropdown === 'variant' ? '' : 'variant')}>
                  <Text style={{ color: form.variantId ? '#0f172a' : '#94a3b8' }}>
                    {variants.find(v => v.id?.toString() === form.variantId)?.name || 'Semua / Produk Utama'}
                  </Text>
                </Pressable>
                {openDropdown === 'variant' && (
                  <ScrollView style={styles.accordionMenu} nestedScrollEnabled>
                    <Pressable style={styles.accordionItem} onPress={() => { setForm({ ...form, variantId: '' }); setOpenDropdown(''); }}>
                      <Text style={!form.variantId ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>Semua / Produk Utama</Text>
                    </Pressable>
                    {variants.map(v => (
                      <Pressable key={v.id} style={styles.accordionItem} onPress={() => { setForm({ ...form, variantId: v.id?.toString() || '' }); setOpenDropdown(''); }}>
                        <Text style={form.variantId === v.id?.toString() ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#334155' }}>{v.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            <Text style={styles.label}>Kuantitas</Text>
            <TextInput
              style={styles.dropdownInput}
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={(t) => setForm({ ...form, quantity: t })}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, { backgroundColor: '#f1f5f9' }]} onPress={onClose}>
              <Text style={{ color: '#475569', fontWeight: 'bold' }}>Batal</Text>
            </Pressable>
            <Pressable style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={handleTransfer} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Transfer</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  content: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6, marginTop: 10 },
  dropdownInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 12, marginBottom: 4 },
  accordionMenu: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginBottom: 10, maxHeight: 150 },
  accordionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, padding: 12, borderRadius: 6, alignItems: 'center' }
});
