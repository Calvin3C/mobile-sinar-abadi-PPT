import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff, LogIn, ArrowLeft, Shield, Crown } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function CustomerLogin() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage('Username dan password harus diisi.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await login(username.trim(), password, 'customer');
      router.replace('/(tabs)/catalog');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Login gagal. Periksa kembali username dan password Anda.';
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
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ArrowLeft size={24} color={Colors.textMain} />
          </Pressable>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SA</Text>
            </View>
            <Text style={styles.brandName}>
              SINAR <Text style={styles.brandAccent}>ABADI</Text>
            </Text>
            <Text style={styles.subtitle}>Masuk ke akun pelanggan</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username / Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan username atau email"
                placeholderTextColor={Colors.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textMuted} />
                  ) : (
                    <Eye size={20} color={Colors.textMuted} />
                  )}
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
                  <Text style={styles.loginButtonText}>Masuk</Text>
                </>
              )}
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Belum punya akun? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={styles.registerLink}>Daftar Sekarang</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Staff login links */}
          <View style={styles.staffSection}>
            <Text style={styles.staffTitle}>Login Staff</Text>
            <View style={styles.staffRow}>
              <Link href="/(auth)/admin-login" asChild>
                <Pressable style={styles.staffButton}>
                  <Shield size={16} color={Colors.info} />
                  <Text style={styles.staffButtonText}>Admin</Text>
                </Pressable>
              </Link>
              <Link href="/(auth)/owner-login" asChild>
                <Pressable style={styles.staffButton}>
                  <Crown size={16} color={Colors.warning} />
                  <Text style={styles.staffButtonText}>Owner</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    marginBottom: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  logoText: {
    color: Colors.white,
    fontSize: FontSizes['2xl'],
    fontWeight: Fonts.extrabold,
    letterSpacing: 2,
  },
  brandName: {
    fontSize: FontSizes['2xl'],
    fontWeight: Fonts.extrabold,
    color: Colors.textMain,
    letterSpacing: 2,
  },
  brandAccent: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textMain,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: Fonts.bold,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  registerLink: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.bold,
  },
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
  staffSection: {
    marginTop: Spacing['3xl'],
    alignItems: 'center',
  },
  staffTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  staffRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  staffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  staffButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.medium,
  },
});
