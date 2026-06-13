import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Eye, EyeOff, Save } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function OwnerProfile() {
  const { user, updateProfile } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '', username: user?.username || '',
    email: user?.email || '', phone: user?.phone || '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.username || !form.email || !form.phone) {
      Alert.alert('Error', 'Semua field wajib diisi.'); return;
    }
    setLoading(true);
    try {
      const payload: any = { name: form.name, username: form.username, email: form.email, phone: form.phone };
      if (form.password.length > 0) {
        if (form.password.length < 5) { Alert.alert('Error', 'Password minimal 5 karakter.'); setLoading(false); return; }
        payload.password = form.password;
      }
      await updateProfile(payload);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal memperbarui profil.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {['name', 'username', 'email', 'phone'].map((key) => (
          <View key={key} style={styles.group}>
            <Text style={styles.label}>{key === 'name' ? 'Nama' : key === 'username' ? 'Username' : key === 'email' ? 'Email' : 'Nomor HP'}</Text>
            <TextInput style={styles.input} value={(form as any)[key]} onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))} placeholderTextColor={Colors.textLight} autoCapitalize={key === 'name' ? 'words' : 'none'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} />
          </View>
        ))}
        <View style={styles.group}>
          <Text style={styles.label}>Password Baru (opsional)</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 50 }]} placeholder="Kosongkan jika tidak diubah" placeholderTextColor={Colors.textLight} value={form.password} onChangeText={(v) => setForm((p) => ({ ...p, password: v }))} secureTextEntry={!showPassword} />
            <Pressable style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }} onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
            </Pressable>
          </View>
        </View>
        <Pressable style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <><Save size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Simpan</Text></>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.sm },
  group: { marginBottom: Spacing.lg },
  label: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSizes.base, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, ...Shadows.md },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
