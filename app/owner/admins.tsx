import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  Pressable, Modal, TextInput, Alert, Platform, ScrollView,
} from 'react-native';
import { Shield, Phone, Mail, Plus, X, Trash2, Edit2 } from 'lucide-react-native';
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

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', username: '', email: '', phone: '', password: '' });

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', password: '' });

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.username || !createForm.password) {
      if (Platform.OS === 'web') window.alert('Nama, Username, dan Password wajib diisi.');
      else Alert.alert('Error', 'Nama, Username, dan Password wajib diisi.');
      return;
    }
    setCreateSubmitting(true);
    try {
      await api.post('/users/admins', createForm);
      if (Platform.OS === 'web') window.alert('Admin berhasil ditambahkan.');
      else Alert.alert('Berhasil', 'Admin berhasil ditambahkan.');
      setShowCreateModal(false);
      setCreateForm({ name: '', username: '', email: '', phone: '', password: '' });
      fetchAdmins();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'Gagal menambahkan admin.';
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEdit = (admin: AdminData) => {
    setTargetUsername(admin.username);
    setEditForm({
      name: admin.name || '',
      phone: admin.phone || '',
      email: admin.email || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name) {
      if (Platform.OS === 'web') window.alert('Nama wajib diisi.');
      else Alert.alert('Error', 'Nama wajib diisi.');
      return;
    }
    setEditSubmitting(true);
    try {
      await api.put(`/users/admins/${targetUsername}`, editForm);
      if (Platform.OS === 'web') window.alert('Admin berhasil diperbarui.');
      else Alert.alert('Berhasil', 'Admin berhasil diperbarui.');
      setShowEditModal(false);
      fetchAdmins();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'Gagal memperbarui admin.';
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = (username: string) => {
    const title = 'Hapus Admin?';
    const message = `Apakah Anda yakin ingin menghapus staf admin "${username}"? Aksi ini tidak dapat dibatalkan.`;

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`${title}\n${message}`);
      if (confirm) {
        api.delete(`/users/admins/${username}`)
          .then(() => {
            window.alert(`Akun admin "${username}" telah dihapus.`);
            fetchAdmins();
          })
          .catch(() => {
            window.alert('Gagal menghapus admin.');
          });
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/admins/${username}`);
              fetchAdmins();
            } catch (e: any) {
              Alert.alert('Error', 'Gagal menghapus admin.');
            }
          },
        },
      ]);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Pressable style={styles.addButton} onPress={() => setShowCreateModal(true)}>
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Tambah Admin Baru</Text>
      </Pressable>

      <FlatList
        data={admins}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState title="Belum ada Admin" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdmins(); }} colors={[Colors.primary]} />}
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
                <Text style={styles.detailText}>{item.email || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Phone size={12} color={Colors.textMuted} />
                <Text style={styles.detailText}>{item.phone || '-'}</Text>
              </View>
            </View>
            <View style={styles.actionColumn}>
              <Pressable style={[styles.actionBtn, { backgroundColor: Colors.warningBg }]} onPress={() => handleOpenEdit(item)}>
                <Edit2 size={16} color={Colors.warning} />
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: Colors.dangerBg }]} onPress={() => handleDelete(item.username)}>
                <Trash2 size={16} color={Colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Admin Baru</Text>
              <Pressable onPress={() => setShowCreateModal(false)}><X size={22} color={Colors.textMain} /></Pressable>
            </View>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap"
                  value={createForm.name}
                  onChangeText={(v) => setCreateForm((p) => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan username"
                  value={createForm.username}
                  onChangeText={(v) => setCreateForm((p) => ({ ...p, username: v }))}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan email"
                  value={createForm.email}
                  onChangeText={(v) => setCreateForm((p) => ({ ...p, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor HP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nomor HP"
                  value={createForm.phone}
                  onChangeText={(v) => setCreateForm((p) => ({ ...p, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  value={createForm.password}
                  onChangeText={(v) => setCreateForm((p) => ({ ...p, password: v }))}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <Pressable style={styles.saveBtn} onPress={handleCreate} disabled={createSubmitting}>
                {createSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Simpan Admin</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profil Admin (@{targetUsername})</Text>
              <Pressable onPress={() => setShowEditModal(false)}><X size={22} color={Colors.textMain} /></Pressable>
            </View>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap"
                  value={editForm.name}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan email"
                  value={editForm.email}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor HP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nomor HP"
                  value={editForm.phone}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password Baru (Kosongkan jika tidak diubah)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 3 karakter"
                  value={editForm.password}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, password: v }))}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <Pressable style={styles.saveBtn} onPress={handleUpdate} disabled={editSubmitting}>
                {editSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Simpan Perubahan</Text>}
              </Pressable>
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
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, paddingVertical: Spacing.md, ...Shadows.md },
  addButtonText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  
  card: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.infoBg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  name: { fontSize: FontSizes.base, fontWeight: Fonts.semibold, color: Colors.textMain },
  username: { fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  detailText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  
  actionColumn: { justifyContent: 'center', gap: Spacing.sm, paddingLeft: Spacing.sm },
  actionBtn: { width: 36, height: 36, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain },
  
  formGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.xs, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, fontSize: FontSizes.sm, color: Colors.textMain },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  saveText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
