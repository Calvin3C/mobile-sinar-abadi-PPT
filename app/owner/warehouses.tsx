import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Package, Truck, ArrowRight, ArrowLeftRight, Store, Plus, CheckCircle, XCircle, Search, Edit2, ChevronDown, ChevronUp, Calendar } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

type TabType = 'gudang' | 'masuk' | 'keluar' | 'transfer';

// Custom Dropdown Component for better iOS and Android compatibility
const CustomDropdown = ({ label, options, selectedValue, onSelect, placeholder }: { label: string, options: {label: string, value: string}[], selectedValue: string, onSelect: (val: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === selectedValue);
  
  return (
    <View>
      <Pressable style={styles.dropdownToggle} onPress={() => setIsOpen(true)}>
        <Text style={{ color: selectedOption ? Colors.textMain : Colors.textMuted, fontSize: FontSizes.sm }}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={Colors.textMuted} />
      </Pressable>
      
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.dropdownOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <Pressable style={styles.dropdownItem} onPress={() => { onSelect(''); setIsOpen(false); }}>
                <Text style={[styles.dropdownItemText, { color: Colors.textMuted }]}>{placeholder}</Text>
              </Pressable>
              {options.map((opt) => (
                <Pressable 
                  key={opt.value} 
                  style={[styles.dropdownItem, selectedValue === opt.value && { backgroundColor: Colors.primaryBg }]} 
                  onPress={() => { onSelect(opt.value); setIsOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, selectedValue === opt.value && { color: Colors.primary, fontWeight: Fonts.bold }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function WarehousesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('gudang');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [outbounds, setOutbounds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search Queries and Filters
  const [inboundSearch, setInboundSearch] = useState('');
  const [inboundDateFilter, setInboundDateFilter] = useState('');
  const [inboundWarehouseFilter, setInboundWarehouseFilter] = useState('');
  const [showInboundDateFilterPicker, setShowInboundDateFilterPicker] = useState(false);
  const [outboundSearch, setOutboundSearch] = useState('');
  const [outboundDateFilter, setOutboundDateFilter] = useState('');
  const [outboundWarehouseFilter, setOutboundWarehouseFilter] = useState('');
  const [showOutboundDateFilterPicker, setShowOutboundDateFilterPicker] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');

  // Modals state
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isEditWarehouseModalOpen, setIsEditWarehouseModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ id: '', name: '', description: '', isActive: true });

  // Inbound Modal
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inboundForm, setInboundForm] = useState({
    supplierName: '',
    expectedDate: '',
    items: [{ productId: '', warehouseId: '', qty: '1', unitCost: '0' }]
  });


  // Inbound Expansion / Detail Modal
  const [selectedInbound, setSelectedInbound] = useState<any>(null);
  const [isInboundDetailModalOpen, setIsInboundDetailModalOpen] = useState(false);

  // Outbound Expansion
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [isOutboundDetailModalOpen, setIsOutboundDetailModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [whRes, ibRes, outRes, prodRes, trRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/inbounds'),
        api.get('/orders'),
        api.get('/products', { params: { limit: 1000 } }),
        api.get('/stock-transfers').catch(() => ({ data: { data: [] } })),
      ]);
      setWarehouses(whRes.data?.data || []);
      setInbounds(ibRes.data?.data || []);
      
      const prodArray = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || prodRes.data?.data || []);
      setProducts(prodArray);
      
      setTransfers(trRes.data?.data || []);
      
      const orders = outRes.data || [];
      const shippingOrders = Array.isArray(orders) ? orders.filter((o: any) => o.status?.toLowerCase() === 'shipping' || o.status?.toLowerCase() === 'completed') : [];
      setOutbounds(shippingOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async () => {
    if (!warehouseForm.name) return Alert.alert('Error', 'Nama gudang wajib diisi');
    try {
      await api.post('/warehouses', warehouseForm);
      Alert.alert('Berhasil', 'Gudang berhasil ditambahkan');
      setIsWarehouseModalOpen(false);
      setWarehouseForm({ id: '', name: '', description: '', isActive: true });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal menambahkan gudang');
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!warehouseForm.name) return Alert.alert('Error', 'Nama gudang wajib diisi');
    try {
      await api.put(`/warehouses/${warehouseForm.id}`, warehouseForm);
      Alert.alert('Berhasil', 'Data gudang berhasil diperbarui');
      setIsEditWarehouseModalOpen(false);
      setWarehouseForm({ id: '', name: '', description: '', isActive: true });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal memperbarui gudang');
    }
  };

  const openEditWarehouse = (wh: any) => {
    setWarehouseForm({ id: wh.id, name: wh.name, description: wh.description || '', isActive: wh.isActive });
    setIsEditWarehouseModalOpen(true);
  };

  const updateInboundStatus = async (id: string, status: string) => {
    try {
      await api.put(`/inbounds/${id}/status`, { status });
      Alert.alert('Berhasil', 'Status berhasil diperbarui');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal memperbarui status');
    }
  };

  const handleCreateInbound = async () => {
    if (!inboundForm.supplierName || !inboundForm.expectedDate) {
      return Alert.alert('Error', 'Nama supplier dan tanggal estimasi wajib diisi');
    }
    
    // Convert to API format
    const totalCost = inboundForm.items.reduce((sum, item) => sum + (parseInt(item.qty) * parseInt(item.unitCost)), 0);
    const payload = {
      supplierName: inboundForm.supplierName,
      expectedDate: new Date(inboundForm.expectedDate).toISOString(),
      totalCost,
      items: inboundForm.items.map(i => ({
        productId: i.productId,
        warehouseId: parseInt(i.warehouseId),
        qty: parseInt(i.qty),
        unitCost: parseInt(i.unitCost)
      }))
    };

    try {
      await api.post('/inbounds', payload);
      Alert.alert('Berhasil', 'Logistik masuk berhasil dibuat');
      setIsInboundModalOpen(false);
      setInboundForm({ supplierName: '', expectedDate: '', items: [{ productId: '', warehouseId: warehouses[0]?.id?.toString() || '', qty: '1', unitCost: '0' }] });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Gagal membuat logistik masuk');
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrders.includes(orderId)) {
      setExpandedOrders(expandedOrders.filter(id => id !== orderId));
    } else {
      setExpandedOrders([...expandedOrders, orderId]);
    }
  };

  const getInboundStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'received': return 'Diterima';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getInboundStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'received': return Colors.success;
      case 'cancelled': return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const filteredInbounds = inbounds.filter(ib => {
    const matchSearch = `PO-${ib.id}`.toLowerCase().includes(inboundSearch.toLowerCase()) || 
      (ib.supplierName || '').toLowerCase().includes(inboundSearch.toLowerCase());
    
    const matchDate = inboundDateFilter 
      ? (ib.expectedDate && ib.expectedDate.startsWith(inboundDateFilter)) || (ib.createdAt && ib.createdAt.startsWith(inboundDateFilter))
      : true;

    const matchWarehouse = inboundWarehouseFilter 
      ? (ib.items || ib.Items || []).some((item: any) => item.warehouseId?.toString() === inboundWarehouseFilter || item.WarehouseID?.toString() === inboundWarehouseFilter)
      : true;

    return matchSearch && matchDate && matchWarehouse;
  });

  const filteredOutbounds = outbounds.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(outboundSearch.toLowerCase()) || 
      (o.shippingMethod || '').toLowerCase().includes(outboundSearch.toLowerCase());

    const matchDate = outboundDateFilter 
      ? (o.date && o.date.startsWith(outboundDateFilter)) || (o.createdAt && o.createdAt.startsWith(outboundDateFilter))
      : true;

    const matchWarehouse = outboundWarehouseFilter 
      ? (o.items || o.Items || []).some((item: any) => item.warehouseId?.toString() === outboundWarehouseFilter || item.WarehouseID?.toString() === outboundWarehouseFilter)
      : true;

    return matchSearch && matchDate && matchWarehouse;
  });

  const filteredTransfers = transfers.filter(t =>
    (t.product?.name || '').toLowerCase().includes(transferSearch.toLowerCase()) ||
    (t.fromWarehouse?.name || '').toLowerCase().includes(transferSearch.toLowerCase()) ||
    (t.toWarehouse?.name || '').toLowerCase().includes(transferSearch.toLowerCase()) ||
    (t.notes || '').toLowerCase().includes(transferSearch.toLowerCase())
  );


  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <Pressable style={[styles.tab, activeTab === 'gudang' && styles.tabActive]} onPress={() => setActiveTab('gudang')}>
        <Store size={18} color={activeTab === 'gudang' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'gudang' && styles.tabTextActive]}>Daftar Gudang</Text>
      </Pressable>
      <Pressable style={[styles.tab, activeTab === 'masuk' && styles.tabActive]} onPress={() => setActiveTab('masuk')}>
        <Package size={18} color={activeTab === 'masuk' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'masuk' && styles.tabTextActive]}>Masuk</Text>
      </Pressable>
      <Pressable style={[styles.tab, activeTab === 'keluar' && styles.tabActive]} onPress={() => setActiveTab('keluar')}>
        <Truck size={18} color={activeTab === 'keluar' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'keluar' && styles.tabTextActive]}>Keluar</Text>
      </Pressable>
      <Pressable style={[styles.tab, activeTab === 'transfer' && styles.tabActive]} onPress={() => setActiveTab('transfer')}>
        <ArrowLeftRight size={18} color={activeTab === 'transfer' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'transfer' && styles.tabTextActive]}>Transfer</Text>
      </Pressable>
    </View>
  );

  const renderGudang = () => (
    <View>
      <Pressable style={styles.addBtn} onPress={() => { setWarehouseForm({ id: '', name: '', description: '', isActive: true }); setIsWarehouseModalOpen(true); }}>
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addBtnText}>Tambah Gudang</Text>
      </Pressable>
      {warehouses.length === 0 ? (
        <EmptyState title="Belum ada gudang" subtitle="Silakan tambahkan gudang baru." />
      ) : (
        warehouses.map((wh) => (
          <View key={wh.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Store size={20} color={Colors.textMain} />
                <Text style={styles.cardTitle}>{wh.name}</Text>
              </View>
              <Pressable style={styles.editBtn} onPress={() => openEditWarehouse(wh)}>
                <Edit2 size={16} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
            {wh.description ? <Text style={styles.cardDesc}>{wh.description}</Text> : null}
            <View style={styles.badgeWrapper}>
              <Text style={wh.isActive ? styles.badgeText : styles.badgeTextInactive}>{wh.isActive ? 'Aktif' : 'Non-aktif'}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderMasuk = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm }}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Cari PO atau Supplier" 
            value={inboundSearch} 
            onChangeText={setInboundSearch}
          />
        </View>
        <Pressable style={styles.addBtnSmall} onPress={() => setIsInboundModalOpen(true)}>
          <Plus size={20} color={Colors.white} />
        </Pressable>
      </View>
      
      {/* Filters for Tanggal & Gudang */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, zIndex: 10 }}>
        <View style={{ flex: 1 }}>
          <Pressable 
            onPress={() => setShowInboundDateFilterPicker(true)} 
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.borderLight, paddingHorizontal: Spacing.md, height: 40, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}
          >
            <Text style={{ color: inboundDateFilter ? Colors.textMain : Colors.textMuted, fontSize: FontSizes.xs }}>
              {inboundDateFilter || "Semua Tanggal"}
            </Text>
            {inboundDateFilter ? (
              <Pressable onPress={() => setInboundDateFilter('')}>
                <XCircle size={16} color={Colors.textMuted} />
              </Pressable>
            ) : (
              <Calendar size={16} color={Colors.textMuted} />
            )}
          </Pressable>
          {showInboundDateFilterPicker && (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowInboundDateFilterPicker(false)}>
              <Pressable style={styles.dropdownOverlay} onPress={() => setShowInboundDateFilterPicker(false)}>
                <Pressable style={[styles.dropdownMenu, { alignItems: 'center', paddingBottom: Spacing.xl }]} onPress={(e) => e.stopPropagation()}>
                  {Platform.OS === 'ios' && (
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md }}>
                      <Pressable onPress={() => setShowInboundDateFilterPicker(false)}>
                        <Text style={{ color: Colors.primary, fontWeight: Fonts.bold, fontSize: FontSizes.base }}>Selesai</Text>
                      </Pressable>
                    </View>
                  )}
                  <DateTimePicker
                    value={inboundDateFilter ? new Date(inboundDateFilter) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="light"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowInboundDateFilterPicker(false);
                      if (selectedDate) {
                        setInboundDateFilter(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <CustomDropdown
            label="Filter Gudang"
            placeholder="Semua Gudang"
            options={warehouses.map(w => ({ label: w.name, value: w.id.toString() }))}
            selectedValue={inboundWarehouseFilter}
            onSelect={setInboundWarehouseFilter}
          />
        </View>
      </View>
      
      {filteredInbounds.length === 0 ? (
        <EmptyState title="Belum ada logistik masuk" subtitle="Data kulakan akan muncul di sini." />
      ) : (
        filteredInbounds.map((ib) => (
          <Pressable key={ib.id} style={styles.card} onPress={() => { setSelectedInbound(ib); setIsInboundDetailModalOpen(true); }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>PO-{ib.id}</Text>
              <Text style={[styles.statusText, { color: getInboundStatusColor(ib.status) }]}>
                {getInboundStatusLabel(ib.status)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Supplier:</Text>
              <Text style={styles.infoValue}>{ib.supplierName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimasi:</Text>
              <Text style={styles.infoValue}>{formatDate(ib.expectedDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Biaya:</Text>
              <Text style={[styles.infoValue, { color: Colors.danger, fontWeight: Fonts.bold }]}>{formatPrice(ib.totalCost)}</Text>
            </View>

            {ib.status === 'pending' && (
              <View style={styles.actionRow}>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.danger, marginRight: Spacing.sm }]} onPress={() => updateInboundStatus(ib.id, 'cancelled')}>
                  <XCircle size={16} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Batalkan</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => updateInboundStatus(ib.id, 'received')}>
                  <CheckCircle size={16} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Diterima</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        ))
      )}
    </View>
  );

  const renderKeluar = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm }}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Cari ID Order atau Metode Pengiriman" 
            value={outboundSearch} 
            onChangeText={setOutboundSearch}
          />
        </View>
      </View>
      
      {/* Filters for Tanggal & Gudang Keluar */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, zIndex: 10 }}>
        <View style={{ flex: 1 }}>
          <Pressable 
            onPress={() => setShowOutboundDateFilterPicker(true)} 
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.borderLight, paddingHorizontal: Spacing.md, height: 40, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}
          >
            <Text style={{ color: outboundDateFilter ? Colors.textMain : Colors.textMuted, fontSize: FontSizes.xs }}>
              {outboundDateFilter || "Semua Tanggal"}
            </Text>
            {outboundDateFilter ? (
              <Pressable onPress={() => setOutboundDateFilter('')}>
                <XCircle size={16} color={Colors.textMuted} />
              </Pressable>
            ) : (
              <Calendar size={16} color={Colors.textMuted} />
            )}
          </Pressable>
          {showOutboundDateFilterPicker && (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowOutboundDateFilterPicker(false)}>
              <Pressable style={styles.dropdownOverlay} onPress={() => setShowOutboundDateFilterPicker(false)}>
                <Pressable style={[styles.dropdownMenu, { alignItems: 'center', paddingBottom: Spacing.xl }]} onPress={(e) => e.stopPropagation()}>
                  {Platform.OS === 'ios' && (
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md }}>
                      <Pressable onPress={() => setShowOutboundDateFilterPicker(false)}>
                        <Text style={{ color: Colors.primary, fontWeight: Fonts.bold, fontSize: FontSizes.base }}>Selesai</Text>
                      </Pressable>
                    </View>
                  )}
                  <DateTimePicker
                    value={outboundDateFilter ? new Date(outboundDateFilter) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="light"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowOutboundDateFilterPicker(false);
                      if (selectedDate) {
                        setOutboundDateFilter(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <CustomDropdown
            label="Filter Gudang"
            placeholder="Semua Gudang"
            options={warehouses.map(w => ({ label: w.name, value: w.id.toString() }))}
            selectedValue={outboundWarehouseFilter}
            onSelect={setOutboundWarehouseFilter}
          />
        </View>
      </View>

      {filteredOutbounds.length === 0 ? (
        <EmptyState title="Belum ada logistik keluar" subtitle="Pesanan yang sedang dikirim akan muncul di sini." />
      ) : (
        filteredOutbounds.map((order) => {
          return (
            <Pressable key={order.id} style={styles.card} onPress={() => { setSelectedOutbound(order); setIsOutboundDetailModalOpen(true); }}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{order.id}</Text>
                  <Text style={styles.cardDate}>{formatDate(order.date)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              <View style={styles.infoRow}>
                <Truck size={14} color={Colors.textMuted} />
                <Text style={[styles.infoValue, { marginLeft: 6 }]}>{order.shippingMethod}</Text>
              </View>
              {order.shipping?.waybillId && (
                <View style={styles.infoRow}>
                  <ArrowRight size={14} color={Colors.textMuted} />
                  <Text style={[styles.infoValue, { marginLeft: 6 }]}>Resi: {order.shipping.waybillId}</Text>
                </View>
              )}

              <View style={styles.expandToggle}>
                <Text style={styles.expandToggleText}>Lihat Detail Barang Keluar</Text>
                <ArrowRight size={16} color={Colors.textMuted} />
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const renderTransfer = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
        <View style={[styles.searchContainer, { flex: 1 }]}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk atau gudang"
            value={transferSearch}
            onChangeText={setTransferSearch}
          />
        </View>
      </View>

      {filteredTransfers.length === 0 ? (
        <EmptyState title="Belum ada transfer stok" subtitle="Riwayat perpindahan stok antar gudang akan muncul di sini." />
      ) : (
        filteredTransfers.map((tr: any) => (
          <View key={tr.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{tr.product?.name || `Produk #${tr.productId}`}</Text>
              <Text style={[styles.statusText, { color: Colors.info }]}>{tr.quantity} unit</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: Spacing.sm }]}>
              <View style={styles.transferRoute}>
                <View style={styles.transferWarehouse}>
                  <Store size={14} color={Colors.danger} />
                  <Text style={styles.transferWarehouseText}>{tr.fromWarehouse?.name || `Gudang #${tr.fromWarehouseId}`}</Text>
                </View>
                <ArrowRight size={16} color={Colors.textMuted} />
                <View style={styles.transferWarehouse}>
                  <Store size={14} color={Colors.success} />
                  <Text style={styles.transferWarehouseText}>{tr.toWarehouse?.name || `Gudang #${tr.toWarehouseId}`}</Text>
                </View>
              </View>
            </View>
            {tr.notes && (
              <Text style={[styles.cardDesc, { marginTop: Spacing.sm, marginBottom: 0 }]}>{tr.notes}</Text>
            )}
            <Text style={[styles.cardDate, { marginTop: Spacing.sm }]}>{formatDate(tr.createdAt)}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabs()}
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[Colors.primary]} />}
      >
        {activeTab === 'gudang' && renderGudang()}
        {activeTab === 'masuk' && renderMasuk()}
        {activeTab === 'keluar' && renderKeluar()}
        {activeTab === 'transfer' && renderTransfer()}
      </ScrollView>

      {/* Modal Tambah/Edit Gudang */}
      <Modal visible={isWarehouseModalOpen || isEditWarehouseModalOpen} transparent animationType="fade" onRequestClose={() => { setIsWarehouseModalOpen(false); setIsEditWarehouseModalOpen(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditWarehouseModalOpen ? 'Edit Gudang' : 'Tambah Gudang Baru'}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Gudang</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Gudang Y"
                value={warehouseForm.name}
                onChangeText={(text) => setWarehouseForm({ ...warehouseForm, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi (Opsional)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Deskripsi gudang..."
                multiline
                value={warehouseForm.description}
                onChangeText={(text) => setWarehouseForm({ ...warehouseForm, description: text })}
              />
            </View>

            {isEditWarehouseModalOpen && (
              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={styles.label}>Status Aktif</Text>
                <Switch 
                  value={warehouseForm.isActive} 
                  onValueChange={(val) => setWarehouseForm({ ...warehouseForm, isActive: val })}
                  trackColor={{ true: Colors.success, false: Colors.border }}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnOutline]} onPress={() => { setIsWarehouseModalOpen(false); setIsEditWarehouseModalOpen(false); }}>
                <Text style={styles.modalBtnOutlineText}>Batal</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={isEditWarehouseModalOpen ? handleUpdateWarehouse : handleCreateWarehouse}>
                <Text style={styles.modalBtnPrimaryText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Tambah Kulakan */}
      <Modal visible={isInboundModalOpen} transparent animationType="slide" onRequestClose={() => setIsInboundModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Catat Logistik Masuk</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Supplier</Text>
                <TextInput style={styles.input} placeholder="PT Supplier Makmur" value={inboundForm.supplierName} onChangeText={(text) => setInboundForm({ ...inboundForm, supplierName: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tanggal Estimasi Sampai</Text>
                {Platform.OS === 'web' ? (
                  React.createElement(TextInput as any, {
                    type: "date",
                    style: [styles.input, { outlineWidth: 0 }],
                    placeholder: "YYYY-MM-DD",
                    value: inboundForm.expectedDate,
                    onChangeText: (text: string) => setInboundForm({ ...inboundForm, expectedDate: text })
                  })
                ) : (
                  <>
                    <Pressable onPress={() => setShowDatePicker(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 }]}>
                      <Text style={{ color: inboundForm.expectedDate ? Colors.textMain : Colors.textMuted }}>
                        {inboundForm.expectedDate || "dd/mm/yyyy"}
                      </Text>
                      <Calendar size={18} color={Colors.textMain} />
                    </Pressable>
                    {showDatePicker && (
                      <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                        <Pressable style={styles.dropdownOverlay} onPress={() => setShowDatePicker(false)}>
                          <Pressable style={[styles.dropdownMenu, { alignItems: 'center', paddingBottom: Spacing.xl }]} onPress={(e) => e.stopPropagation()}>
                            {Platform.OS === 'ios' && (
                              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md }}>
                                <Pressable onPress={() => setShowDatePicker(false)}>
                                  <Text style={{ color: Colors.primary, fontWeight: Fonts.bold, fontSize: FontSizes.base }}>Selesai</Text>
                                </Pressable>
                              </View>
                            )}
                            <DateTimePicker
                              value={inboundForm.expectedDate ? new Date(inboundForm.expectedDate) : new Date()}
                              mode="date"
                              display={Platform.OS === 'ios' ? 'inline' : 'default'}
                              themeVariant="light"
                              onChange={(event, selectedDate) => {
                                if (Platform.OS === 'android') setShowDatePicker(false);
                                if (selectedDate) {
                                  setInboundForm({ ...inboundForm, expectedDate: selectedDate.toISOString().split('T')[0] });
                                }
                              }}
                            />
                          </Pressable>
                        </Pressable>
                      </Modal>
                    )}
                  </>
                )}
              </View>

              <Text style={[styles.label, { marginTop: Spacing.sm }]}>Item Produk</Text>
              {inboundForm.items.map((item, index) => (
                <View key={index} style={{ backgroundColor: Colors.background, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                    <Text style={styles.label}>Gudang Penerima</Text>
                    {inboundForm.items.length > 1 && (
                      <Pressable onPress={() => {
                        const newItems = inboundForm.items.filter((_, i) => i !== index);
                        setInboundForm({ ...inboundForm, items: newItems });
                      }}>
                        <XCircle size={20} color={Colors.danger} />
                      </Pressable>
                    )}
                  </View>
                  <CustomDropdown
                    label="Pilih Gudang Penerima"
                    placeholder="-- Pilih Gudang --"
                    options={warehouses.map(w => ({ label: w.name, value: w.id.toString() }))}
                    selectedValue={item.warehouseId}
                    onSelect={(val) => {
                      const newItems = [...inboundForm.items];
                      newItems[index].warehouseId = val;
                      setInboundForm({ ...inboundForm, items: newItems });
                    }}
                  />
                  
                  <Text style={[styles.label, { marginTop: Spacing.sm }]}>Pilih Produk</Text>
                  <CustomDropdown
                    label="Pilih Produk"
                    placeholder="-- Pilih Produk --"
                    options={products.map(p => ({ label: p.name, value: p.id.toString() }))}
                    selectedValue={item.productId}
                    onSelect={(val) => {
                      const newItems = [...inboundForm.items];
                      newItems[index].productId = val;
                      setInboundForm({ ...inboundForm, items: newItems });
                    }}
                  />
                  
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Kuantitas (Qty)</Text>
                      <TextInput style={styles.input} keyboardType="numeric" value={item.qty} onChangeText={(text) => {
                        const newItems = [...inboundForm.items];
                        newItems[index].qty = text;
                        setInboundForm({ ...inboundForm, items: newItems });
                      }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Harga Beli Satuan</Text>
                      <TextInput style={styles.input} keyboardType="numeric" value={item.unitCost} onChangeText={(text) => {
                        const newItems = [...inboundForm.items];
                        newItems[index].unitCost = text;
                        setInboundForm({ ...inboundForm, items: newItems });
                      }} />
                    </View>
                  </View>
                </View>
              ))}
              
              <Pressable style={{ alignItems: 'center', padding: Spacing.sm, marginBottom: Spacing.xl }} onPress={() => setInboundForm({ ...inboundForm, items: [...inboundForm.items, { productId: '', warehouseId: warehouses[0]?.id?.toString() || '', qty: '1', unitCost: '0' }] })}>
                <Text style={{ color: Colors.primary, fontWeight: Fonts.bold }}>+ Tambah Item Lagi</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnOutline]} onPress={() => setIsInboundModalOpen(false)}>
                <Text style={styles.modalBtnOutlineText}>Batal</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleCreateInbound}>
                <Text style={styles.modalBtnPrimaryText}>Simpan PO</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      {/* Modal Detail Inbound */}
      <Modal visible={isInboundDetailModalOpen} transparent animationType="slide" onRequestClose={() => setIsInboundDetailModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', width: '95%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Detail Purchase Order (PO-{selectedInbound?.id})</Text>
              <Pressable onPress={() => setIsInboundDetailModalOpen(false)}>
                <XCircle size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Info Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.borderLight, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg }}>
                <View>
                  <Text style={styles.infoLabel}>Supplier</Text>
                  <Text style={{ fontWeight: Fonts.bold, color: Colors.textMain, fontSize: FontSizes.base }}>{selectedInbound?.supplierName}</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Tgl. Estimasi</Text>
                  <Text style={{ fontWeight: Fonts.bold, color: Colors.textMain, fontSize: FontSizes.base }}>{selectedInbound ? formatDate(selectedInbound.expectedDate) : ''}</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.statusText, { color: getInboundStatusColor(selectedInbound?.status), marginTop: 4 }]}>
                    {selectedInbound ? getInboundStatusLabel(selectedInbound.status) : ''}
                  </Text>
                </View>
              </View>

              <Text style={{ fontWeight: Fonts.bold, fontSize: FontSizes.md, color: Colors.textMain, marginBottom: Spacing.md }}>Daftar Barang Dikulak</Text>
              
              <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', backgroundColor: Colors.borderLight, padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                  <Text style={{ flex: 1, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted }}>ID</Text>
                  <Text style={{ flex: 2, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted }}>PRODUK</Text>
                  <Text style={{ flex: 1.5, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted }}>GUDANG</Text>
                  <Text style={{ flex: 0.8, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted, textAlign: 'center' }}>QTY</Text>
                  <Text style={{ flex: 1.5, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted, textAlign: 'right' }}>HARGA</Text>
                  <Text style={{ flex: 1.8, fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textMuted, textAlign: 'right' }}>SUBTOTAL</Text>
                </View>
                
                {(selectedInbound?.items || selectedInbound?.Items || []).map((item: any, idx: number) => {
                  const product = products.find(p => p.id === item.productId || p.id === item.ProductID || p.id === item.product_id);
                  const wh = warehouses.find(w => w.id === item.warehouseId || w.id === item.WarehouseID || w.id === item.warehouse_id);
                  const subtotal = (item.qty || item.Qty) * (item.unitCost || item.UnitCost);
                  
                  return (
                    <View key={idx} style={{ flexDirection: 'row', padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: FontSizes.xs, color: Colors.textMain }}>{product?.id || item.productId || item.ProductID}</Text>
                      <Text style={{ flex: 2, fontSize: FontSizes.xs, color: Colors.textMain, fontWeight: Fonts.medium }}>{product?.name || 'Unknown'}</Text>
                      <Text style={{ flex: 1.5, fontSize: FontSizes.xs, color: Colors.textMain }}>{wh?.name || 'Unknown'}</Text>
                      <Text style={{ flex: 0.8, fontSize: FontSizes.xs, color: Colors.textMain, textAlign: 'center', fontWeight: Fonts.bold }}>{item.qty || item.Qty}</Text>
                      <Text style={{ flex: 1.5, fontSize: FontSizes.xs, color: Colors.textMain, textAlign: 'right' }}>{formatPrice(item.unitCost || item.UnitCost)}</Text>
                      <Text style={{ flex: 1.8, fontSize: FontSizes.xs, color: Colors.textMain, textAlign: 'right', fontWeight: Fonts.bold }}>{formatPrice(subtotal)}</Text>
                    </View>
                  );
                })}
                
                <View style={{ flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.white, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Text style={{ fontWeight: Fonts.bold, color: Colors.textMain, marginRight: Spacing.md }}>Total Biaya:</Text>
                  <Text style={{ fontWeight: Fonts.bold, color: Colors.danger, fontSize: FontSizes.md }}>{formatPrice(selectedInbound?.totalCost || 0)}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Detail Outbound (Logistik Keluar) */}
      <Modal visible={isOutboundDetailModalOpen} transparent animationType="slide" onRequestClose={() => setIsOutboundDetailModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', width: '95%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Detail Logistik Keluar ({selectedOutbound?.id})</Text>
              <Pressable onPress={() => setIsOutboundDetailModalOpen(false)}>
                <XCircle size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.md }}>
              <View>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ width: 180, fontWeight: Fonts.bold, color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'left' }}>NAMA PRODUK / DESKRIPSI</Text>
                  <Text style={{ width: 80, fontWeight: Fonts.bold, color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }}>QTY KELUAR</Text>
                  <Text style={{ width: 60, fontWeight: Fonts.bold, color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }}>UOM</Text>
                  {warehouses.map(wh => (
                    <Text key={wh.id} style={{ width: 100, fontWeight: Fonts.bold, color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }}>
                      STOK AKTUAL{'\n'}({wh.name.toUpperCase()})
                    </Text>
                  ))}
                  <Text style={{ width: 100, fontWeight: Fonts.bold, color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }}>STOK ALOKASI</Text>
                </View>

                {/* Table Rows */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedOutbound?.items?.map((item: any, idx: number) => {
                    const product = products.find((p: any) => String(p.id) === String(item.productId) || p.name === item.name);
                    
                    return (
                      <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: Spacing.sm, alignItems: 'center' }}>
                        <View style={{ width: 180, paddingRight: Spacing.sm }}>
                          <Text style={{ fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.semibold }}>{item.name}</Text>
                          {item.color && <Text style={{ fontSize: FontSizes.xs, color: Colors.textMuted }}>Varian: {item.color}</Text>}
                        </View>
                        <Text style={{ width: 80, fontSize: FontSizes.sm, color: Colors.success, fontWeight: Fonts.bold, textAlign: 'center' }}>{item.qty}</Text>
                        <Text style={{ width: 60, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' }}>{product?.unit || 'Pcs'}</Text>
                        
                        {warehouses.map(wh => {
                          let stock = 0;
                          if (product?.warehouseStocks) {
                            const ws = product.warehouseStocks.find((w: any) => String(w.warehouseId) === String(wh.id));
                            stock = ws ? ws.stock : 0;
                          }
                          return (
                            <Text key={wh.id} style={{ width: 100, fontSize: FontSizes.sm, color: Colors.info, textAlign: 'center' }}>
                              {stock}
                            </Text>
                          );
                        })}
                        
                        <Text style={{ width: 100, fontSize: FontSizes.sm, color: Colors.warning, textAlign: 'center' }}>0</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
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
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, height: 48 },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSizes.sm, color: Colors.textMain },
  
  addBtn: { flexDirection: 'row', backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', padding: Spacing.md, borderRadius: Radius.md, gap: Spacing.xs, marginBottom: Spacing.lg, ...Shadows.sm },
  addBtnSmall: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: Radius.md, ...Shadows.sm },
  addBtnText: { color: Colors.white, fontWeight: Fonts.bold, fontSize: FontSizes.sm },
  
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primaryBg, borderRadius: Radius.sm },
  editBtnText: { fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.primary },

  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'space-between' },
  cardTitle: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain },
  cardDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  cardDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  statusText: { fontSize: FontSizes.sm, fontWeight: Fonts.bold },
  
  badgeWrapper: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: Colors.successBg },
  badgeText: { color: Colors.success, fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  badgeTextInactive: { color: Colors.danger, fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  infoLabel: { fontSize: FontSizes.sm, color: Colors.textMuted, width: 80 },
  infoValue: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.medium, flex: 1 },
  
  actionRow: { flexDirection: 'row', marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  actionBtnText: { color: Colors.white, fontSize: FontSizes.xs, fontWeight: Fonts.bold },
  
  expandToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  expandToggleText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: Fonts.semibold },
  expandedContent: { marginTop: Spacing.md, backgroundColor: Colors.background, padding: Spacing.md, borderRadius: Radius.md },
  expandedTitle: { fontSize: FontSizes.xs, fontWeight: Fonts.bold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  expandedItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  expandedItemName: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textMain },
  expandedItemVariant: { fontSize: FontSizes.xs, color: Colors.textMuted },
  expandedItemQty: { fontSize: FontSizes.sm, fontWeight: Fonts.bold, color: Colors.success },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, width: '100%', maxWidth: 400, ...Shadows.lg },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.lg },
  formGroup: { marginBottom: Spacing.xl },
  label: { fontSize: FontSizes.sm, fontWeight: Fonts.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSizes.base, color: Colors.textMain },
  dropdownToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.white },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dropdownMenu: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  dropdownTitle: { fontSize: FontSizes.base, fontWeight: Fonts.bold, color: Colors.textMain, marginBottom: Spacing.md, textAlign: 'center' },
  dropdownItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, borderRadius: Radius.sm },
  dropdownItemText: { fontSize: FontSizes.sm, color: Colors.textMain },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnOutline: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  modalBtnPrimary: { backgroundColor: Colors.primary },
  modalBtnOutlineText: { color: Colors.textMain, fontWeight: Fonts.bold, fontSize: FontSizes.sm },
  modalBtnPrimaryText: { color: Colors.white, fontWeight: Fonts.bold, fontSize: FontSizes.sm },

  // Transfer styles
  transferRoute: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  transferWarehouse: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  transferWarehouseText: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: Fonts.medium, flexShrink: 1 },
});
