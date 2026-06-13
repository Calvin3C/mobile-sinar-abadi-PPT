import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types';

const CART_STORAGE_KEY = '@sinar_abadi_cart';

interface CartState {
  items: CartItem[];
  isLoading: boolean;

  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  updateQty: (productId: string, color: string | null, qty: number) => Promise<void>;
  removeItem: (productId: string, color: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const persistCart = async (items: CartItem[]) => {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: true,

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const { items } = get();
    // Check if same product + same color already in cart
    const existingIdx = items.findIndex(
      (i) => i.id === item.id && i.color === item.color
    );

    let newItems: CartItem[];
    if (existingIdx >= 0) {
      // Update quantity
      newItems = [...items];
      newItems[existingIdx] = {
        ...newItems[existingIdx],
        qty: Math.min(
          newItems[existingIdx].qty + item.qty,
          newItems[existingIdx].stock
        ),
      };
    } else {
      newItems = [...items, item];
    }

    set({ items: newItems });
    await persistCart(newItems);
  },

  updateQty: async (productId, color, qty) => {
    const { items } = get();
    const newItems = items.map((item) => {
      if (item.id === productId && item.color === color) {
        const effectiveMin = Math.min(item.minPurchase || 1, Math.max(1, item.stock));
        return { ...item, qty: Math.max(effectiveMin, Math.min(qty, item.stock)) };
      }
      return item;
    });
    set({ items: newItems });
    await persistCart(newItems);
  },

  removeItem: async (productId, color) => {
    const { items } = get();
    const newItems = items.filter(
      (item) => !(item.id === productId && item.color === color)
    );
    set({ items: newItems });
    await persistCart(newItems);
  },

  clearCart: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.qty, 0);
  },
}));
