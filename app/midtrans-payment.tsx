import React, { useRef } from 'react';
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
import { useCartStore } from '../stores/cartStore';

export default function MidtransPaymentScreen() {
  const { snapToken, orderId } = useLocalSearchParams<{ snapToken: string; orderId: string }>();
  const router = useRouter();
  const { clearCart } = useCartStore();

  const webviewRef = useRef<WebView>(null);
  const isCancelledRef = useRef(false);

  const snapUrl = `${MIDTRANS_SNAP_URL}/${snapToken}`;

  // JS injected into WebView to detect Midtrans close/navigation events
  const injectedJS = `
    (function() {
      // Monitor if the Midtrans Snap container gets removed (user pressed X inside Snap)
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          m.removedNodes.forEach(function(node) {
            if (node.id === 'snap-midtrans' || (node.className && node.className.toString().includes('snap'))) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MIDTRANS_CLOSED' }));
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Also detect if the page becomes mostly empty (Snap was closed)
      setInterval(function() {
        var snapFrame = document.querySelector('iframe[src*="snap"], .snap-container, #snap-midtrans');
        var bodyText = document.body.innerText.trim();
        if (!snapFrame && bodyText.length < 20 && document.readyState === 'complete') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MIDTRANS_CLOSED' }));
        }
      }, 2000);
    })();
    true;
  `;

  const handleNavigationChange = (navState: any) => {
    const { url } = navState;

    // Check for success callback
    if (url.includes('status_code=200') || url.includes('transaction_status=settlement') || url.includes('transaction_status=capture')) {
      clearCart();
      Alert.alert('Pembayaran Berhasil', 'Pesanan Anda sedang diproses.', [
        { text: 'OK', onPress: () => router.replace('/customer/orders') },
      ]);
      return;
    }

    // Check for pending — user selected a method (VA/QRIS shown), then closed
    // In web, onPending cancels the order and user stays on payment page.
    if (url.includes('status_code=201') || url.includes('transaction_status=pending')) {
      handleCancelAndGoBack();
      return;
    }

    // Check for error/failure
    if (url.includes('status_code=202') || url.includes('transaction_status=deny') || url.includes('transaction_status=expire') || url.includes('transaction_status=cancel')) {
      handleCancelAndGoBack();
    }
  };

  // Handle WebView messages (from injected JS)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MIDTRANS_CLOSED') {
        handleCancelAndGoBack();
      }
    } catch (e) {
      // ignore parse errors
    }
  };

  // Cancel the order and go back to payment page (matching web behavior)
  const handleCancelAndGoBack = async () => {
    if (isCancelledRef.current) return; // prevent double-cancel
    isCancelledRef.current = true;

    if (orderId) {
      try {
        await api.put(`/orders/${orderId}/cancel`);
      } catch (e) {
        console.error('Failed to cancel order:', e);
      }
    }
    
    if (Platform.OS === 'web') {
      window.alert('Pembayaran dibatalkan. Anda dapat mencoba lagi.');
    }
    // Go back to payment screen (like web: user stays on payment page and can retry)
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/payment');
    }
  };

  // The X button on the header — confirm then cancel and go back to payment
  const handleClose = () => {
    if (Platform.OS === 'web') {
      const confirmCancel = window.confirm(
        'Batalkan Pembayaran?\nJika Anda meninggalkan halaman ini, pesanan akan dibatalkan.'
      );
      if (confirmCancel) {
        handleCancelAndGoBack();
      }
    } else {
      Alert.alert(
        'Batalkan Pembayaran?',
        'Jika Anda meninggalkan halaman ini, pesanan akan dibatalkan.',
        [
          { text: 'Lanjutkan Bayar', style: 'cancel' },
          { text: 'Batalkan', style: 'destructive', onPress: handleCancelAndGoBack },
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
          ref={webviewRef}
          source={{ uri: snapUrl }}
          onNavigationStateChange={handleNavigationChange}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJS}
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
