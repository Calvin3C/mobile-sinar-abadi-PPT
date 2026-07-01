import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, LogIn, ArrowLeft, Shield } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLogin() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password harus diisi.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, 'admin');
      router.replace('/admin');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Login gagal. Periksa kembali data Anda.';
      Alert.alert('Login Gagal', msg);
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

          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: Colors.info }]}>
              <Shield size={32} color={Colors.white} />
            </View>
            <Text style={styles.brandName}>
              SINAR <Text style={styles.brandAccent}>ABADI</Text>
            </Text>
            <Text style={styles.subtitle}>Panel Administrator</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email admin"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Masukkan password"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <LogIn size={20} color={Colors.white} />
                  <Text style={styles.loginButtonText}>Masuk sebagai Admin</Text>
                </>
              )}
            </Pressable>
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
  },
  backButton: {
    width: 40, height: 40, borderRadius: Radius.lg,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm, marginBottom: Spacing['2xl'],
  },
  header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md, ...Shadows.lg,
  },
  brandName: { fontSize: FontSizes['2xl'], fontWeight: Fonts.extrabold, color: Colors.textMain, letterSpacing: 2 },
  brandAccent: { color: Colors.primary },
  subtitle: { fontSize: FontSizes.base, color: Colors.info, marginTop: Spacing.xs, fontWeight: Fonts.semibold },
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
  loginButton: {
    backgroundColor: Colors.info, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, ...Shadows.md,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
