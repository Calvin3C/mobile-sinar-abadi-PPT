import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function CustomerRegister() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMessage(''); // Clear error when typing
  };

  const handleRegister = async () => {
    const { username, name, email, phone, password } = form;

    if (!username.trim() || !name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Semua field harus diisi.');
      return;
    }
    if (password.length < 5) {
      setErrorMessage('Password minimal 5 karakter.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await register({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      Alert.alert('Berhasil', 'Akun berhasil dibuat! Silakan login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Registrasi gagal. Coba lagi.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.textMain} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SA</Text>
            </View>
            <Text style={styles.title}>Daftar Akun Baru</Text>
            <Text style={styles.subtitle}>Buat akun untuk mulai berbelanja</Text>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {[
              { key: 'username', label: 'Username', placeholder: 'Contoh: budi123', autoCapitalize: 'none' as const },
              { key: 'name', label: 'Nama Lengkap', placeholder: 'Contoh: Budi Santoso', autoCapitalize: 'words' as const },
              { key: 'email', label: 'Email', placeholder: 'Contoh: budi@email.com', autoCapitalize: 'none' as const, keyboardType: 'email-address' as const },
              { key: 'phone', label: 'Nomor HP', placeholder: 'Contoh: 081234567890', autoCapitalize: 'none' as const, keyboardType: 'phone-pad' as const },
            ].map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textLight}
                  value={(form as any)[field.key]}
                  onChangeText={(v) => updateField(field.key, v)}
                  autoCapitalize={field.autoCapitalize}
                  keyboardType={field.keyboardType || 'default'}
                  autoCorrect={false}
                />
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password (min. 5 karakter)</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Masukkan password"
                  placeholderTextColor={Colors.textLight}
                  value={form.password}
                  onChangeText={(v) => updateField('password', v)}
                  secureTextEntry={!showPassword}
                />
                <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <UserPlus size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Daftar</Text>
                </>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Masuk</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 40 : Spacing.xl,
  },
  backButton: {
    width: 40, height: 40, borderRadius: Radius.lg,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm, marginBottom: Spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md, ...Shadows.lg,
  },
  logoText: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: Fonts.extrabold, letterSpacing: 2 },
  title: { fontSize: FontSizes.xl, fontWeight: Fonts.bold, color: Colors.textMain },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  formCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadows.md,
  },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSizes.base, color: Colors.textMain,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  submitButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, ...Shadows.md,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  loginLink: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: Fonts.bold },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontWeight: Fonts.medium,
  },
});
