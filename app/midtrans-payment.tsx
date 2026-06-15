import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar,
  Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { MIDTRANS_SNAP_URL } from '../constants/api';
import api from '../services/api';

export default function MidtransPaymentScreen() {
  const { snapToken, orderId } = useLocalSearchParams<{ snapToken: string; orderId: string }>();
  const router = useRouter();

  const snapUrl = `${MIDTRANS_SNAP_URL}/${snapToken}`;

  const handleNavigationChange = (navState: any) => {
    const { url } = navState;

    // Check for success callback
    if (url.includes('status_code=200') || url.includes('transaction_status=settlement') || url.includes('transaction_status=capture')) {
      Alert.alert('Pembayaran Berhasil', 'Pesanan Anda sedang diproses.', [
        { text: 'OK', onPress: () => router.replace('/customer/orders') },
      ]);
      return;
    }

    // Check for pending
    if (url.includes('status_code=201') || url.includes('transaction_status=pending')) {
      Alert.alert('Pembayaran Pending', 'Silakan selesaikan pembayaran Anda.', [
        { text: 'OK', onPress: () => router.replace('/customer/orders') },
      ]);
      return;
    }

    // Check for error/failure
    if (url.includes('status_code=202') || url.includes('transaction_status=deny') || url.includes('transaction_status=expire') || url.includes('transaction_status=cancel')) {
      handleCancel();
    }
  };

  const handleCancel = async () => {
    // Cancel the order to restore stock
    if (orderId) {
      try {
        await api.put(`/orders/${orderId}/cancel`);
      } catch (e) {
        console.error('Failed to cancel order:', e);
      }
    }
    
    if (Platform.OS === 'web') {
      window.alert('Pembayaran Dibatalkan. Pesanan Anda telah dibatalkan.');
      router.replace('/(tabs)');
    } else {
      Alert.alert('Pembayaran Dibatalkan', 'Pesanan Anda telah dibatalkan.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'web') {
      const confirmCancel = window.confirm(
        'Batalkan Pembayaran?\nJika Anda meninggalkan halaman ini, pesanan akan dibatalkan.'
      );
      if (confirmCancel) {
        handleCancel();
      }
    } else {
      Alert.alert(
        'Batalkan Pembayaran?',
        'Jika Anda meninggalkan halaman ini, pesanan akan dibatalkan.',
        [
          { text: 'Lanjutkan Bayar', style: 'cancel' },
          { text: 'Batalkan', style: 'destructive', onPress: handleCancel },
        ]
      );
    }
  };

  if (!snapToken) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Token pembayaran tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={handleClose}>
          <X size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Pembayaran Midtrans</Text>
        <View style={styles.headerBtn} />
      </View>

      {Platform.OS === 'web' ? (
        <iframe 
          src={snapUrl} 
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
          title="Midtrans Payment"
          allow="payment"
        />
      ) : (
        <WebView
          source={{ uri: snapUrl }}
          onNavigationStateChange={handleNavigationChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Memuat halaman pembayaran...</Text>
            </View>
          )}
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.textMain,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 100,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  webText: {
    fontSize: FontSizes.md,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  webButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  webButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
  },
  webButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  webButtonOutlineText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
  },
});
