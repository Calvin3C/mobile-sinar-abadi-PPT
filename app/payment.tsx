import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView,
  Platform, StatusBar, Alert, ActivityIndicator, Modal, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, MapPin, Truck, Store, Package, CreditCard, Upload,
  ChevronDown, ChevronRight, X, Check, Plus, Search,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../constants/theme';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { CustomerAddress, CourierRate } from '../types';
import { formatPrice } from '../utils/format';
import { STORE_ADDRESS, BANK_TRANSFER, BITESHIP_COURIERS } from '../constants/api';

type ShippingTab = 'ekspedisi' | 'kurir' | 'ambil';
type PaymentMethod = 'midtrans' | 'transfer';

export default function PaymentScreen() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Shipping
  const [shippingTab, setShippingTab] = useState<ShippingTab>('ekspedisi');
  const [courierRates, setCourierRates] = useState<CourierRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('midtrans');
  const [proofImage, setProofImage] = useState<string | null>(null);

  // Address form
  const [addressForm, setAddressForm] = useState({
    name: user?.name || '', phone: user?.phone || '', label: '', address: '', catatan: '',
    kota: '', postalCode: '', biteshipAreaId: '',
  });
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [searchingArea, setSearchingArea] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const subtotal = getTotal();
  const ppn = Math.round(subtotal * 0.11);
  const shippingCost = (() => {
    if (shippingTab === 'kurir' || shippingTab === 'ambil') return 0;
    return selectedRate?.price || 0;
  })();
  const grandTotal = subtotal + ppn + shippingCost;

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (selectedAddress && shippingTab === 'ekspedisi') {
      fetchRates();
    }
  }, [selectedAddress, shippingTab]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      const addrs = res.data || [];
      setAddresses(addrs);
      const mainAddr = addrs.find((a: CustomerAddress) => a.isMain) || addrs[0];
      if (mainAddr) setSelectedAddress(mainAddr);
    } catch (e) {
      console.error('Failed to fetch addresses:', e);
    }
  };

  const fetchRates = async () => {
    if (!selectedAddress?.biteshipAreaId) return;
    setLoadingRates(true);
    setCourierRates([]);
    setSelectedRate(null);
    try {
      const rateItems = items.map((item) => ({
        name: item.name,
        value: item.price,
        quantity: item.qty,
        weight: item.weight || 1000,
        length: item.length || 1,
        width: item.width || 1,
        height: item.height || 1,
      }));
      const res = await api.post('/biteship/rates', {
        destinationAreaId: selectedAddress.biteshipAreaId,
        couriers: BITESHIP_COURIERS,
        items: rateItems,
      });
      setCourierRates(res.data.pricing || []);
    } catch (e) {
      console.error('Failed to fetch rates:', e);
    } finally {
      setLoadingRates(false);
    }
  };

  // Biteship area autocomplete
  useEffect(() => {
    if (areaQuery.length < 3) { setAreaResults([]); return; }
    if (addressForm.kota && areaQuery === addressForm.kota) { setAreaResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingArea(true);
      try {
        const res = await api.get('/biteship/maps', { params: { input: areaQuery } });
        setAreaResults(res.data.areas || res.data || []);
      } catch { }
      setSearchingArea(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [areaQuery, addressForm.kota]);

  const handleSelectArea = (area: any) => {
    const displayName = area.name || `${area.administrative_division_level_3_name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}. ${area.postal_code || ''}`;
    setAddressForm((prev) => ({
      ...prev,
      kota: displayName,
      postalCode: String(area.postal_code || ''),
      biteshipAreaId: area.id,
    }));
    setAreaQuery(displayName);
    setAreaResults([]);
  };

  const handleSaveAddress = async () => {
    const { name, phone, label, address, kota, biteshipAreaId } = addressForm;
    if (!name || !phone || !label || !address || !kota || !biteshipAreaId) {
      if (Platform.OS === 'web') window.alert('Semua field wajib diisi.');
      else Alert.alert('Error', 'Semua field wajib diisi.');
      return;
    }
    try {
      await api.post('/addresses', addressForm);
      await fetchAddresses();
      setShowAddressForm(false);
      setAddressForm({ name: user?.name || '', phone: user?.phone || '', label: '', address: '', catatan: '', kota: '', postalCode: '', biteshipAreaId: '' });
      setAreaQuery('');
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.response?.data?.error || 'Gagal menyimpan alamat.');
      else Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan alamat.');
    }
  };

  const handlePickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleCheckout = async () => {
    if (shippingTab === 'ekspedisi' && !selectedAddress) {
      Alert.alert('Error', 'Pilih alamat pengiriman terlebih dahulu.');
      return;
    }
    if (shippingTab === 'ekspedisi' && !selectedRate) {
      Alert.alert('Error', 'Pilih metode pengiriman terlebih dahulu.');
      return;
    }
    if (shippingTab === 'kurir') {
      const kotaLower = selectedAddress?.kota?.toLowerCase() || '';
      if (!kotaLower.includes('malang')) {
        Alert.alert('Error', 'Kurir Toko hanya tersedia untuk area Malang.');
        return;
      }
    }
    if (paymentMethod === 'transfer' && !proofImage) {
      Alert.alert('Error', 'Upload bukti transfer terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      // Build order payload
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        color: item.color || '',
      }));

      let shippingMethodName = '';
      let shippingCostVal = 0;
      let courierCode = '';
      let courierServiceCode = '';

      if (shippingTab === 'ekspedisi' && selectedRate) {
        shippingMethodName = `${selectedRate.courier_name} ${selectedRate.courier_service_name}`;
        shippingCostVal = selectedRate.price;
        courierCode = selectedRate.courier_code;
        courierServiceCode = selectedRate.courier_service_code;
      } else if (shippingTab === 'kurir') {
        shippingMethodName = 'Kurir Toko Sinar Abadi';
      } else {
        shippingMethodName = 'Ambil di Toko';
      }

      const orderPayload = {
        items: orderItems,
        phone: shippingTab === 'ambil' ? user?.phone || '' : selectedAddress?.phone || user?.phone || '',
        address: shippingTab === 'ambil' ? STORE_ADDRESS : selectedAddress?.address,
        shippingMethod: shippingMethodName,
        shippingCost: shippingCostVal,
        courierCode,
        courierServiceCode,
        biteshipAreaId: selectedAddress?.biteshipAreaId || '',
        destinationAddress: selectedAddress?.address || STORE_ADDRESS,
        paymentMethod: paymentMethod === 'midtrans' ? 'Midtrans' : 'Transfer Bank',
        total: grandTotal,
      };

      const res = await api.post('/orders', orderPayload);
      const order = res.data;

      if (paymentMethod === 'midtrans' && order.payment?.snapToken) {
        // Navigate to Midtrans WebView
        router.replace({
          pathname: '/midtrans-payment',
          params: { snapToken: order.payment.snapToken, orderId: order.id },
        });
        await clearCart();
      } else if (paymentMethod === 'transfer' && proofImage) {
        // Upload proof
        const formData = new FormData();
        formData.append('proof', {
          uri: proofImage,
          name: 'proof.jpg',
          type: 'image/jpeg',
        } as any);

        await api.put(`/orders/${order.id}/proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        await clearCart();
        Alert.alert('Berhasil', 'Pesanan berhasil dibuat! Menunggu verifikasi pembayaran.', [
          { text: 'OK', onPress: () => router.replace('/customer/orders') },
        ]);
      } else {
        await clearCart();
        Alert.alert('Berhasil', 'Pesanan berhasil dibuat!', [
          { text: 'OK', onPress: () => router.replace('/customer/orders') },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Address */}
        <Pressable style={styles.addressCard} onPress={() => setShowAddressModal(true)}>
          <MapPin size={20} color={Colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.addressLabel}>Alamat Pengiriman</Text>
            {selectedAddress ? (
              <>
                <Text style={styles.addressName}>{selectedAddress.name} • {selectedAddress.phone}</Text>
                <Text style={styles.addressText}>{selectedAddress.address}, {selectedAddress.kota}</Text>
              </>
            ) : (
              <Text style={styles.addressText}>Pilih alamat pengiriman</Text>
            )}
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Shipping Method Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pengiriman</Text>
          <View style={styles.tabRow}>
            {([
              { key: 'ekspedisi', label: 'Semua', icon: <Truck size={16} /> },
              { key: 'kurir', label: 'Kurir', icon: <Package size={16} /> },
              { key: 'ambil', label: 'Ambil', icon: <Store size={16} /> },
            ] as const).map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tabBtn, shippingTab === tab.key && styles.tabBtnActive]}
                onPress={() => { setShippingTab(tab.key); setSelectedRate(null); }}
              >
                {React.cloneElement(tab.icon, { color: shippingTab === tab.key ? Colors.primary : Colors.textMuted })}
                <Text style={[styles.tabBtnText, shippingTab === tab.key && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Expedition rates */}
          {shippingTab === 'ekspedisi' && (
            <View style={styles.ratesContainer}>
              {loadingRates ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
              ) : courierRates.length > 0 ? (
                courierRates.map((rate, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.rateCard, selectedRate === rate && styles.rateCardSelected]}
                    onPress={() => setSelectedRate(rate)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rateName}>{rate.courier_name} {rate.courier_service_name}</Text>
                      <Text style={styles.rateDuration}>{rate.duration}</Text>
                    </View>
                    <Text style={styles.ratePrice}>{formatPrice(rate.price)}</Text>
                    {selectedRate === rate && <Check size={18} color={Colors.primary} />}
                  </Pressable>
                ))
              ) : (
                <Text style={styles.noRates}>
                  {selectedAddress ? 'Tidak ada kurir tersedia' : 'Pilih alamat untuk melihat ongkir'}
                </Text>
              )}
            </View>
          )}

          {shippingTab === 'kurir' && (
            <View style={styles.kurirInfo}>
              <Text style={styles.kurirTitle}>Kurir Toko Sinar Abadi</Text>
              <Text style={styles.kurirText}>Gratis ongkir — Khusus area Malang (Kota/Kabupaten)</Text>
            </View>
          )}

          {shippingTab === 'ambil' && (
            <View style={styles.kurirInfo}>
              <Text style={styles.kurirTitle}>Ambil di Toko</Text>
              <Text style={styles.kurirText}>{STORE_ADDRESS}</Text>
              <Text style={[styles.kurirText, { color: Colors.success, fontWeight: Fonts.semibold }]}>Gratis</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <Pressable
            style={[styles.paymentOption, paymentMethod === 'midtrans' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('midtrans')}
          >
            <CreditCard size={20} color={paymentMethod === 'midtrans' ? Colors.primary : Colors.textMuted} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.paymentTitle}>Midtrans (Online)</Text>
              <Text style={styles.paymentDesc}>QRIS, VA, GoPay, Kartu Kredit</Text>
            </View>
            {paymentMethod === 'midtrans' && <Check size={18} color={Colors.primary} />}
          </Pressable>

          <Pressable
            style={[styles.paymentOption, paymentMethod === 'transfer' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('transfer')}
          >
            <Upload size={20} color={paymentMethod === 'transfer' ? Colors.primary : Colors.textMuted} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.paymentTitle}>Transfer Bank Manual</Text>
              <Text style={styles.paymentDesc}>{BANK_TRANSFER.bank} - {BANK_TRANSFER.accountNumber} a.n. {BANK_TRANSFER.accountName}</Text>
            </View>
            {paymentMethod === 'transfer' && <Check size={18} color={Colors.primary} />}
          </Pressable>

          {paymentMethod === 'transfer' && (
            <Pressable style={styles.uploadProofButton} onPress={handlePickProof}>
              {proofImage ? (
                <Image source={{ uri: proofImage }} style={styles.proofPreview} resizeMode="cover" />
              ) : (
                <>
                  <Upload size={24} color={Colors.textMuted} />
                  <Text style={styles.uploadText}>Upload Bukti Transfer</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pembelian</Text>
          <View style={styles.summaryCard}>
            {items.map((item) => (
              <View key={`${item.id}-${item.color}`} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.name} {item.color ? `(${item.color})` : ''} × {item.qty}
                </Text>
                <Text style={styles.summaryItemPrice}>{formatPrice(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal Produk</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PPN (11%)</Text>
              <Text style={styles.summaryValue}>{formatPrice(ppn)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Pengiriman</Text>
              <Text style={[styles.summaryValue, shippingCost === 0 && { color: Colors.success }]}>
                {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalPrice}>{formatPrice(grandTotal)}</Text>
        </View>
        <Pressable
          style={[styles.checkoutButton, submitting && { opacity: 0.7 }]}
          onPress={handleCheckout}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.checkoutText}>Checkout</Text>
          )}
        </Pressable>
      </View>

      {/* Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Alamat</Text>
              <Pressable onPress={() => setShowAddressModal(false)}>
                <X size={22} color={Colors.textMain} />
              </Pressable>
            </View>
            <ScrollView>
              {/* Ambil di toko option */}
              <Pressable
                style={[styles.addressOption, shippingTab === 'ambil' && styles.addressOptionActive]}
                onPress={() => {
                  setShippingTab('ambil');
                  setShowAddressModal(false);
                }}
              >
                <Store size={18} color={Colors.info} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.addressOptName}>Ambil Di Toko</Text>
                  <Text style={styles.addressOptAddr}>{STORE_ADDRESS}</Text>
                </View>
              </Pressable>

              {addresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  style={[styles.addressOption, selectedAddress?.id === addr.id && styles.addressOptionActive]}
                  onPress={() => {
                    setSelectedAddress(addr);
                    if (shippingTab === 'ambil') setShippingTab('ekspedisi');
                    setShowAddressModal(false);
                  }}
                >
                  <MapPin size={18} color={Colors.primary} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.addressOptName}>{addr.label}</Text>
                      {addr.isMain && (
                        <View style={styles.mainBadge}>
                          <Text style={styles.mainBadgeText}>Utama</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressOptAddr}>{addr.name} • {addr.phone}</Text>
                    <Text style={styles.addressOptAddr}>{addr.address}, {addr.kota}</Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                style={styles.addAddressButton}
                onPress={() => { setShowAddressModal(false); setShowAddressForm(true); }}
              >
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addAddressText}>Tambah Alamat Baru</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Form Modal */}
      <Modal visible={showAddressForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Alamat</Text>
              <Pressable onPress={() => setShowAddressForm(false)}>
                <X size={22} color={Colors.textMain} />
              </Pressable>
            </View>
            <ScrollView>
              {[
                { key: 'label', label: 'Label Alamat', placeholder: 'Contoh: Rumah' },
                { key: 'name', label: 'Nama Penerima', placeholder: 'Nama lengkap' },
                { key: 'phone', label: 'Nomor HP', placeholder: '08xxxxxxxxxx', keyboardType: 'phone-pad' as const },
              ].map((f) => (
                <View key={f.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textLight}
                    value={(addressForm as any)[f.key]}
                    onChangeText={(v) => setAddressForm((prev) => ({ ...prev, [f.key]: v }))}
                    keyboardType={f.keyboardType || 'default'}
                  />
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kota & Kecamatan</Text>
                <View style={styles.areaSearchContainer}>
                  <Search size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.areaSearchInput}
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
                      <Pressable key={idx} style={styles.areaResultItem} onPress={() => handleSelectArea(area)}>
                        <Text style={styles.areaResultText}>{area.name || `${area.administrative_division_level_3_name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}`}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alamat Lengkap</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Jalan, nomor rumah, RT/RW..."
                  placeholderTextColor={Colors.textLight}
                  value={addressForm.address}
                  onChangeText={(v) => setAddressForm((prev) => ({ ...prev, address: v }))}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan Kurir (opsional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Dekat masjid"
                  placeholderTextColor={Colors.textLight}
                  value={addressForm.catatan}
                  onChangeText={(v) => setAddressForm((prev) => ({ ...prev, catatan: v }))}
                />
              </View>

              <Pressable style={styles.saveAddressButton} onPress={handleSaveAddress}>
                <Text style={styles.saveAddressText}>Simpan Alamat</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSizes.md, fontWeight: Fonts.semibold, color: Colors.textMain },

  // Address card
  addressCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    backgroundColor: Colors.white, marginBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  addressLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: 2 },
  addressName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  addressText: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  // Section
  section: {
    backgroundColor: Colors.white, padding: Spacing.lg,
    marginBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md },

  // Shipping tabs
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  tabBtnText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: Fonts.medium },
  tabBtnTextActive: { color: Colors.primary, fontWeight: Fonts.semibold },

  // Rates
  ratesContainer: {},
  rateCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm, backgroundColor: Colors.white,
  },
  rateCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  rateName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  rateDuration: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  ratePrice: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.primary, marginRight: Spacing.sm },
  noRates: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

  // Kurir info
  kurirInfo: {
    padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.successBg, borderWidth: 1, borderColor: '#bbf7d0',
  },
  kurirTitle: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  kurirText: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  paymentTitle: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  paymentDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  uploadProofButton: {
    height: 120, borderRadius: Radius.md, borderWidth: 2,
    borderStyle: 'dashed', borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.borderLight, overflow: 'hidden',
  },
  proofPreview: { width: '100%', height: '100%' },
  uploadText: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.sm },

  // Summary
  summaryCard: {
    padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryItemName: { flex: 1, fontSize: FontSizes.xs, color: Colors.textSecondary },
  summaryItemPrice: { fontSize: FontSizes.xs, color: Colors.textMain, fontWeight: Fonts.medium },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: FontSizes.sm, color: Colors.textMuted },
  summaryValue: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.medium },
  grandTotalLabel: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain },
  grandTotalValue: { fontSize: FontSizes.lg, fontWeight: Fonts.extrabold, color: Colors.primary },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.lg,
    ...Shadows.lg,
  },
  bottomTotal: { flex: 1 },
  bottomTotalLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  bottomTotalPrice: { fontSize: FontSizes.lg, fontWeight: Fonts.extrabold, color: Colors.primary },
  checkoutButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing['3xl'],
    ...Shadows.md,
  },
  checkoutText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'], maxHeight: '80%',
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain },
  addressOption: {
    flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  addressOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  addressOptName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  addressOptAddr: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  mainBadge: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.sm,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  mainBadgeText: { fontSize: 9, color: Colors.primary, fontWeight: Fonts.bold },
  addAddressButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addAddressText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: Fonts.semibold },

  // Form
  formGroup: { marginBottom: Spacing.lg },
  formLabel: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  formInput: {
    backgroundColor: Colors.borderLight, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSizes.sm, color: Colors.textMain,
    borderWidth: 1, borderColor: Colors.border,
  },
  areaSearchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.borderLight, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  areaSearchInput: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMain, paddingVertical: Spacing.md },
  areaResults: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    marginTop: 4, backgroundColor: Colors.white, ...Shadows.md,
  },
  areaResultItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  areaResultText: { fontSize: FontSizes.sm, color: Colors.textMain },
  saveAddressButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
    marginBottom: Spacing['3xl'], ...Shadows.md,
  },
  saveAddressText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: Fonts.bold },
});
