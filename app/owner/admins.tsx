import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  Pressable, Modal, TextInput, Alert,
} from 'react-native';
import { Shield, Phone, Mail, Plus, X, Trash2 } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import EmptyState from '../../components/EmptyState';

interface AdminData {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
}

export default function OwnerAdmins() {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '' });

  const fetch = async () => {
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.email || !form.phone || !form.password) {
      Alert.alert('Error', 'Semua field wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users/admins', form);
      Alert.alert('Berhasil', 'Admin berhasil ditambahkan.');
      setShowModal(false);
      setForm({ name: '', username: '', email: '', phone: '', password: '' });
      fetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menambahkan admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Hapus Admin?', 'Aksi ini tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/admins/${id}`);
            fetch();
          } catch (e: any) {
            Alert.alert('Error', 'Gagal menghapus admin.');
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Pressable style={styles.addButton} onPress={() => setShowModal(true)}>
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Tambah Admin Baru</Text>
      </Pressable>

      <FlatList
        data={admins}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState title="Belum ada Admin" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} colors={[Colors.primary]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Shield size={20} color={Colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
              <View style={styles.detailRow}>
                <Mail size={12} color={Colors.textMuted} />
                <Text style={styles.detailText}>{item.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Phone size={12} color={Colors.textMuted} />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 size={16} color={Colors.danger} />
            </Pressable>
          </View>
        )}
      />

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Admin</Text>
              <Pressable onPress={() => setShowModal(false)}><X size={22} color={Colors.textMain} /></Pressable>
            </View>
            <View>
              {['name', 'username', 'email', 'phone', 'password'].map((k) => (
                <View key={k} style={{ marginBottom: Spacing.md }}>
                  <TextInput
                    style={styles.input}
                    placeholder={`Masukkan ${k}`}
                    value={(form as any)[k]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [k]: v }))}
                    secureTextEntry={k === 'password'}
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <Pressable style={styles.saveBtn} onPress={handleAdd} disabled={submitting}>
                {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Simpan Admin</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, paddingVertical: Spacing.md, ...Shadows.md },
  addButtonText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  card: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.infoBg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  name: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain },
  username: { fontSize: FontSizes.xs, color: Colors.textMuted },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  detailText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  deleteBtn: { justifyContent: 'center', padding: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain },
  input: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  saveText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
