import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../services/api';
import { User, AuthResponse } from '../types';

// Helper for cross-platform storage
const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const removeStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string, role: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    name: string;
    phone: string;
    email: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: Partial<User & { password?: string }>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password, role) => {
    const response = await api.post<AuthResponse>('/login', {
      username,
      password,
      role,
    });
    const { token, user } = response.data;

    await setStorageItem('auth_token', token);
    await setStorageItem('auth_user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });
  },

  register: async (data) => {
    await api.post('/register', {
      ...data,
      role: 'customer',
    });
  },

  logout: async () => {
    await removeStorageItem('auth_token');
    await removeStorageItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await getStorageItem('auth_token');
      const userStr = await getStorageItem('auth_user');

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    const updatedUser = response.data.user || response.data;
    
    if (updatedUser) {
      const currentUser = get().user;
      const mergedUser = { ...currentUser, ...updatedUser };
      await setStorageItem('auth_user', JSON.stringify(mergedUser));
      set({ user: mergedUser });
    }
  },
}));
