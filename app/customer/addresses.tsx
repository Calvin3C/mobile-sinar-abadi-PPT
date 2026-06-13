import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Modal, RefreshControl, Platform,
} from 'react-native';
import { MapPin, Plus, Edit3, Star, X, Search } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { CustomerAddress } from '../../types';

import { useAuthStore } from '../../stores/authStore';

export default function AddressesScreen() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', label: '', address: '', catatan: '',
    kota: '', postalCode: '', biteshipAreaId: '',
  });
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [searchingArea, setSearchingArea] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  // Biteship area autocomplete
  useEffect(() => {
    if (areaQuery.length < 3) { setAreaResults([]); return; }
    if (form.kota && areaQuery === form.kota) { setAreaResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingArea(true);
      try {
        const res = await api.get('/biteship/maps', { params: { input: areaQuery } });
        setAreaResults(res.data.areas || res.data || []);
      } catch { }
      setSearchingArea(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [areaQuery, form.kota]);

  const handleSelectArea = (area: any) => {
    const displayName = area.name || `${area.administrative_division_level_3_name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}. ${area.postal_code || ''}`;
    setForm((prev) => ({
      ...prev,
      kota: displayName,
      postalCode: String(area.postal_code || ''),
      biteshipAreaId: area.id,
    }));
    setAreaQuery(displayName);
    setAreaResults([]);
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setForm({ name: user?.name || '', phone: user?.phone || '', label: '', address: '', catatan: '', kota: '', postalCode: '', biteshipAreaId: '' });
    setAreaQuery('');
    setShowForm(true);
  };

  const openEditForm = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setForm({
      name: addr.name, phone: addr.phone, label: addr.label,
      address: addr.address, catatan: addr.catatan,
      kota: addr.kota, postalCode: addr.postalCode, biteshipAreaId: addr.biteshipAreaId,
    });
    setAreaQuery(addr.kota);
    setShowForm(true);
  };

  const handleSave = async () => {
    const { name, phone, label, address, kota, biteshipAreaId } = form;
    if (!name || !phone || !label || !address || !kota || !biteshipAreaId) {
      if (Platform.OS === 'web') window.alert('Semua field wajib diisi.');
      else Alert.alert('Error', 'Semua field wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, form);
      } else {
        await api.post('/addresses', form);
      }
      await fetchAddresses();
      setShowForm(false);
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.response?.data?.error || 'Gagal menyimpan alamat.');
      else Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan alamat.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetMain = async (addr: CustomerAddress) => {
    try {
      await api.put(`/addresses/${addr.id}`, { ...addr, isMain: true });
      await fetchAddresses();
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert('Gagal mengubah alamat utama.');
      else Alert.alert('Error', 'Gagal mengubah alamat utama.');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAddresses(); }} colors={[Colors.primary]} />}
      >
        {addresses.map((addr) => (
          <View key={addr.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.labelRow}>
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.isMain && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Utama</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.addressName}>{addr.name} • {addr.phone}</Text>
            <Text style={styles.addressText}>{addr.address}</Text>
            <Text style={styles.addressKota}>{addr.kota}</Text>
            {addr.catatan ? <Text style={styles.addressNote}>Catatan: {addr.catatan}</Text> : null}

            <View style={styles.addressActions}>
              <Pressable style={styles.actionButton} onPress={() => openEditForm(addr)}>
                <Edit3 size={14} color={Colors.info} />
                <Text style={[styles.actionText, { color: Colors.info }]}>Ubah Alamat</Text>
              </Pressable>
              {!addr.isMain && (
                <Pressable style={styles.actionButton} onPress={() => handleSetMain(addr)}>
                  <Star size={14} color={Colors.warning} />
                  <Text style={[styles.actionText, { color: Colors.warning }]}>Jadikan Utama</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        <Pressable style={styles.addButton} onPress={openAddForm}>
          <Plus size={20} color={Colors.primary} />
          <Text style={styles.addButtonText}>Tambah Alamat Baru</Text>
        </Pressable>
      </ScrollView>

      {/* Address Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAddress ? 'Ubah Alamat' : 'Tambah Alamat'}</Text>
              <Pressable onPress={() => setShowForm(false)}>
                <X size={22} color={Colors.textMain} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'label', label: 'Label Alamat', placeholder: 'Contoh: Rumah, Kantor' },
                { key: 'name', label: 'Nama Penerima', placeholder: 'Nama lengkap penerima' },
                { key: 'phone', label: 'Nomor HP', placeholder: '08xxxxxxxxxx', keyboardType: 'phone-pad' as const },
              ].map((f) => (
                <View key={f.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textLight}
                    value={(form as any)[f.key]}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                    keyboardType={f.keyboardType || 'default'}
                  />
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kota & Kecamatan</Text>
                <View style={styles.areaSearchRow}>
                  <Search size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.areaInput}
                    placeholder="Ketik kota/kecamatan (min. 3 huruf)"
                    placeholderTextColor={Colors.textLight}
                    value={areaQuery}
                    onChangeText={setAreaQuery}
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                  {searchingArea && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>
                {areaResults.length > 0 && (
                  <View style={styles.areaResults}>
                    {areaResults.slice(0, 8).map((area: any, idx: number) => (
                      <Pressable key={idx} style={styles.areaItem} onPress={() => handleSelectArea(area)}>
                        <Text style={styles.areaItemText}>{area.name || `${area.administrative_division_level_3_name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}`}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alamat Lengkap</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Jalan, nomor rumah..."
                  placeholderTextColor={Colors.textLight}
                  value={form.address}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, address: v }))}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan Kurir (opsional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Dekat masjid"
                  placeholderTextColor={Colors.textLight}
                  value={form.catatan}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, catatan: v }))}
                />
              </View>

              <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Simpan Alamat</Text>}
              </Pressable>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  addressCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addressLabel: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain },
  mainBadge: { backgroundColor: Colors.primaryBg, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  mainBadgeText: { fontSize: 9, color: Colors.primary, fontWeight: Fonts.bold },
  addressName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary },
  addressText: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  addressKota: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 1 },
  addressNote: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: 4, fontStyle: 'italic' },
  addressActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  addButtonText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: Fonts.semibold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], maxHeight: '85%', padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain },
  formGroup: { marginBottom: Spacing.lg },
  formLabel: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  formInput: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSizes.sm, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border },
  areaSearchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  areaInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.md },
  areaResults: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, marginTop: 4, backgroundColor: Colors.white, ...Shadows.md },
  areaItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  areaItemText: { fontSize: FontSizes.sm, color: Colors.textMain },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, alignItems: 'center', ...Shadows.md },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
