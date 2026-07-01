import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function CustomerRegister() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMessage(''); // Clear error when typing
  };

  const handleRegister = async () => {
    const { username, name, email, phone, password, confirmPassword } = form;

    if (!username.trim() || !name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setErrorMessage('Semua field harus diisi.');
      return;
    }
    if (password.length < 5) {
      setErrorMessage('Password minimal 5 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const formattedPhone = phone.startsWith('0') ? phone : `0${phone}`;
      
      await register({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: formattedPhone.trim(),
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
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: Math.max(insets.top + 10, Platform.OS === 'android' ? 40 : 20) }
          ]} 
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ArrowLeft size={24} color={Colors.textMain} />
          </Pressable>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SA</Text>
            </View>
            <Text style={styles.brandName}>
              SINAR <Text style={styles.brandAccent}>ABADI</Text>
            </Text>
            <Text style={styles.subtitle}>Buat akun pelanggan baru</Text>
          </View>

          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={Colors.textLight}
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                No. Handphone Pengguna <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+62</Text>
                  <ChevronDown size={16} color={Colors.textMain} />
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="eg, 871037262"
                  placeholderTextColor={Colors.textLight}
                  value={form.phone}
                  onChangeText={(v) => updateField('phone', v)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan alamat email"
                placeholderTextColor={Colors.textLight}
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Buat username unik"
                placeholderTextColor={Colors.textLight}
                value={form.username}
                onChangeText={(v) => updateField('username', v)}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 5 karakter"
                placeholderTextColor={Colors.textLight}
                value={form.password}
                onChangeText={(v) => updateField('password', v)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
              <TextInput
                style={styles.input}
                placeholder="Ketik ulang kata sandi"
                placeholderTextColor={Colors.textLight}
                value={form.confirmPassword}
                onChangeText={(v) => updateField('confirmPassword', v)}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Daftar Sekarang</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Masuk di sini</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  backButton: {
    width: 40, height: 40, borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandName: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 2,
  },
  brandAccent: {
    color: '#DC2626',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: '#6B7280',
    marginTop: Spacing.xs,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: Spacing.sm,
  },
  inputGroup: { marginBottom: Spacing.lg },
  label: { 
    fontSize: FontSizes.sm, 
    fontWeight: '700', 
    color: '#1F2937', 
    marginBottom: Spacing.xs 
  },
  asterisk: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.md,
    fontSize: FontSizes.sm, 
    color: '#1F2937',
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  prefixText: {
    fontSize: FontSizes.sm,
    color: '#4B5563',
  },
  phoneInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#DC2626', // Red color as requested
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { 
    color: '#FFFFFF', 
    fontSize: FontSizes.base, 
    fontWeight: '700' 
  },
  loginRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: Spacing.xl 
  },
  loginText: { 
    fontSize: FontSizes.sm, 
    color: '#6B7280' 
  },
  loginLink: { 
    fontSize: FontSizes.sm, 
    color: '#DC2626', 
    fontWeight: '600' 
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
});
